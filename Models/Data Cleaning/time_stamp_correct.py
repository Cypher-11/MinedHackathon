df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
df = df.sort_values("timestamp")
df.to_csv("plant_1D-2_final_dataset_fixed_time.csv", index=False)
import pandas as pd
file = "plant_1D-2_final_dataset.csv"
df = pd.read_csv(file)
df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
df = df.sort_values("timestamp")
df.to_csv("plant_1D-2_final_dataset_fixed_time.csv", index=False)