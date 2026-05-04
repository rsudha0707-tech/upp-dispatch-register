from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .models import RoleEnum

class UserBase(BaseModel):
    username: str
    email: str
    mobile_number: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

class DaakCreate(BaseModel):
    letter_no: str
    subject: str
    sender: str
    department: str
    recipient_id: int
    remarks: Optional[str] = None

class DaakResponse(BaseModel):
    id: int
    daak_id: str
    letter_no: str
    subject: str
    sender: str
    department: str
    date_received: datetime
    file_path: Optional[str] = None
    status: str
    current_recipient_id: Optional[int]
    current_recipient_username: Optional[str] = None
    creator_id: int
    creator_username: str

    class Config:
        from_attributes = True

class TrackingLogResponse(BaseModel):
    id: int
    daak_id: int
    user_id: int
    action: str
    timestamp: datetime
    comments: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_received: int
    pending: int
    completed: int
    my_assigned: int
