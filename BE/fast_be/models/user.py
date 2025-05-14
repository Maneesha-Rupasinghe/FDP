from pydantic import BaseModel, EmailStr
from bson.objectid import ObjectId
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str

class UserCreate(UserBase):
    doctor_reg_no: Optional[str] = None
    firebase_uid: str  # Add Firebase UID

class UserInDB(UserBase):
    id: Optional[str] = None  # Will store ObjectId as string
    doctor_reg_no: Optional[str] = None
    firebase_uid: str  # Add Firebase UID

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}