import pandas as pd
import numpy as np
file_path = "plant_3D-2.csv"
cols = pd.read_csv(file_path, nrows=0).columns
needed_cols = []
for c in cols:
    if "timestamp" in c:
        needed_cols.append(c)
    if "inverters[0]" in c and (
        ".power" in c
        or ".temp" in c
        or ".kwh_today" in c
        or ".kwh_total" in c
        or ".limit_percent" in c
        or ".op_state" in c
        or "_current" in c
        or "_voltage" in c
    ):
        needed_cols.append(c)
    if "meters[0]" in c and (
        "meter_active_power" in c
        or ".freq" in c
        or ".pf" in c
        or ".v_" in c
        or ".p_" in c
    ):
        needed_cols.append(c)
    if "ambient_temp" in c:
        needed_cols.append(c)
    if "smu[" in c and "string" in c:
        needed_cols.append(c)
df = pd.read_csv(file_path, usecols=needed_cols, low_memory=False)
df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
inv_df = pd.DataFrame()
inv_df["timestamp"] = df["timestamp"]
inv_df["plant_id"] = "plant_3"
inv_df["inverter_id"] = 0
inv_df["power"] = df.get("inverters[0].power")
inv_df["temp"] = df.get("inverters[0].temp")
inv_df["kwh_today"] = df.get("inverters[0].kwh_today")
inv_df["kwh_total"] = df.get("inverters[0].kwh_total")
inv_df["limit_percent"] = df.get("inverters[0].limit_percent")
inv_df["op_state"] = df.get("inverters[0].op_state")
inv_df["pv1_current"] = df.get("inverters[0].pv1_current")
inv_df["pv1_voltage"] = df.get("inverters[0].pv1_voltage")
inv_df["pv2_current"] = df.get("inverters[0].pv2_current")
inv_df["pv2_voltage"] = df.get("inverters[0].pv2_voltage")
inv_df["ambient_temp"] = df.get("sensors[0].ambient_temp")
inv_df["meter_power"] = df.get("meters[0].meter_active_power")
inv_df["grid_freq"] = df.get("meters[0].freq")
inv_df["power_factor"] = df.get("meters[0].pf")
smu_cols = [c for c in df.columns if "smu[" in c and "string" in c]
smu_df = df[["timestamp"] + smu_cols].copy()
smu_df["string_mean"] = smu_df[smu_cols].mean(axis=1)
smu_df["string_std"] = smu_df[smu_cols].std(axis=1)
smu_df["string_min"] = smu_df[smu_cols].min(axis=1)
smu_df["string_max"] = smu_df[smu_cols].max(axis=1)
smu_stats = smu_df[["timestamp","string_mean","string_std","string_min","string_max"]]
final_df = pd.merge(inv_df, smu_stats, on="timestamp", how="left")
inv_df.to_csv("plant3D_2_inverter_dataset.csv", index=False)
smu_stats.to_csv("plant3D_2_smu_statistics.csv", index=False)
final_df.to_csv("plant3D_2_final_dataset.csv", index=False)