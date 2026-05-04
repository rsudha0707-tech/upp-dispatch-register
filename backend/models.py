from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    DIGTS = "DIGTS"
    SPTS = "SPTS"
    SPAD = "SPAD"
    ACCOUNTANT = "Accountant"
    PRADHAN_LIPIK = "Pradhan Lipik"
    COMPUTER_CENTRE = "Computer Centre"
    OTHERS = "Others"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, index=True)
    mobile_number = Column(String)
    role = Column(Enum(RoleEnum))

class Daak(Base):
    __tablename__ = "daaks"
    id = Column(Integer, primary_key=True, index=True)
    daak_id = Column(String, unique=True, index=True) # DAAK/YYYY/XXXX
    letter_no = Column(String, index=True)
    subject = Column(String)
    sender = Column(String)
    department = Column(String)
    date_received = Column(DateTime, default=datetime.datetime.utcnow)
    file_path = Column(String, nullable=True)
    status = Column(String, default="Pending") # Pending, Read, Completed
    current_recipient_id = Column(Integer, ForeignKey("users.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    current_recipient = relationship("User", foreign_keys=[current_recipient_id])
    creator = relationship("User", foreign_keys=[creator_id])
    tracking_logs = relationship("TrackingLog", back_populates="daak")

class TrackingLog(Base):
    __tablename__ = "tracking_logs"
    id = Column(Integer, primary_key=True, index=True)
    daak_id = Column(Integer, ForeignKey("daaks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # Created, Read, Forwarded, Completed
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    comments = Column(Text, nullable=True)

    daak = relationship("Daak", back_populates="tracking_logs")
    user = relationship("User")
