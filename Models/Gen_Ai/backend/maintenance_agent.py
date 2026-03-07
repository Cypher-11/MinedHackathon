import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def maintenance_decision(data):

    prompt = f"""
You are a solar plant maintenance planner.

Based on this inverter telemetry decide maintenance action.

DATA:
{data}

Return:

Action:
Reason:
Maintenance Ticket:
"""

    response = model.generate_content(prompt)

    return response.text