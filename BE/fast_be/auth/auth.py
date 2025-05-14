from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os
from pydantic import BaseModel, EmailStr
from bson.objectid import ObjectId
from config.database import db

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()


# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str


class UserCreate(UserBase):
    doctor_reg_no: Optional[str] = None
    firebase_uid: str


class UserInDB(UserBase):
    id: Optional[str] = None
    doctor_reg_no: Optional[str] = None
    firebase_uid: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Hash password
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# Create JWT token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Register Endpoint
@router.post("/register")
async def register_user(user: UserCreate):
    try:
        # Check if user already exists by email or firebase_uid
        existing_user = await db.users.find_one(
            {"$or": [{"email": user.email}, {"firebase_uid": user.firebase_uid}]}
        )
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email or Firebase UID already exists",
            )

        # Prepare user data for MongoDB
        user_data = user.dict()
        user_data["role"] = user_data["role"].lower()  # Ensure role is lowercase
        if user_data["role"] not in ["user", "doctor"]:
            raise HTTPException(
                status_code=400, detail="Invalid role. Must be 'user' or 'doctor'"
            )

        # Insert user into MongoDB
        result = await db.users.insert_one(user_data)
        user_data["id"] = str(result.inserted_id)

        return {"message": "User registered successfully", "user_id": user_data["id"]}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to register user: {str(e)}"
        )
