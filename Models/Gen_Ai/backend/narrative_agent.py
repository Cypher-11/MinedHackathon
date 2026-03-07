import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def explain_inverter(data):

    prompt = f"""
You are a solar inverter diagnostics expert.

Explain why the inverter is at risk using this telemetry data.

DATA:
{data}

Provide:

Explanation:
Recommended Action (clean / repair / replace):
"""

    response = model.generate_content(prompt)

    return response.text