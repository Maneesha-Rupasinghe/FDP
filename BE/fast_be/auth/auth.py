from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from config.database import db
from typing import Optional, List
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


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
    latitude: Optional[float] = None  # New field for latitude
    longitude: Optional[float] = None  # New field for longitude


class UserResponse(BaseModel):
    _id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_no: Optional[str] = None
    specialization: Optional[str] = None
    years_experience: Optional[int] = None
    skin_type: Optional[str] = None
    doctor_reg_no: Optional[str] = None
    firebase_uid: str
    role: str
    latitude: Optional[float] = None  # New field for latitude
    longitude: Optional[float] = None  # New field for longitude


class SearchDoctorsResponse(BaseModel):
    doctors: List[UserResponse]
    total: int


@router.post("/register")
async def register_user(user: UserCreate):
    existing_user = await db.users.find_one(
        {
            "$or": [
                {"email": {"$regex": f"^{user.email}$", "$options": "i"}},
                {"firebase_uid": {"$regex": f"^{user.firebase_uid}$", "$options": "i"}},
            ]
        }
    )
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email or Firebase UID already exists",
        )

    if user.role not in ["user", "doctor"]:
        raise HTTPException(
            status_code=400, detail="Invalid role. Must be 'user' or 'doctor'"
        )

    if user.role == "doctor" and not user.doctor_reg_no:
        raise HTTPException(
            status_code=400,
            detail="Doctor registration number is required for doctor role",
        )

    user_data = user.dict(exclude_unset=True)
    result = await db.users.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
    }


@router.get("/user/{firebase_uid}")
async def get_user(firebase_uid: str):
    logger.info(f"Endpoint /user/{firebase_uid} called")
    try:
        logger.info(f"Received firebase_uid from request: {firebase_uid}")
        logger.info(
            f"Querying MongoDB with: {{'firebase_uid': {{'$regex': '^{firebase_uid}$', '$options': 'i'}}}}"
        )
        user = await db.users.find_one(
            {"firebase_uid": {"$regex": f"^{firebase_uid}$", "$options": "i"}}
        )
        logger.info(f"MongoDB query result: {user}")
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["_id"] = str(user["_id"])
        return UserResponse(
            _id=user["_id"],
            first_name=user.get("first_name"),
            last_name=user.get("last_name"),
            contact_no=user.get("contact_no"),
            specialization=user.get("specialization"),
            years_experience=user.get("years_experience"),
            skin_type=user.get("skin_type"),
            doctor_reg_no=user.get("doctor_reg_no"),
            firebase_uid=user.get("firebase_uid"),
            role=user.get("role"),
            latitude=user.get("latitude"),
            longitude=user.get("longitude"),
        )
    except Exception as e:
        logger.error(f"Exception in get_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.put("/user/{firebase_uid}")
async def update_user(firebase_uid: str, update_data: UserUpdate):
    update_dict = update_data.dict(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data provided for update")

    # Validate latitude and longitude if provided
    if "latitude" in update_dict and (update_dict["latitude"] < -90 or update_dict["latitude"] > 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if "longitude" in update_dict and (update_dict["longitude"] < -180 or update_dict["longitude"] > 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")

    result = await db.users.update_one(
        {"firebase_uid": {"$regex": f"^{firebase_uid}$", "$options": "i"}},
        {"$set": update_dict},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User profile updated successfully"}


@router.delete("/user/{firebase_uid}")
async def delete_user(firebase_uid: str):
    result = await db.users.delete_one(
        {"firebase_uid": {"$regex": f"^{firebase_uid}$", "$options": "i"}}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User account deleted successfully"}


@router.get("/search/doctors", response_model=SearchDoctorsResponse)
async def search_doctors(q: str = "", page: int = 1, limit: int = 5):
    logger.info(
        f"Endpoint /search/doctors called with query: {q}, page: {page}, limit: {limit}"
    )
    try:
        skip = (page - 1) * limit
        query = {
            "role": "doctor",
            "$or": [
                {"first_name": {"$regex": f"{q}", "$options": "i"}},
                {"last_name": {"$regex": f"{q}", "$options": "i"}},
                {"specialization": {"$regex": f"{q}", "$options": "i"}},
            ],
        }
        # Get total count
        total = await db.users.count_documents(query)
        # Fetch paginated doctors
        doctors = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
        return {
            "doctors": [
                UserResponse(
                    _id=str(doc["_id"]),
                    first_name=doc.get("first_name"),
                    last_name=doc.get("last_name"),
                    contact_no=doc.get("contact_no"),
                    specialization=doc.get("specialization"),
                    years_experience=doc.get("years_experience"),
                    skin_type=doc.get("skin_type"),
                    doctor_reg_no=doc.get("doctor_reg_no"),
                    firebase_uid=doc.get("firebase_uid"),
                    role=doc.get("role"),
                    latitude=doc.get("latitude"),
                    longitude=doc.get("longitude"),
                )
                for doc in doctors
            ],
            "total": total,
        }
    except Exception as e:
        logger.error(f"Exception in search_doctors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")