# BE/models/user.py
from pydantic import BaseModel, EmailStr
from bson.objectid import ObjectId
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str


class UserCreate(UserBase):
    password: str
    doctor_reg_no: Optional[str] = None


class UserInDB(UserBase):
    id: Optional[str] = None  # Will store ObjectId as string
    hashed_password: Optional[str] = None
    doctor_reg_no: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
