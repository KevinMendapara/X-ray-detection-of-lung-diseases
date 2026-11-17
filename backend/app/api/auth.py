import sys
import os
import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
import bcrypt
import jwt

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.database import DBManager
except (ImportError, ValueError):
    try:
        from app.database import DBManager
    except (ImportError, ValueError):
        from database import DBManager

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = "tb_detect_ai_secure_research_token_key_change_in_prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "radiologist"

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user_data: UserRegister):
    existing = DBManager.get_user_by_username(user_data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    user = DBManager.create_user(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role or "radiologist",
        full_name=user_data.full_name or user_data.username
    )

    DBManager.log_audit("USER_REGISTER", f"Registered user {user['username']} ({user['role']})", user=user['username'])

    token = create_access_token({"sub": user["username"], "role": user["role"], "id": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@router.post("/login")
def login(user_data: UserLogin):
    user = DBManager.get_user_by_username(user_data.username)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user["username"], "role": user["role"], "id": user["id"]})
    DBManager.log_audit("USER_LOGIN", f"User {user['username']} logged in", user=user['username'])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    user = DBManager.get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"]
    }
