from pydantic import BaseModel, EmailStr
from bson.objectid import ObjectId
from typing import List, Optional


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


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    role: str
    firebase_uid: str
    doctor_reg_no: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    contact_no: Optional[str] = None
    address: Optional[str] = None
    skin_type: Optional[str] = None
    specialization: Optional[str] = None
    years_experience: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserResponse(BaseModel):
    _id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_no: Optional[str] = None
    specialization: Optional[str] = None
    years_experience: Optional[int] = None
    skin_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    doctor_reg_no: Optional[str] = None
    firebase_uid: str
    role: str


class SearchDoctorsResponse(BaseModel):
    doctors: List[UserResponse]
    total: int
