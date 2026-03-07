import pandas as pd
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

df = pd.read_csv("./Data/inverter_data.csv")


def ask_question(question):

    question_lower = question.lower()

    if "highest risk" in question_lower:

        highest = df.loc[df["risk_score"].idxmax()]

        inverter_id = highest["global_inverter_id"]
        risk_score = highest["risk_score"]
        temp = highest["temp"]
        power = highest["power"]

        context = f"""
Inverter ID: {inverter_id}
Risk Score: {risk_score}
Temperature: {temp}
Power Output: {power}
"""

        prompt = f"""
You are a solar inverter diagnostics assistant.

Explain why this inverter has the highest risk.

DATA:
{context}

Provide:
1. Explanation
2. Recommended Action
"""

    else:

        sample = df.sample(5).to_string()

        prompt = f"""
Answer the question based on this inverter telemetry.

DATA:
{sample}

Question:
{question}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return str(e)