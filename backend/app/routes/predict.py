
import json
import logging
from pathlib import Path
from io import BytesIO

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/predict", tags=["AI Skin Analysis"])

logger = logging.getLogger(__name__)

APP_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = APP_DIR / "ml" / "skin_disease_model_v2.keras"
CLASS_NAMES_PATH = APP_DIR / "ml" / "class_names.json"

MODEL_VERSION = "skin_disease_model_v2 (MobileNetV2 transfer learning)"
CONFIDENCE_THRESHOLD = 60.0
MAX_IMAGE_BYTES = 10 * 1024 * 1024
IMAGE_SIZE = (224, 224)

model = None
class_names = []


def load_class_names():
    global class_names

    try:
        with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
            loaded_names = json.load(file)

        if not isinstance(loaded_names, list) or not loaded_names:
            raise ValueError("class_names.json must contain a non-empty list.")

        class_names = [str(name) for name in loaded_names]

    except Exception:
        logger.exception("Could not load skin disease class names.")
        class_names = []


load_class_names()


def get_model():
    global model

    if model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(
                f"Skin disease model not found: {MODEL_PATH}"
            )

        model = tf.keras.models.load_model(MODEL_PATH)

    return model


def _specialist_for(name: str) -> str:
    lower = name.lower()

    if any(term in lower for term in ["melanoma", "carcinoma", "malignant"]):
        return "Dermatologist / Dermato-oncologist"

    if any(term in lower for term in ["fungal", "tinea", "candid"]):
        return "Dermatologist"

    if any(term in lower for term in ["bacterial", "cellulitis", "impetigo"]):
        return "Dermatologist / General physician"

    if any(term in lower for term in ["viral", "herpes", "hpv"]):
        return "Dermatologist / Sexual health physician"

    if any(term in lower for term in [
        "allerg", "dermatitis", "eczema", "urticaria", "hives"
    ]):
        return "Dermatologist / Allergist"

    if any(term in lower for term in ["lupus", "vasculitis", "connective"]):
        return "Dermatologist / Rheumatologist"

    if "pigment" in lower:
        return "Dermatologist"

    if any(term in lower for term in ["hair", "alopecia"]):
        return "Dermatologist / Trichologist"

    return "Dermatologist"


def _validate_image(contents: bytes):
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    try:
        image = Image.open(BytesIO(contents))
        image.verify()

        image = Image.open(BytesIO(contents)).convert("RGB")

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image. Please upload a valid JPG or PNG."
        )

    if image.width < 32 or image.height < 32:
        raise HTTPException(
            status_code=400,
            detail="Image resolution is too small. Upload a clearer image."
        )

    return image


@router.get("/model-info")
def model_info():
    return {
        "model_version": MODEL_VERSION,
        "model_file": MODEL_PATH.name,
        "num_classes": len(class_names),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "image_size": IMAGE_SIZE,
        "model_available": MODEL_PATH.exists(),
    }


@router.post("/analyze")
async def analyze_skin(file: UploadFile = File(...)):

    allowed_types = {
        "image/jpeg",
        "image/png",
    }

    content_type = (file.content_type or "").lower()

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG or PNG image."
        )

    contents = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()

    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum allowed size is 10 MB."
        )

    image = _validate_image(contents)

    try:
        if not class_names:
            raise RuntimeError("Skin disease class names could not be loaded.")

        processed_image = image.resize(IMAGE_SIZE)

        image_array = np.array(
            processed_image,
            dtype=np.float32
        )

        image_array = tf.keras.applications.mobilenet_v2.preprocess_input(
            image_array
        )

        image_array = np.expand_dims(image_array, axis=0)

        predictions = get_model().predict(
            image_array,
            verbose=0
        )[0]

        predictions = np.asarray(predictions).flatten()

        if len(predictions) != len(class_names):
            raise RuntimeError(
                "Model output count does not match the class names file."
            )

        if not np.all(np.isfinite(predictions)):
            raise RuntimeError("Model returned invalid prediction values.")

        sorted_indices = np.argsort(predictions)[::-1]

        top_predictions = []

        for idx in sorted_indices[:3]:
            confidence = float(predictions[idx]) * 100

            top_predictions.append({
                "prediction": class_names[int(idx)],
                "confidence": round(confidence, 2),
            })

        best = top_predictions[0]
        is_uncertain = best["confidence"] < CONFIDENCE_THRESHOLD

        result_label = (
            "Uncertain / Unclassified"
            if is_uncertain
            else best["prediction"]
        )

        response = {
            "prediction": result_label,
            "confidence": best["confidence"],
            "top_predictions": top_predictions,
            "uncertain": is_uncertain,
            "model_version": MODEL_VERSION,
            "message": "AI prediction generated successfully.",
            "note": (
                "Experimental AI result only. This is not a medical diagnosis. "
                "Consult a qualified dermatologist for evaluation."
            ),
        }

        if is_uncertain:
            response.update({
                "description": (
                    "The model could not confidently classify this image. "
                    "Try a clearer image or consult a dermatologist."
                ),
                "precautions": [
                    "Use a clear, well-lit image.",
                    "Avoid relying on this result for medical decisions.",
                    "Consult a dermatologist if you have concerns."
                ],
                "specialist": "Dermatologist",
            })

        else:
            response.update({
                "description": (
                    f"{best['prediction']} is a possible condition suggested "
                    "by the AI model. It requires professional evaluation."
                ),
                "precautions": [
                    "Protect your skin from excessive sun exposure.",
                    "Avoid self-medicating or applying unverified treatments.",
                    "Monitor the affected area for changes.",
                    "Consult a qualified dermatologist."
                ],
                "specialist": _specialist_for(best["prediction"]),
            })

        return response

    except HTTPException:
        raise

    except Exception:
        logger.exception("Skin analysis failed.")

        raise HTTPException(
            status_code=500,
            detail="Skin analysis failed. Please check the model files and try again."
        )