import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "power","efficiency","string_imbalance","temp_delta",
    "freq","op_state","string_mean","string_std",
    "string_min","string_max","hour","is_daytime",
    "day_of_week","month"
]

TARGET_COL = "fail_next_7_days"

def prepare_dataset(filepath):

    print("\nLoading dataset...")

    df = pd.read_csv(filepath)

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df["global_inverter_id"] = (
        df["plant_id"].astype(str) + "_inv" + df["inverter_id"].astype(str)
    )

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month

    df["is_daytime"] = ((df["hour"] >= 6) & (df["hour"] <= 19)).astype(float)

    for col in FEATURE_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df[TARGET_COL] = pd.to_numeric(df[TARGET_COL], errors="coerce").fillna(0).astype(int)

    print("Rows:", len(df))
    print("Inverters:", df["global_inverter_id"].nunique())

    return df




class InverterDataset(Dataset):

    def __init__(self, df, seq_len, scaler=None, fit_scaler=False):

        self.seq_len = seq_len
        self.samples = []

        raw = df[FEATURE_COLS].values.astype(np.float32)

        if scaler is None:
            scaler = StandardScaler()

        if fit_scaler:
            raw = scaler.fit_transform(raw)
        else:
            raw = scaler.transform(raw)

        self.scaler = scaler
        feat = pd.DataFrame(raw, columns=FEATURE_COLS)

        for gid, grp in df.groupby("global_inverter_id"):

            idx = grp.index.tolist()

            if len(idx) < seq_len + 1:
                continue

            X = feat.loc[idx].values
            y = grp[TARGET_COL].values

            for i in range(len(idx) - seq_len):

                seq = X[i:i+seq_len]
                label = y[i+seq_len]

                self.samples.append((seq,label))

        print("Sequences created:", len(self.samples))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self,i):

        x,y = self.samples[i]

        return (
            torch.tensor(x,dtype=torch.float32),
            torch.tensor(y,dtype=torch.float32)
        )

    def labels(self):
        return np.array([s[1] for s in self.samples])




class SolarLSTM(nn.Module):

    def __init__(self,n_features):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            dropout=0.3
        )

        self.fc = nn.Sequential(
            nn.Linear(128,64),
            nn.ReLU(),
            nn.Linear(64,1)
        )

    def forward(self,x):

        out,_ = self.lstm(x)

        last = out[:,-1,:]

        return self.fc(last).squeeze(-1)




class StratifiedKFold:

    def __init__(self,n_splits=5):
        self.n_splits=n_splits

    def split(self,y):

        unique=np.unique(y)

        folds=[[] for _ in range(self.n_splits)]

        for cls in unique:

            idx=np.where(y==cls)[0]

            np.random.shuffle(idx)

            chunks=np.array_split(idx,self.n_splits)

            for i in range(self.n_splits):
                folds[i].extend(chunks[i])

        for i in range(self.n_splits):

            test_idx=np.array(folds[i])

            train_idx=np.array(
                [j for k in range(self.n_splits) if k!=i for j in folds[k]]
            )

            yield train_idx,test_idx




def train_epoch(model,loader,optimizer,criterion,device):

    model.train()

    for X,y in loader:

        X=X.to(device)
        y=y.to(device)

        out=model(X)

        loss=criterion(out,y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()




def evaluate(model,loader,device):

    model.eval()

    preds=[]
    labels=[]

    with torch.no_grad():

        for X,y in loader:

            X=X.to(device)

            out=torch.sigmoid(model(X)).cpu().numpy()

            preds.extend(out)
            labels.extend(y.numpy())

    preds=np.array(preds)
    labels=np.array(labels)

    preds=(preds>0.5).astype(int)

    return labels,preds


def compute_metrics(y_true,y_pred):

    TP=0
    TN=0
    FP=0
    FN=0

    for t,p in zip(y_true,y_pred):

        if t==1 and p==1:
            TP+=1
        elif t==0 and p==0:
            TN+=1
        elif t==0 and p==1:
            FP+=1
        elif t==1 and p==0:
            FN+=1

    acc=(TP+TN)/(TP+TN+FP+FN)
    precision=TP/(TP+FP) if TP+FP else 0
    recall=TP/(TP+FN) if TP+FN else 0
    f1=2*precision*recall/(precision+recall) if precision+recall else 0

    return dict(
        accuracy=acc,
        precision=precision,
        recall=recall,
        f1=f1
    )

def print_final_dashboard(fold_results):

    print("\n\n")
    print("    █████████████████████████████████████████████████████████████████████████")
    print("    █                                                                       █")
    print("    █                 🌟 FINAL CROSS-VALIDATION DASHBOARD 🌟               █")
    print("    █                                                                       █")
    print("    █████████████████████████████████████████████████████████████████████████")

    print("\n    📊 FOLD-BY-FOLD BREAKDOWN:")
    print("    ┌───────┬────────────┬────────────┬────────────┬────────────┐")
    print("    │ FOLD  │ ACCURACY   │ PRECISION  │ RECALL     │ F1-SCORE   │")
    print("    ├───────┼────────────┼────────────┼────────────┼────────────┤")

    for i,r in enumerate(fold_results):

        print(
            f"    │ #{i+1:<4} │ {r['accuracy']*100:>8.2f} % │ "
            f"{r['precision']*100:>8.2f} % │ "
            f"{r['recall']*100:>8.2f} % │ "
            f"{r['f1']*100:>8.2f} % │"
        )

    print("    └───────┴────────────┴────────────┴────────────┴────────────┘")

    acc=np.array([r["accuracy"] for r in fold_results])
    prec=np.array([r["precision"] for r in fold_results])
    rec=np.array([r["recall"] for r in fold_results])
    f1=np.array([r["f1"] for r in fold_results])

    print("\n    🏆 AGGREGATED METRICS (AVERAGE ACROSS ALL FOLDS):")
    print("    ╔══════════════════════╦════════════════════════════════════╗")

    print(f"    ║ OVERALL ACCURACY     ║ {acc.mean()*100:>10.2f} %  (±{acc.std()*100:.2f}%)   ║")
    print(f"    ║ OVERALL PRECISION    ║ {prec.mean()*100:>10.2f} %  (±{prec.std()*100:.2f}%)   ║")
    print(f"    ║ OVERALL RECALL       ║ {rec.mean()*100:>10.2f} %  (±{rec.std()*100:.2f}%)   ║")
    print(f"    ║ OVERALL F1-SCORE     ║ {f1.mean()*100:>10.2f} %  (±{f1.std()*100:.2f}%)   ║")

    print("    ╚══════════════════════╩════════════════════════════════════╝\n")


def main():

    parser=argparse.ArgumentParser()

    parser.add_argument("--data",type=str,default="master_dataset.csv")
    parser.add_argument("--seq_len",type=int,default=24)
    parser.add_argument("--epochs",type=int,default=10)

    args=parser.parse_args()

    df = prepare_dataset(args.data)

    dataset=InverterDataset(df,args.seq_len,fit_scaler=True)

    labels=dataset.labels()

    splitter=StratifiedKFold(5)

    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")

    fold_results=[]

    for fold,(train_idx,test_idx) in enumerate(splitter.split(labels)):

        train_data=torch.utils.data.Subset(dataset,train_idx)
        test_data=torch.utils.data.Subset(dataset,test_idx)

        train_loader=DataLoader(train_data,batch_size=128,shuffle=True)
        test_loader=DataLoader(test_data,batch_size=128)

        model=SolarLSTM(len(FEATURE_COLS)).to(device)

        optimizer=torch.optim.Adam(model.parameters(),lr=0.001)
        criterion=nn.BCEWithLogitsLoss()

        for epoch in range(args.epochs):
            train_epoch(model,train_loader,optimizer,criterion,device)

        y_true,y_pred=evaluate(model,test_loader,device)

        metrics=compute_metrics(y_true,y_pred)

        fold_results.append(metrics)

    print_final_dashboard(fold_results)


if __name__=="__main__":
    main()