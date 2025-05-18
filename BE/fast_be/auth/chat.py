from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.database import db
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRoomCreate(BaseModel):
    user_id: str
    doctor_id: str
    user_name: str
    doctor_name: str


class ChatRoomResponse(BaseModel):
    chat_room_id: str
    user_id: str
    doctor_id: str
    user_name: str
    doctor_name: str


@router.post("/chat/room", response_model=ChatRoomResponse)
async def create_chat_room(chat_room: ChatRoomCreate):
    logger.info(
        f"Creating chat room for user {chat_room.user_id} and doctor {chat_room.doctor_id}"
    )

    # Validate user and doctor
    user = await db.users.find_one({"firebase_uid": chat_room.user_id, "role": "user"})
    if not user:
        raise HTTPException(status_code=404, detail="User not found or not a user role")

    doctor = await db.users.find_one(
        {"firebase_uid": chat_room.doctor_id, "role": "doctor"}
    )
    if not doctor:
        raise HTTPException(
            status_code=404, detail="Doctor not found or not a doctor role"
        )

    # Check if a chat room already exists
    existing_room = await db.chat_rooms.find_one(
        {"user_id": chat_room.user_id, "doctor_id": chat_room.doctor_id}
    )

    if existing_room:
        return {
            "chat_room_id": str(existing_room["_id"]),
            "user_id": existing_room["user_id"],
            "doctor_id": existing_room["doctor_id"],
            "user_name": existing_room["user_name"],
            "doctor_name": existing_room["doctor_name"],
        }

    # Create new chat room
    chat_room_data = {
        "user_id": chat_room.user_id,
        "doctor_id": chat_room.doctor_id,
        "user_name": chat_room.user_name,
        "doctor_name": chat_room.doctor_name,
    }
    result = await db.chat_rooms.insert_one(chat_room_data)

    return {
        "chat_room_id": str(result.inserted_id),
        "user_id": chat_room.user_id,
        "doctor_id": chat_room.doctor_id,
        "user_name": chat_room.user_name,
        "doctor_name": chat_room.doctor_name,
    }


@router.get("/chat/rooms/{firebase_uid}", response_model=List[ChatRoomResponse])
async def get_chat_rooms(firebase_uid: str):
    logger.info(f"Fetching chat rooms for user {firebase_uid}")

    # Validate user
    user = await db.users.find_one({"firebase_uid": firebase_uid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch chat rooms where the user is either the user or the doctor
    chat_rooms = await db.chat_rooms.find(
        {"$or": [{"user_id": firebase_uid}, {"doctor_id": firebase_uid}]}
    ).to_list(100)

    return [
        {
            "chat_room_id": str(room["_id"]),
            "user_id": room["user_id"],
            "doctor_id": room["doctor_id"],
            "user_name": room["user_name"],
            "doctor_name": room["doctor_name"],
        }
        for room in chat_rooms
    ]
