import pandas as pd
import numpy as np
file_path = "plant_1D-2.csv"
cols = pd.read_csv(file_path, nrows=0).columns
needed_cols = []
for c in cols:
    if "timestamp" in c:
        needed_cols.append(c)
    if "sensors[0].ambient_temp" in c:
        needed_cols.append(c)
    if "inverters[" in c and (
        "pv1_power" in c
        or ".power" in c
        or ".temp" in c
        or ".freq" in c
        or ".v_ab" in c
        or ".v_bc" in c
        or ".v_ca" in c
        or ".kwh_today" in c
        or ".kwh_total" in c
        or ".op_state" in c
    ):
        needed_cols.append(c)
    if "smu[" in c and "string" in c:
        needed_cols.append(c)
df = pd.read_csv(file_path, usecols=needed_cols, low_memory=False)
inv_ids = set()
for col in df.columns:
    if "inverters[" in col:
        inv = col.split("[")[1].split("]")[0]
        inv_ids.add(int(inv))

inv_ids = sorted(list(inv_ids))

print("Detected inverters:", inv_ids)
print("\n[4/8] Creating inverter dataset...")
rows = []
for inv in inv_ids:
    print(f"Processing inverter {inv}")
    temp_df = pd.DataFrame()
    temp_df["timestamp"] = df["timestamp"]
    temp_df["plant_id"] = "plant_1"
    temp_df["inverter_id"] = inv
    temp_df["pv1_power"] = df[f"inverters[{inv}].pv1_power"]
    temp_df["power"] = df[f"inverters[{inv}].power"]
    temp_df["temp"] = df[f"inverters[{inv}].temp"]
    temp_df["freq"] = df[f"inverters[{inv}].freq"]
    temp_df["v_ab"] = df[f"inverters[{inv}].v_ab"]
    temp_df["v_bc"] = df[f"inverters[{inv}].v_bc"]
    temp_df["v_ca"] = df[f"inverters[{inv}].v_ca"]
    temp_df["kwh_today"] = df[f"inverters[{inv}].kwh_today"]
    temp_df["kwh_total"] = df[f"inverters[{inv}].kwh_total"]
    temp_df["ambient_temp"] = df["sensors[0].ambient_temp"]
    temp_df["op_state"] = df[f"inverters[{inv}].op_state"]
    rows.append(temp_df)
inv_df = pd.concat(rows)
print("Inverter dataset shape:", inv_df.shape)
print("\n[5/8] Creating fault label...")
inv_df["fault"] = np.where(inv_df["op_state"] == 0, 0, 1)
inv_df = inv_df.dropna(subset=["op_state"])
print("Rows after cleaning:", inv_df.shape[0])
print("\n[6/8] Extracting SMU data...")
smu_cols = [c for c in df.columns if "smu[" in c and "string" in c]
print("Total SMU string columns:", len(smu_cols))
smu_df = df[["timestamp"] + smu_cols].copy()
print("\n[7/8] Computing SMU statistics...")
smu_df["string_mean"] = smu_df[smu_cols].mean(axis=1)
smu_df["string_std"] = smu_df[smu_cols].std(axis=1)
smu_df["string_min"] = smu_df[smu_cols].min(axis=1)
smu_df["string_max"] = smu_df[smu_cols].max(axis=1)
smu_stats = smu_df[["timestamp","string_mean","string_std","string_min","string_max"]]
print("SMU stats shape:", smu_stats.shape)
print("\n[8/8] Merging datasets using timestamp...")
final_df = pd.merge(inv_df, smu_stats, on="timestamp", how="left")
print("Final dataset shape:", final_df.shape)
print("\nSaving datasets...")
inv_df.to_csv("plant_1D-2_inverter_dataset.csv", index=False)
smu_stats.to_csv("plant_1D-2_smu_statistics.csv", index=False)
final_df.to_csv("plant_1D-2_final_dataset.csv", index=False)
print("\nSaved files:")
print("plant1_inverter_dataset.csv")
print("plant1_smu_statistics.csv")
print("plant1_final_dataset.csv")
print("\n===== Plant 1 Processing Completed =====")