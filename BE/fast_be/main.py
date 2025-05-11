from fastapi import FastAPI
from config.database import db, test_connection

app = FastAPI()


@app.get("/test")
async def test_endpoint():
    return {"message": "Hello, this is a test endpoint!"}


# Test MongoDB connection on startup
@app.on_event("startup")
async def startup_event():
    await test_connection()


# Test endpoint to insert and retrieve a document
@app.get("/test-mongo")
async def test_mongo():
    # Insert a test document
    test_data = {"name": "Test Document", "value": "Hello MongoDB"}
    await db.test_collection.insert_one(test_data)

    # Retrieve the document
    result = await db.test_collection.find_one({"name": "Test Document"})
    return {"message": "MongoDB connected", "data": result}
