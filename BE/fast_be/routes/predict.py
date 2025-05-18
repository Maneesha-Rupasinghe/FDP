from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from tensorflow.keras.models import load_model
import os
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io
import base64
from datetime import datetime
from pymongo.collection import Collection
from typing import List, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor
from config.database import get_db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/predict", tags=["predict"])

# Thread pool for synchronous tasks
executor = ThreadPoolExecutor()

# Define the absolute path to the model file
MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "face_disease_mobilenetv2_v2.h5"
)

# Load the trained model
try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    model = load_model(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model: {str(e)}")

# Define class labels
CLASS_NAMES = [
    "Actinic Keratosis",
    "Basal Cell Carcinoma",
    "Eczemaa",
    "Rosacea",
    "Acne",
]

IMG_SIZE = (224, 224)


def read_imagefile(file_data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(file_data)).convert("RGB")


def preprocess(img: Image.Image) -> np.ndarray:
    img = img.resize(IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0  # Rescale
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    return img_array


def predict_image(img_data: bytes) -> tuple[str, float]:
    img = read_imagefile(img_data)
    input_data = preprocess(img)
    prediction = model.predict(input_data)
    predicted_class = CLASS_NAMES[np.argmax(prediction)]
    confidence = float(np.max(prediction))
    return predicted_class, confidence


@router.post("/")
async def predict(
    file: UploadFile = File(...),
    user_id: str = Form(...),  # Use Form(...) for multipart/form-data
    db: Collection = Depends(get_db),
):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="Uploaded file must be an image"
            )

        # Read and process the image
        file_data = await file.read()
        image_base64 = base64.b64encode(file_data).decode("utf-8")

        # Run synchronous prediction in a thread pool
        loop = asyncio.get_event_loop()
        predicted_class, confidence = await loop.run_in_executor(
            executor, lambda: predict_image(file_data)
        )

        # Save the result to MongoDB
        scan_result = {
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "result": predicted_class,
            "confidence": confidence,
            "image_base64": image_base64,
        }
        await db.scan_results.insert_one(scan_result)

        return JSONResponse(
            content={"predicted_class": predicted_class, "confidence": confidence}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing prediction: {str(e)}"
        )


@router.get("/history/{user_id}")
async def get_scan_history(
    user_id: str, page: int = 1, limit: int = 10, db: Collection = Depends(get_db)
) -> Dict[str, Any]:
    try:
        # Calculate skip and limit for pagination
        skip = (page - 1) * limit
        logger.info(
            f"Querying history for user_id: {user_id}, page: {page}, limit: {limit}, skip: {skip}"
        )
        total_records = await db.scan_results.count_documents({"user_id": user_id})
        logger.info(f"Total records found: {total_records}")

        # Fetch paginated history for the user
        history = (
            await db.scan_results.find({"user_id": user_id})
            .sort("timestamp", -1)
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )
        logger.info(f"Retrieved records count: {len(history)}")

        # Convert ObjectId and datetime to string for JSON serialization
        for record in history:
            record["_id"] = str(record["_id"])
            record["timestamp"] = record["timestamp"].isoformat()

        return {
            "data": history,
            "total": total_records,
            "page": page,
            "limit": limit,
            "total_pages": (total_records + limit - 1) // limit,
        }
    except Exception as e:
        logger.error(f"Error fetching scan history: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching scan history: {str(e)}"
        )


@router.get("/stats/{user_id}/condition-frequency")
async def get_condition_frequency(user_id: str, db: Collection = Depends(get_db)):
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp",
                            }
                        },
                        "result": "$result",
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.date": 1}},
        ]
        result = await db.scan_results.aggregate(pipeline).to_list(length=None)
        return [
            {
                "date": r["_id"]["date"],
                "condition": r["_id"]["result"],
                "count": r["count"],
            }
            for r in result
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching condition frequency: {str(e)}"
        )


@router.get("/stats/{user_id}/condition-distribution")
async def get_condition_distribution(user_id: str, db: Collection = Depends(get_db)):
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$result", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        result = await db.scan_results.aggregate(pipeline).to_list(length=None)
        return [{"condition": r["_id"], "count": r["count"]} for r in result]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching condition distribution: {str(e)}"
        )


@router.get("/stats/{user_id}/scan-frequency-by-day")
async def get_scan_frequency_by_day(user_id: str, db: Collection = Depends(get_db)):
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": {"$dayOfWeek": "$timestamp"}, "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]
        result = await db.scan_results.aggregate(pipeline).to_list(length=None)
        days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ]
        return [{"day": days[r["_id"] - 1], "count": r["count"]} for r in result]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching scan frequency by day: {str(e)}"
        )


@router.get("/stats/{user_id}/condition-by-confidence")
async def get_condition_by_confidence(user_id: str, db: Collection = Depends(get_db)):
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$bucket": {
                    "groupBy": "$confidence",
                    "boundaries": [0, 0.5, 0.8, 1.0],
                    "default": "Other",
                    "output": {
                        "conditions": {
                            "$push": {
                                "condition": "$result",
                                "confidence": "$confidence",
                            }
                        }
                    },
                }
            },
        ]
        result = await db.scan_results.aggregate(pipeline).to_list(length=None)

        # Transform the data into a format suitable for a stacked bar chart
        ranges = ["0-0.5", "0.5-0.8", "0.8-1.0"]
        transformed_data = []
        for i, bucket in enumerate(result):
            if bucket["_id"] == "Other":
                continue
            condition_counts = {}
            for entry in bucket["conditions"]:
                condition = entry["condition"]
                condition_counts[condition] = condition_counts.get(condition, 0) + 1
            transformed_data.append({"confidenceRange": ranges[i], **condition_counts})
        return transformed_data
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching condition by confidence: {str(e)}"
        )
