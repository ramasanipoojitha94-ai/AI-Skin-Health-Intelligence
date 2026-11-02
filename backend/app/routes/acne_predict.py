import json
import logging
from pathlib import Path
from io import BytesIO

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, UploadFile, File, HTTPException, Form

router = APIRouter(
    prefix="/acne",
    tags=["Acne Severity Analysis"]
)

logger = logging.getLogger(__name__)

ML_DIR = Path(__file__).resolve().parents[1] / "ml"

MODEL_PATH = ML_DIR / "acne_severity_model.keras"
CLASS_PATH = ML_DIR / "acne_class_names.json"

MODEL_VERSION = "acne_severity_model (MobileNetV2 transfer learning)"
CONFIDENCE_THRESHOLD = 50.0
MAX_IMAGE_BYTES = 10 * 1024 * 1024
IMAGE_SIZE = (224, 224)

model = None


def load_class_names():
    if not CLASS_PATH.exists():
        raise RuntimeError(f"Acne class names file not found: {CLASS_PATH}")

    with open(CLASS_PATH, "r", encoding="utf-8") as file:
        class_indices = json.load(file)

    if not isinstance(class_indices, dict) or not class_indices:
        raise RuntimeError("Invalid acne class names file.")

    return {
        int(index): str(name)
        for name, index in class_indices.items()
    }


class_names = load_class_names()


def get_model():
    global model

    if model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Acne model file not found: {MODEL_PATH}")

        model = tf.keras.models.load_model(MODEL_PATH)

    return model


def generate_care_advice(symptoms, duration, description=""):
    recommendations = [
        "Wash your face gently twice daily.",
        "Use a gentle, non-comedogenic moisturizer.",
        "Use broad-spectrum SPF 30 or higher sunscreen.",
        "Avoid squeezing or picking pimples.",
        "Avoid harsh scrubs and excessive exfoliation."
    ]

    cautions = [
        "Introduce skincare products gradually.",
        "Stop products that cause significant irritation."
    ]

    consult = False
    text = description.lower()

    if "Painful or swollen pimples" in symptoms:
        cautions.append(
            "Painful or swollen pimples may need dermatologist assessment."
        )
        consult = True

    if "Pus-filled pimples" in symptoms:
        cautions.append(
            "Avoid squeezing pus-filled pimples. Seek professional advice if persistent or worsening."
        )
        consult = True

    if "Acne scars or dark spots" in symptoms:
        cautions.append(
            "Avoid picking acne to reduce the risk of further scarring."
        )
        consult = True

    if duration in ["3–6 months", "More than 6 months"]:
        cautions.append(
            "Consider consulting a dermatologist because symptoms have persisted."
        )
        consult = True

    if any(word in text for word in ["dry", "dryness", "flaky"]):
        recommendations.append(
            "If your skin feels dry, use a gentle fragrance-free moisturizer."
        )

    if any(word in text for word in ["oily", "oiliness", "greasy"]):
        recommendations.append(
            "For oily skin, consider a gentle non-comedogenic cleanser."
        )

    if any(word in text for word in ["itch", "itchy", "irritation", "burning"]):
        cautions.append(
            "Avoid introducing new active skincare products while irritation is present. Seek medical advice if it persists."
        )

    if any(word in text for word in ["swelling", "severe pain", "getting worse"]):
        cautions.append(
            "Seek professional medical assessment for worsening or severe symptoms."
        )
        consult = True

    return {
        "recommendations": recommendations,
        "cautions": cautions,
        "consult_dermatologist": consult
    }


def _validate_image(contents):
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
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
            detail="Image resolution is too small."
        )

    return image


@router.get("/model-info")
def model_info():
    return {
        "model_version": MODEL_VERSION,
        "model_file": MODEL_PATH.name,
        "classes": list(class_names.values()),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "model_available": MODEL_PATH.exists()
    }


@router.post("/analyze")
async def analyze_acne(
    file: UploadFile = File(...),
    duration: str = Form(...),
    symptoms: str = Form(...),
    areas: str = Form(...),
    description: str = Form("")
):
    if (file.content_type or "").lower() not in [
        "image/jpeg",
        "image/png"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG or PNG image."
        )

    allowed_durations = [
        "Less than 1 month",
        "1–3 months",
        "3–6 months",
        "More than 6 months"
    ]

    allowed_symptoms = [
        "Painless pimples",
        "Painful or swollen pimples",
        "Itching or irritation",
        "Whiteheads and blackheads",
        "Pus-filled pimples",
        "Acne scars or dark spots"
    ]

    allowed_areas = [
        "Forehead",
        "Cheeks",
        "Nose",
        "Chin and jawline",
        "Multiple areas"
    ]

    selected_symptoms = [
        item.strip()
        for item in symptoms.split(",")
        if item.strip()
    ]

    selected_areas = [
        item.strip()
        for item in areas.split(",")
        if item.strip()
    ]

    description = description.strip()

    if len(description) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Description must be under 1000 characters."
        )

    if duration not in allowed_durations:
        raise HTTPException(
            status_code=400,
            detail="Invalid acne duration."
        )

    if not selected_symptoms or any(
        item not in allowed_symptoms for item in selected_symptoms
    ):
        raise HTTPException(
            status_code=400,
            detail="Select valid acne symptoms."
        )

    if not selected_areas or any(
        item not in allowed_areas for item in selected_areas
    ):
        raise HTTPException(
            status_code=400,
            detail="Select valid affected areas."
        )

    contents = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()

    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum size is 10 MB."
        )

    image = _validate_image(contents)

    try:
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
                "Model output count does not match acne class names."
            )

        if not np.all(np.isfinite(predictions)):
            raise RuntimeError("Model returned invalid prediction values.")

        sorted_indices = np.argsort(predictions)[::-1]

        top_predictions = []

        for idx in sorted_indices[:3]:
            top_predictions.append({
                "prediction": class_names.get(
                    int(idx),
                    f"Class {int(idx)}"
                ),
                "confidence": round(
                    float(predictions[int(idx)]) * 100,
                    2
                )
            })

        best = top_predictions[0]
        is_uncertain = best["confidence"] < CONFIDENCE_THRESHOLD

        prediction = (
            "Uncertain / Unclassified"
            if is_uncertain
            else best["prediction"]
        )

        care = generate_care_advice(
            selected_symptoms,
            duration,
            description
        )

        return {
            "user_description": description,
            "prediction": prediction,
            "confidence": best["confidence"],
            "top_predictions": top_predictions,
            "uncertain": is_uncertain,
            "model_version": MODEL_VERSION,
            "duration": duration,
            "symptoms": selected_symptoms,
            "affected_areas": selected_areas,
            "symptom_summary": (
                f"You reported {', '.join(selected_symptoms)} "
                f"in {', '.join(selected_areas)}."
            ),
            "care_recommendations": care["recommendations"],
            "cautions": care["cautions"],
            "consult_dermatologist": care["consult_dermatologist"],
            "note": (
                "The image prediction and symptom assessment are separate "
                "educational assessments. They are not a medical diagnosis."
            )
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Acne severity analysis failed.")

        raise HTTPException(
            status_code=500,
            detail="Acne analysis failed. Please check the model files and try again."
        )