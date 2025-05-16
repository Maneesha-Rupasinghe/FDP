from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io

router = APIRouter(prefix="/api/predict", tags=["predict"])

# Load the trained model
try:
    model = load_model("face_disease_mobilenetv2.h5")
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


@router.post("/")
async def predict(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="Uploaded file must be an image"
            )

        # Read and process the image
        file_data = await file.read()
        img = read_imagefile(file_data)
        input_data = preprocess(img)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = CLASS_NAMES[np.argmax(prediction)]
        confidence = float(np.max(prediction))

        return JSONResponse(
            content={"predicted_class": predicted_class, "confidence": confidence}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing prediction: {str(e)}"
        )
