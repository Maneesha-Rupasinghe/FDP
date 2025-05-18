# BE/routes/auth.py
from fastapi import APIRouter, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import UserCreate, UserInDB
from config.database import db

router = APIRouter()


@router.post("/register", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)  # Add the ObjectId as a string
    return UserInDB(**user_dict)
