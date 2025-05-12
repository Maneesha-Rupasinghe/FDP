# BE/main.py
from fastapi import FastAPI
from config.database import db, test_connection
from fastapi.encoders import jsonable_encoder
from bson.objectid import ObjectId
from routes.auth import router as auth_router

app = FastAPI()

# Include authentication routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])


@app.get("/test")
async def test_endpoint():
    return {"test endpoint"}


# Correct way to handle custom JSON encoding for ObjectId
def custom_json_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


# Test MongoDB connection on startup
@app.on_event("startup")
async def startup_event():
    await test_connection()


# Test endpoint to insert and retrieve a document
@app.get("/test-mongo")
async def test_mongo():
    # Insert a test document
    test_data = {"name": "Test Document", "value": "Hello MongoDB"}
    result = await db.test_collection.insert_one(test_data)

    # Retrieve the document
    document = await db.test_collection.find_one({"_id": result.inserted_id})

    # Prepare response with custom encoding
    if document is not None:
        response_data = jsonable_encoder(
            document, custom_encoder={ObjectId: custom_json_encoder}
        )
    else:
        response_data = None

    return {"message": "MongoDB connected", "data": response_data}
