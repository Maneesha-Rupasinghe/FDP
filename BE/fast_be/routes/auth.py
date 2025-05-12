# BE/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import UserCreate, UserInDB, Token
from auth.auth import (
    ALGORITHM,
    SECRET_KEY,
    verify_password,
    get_password_hash,
    create_access_token,
    oauth2_scheme,
)
from jose import JWTError, jwt
from config.database import db

router = APIRouter()


@router.post("/register", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_dict = user.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)  # Add the ObjectId as a string
    return UserInDB(**user_dict)


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/register-oauth", response_model=UserInDB, status_code=status.HTTP_201_CREATED
)
async def register_oauth(email: str, username: str, role: str = "regular"):
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return UserInDB(**existing_user, id=str(existing_user["_id"]))

    user_dict = {
        "email": email,
        "username": username,
        "role": role,
        "hashed_password": None,
        "doctor_reg_no": None,
    }
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return UserInDB(**user_dict)


@router.get("/users/me", response_model=UserInDB)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserInDB(**user, id=str(user["_id"]))
