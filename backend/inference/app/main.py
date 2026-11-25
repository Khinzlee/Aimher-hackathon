from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .predictor import DISEASES, Predictor, SymptomPredictor
from .rppg_v8 import RppgV8Predictor

predictor: Optional[Predictor] = None
symptom_predictor: Optional[SymptomPredictor] = None
rppg_v8_predictor: Optional[RppgV8Predictor] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, symptom_predictor, rppg_v8_predictor
    predictor = Predictor()
    symptom_predictor = SymptomPredictor()
    try:
        rppg_v8_predictor = RppgV8Predictor()
    except Exception as exc:
        print(f"[rppg-v8] Model load failed: {exc}")
        rppg_v8_predictor = None
    yield


app = FastAPI(title="Aimher Inference Service", lifespan=lifespan)


class DiseaseFeatures(BaseModel):
    PredFlag: float
    PredScore: float
    RiskProb: float


class PredictRequest(BaseModel):
    pcos_label: float
    features: dict[str, DiseaseFeatures]


class SymptomEntry(BaseModel):
    day_of_cycle: Optional[int] = None
    cycle_phase: Optional[str] = None
    breast_soreness_vas: Optional[float] = None
    painful_touch_vas: Optional[float] = None
    pelvic_pressure_vas: Optional[float] = None
    bloating_delta_cm: Optional[float] = None
    fatigue_mfi5_vas: Optional[float] = None
    acne_severity_likert: Optional[float] = None
    hirsutism_mfg_score: Optional[float] = None


class SymptomPredictRequest(BaseModel):
    entries: list[SymptomEntry]


class RppgV8PredictRequest(BaseModel):
    vector: dict[str, Any]


class RppgV8RegressionRequest(RppgV8PredictRequest):
    target: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": predictor is not None,
        "symptom_model_loaded": symptom_predictor is not None,
        "rppg_v8_model_loaded": rppg_v8_predictor is not None,
    }


@app.post("/predict")
def predict(req: PredictRequest):
    missing = [d for d in DISEASES if d not in req.features]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing disease features: {missing}")
    return predictor.predict(req.model_dump())


@app.post("/predict/from-symptoms")
def predict_from_symptoms(req: SymptomPredictRequest):
    if not req.entries:
        raise HTTPException(status_code=422, detail="entries must not be empty")
    entries = [e.model_dump(exclude_none=True) for e in req.entries]
    return symptom_predictor.predict(entries)


def require_rppg_v8() -> RppgV8Predictor:
    if rppg_v8_predictor is None:
        raise HTTPException(status_code=503, detail="rPPG v8 models are not loaded")
    return rppg_v8_predictor


@app.post("/rppg-v8/predict")
def predict_rppg_v8(req: RppgV8PredictRequest):
    return require_rppg_v8().predict_all(req.vector)


@app.post("/rppg-v8/predict/regression")
def predict_rppg_v8_regression(req: RppgV8RegressionRequest):
    try:
        return require_rppg_v8().predict_regression(req.vector, req.target)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/rppg-v8/predict/mood")
def predict_rppg_v8_mood(req: RppgV8PredictRequest):
    return require_rppg_v8().predict_mood(req.vector)


@app.get("/rppg-v8/metadata")
def rppg_v8_metadata():
    return require_rppg_v8().metadata()
