import pandas as pd
import numpy as np
file_path = "plant_2D-2.csv"
cols = pd.read_csv(file_path, nrows=0).columns
needed_cols = []
for c in cols:
    if "timestamp" in c:
        needed_cols.append(c)
    if "inverters[" in c and (
        ".power" in c
        or ".temp" in c
        or ".kwh_today" in c
        or ".kwh_total" in c
        or ".limit_percent" in c
        or ".op_state" in c
    ):
        needed_cols.append(c)
    if "inverters[" in c and (
        "_current" in c
        or "_voltage" in c
        or "_power" in c
    ):
        needed_cols.append(c)
    if "sensors[0].ambient_temp" in c:
        needed_cols.append(c)
    if "sensors[0].module_temp" in c:
        needed_cols.append(c)
    if "sensors[0].irradiation" in c:
        needed_cols.append(c)
    if "sensors[0].wind_speed" in c:
        needed_cols.append(c)
    if "meters[0]" in c and (
        "meter_active_power" in c
        or ".freq" in c
        or ".pf" in c
        or ".v_" in c
        or ".p_" in c
    ):
        needed_cols.append(c)
    if "smu[" in c and "string" in c:
        needed_cols.append(c)
df = pd.read_csv(file_path, usecols=needed_cols, low_memory=False)
df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
inv_ids = set()
for col in df.columns:
    if "inverters[" in col:
        inv = col.split("[")[1].split("]")[0]
        inv_ids.add(int(inv))
inv_ids = sorted(list(inv_ids))
pv_channels = set()
for col in df.columns:
    if "pv" in col and "_" in col:
        try:
            pv = col.split("pv")[1].split("_")[0]
            pv_channels.add(int(pv))
        except:
            pass
pv_channels = sorted(pv_channels)
rows = []
for inv in inv_ids:
    temp_df = pd.DataFrame()
    temp_df["timestamp"] = df["timestamp"]
    temp_df["plant_id"] = "plant_2"
    temp_df["inverter_id"] = inv
    temp_df["power"] = df.get(f"inverters[{inv}].power")
    temp_df["temp"] = df.get(f"inverters[{inv}].temp")
    temp_df["kwh_today"] = df.get(f"inverters[{inv}].kwh_today")
    temp_df["kwh_total"] = df.get(f"inverters[{inv}].kwh_total")
    temp_df["limit_percent"] = df.get(f"inverters[{inv}].limit_percent")
    temp_df["op_state"] = df.get(f"inverters[{inv}].op_state")
    for pv in pv_channels:
        temp_df[f"pv{pv}_current"] = df.get(f"inverters[{inv}].pv{pv}_current")
        temp_df[f"pv{pv}_voltage"] = df.get(f"inverters[{inv}].pv{pv}_voltage")
        temp_df[f"pv{pv}_power"] = df.get(f"inverters[{inv}].pv{pv}_power")
    temp_df["ambient_temp"] = df.get("sensors[0].ambient_temp")
    temp_df["module_temp"] = df.get("sensors[0].module_temp")
    temp_df["irradiation"] = df.get("sensors[0].irradiation")
    temp_df["wind_speed"] = df.get("sensors[0].wind_speed")
    temp_df["meter_power"] = df.get("meters[0].meter_active_power")
    temp_df["grid_freq"] = df.get("meters[0].freq")
    temp_df["power_factor"] = df.get("meters[0].pf")
    rows.append(temp_df)
inv_df = pd.concat(rows)
smu_cols = [c for c in df.columns if "smu[" in c and "string" in c]
smu_df = df[["timestamp"] + smu_cols].copy()
smu_df["string_mean"] = smu_df[smu_cols].mean(axis=1)
smu_df["string_std"] = smu_df[smu_cols].std(axis=1)
smu_df["string_min"] = smu_df[smu_cols].min(axis=1)
smu_df["string_max"] = smu_df[smu_cols].max(axis=1)
smu_stats = smu_df[["timestamp","string_mean","string_std","string_min","string_max"]]
final_df = pd.merge(inv_df, smu_stats, on="timestamp", how="left")
inv_df.to_csv("plant_2D_2_inverter_dataset.csv", index=False)
smu_stats.to_csv("plant_2D_2_smu_statistics.csv", index=False)
final_df.to_csv("plant_2D_2_final_dataset.csv", index=False)