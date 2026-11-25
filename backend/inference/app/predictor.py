import os

import joblib
import numpy as np
import pandas as pd

DISEASES = ["Infertility", "Dysmenorrhea", "PMDD", "T2D", "CVD", "Endometrial"]

# Model files are in the docs/ directory (mounted as /app/docs in container)
DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "docs")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Try docs directory first (where model files actually are), then models as fallback
BUNDLE_PATH = os.environ.get(
    "MODEL_BUNDLE", 
    os.path.join(DOCS_DIR, "all_models_bundle.joblib")
)
if not os.path.exists(BUNDLE_PATH):
    BUNDLE_PATH = os.path.join(MODELS_DIR, "all_models_bundle.joblib")

SYMPTOM_BUNDLE_PATH = os.environ.get(
    "SYMPTOM_MODEL_BUNDLE", 
    os.path.join(DOCS_DIR, "all_models_symptom_bundle.joblib")
)
if not os.path.exists(SYMPTOM_BUNDLE_PATH):
    SYMPTOM_BUNDLE_PATH = os.path.join(MODELS_DIR, "all_models_symptom_bundle.joblib")

# snake_case API fields -> training column names
FIELD_MAP = {
    "cycle_phase": "Cycle_Phase",
    "breast_soreness_vas": "Breast_Soreness_VAS",
    "painful_touch_vas": "Painful_Touch_VAS",
    "pelvic_pressure_vas": "Pelvic_Pressure_VAS",
    "bloating_delta_cm": "Bloating_Delta_cm",
    "fatigue_mfi5_vas": "Fatigue_MFI5_VAS",
    "acne_severity_likert": "Acne_Severity_Likert",
    "hirsutism_mfg_score": "Hirsutism_mFG_Score",
}
SYMPTOMS = [v for k, v in FIELD_MAP.items() if k != "cycle_phase"]
PHASES = ["Follicular", "Luteal", "Menstrual", "Ovulatory"]


def clf_category(p: float) -> str:
    if p < 0.33:
        return "Low"
    if p < 0.66:
        return "Moderate"
    return "High"


def reg_category(s: float) -> str:
    if s < 0.2:
        return "Minimal"
    if s < 0.4:
        return "Mild"
    if s < 0.6:
        return "Moderate"
    return "Severe"


def disease_results(bundle, X: np.ndarray) -> dict:
    results = {}
    for d in DISEASES:
        prob = float(bundle["classifiers"][d].predict_proba(X)[0, 1])
        score = float(np.clip(bundle["regressors"][d].predict(X)[0], 0, 1))
        results[d] = {
            "probability": round(prob, 4),
            "predicted": int(prob >= 0.5),
            "severity": clf_category(prob),
            "riskScore": round(score, 4),
            "riskSeverity": reg_category(score),
        }
    return {"diseases": results}


class Predictor:
    """Stage-2 models: pcos_label + per-disease PredFlag/PredScore/RiskProb."""

    def __init__(self, bundle_path: str = BUNDLE_PATH):
        self.bundle = joblib.load(bundle_path)
        self.features = self.bundle["features"]

    def _row(self, payload: dict) -> np.ndarray:
        feats = payload["features"]
        row = {"pcos_label": payload["pcos_label"]}
        for d in DISEASES:
            for s in ("PredFlag", "PredScore", "RiskProb"):
                row[f"{d}_{s}"] = feats[d][s]
        return np.array([[row[f] for f in self.features]], dtype=float)

    def predict(self, payload: dict) -> dict:
        return disease_results(self.bundle, self._row(payload))


class SymptomPredictor:
    """Symptom-log models: per-patient aggregates of daily symptom entries.

    Replicates the feature engineering in train_model_symptom_log.ipynb:
    per-symptom mean/std(ddof=1)/max, per-phase means, and
    luteal/menstrual minus follicular deltas. Missing phases and the
    std of a single entry become NaN, which XGBoost handles natively.
    """

    def __init__(self, bundle_path: str = SYMPTOM_BUNDLE_PATH):
        self.bundle = joblib.load(bundle_path)
        self.features = self.bundle["features"]

    def _entries_to_frame(self, entries: list[dict]) -> pd.DataFrame:
        rows = []
        for e in entries:
            row = {col: e.get(api_key) for api_key, col in FIELD_MAP.items()}
            rows.append(row)
        return pd.DataFrame(rows)

    def _features(self, entries: list[dict]) -> dict:
        df = self._entries_to_frame(entries)
        feat = {}
        for s in SYMPTOMS:
            vals = df[s].astype(float)
            feat[f"{s}_mean"] = vals.mean()
            feat[f"{s}_std"] = vals.std(ddof=1)
            feat[f"{s}_max"] = vals.max()
        for s in SYMPTOMS:
            for p in PHASES:
                mask = df["Cycle_Phase"] == p
                feat[f"{s}_{p}"] = (
                    df.loc[mask, s].astype(float).mean() if mask.any() else np.nan
                )
        for s in SYMPTOMS:
            feat[f"{s}_Luteal_minus_Follicular"] = (
                feat[f"{s}_Luteal"] - feat[f"{s}_Follicular"]
            )
            feat[f"{s}_Menstrual_minus_Follicular"] = (
                feat[f"{s}_Menstrual"] - feat[f"{s}_Follicular"]
            )
        return feat

    def predict(self, entries: list[dict]) -> dict:
        feat = self._features(entries)
        X = np.array([[feat.get(f, np.nan) for f in self.features]], dtype=float)
        return disease_results(self.bundle, X)
