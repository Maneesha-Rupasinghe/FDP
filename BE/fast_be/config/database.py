from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB URI from .env
MONGO_URI = os.getenv(
    "MONGO_URI", "mongodb://localhost:27017/"
)  # Default to localhost if not set

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
db = client["fdpDB"]  # Database name: fdpDB


# Dependency to get the database
async def get_db():
    return db


# Test connection (optional, for debugging)
async def test_connection():
    try:
        await client.server_info()  # Check if MongoDB server is reachable
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
