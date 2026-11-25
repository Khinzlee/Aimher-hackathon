import json
import os
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort

DEFAULT_MODELS_DIR = (
    Path(__file__).resolve().parents[1] / "models" / "rppg_v8"
)
MODELS_DIR = Path(os.environ.get("RPPG_V8_MODELS_DIR", DEFAULT_MODELS_DIR))


def _as_float(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


class RppgV8Predictor:
    """rPPG v8 ONNX inference for regression targets and mood check."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = Path(models_dir)
        meta_path = self.models_dir / "v8_training_metadata.json"
        if not meta_path.exists():
            raise FileNotFoundError(f"Missing rPPG v8 metadata: {meta_path}")

        self._metadata = json.loads(meta_path.read_text(encoding="utf-8"))
        self.version = self._metadata.get("version", "v8")
        self.all_features = self._metadata.get("all_features", [])
        self.regression_targets = self._metadata.get("regression_targets", [])
        self.per_target_features = self._metadata.get("per_target_features", {})
        self.regression_scalers = self._metadata.get("regression_scalers", {})
        self.mood_meta = self._metadata.get("mood_check", {})

        onnx_dir = self.models_dir / "onnx"
        self.regression_sessions = {}
        for target in self.regression_targets:
            model_path = onnx_dir / f"reg_{target}_LinearRegression.onnx"
            if not model_path.exists():
                raise FileNotFoundError(f"Missing rPPG v8 model: {model_path}")
            self.regression_sessions[target] = ort.InferenceSession(str(model_path))

        mood_path = onnx_dir / "mood_check_MLP.onnx"
        if not mood_path.exists():
            raise FileNotFoundError(f"Missing rPPG v8 model: {mood_path}")
        self.mood_session = ort.InferenceSession(str(mood_path))

    def _raw_features(self, vector: dict[str, Any], feature_names: list[str]) -> list[float]:
        return [_as_float(vector.get(name)) for name in feature_names]

    @staticmethod
    def _scaled(raw: list[float], scaler: dict[str, Any]) -> np.ndarray:
        means = scaler.get("mean", [])
        scales = scaler.get("scale", [])
        values = [
            (value - _as_float(means[i] if i < len(means) else 0.0))
            / (_as_float(scales[i] if i < len(scales) else 1.0) or 1.0)
            for i, value in enumerate(raw)
        ]
        return np.array([values], dtype=np.float32)

    @staticmethod
    def _run(session: ort.InferenceSession, features: np.ndarray) -> list[np.ndarray]:
        input_name = session.get_inputs()[0].name
        return session.run(None, {input_name: features})

    def _predict_regression_target(self, vector: dict[str, Any], target: str) -> dict[str, Any]:
        if target not in self.regression_sessions:
            raise ValueError(f"Unknown rPPG v8 regression target: {target}")

        feature_names = self.per_target_features.get(target)
        scaler = self.regression_scalers.get(target)
        if not feature_names or not scaler:
            raise ValueError(f"Missing feature/scaler metadata for target: {target}")

        raw = self._raw_features(vector, feature_names)
        x = self._scaled(raw, scaler)
        output = self._run(self.regression_sessions[target], x)
        value = round(float(np.asarray(output[0]).reshape(-1)[0]), 2)

        return {
            "target": target,
            "predictions": {"LinearRegression": value},
            "ensemble": value,
        }

    def predict_regression(self, vector: dict[str, Any], target: str) -> dict[str, Any]:
        return self._predict_regression_target(vector, target)

    def _predict_mood(self, vector: dict[str, Any]) -> dict[str, Any]:
        feature_names = self.mood_meta.get("features", [])
        scaler = self.mood_meta.get("scaler")
        if not feature_names or not scaler:
            raise ValueError("Missing rPPG v8 mood-check metadata")

        raw = self._raw_features(vector, feature_names)
        x = self._scaled(raw, scaler)
        output_names = [item.name for item in self.mood_session.get_outputs()]
        feed_name = self.mood_session.get_inputs()[0].name

        if "probabilities" in output_names:
            probabilities = self.mood_session.run(["probabilities"], {feed_name: x})[0]
        else:
            class_count = len(self.mood_meta.get("classes", []))
            candidates = [
                (index, output)
                for index, output in enumerate(self.mood_session.get_outputs())
                if len(output.shape) == 2 and (not class_count or output.shape[-1] == class_count)
            ]
            if not candidates:
                raise RuntimeError("rPPG v8 mood model did not return probabilities")
            probabilities = self.mood_session.run(
                [self.mood_session.get_outputs()[candidates[-1][0]].name],
                {feed_name: x},
            )[0]

        probs = np.asarray(probabilities, dtype=float).reshape(-1)
        classes = self.mood_meta.get("classes", ["Low", "Neutral", "Positive"])
        best_index = int(np.argmax(probs))
        label = classes[best_index] if best_index < len(classes) else "Unknown"
        confidence = float(probs[best_index])

        result = {
            "label": str(label),
            "confidence": round(confidence, 4),
            "probabilities": [round(float(p), 4) for p in probs],
        }
        best_algorithm = self.mood_meta.get("best_model") or "MLP"

        return {
            "best_prediction": result,
            "best_algorithm": best_algorithm,
            "all_predictions": {best_algorithm: result},
            "classes": classes,
        }

    def predict_mood(self, vector: dict[str, Any]) -> dict[str, Any]:
        return self._predict_mood(vector)

    def predict_all(self, vector: dict[str, Any]) -> dict[str, Any]:
        regression = {
            target: self._predict_regression_target(vector, target)
            for target in self.regression_targets
        }
        return {
            "regression": regression,
            "mood_check": self._predict_mood(vector),
            "feature_vector": vector,
        }

    def metadata(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "all_features": self.all_features,
            "regression_targets": self.regression_targets,
            "per_target_features": self.per_target_features,
            "mood_check": self.mood_meta,
        }
