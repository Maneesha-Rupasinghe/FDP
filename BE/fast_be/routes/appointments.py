from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List
from bson.objectid import ObjectId
from config.database import db
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


# Pydantic model for appointment creation
class AppointmentCreate(BaseModel):
    user_id: str
    user_name: str
    doctor_id: str
    doctor_name: str
    date: str  # Format: YYYY-MM-DD
    time: str  # Format: HH:MM


# Pydantic model for appointment update
class AppointmentUpdate(BaseModel):
    status: str


# Pydantic model for response
class AppointmentResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    doctor_id: str
    doctor_name: str
    date: str
    time: str
    status: str
    created_at: str


# Create an appointment
@router.post("/", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate):
    try:
        appointment_dict = appointment.dict()
        appointment_dict["status"] = "pending"
        appointment_dict["created_at"] = datetime.utcnow().isoformat()
        result = await db.appointments.insert_one(appointment_dict)
        appointment_dict["id"] = str(result.inserted_id)
        return appointment_dict
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating appointment: {str(e)}"
        )


# Get appointments for a doctor
@router.get("/doctor/{doctor_id}", response_model=List[AppointmentResponse])
async def get_appointments_for_doctor(doctor_id: str):
    try:
        appointments = await db.appointments.find({"doctor_id": doctor_id}).to_list(
            length=100
        )
        formatted_appointments = []
        for app in appointments:
            app["id"] = str(app.pop("_id"))
            formatted_appointments.append(app)
        return formatted_appointments
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching appointments: {str(e)}"
        )


# Update appointment status
@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: str, update: AppointmentUpdate):
    try:
        result = await db.appointments.find_one_and_update(
            {"_id": ObjectId(appointment_id)},
            {"$set": {"status": update.status}},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=404, detail="Appointment not found")
        result["id"] = str(result.pop("_id"))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating appointment: {str(e)}"
        )


# Get appointments for a user (new path to avoid conflict)
@router.get("/user/{user_id}", response_model=List[AppointmentResponse])
async def get_appointments_by_user(user_id: str):
    try:
        appointments = await db.appointments.find({"user_id": user_id}).to_list(
            length=100
        )
        formatted_appointments = []
        for app in appointments:
            app["id"] = str(app.pop("_id"))
            formatted_appointments.append(app)
        return formatted_appointments
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching appointments: {str(e)}"
        )
