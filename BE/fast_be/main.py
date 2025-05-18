from fastapi import FastAPI
from config.database import db, test_connection
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from auth.auth import router
from auth.chat import router as chat_router
from routes.appointments import router as appointments_router
from routes import predict

app = FastAPI()

# Include routes
app.include_router(router, prefix="/auth")
app.include_router(chat_router)
app.include_router(appointments_router)
app.include_router(predict.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom JSON encoder for ObjectId
def custom_json_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


# Test MongoDB connection on startup
@app.on_event("startup")
async def startup_event():
    await test_connection()


# Test endpoint
@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint"}


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
