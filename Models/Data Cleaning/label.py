
import argparse
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from pathlib import Path

HORIZON_STEPS = 2016
POWER_DROP_THRESH      = 0.30
IMBALANCE_THRESH       = 0.60
TEMP_DELTA_THRESH      = 55.0
FREQ_DEVIATION_THRESH  = 0.5
EFFICIENCY_LOW_THRESH  = -0.15
ROLLING_WINDOW = 12

FEATURE_EXPLANATION = ""

def load_data(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath, low_memory=False)

    if df.columns[0] in ["Unnamed: 0", ""]:
        df = df.rename(columns={df.columns[0]: "row_index"})

    ts_col = None
    for col in ["timestamp", "Timestamp", "time", "Time", "datetime"]:
        if col in df.columns:
            ts_col = col
            break
    if ts_col is None:
        for col in df.columns:
            try:
                pd.to_datetime(df[col].iloc[0])
                ts_col = col
                break
            except:
                continue
    if ts_col:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%d-%m-%Y %H:%M",
                    "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M"):
            try:
                df[ts_col] = pd.to_datetime(df[ts_col], format=fmt)
                if ts_col != "timestamp":
                    df = df.rename(columns={ts_col: "timestamp"})
                break
            except:
                continue
        else:
            df["timestamp"] = pd.to_datetime(df[ts_col], infer_datetime_format=True)
    return df


def safe_col(df, col, default=0.0):
    if col in df.columns:
        return pd.to_numeric(df[col], errors="coerce").fillna(default).values
    return np.full(len(df), default)

def rolling_mean(arr, window=ROLLING_WINDOW):
    return pd.Series(arr).rolling(window, min_periods=1).mean().values

def rolling_std(arr, window=ROLLING_WINDOW):
    return pd.Series(arr).rolling(window, min_periods=1).std().fillna(0).values


def compute_risk_score(grp: pd.DataFrame) -> np.ndarray:
    n = len(grp)

    power      = safe_col(grp, "power")
    roll_mean  = rolling_mean(power)
    roll_mean  = np.where(roll_mean < 1.0, 1.0, roll_mean)
    power_drop = np.clip((roll_mean - power) / roll_mean, 0, 1)
    sig_power  = power_drop  # 0=no drop, 1=complete drop

    efficiency    = safe_col(grp, "efficiency", default=0.0)
    eff_roll_mean = rolling_mean(efficiency)
    eff_deviation = np.clip(
        np.abs(efficiency - eff_roll_mean) / (np.abs(eff_roll_mean) + 1e-6),
        0, 1
    )
    eff_low_flag  = (efficiency < EFFICIENCY_LOW_THRESH).astype(float)
    sig_efficiency = np.clip(eff_deviation * 0.5 + eff_low_flag * 0.5, 0, 1)

    imbalance    = safe_col(grp, "string_imbalance", default=0.0)
    sig_imbalance = np.clip(imbalance / IMBALANCE_THRESH, 0, 1)

    temp_delta    = safe_col(grp, "temp_delta", default=0.0)
    sig_temp      = np.clip(temp_delta / TEMP_DELTA_THRESH, 0, 1)

    freq          = safe_col(grp, "freq", default=50.0)
    freq_dev      = np.abs(freq - 50.0)
    sig_freq      = np.clip(freq_dev / FREQ_DEVIATION_THRESH, 0, 1)

    op_state      = safe_col(grp, "op_state", default=0.0)
    sig_op        = (op_state == -1).astype(float)   # -1 = fault

    if "risk_level" in grp.columns:
        risk_map  = {"no_risk": 0.0, "degradation_risk": 0.5, "shutdown_risk": 1.0}
        sig_label = grp["risk_level"].map(risk_map).fillna(0.0).values
    else:
        sig_label = np.zeros(n)

    risk_score = (
        0.30 * sig_power      +
        0.25 * sig_efficiency +
        0.20 * sig_imbalance  +
        0.10 * sig_temp       +
        0.08 * sig_freq       +
        0.05 * sig_op         +
        0.02 * sig_label
    )

    return np.clip(risk_score, 0.0, 1.0)


def compute_failure_label(risk_scores: np.ndarray,
                          power: np.ndarray,
                          horizon: int = HORIZON_STEPS) -> np.ndarray:
    n      = len(risk_scores)
    labels = np.zeros(n, dtype=int)

    for i in range(n):
        end        = min(i + horizon, n)
        future_rs  = risk_scores[i:end]
        future_pwr = power[i:end]
        curr_pwr   = power[i] if power[i] > 1.0 else 1.0

        if (future_rs >= 0.75).any():
            labels[i] = 1
            continue

        if len(future_pwr) > 0:
            min_pwr = future_pwr.min()
            if (curr_pwr - min_pwr) / curr_pwr > 0.50:
                labels[i] = 1

    return labels


def process(df: pd.DataFrame) -> pd.DataFrame:

    df["global_inverter_id"] = (
        df["plant_id"].astype(str) + "_inv" + df["inverter_id"].astype(str)
    )

    if "timestamp" in df.columns:
        df = df.sort_values(["global_inverter_id", "timestamp"]).reset_index(drop=True)
    else:
        df = df.sort_values(["global_inverter_id"]).reset_index(drop=True)

    all_risk   = np.zeros(len(df), dtype=float)
    all_fail   = np.zeros(len(df), dtype=int)

    inverters = df["global_inverter_id"].unique()

    for gid in inverters:
        mask = df["global_inverter_id"] == gid
        idx  = df.index[mask].tolist()
        grp  = df.loc[idx]


        rs = compute_risk_score(grp)

        pwr  = safe_col(grp, "power")
        fail = compute_failure_label(rs, pwr)

        all_risk[idx] = rs
        all_fail[idx] = fail


    df["risk_score"]       = np.round(all_risk, 4)
    df["fail_next_7_days"] = all_fail

    df["risk_label"] = pd.cut(
        df["risk_score"],
        bins=[-0.001, 0.35, 0.60, 0.75, 1.001],
        labels=["healthy", "low_risk", "medium_risk", "high_risk"]
    )

    return df


def print_statistics(df: pd.DataFrame):

    total = len(df)

    will_fail     = df["fail_next_7_days"].sum()
    will_not_fail = total - will_fail
    fail_pct      = will_fail / total * 100
    safe_pct      = will_not_fail / total * 100


    risk_counts = df["risk_label"].value_counts().sort_index()
    for label, count in risk_counts.items():
        pct  = count / total * 100


    for gid in sorted(df["global_inverter_id"].unique()):
        sub      = df[df["global_inverter_id"] == gid]
        rows     = len(sub)
        fail_p   = sub["fail_next_7_days"].mean() * 100
        avg_risk = sub["risk_score"].mean()
        max_risk = sub["risk_score"].max()


    features = [
        ("power (drop from rolling mean)", "30%"),
        ("efficiency (deviation + low flag)", "25%"),
        ("string_imbalance",                 "20%"),
        ("temp_delta",                       "10%"),
        ("freq (deviation from 50Hz)",       " 8%"),
        ("op_state (fault = -1)",            " 5%"),
        ("risk_level (existing label)",      " 2%"),
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Add fail_next_7_days and risk_score columns to solar inverter CSV"
    )
    parser.add_argument("--data",   type=str, default="master_dataset.csv",
                        help="Path to your input CSV file")
    parser.add_argument("--output", type=str, default=None,
                        help="Output CSV filename (default: input_labeled.csv)")
    args = parser.parse_args()


    df = load_data(args.data)

    df = process(df)

    if args.output is None:
        stem       = Path(args.data).stem
        args.output = f"{stem}_labeled.csv"

    df.to_csv(args.output, index=False)

    print_statistics(df)



if __name__ == "__main__":
    main()