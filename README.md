## Contributor
Dhyey Upadhyay : dhyeyupadhyay19@gmail.com (Frontend & Backend)
Divyansh Gandhi : gandhidivyansh2@gmail.com (Feature Engineering, Dataset Cleaning, ML)
Rajan Vadhavana : rajanvadhavana02@gmail.com (Frotnend & Backend)
Karmit Langhnoda : karmitlanghnoda22102005@gmail.com (Backend & ML)
Anas Multani : anasmultani930@gmail.com (Generative AI)

# ☀️ Solar Inverter Failure Prediction & Intelligence Platform

Predict solar inverter failures **7--10 days before they happen** using
machine learning and automated maintenance workflows.

This platform analyzes solar plant telemetry data, predicts inverter
failures in advance, and automatically creates maintenance tickets for
engineers.

The system is designed to **reduce downtime, increase solar efficiency,
and automate plant maintenance operations.**

------------------------------------------------------------------------

# 🚨 Problem Statement

Solar plants operate hundreds of inverters that must run continuously.

Current challenges include:

• Failures detected **after energy loss**\
• **Manual inspection** required to diagnose issues\
• **Dirty panels reducing efficiency**\
• **Slow maintenance response**\
• Engineers overwhelmed with unnecessary alerts

These issues cause **energy production loss and higher operational
costs.**

Our system solves this with **AI-based predictive maintenance.**

------------------------------------------------------------------------

# 💡 Solution Overview

We built a **Smart Solar Predictive Maintenance Platform.**

The system:

1.  Collects telemetry data from solar inverters\
2.  Processes and standardizes raw plant data\
3.  Uses an **LSTM time-series ML model**\
4.  Predicts inverter failures **7 days in advance**\
5.  Automatically generates maintenance tickets\
6.  Assigns tasks to **Site Engineers or Repair/Maintenance Engineers**\
7.  Displays system status in dashboards

This enables **early intervention before inverter failures occur.**

------------------------------------------------------------------------

# 🏗 System Architecture

The architecture contains four layers.

## IoT Layer

Solar inverters send telemetry signals such as:

-   Power output
-   Temperature
-   Frequency
-   Operational state
-   String currents

## Backend Layer

Handles:

-   Data ingestion APIs
-   Data processing
-   ML prediction
-   Ticket generation

## Database Layer

Stores:

-   Telemetry data
-   Maintenance tickets
-   User roles

MongoDB is used for scalable storage.

## Frontend Layer

Role-based dashboards:

-   Manager Dashboard
-   Site Engineer Dashboard
-   Repair / Maintenance Engineer Dashboard

Each role sees only relevant tasks and alerts.

------------------------------------------------------------------------

# 🔄 System Workflow

1.  Solar inverters send telemetry data\
2.  Backend receives data through API\
3.  Data stored in database\
4.  ML model predicts inverter health\
5.  If risk detected → maintenance ticket generated\
6.  Ticket assigned to **Site Engineer or Repair/Maintenance Engineer**\
7.  Dashboard updated in real time

------------------------------------------------------------------------

# 📊 Dataset Description

We collected raw telemetry data from **three different solar plants.**

## Plant 1

-   12 inverters
-   Inverter telemetry data
-   SMU string current data

## Plant 2

-   5 inverters
-   Inverter data
-   PV channel data
-   Weather data
-   Grid data

## Plant 3

-   1 inverter
-   Inverter data
-   PV channel data
-   Grid data

Each plant had **different sensors and schemas**, and the datasets **did
not contain labels.**

------------------------------------------------------------------------

# 🧹 Data Preprocessing

## Wide → Long Transformation

Originally inverter readings were stored as:

    power_inv1
    power_inv2
    power_inv3

This format is called **wide format**, which is not suitable for ML.

We reshaped the data so each row represents:

    (timestamp, plant_id, inverter_id, features...)

This allows us to analyze **each inverter individually over time.**

------------------------------------------------------------------------

# ⚡ SMU String Feature Engineering

SMU strings represent electrical output from panel strings.

Instead of keeping dozens of string columns, we converted them into
statistical features:

-   string_mean
-   string_min
-   string_max
-   string_std

From these statistics we derived:

    string_imbalance

This helps detect:

-   Panel degradation
-   Shading issues
-   Wiring faults

------------------------------------------------------------------------

# 🧬 Unified Data Schema

Each plant had different sensors.

We created a **unified schema** so all datasets could be merged.

Common signals:

-   inverter power
-   temperature
-   efficiency
-   grid frequency
-   operational state

Missing values were handled appropriately.

------------------------------------------------------------------------

# ⚙️ Feature Engineering

Additional features created:

### Efficiency

Represents inverter performance relative to power output.

### Temperature Delta

Measures thermal stress on inverter components.

### String Imbalance

Detects panel-level anomalies.

### Time Features

Extracted from timestamps:

-   hour
-   day_of_week
-   month
-   is_daytime

------------------------------------------------------------------------

# 🏷 Label Creation

Original datasets **had no labels.**

We created labels using **future inverter operational states.**

## Future Labeling Strategy

For each timestamp:

    label = inverter_state within next 7 days

If failure occurs:

    fail_next_7_days = 1

Otherwise:

    fail_next_7_days = 0

This allows the model to **learn patterns that appear before failures.**

------------------------------------------------------------------------

# 🤖 Machine Learning Model

We use an **LSTM neural network** for time-series prediction.

Why LSTM?

Because inverter performance depends on **temporal patterns over time.**

------------------------------------------------------------------------

# 🧠 Model Architecture

Input → LSTM → Dense layers → Failure probability

    Input Features: 14

    LSTM
    Hidden Size: 128
    Layers: 2
    Dropout: 0.3

    Dense Layers
    128 → 64 → 1

    Output
    Failure Probability

------------------------------------------------------------------------

# 📈 Input Features

    power
    efficiency
    string_imbalance
    temp_delta
    freq
    op_state
    string_mean
    string_std
    string_min
    string_max
    hour
    is_daytime
    day_of_week
    month

Target variable:

    fail_next_7_days

------------------------------------------------------------------------

# ⏱ Sequence Generation

Each training sample represents a **time window of inverter behavior.**

Example:

    sequence_length = 24 timestamps

The model learns patterns from **past readings to predict future
failures.**

------------------------------------------------------------------------

# 🔢 Data Scaling

We apply feature normalization using:

    StandardScaler

This improves neural network training stability.

------------------------------------------------------------------------

# 🔁 Cross Validation

We implemented **Stratified K-Fold Cross Validation.**

    Number of folds: 5

This ensures balanced failure distribution across folds.

------------------------------------------------------------------------

# 🏋️ Training Process

For each fold:

1.  Split dataset into train/test
2.  Train LSTM model
3.  Predict failure risk
4.  Evaluate metrics

Loss Function:

    Binary Cross Entropy with Logits

Optimizer:

    Adam
    learning_rate = 0.001

------------------------------------------------------------------------

# 📊 Evaluation Metrics

We evaluate the model using:

-   Accuracy
-   Precision
-   Recall
-   F1 Score

These metrics measure the model's ability to detect failures early.

------------------------------------------------------------------------

# ⚠️ Model Output

The model outputs:

    Probability of inverter failure within next 7 days

Example:

    Inverter 12 → 0.82 probability

This triggers a **maintenance ticket.**

------------------------------------------------------------------------

# 🎫 Ticket Automation System

Based on ML predictions:

### Panel Cleaning Required

Ticket assigned to **Site Engineer**

### Hardware Failure Detected

Ticket assigned to **Repair / Maintenance Engineer**

### Escalation System

    Site Engineer → Repair / Maintenance Engineer → Replacement

------------------------------------------------------------------------

# 👥 Role-Based Dashboards

## Manager

-   Monitor plant performance
-   View inverter health
-   Track maintenance tickets

## Site Engineer

-   Receive cleaning or inspection tickets
-   Update task completion status

## Repair / Maintenance Engineer

-   Receive repair tickets
-   Diagnose and fix technical issues

------------------------------------------------------------------------

# ⭐ Key Features

-   AI-based solar inverter failure prediction
-   Predict failures **7 days in advance**
-   Automated maintenance ticket generation
-   Real-time monitoring dashboards
-   Role-based access control
-   Scalable system architecture

------------------------------------------------------------------------

# 📉 Benefits

-   Reduced inverter downtime
-   Improved solar plant efficiency
-   Faster maintenance response
-   Automated maintenance management
-   Scalable for large solar farms

------------------------------------------------------------------------

# ▶️ Running the ML Model

## Install Dependencies

    pip install numpy pandas torch scikit-learn

## Run Training

    python train_model.py --data master_dataset.csv --seq_len 24 --epochs 10

------------------------------------------------------------------------

# 🔮 Future Improvements

-   Real-time IoT streaming
-   Explainable AI for root-cause analysis
-   SCADA system integration
-   Mobile maintenance alerts
-   Online model retraining

------------------------------------------------------------------------

# 🛠 Tech Stack

Backend: Python, FastAPI\
Machine Learning: PyTorch, Scikit-learn\
Data Processing: Pandas, NumPy\
Database: MongoDB\
Frontend: React

------------------------------------------------------------------------

# 🏆 Hackathon Project

**Solar Inverter Failure Prediction & Intelligence Platform**

Built for **HackaMined 2026**\
Goal: **AI-powered predictive maintenance for solar plants**
