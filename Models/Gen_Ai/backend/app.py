from fastapi import FastAPI
from backend.rag_engine import ask_question
from backend.narrative_agent import explain_inverter
from backend.maintenance_agent import maintenance_decision

app = FastAPI()


@app.get("/ask")
def ask(q: str):
    return {"answer": ask_question(q)}


@app.get("/explain")
def explain(data: str):
    return {"explanation": explain_inverter(data)}


@app.get("/maintenance")
def maintenance(data: str):
    return {"maintenance": maintenance_decision(data)}