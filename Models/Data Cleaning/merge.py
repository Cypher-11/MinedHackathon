import pandas as pd
import numpy as np
p1 = pd.read_csv("merged_file_plant_1.csv")
p2 = pd.read_csv("merged_file_plant_2.csv")
p3 = pd.read_csv("merged_file_plant_3.csv")
columns = [
    "timestamp","plant_id","inverter_id",
    "power","temp","kwh_today","kwh_total",
    "ambient_temp",
    "string_mean","string_std","string_min","string_max",
    "limit_percent",
    "meter_power","grid_freq","power_factor",
    "irradiation","module_temp","wind_speed",
    "freq","v_ab","v_bc","v_ca",
    "op_state"
]
def align_schema(df):
    for col in columns:
        if col not in df.columns:
            df[col] = np.nan
    return df[columns]
p1 = align_schema(p1)
p2 = align_schema(p2)
p3 = align_schema(p3)
df = pd.concat([p1,p2,p3], ignore_index=True)
df.to_csv("solar_unified_dataset.csv", index=False)

before = df.shape[0]
df = df[df["power"] > 50]
after = df.shape[0]
df = df.fillna(df.median(numeric_only=True))
df.to_csv("solar_feature_engineered_dataset.csv", index=False)
df = df.fillna(df.median(numeric_only=True))
print("\n[5/6] Removing night-time rows...")
before = df.shape[0]
df = df[df["power"] > 50]
after = df.shape[0]
print("Rows removed:", before - after)
print("\n[6/6] Creating engineered features...")
df["efficiency"] = df["power"] / (df["meter_power"] + 1)
df["temp_delta"] = df["temp"] - df["ambient_temp"]
df["string_imbalance"] = df["string_std"] / (df["string_mean"] + 0.0001)
df = df.replace([np.inf,-np.inf],np.nan)
df = df.fillna(df.median(numeric_only=True))
print("Final dataset shape:", df.shape)
df.to_csv("solar_feature_engineered_dataset.csv", index=False)
print("\n===== Dataset Processing Completed =====")