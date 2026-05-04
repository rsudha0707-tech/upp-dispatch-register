import os
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(prefix="/daak", tags=["daak"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def generate_daak_id(db: Session):
    year = datetime.datetime.now().year
    count = db.query(models.Daak).filter(models.Daak.daak_id.like(f"DAAK/{year}/%")).count()
    return f"DAAK/{year}/{count + 1:04d}"

@router.post("/", response_model=schemas.DaakResponse)
async def create_daak(
    letter_no: str = Form(...),
    subject: str = Form(...),
    sender: str = Form(...),
    department: str = Form(...),
    recipient_id: int = Form(...),
    remarks: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    file_path = None
    if file:
        file_path = os.path.join(UPLOAD_DIR, f"{datetime.datetime.now().timestamp()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

    daak_id_str = generate_daak_id(db)
    
    new_daak = models.Daak(
        daak_id=daak_id_str,
        letter_no=letter_no,
        subject=subject,
        sender=sender,
        department=department,
        file_path=file_path,
        current_recipient_id=recipient_id,
        creator_id=current_user.id
    )
    
    db.add(new_daak)
    db.commit()
    db.refresh(new_daak)
    
    # Create tracking log
    log = models.TrackingLog(
        daak_id=new_daak.id,
        user_id=current_user.id,
        action="Created",
        comments=remarks if remarks else "Daak created and assigned."
    )
    db.add(log)
    db.commit()

    # Populate usernames for response
    new_daak.current_recipient_username = new_daak.current_recipient.username if new_daak.current_recipient else "None"
    new_daak.creator_username = current_user.username
    
    return new_daak

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    total_received = db.query(models.Daak).count()
    pending = db.query(models.Daak).filter(models.Daak.status == "Pending").count()
    completed = db.query(models.Daak).filter(models.Daak.status == "Completed").count()
    my_assigned = db.query(models.Daak).filter(
        models.Daak.current_recipient_id == current_user.id,
        models.Daak.status != "Completed"
    ).count()

    return schemas.DashboardStats(
        total_received=total_received,
        pending=pending,
        completed=completed,
        my_assigned=my_assigned
    )

@router.get("/my-tasks", response_model=List[schemas.DaakResponse])
def get_my_tasks(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Daak).filter(
        models.Daak.current_recipient_id == current_user.id,
        models.Daak.status != "Completed"
    ).order_by(desc(models.Daak.date_received)).all()
    
    for t in tasks:
        t.current_recipient_username = t.current_recipient.username if t.current_recipient else "None"
        t.creator_username = t.creator.username if t.creator else "Unknown"
    return tasks

@router.get("/all", response_model=List[schemas.DaakResponse])
def get_all_daaks(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    daaks = db.query(models.Daak).order_by(desc(models.Daak.date_received)).all()
    for d in daaks:
        d.current_recipient_username = d.current_recipient.username if d.current_recipient else "None"
        d.creator_username = d.creator.username if d.creator else "Unknown"
    return daaks

@router.post("/{daak_id}/action")
async def process_daak(
    daak_id: int,
    action: str = Form(...), # Read, Forward, Complete
    comments: Optional[str] = Form(None),
    next_recipient_id: Optional[int] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    daak = db.query(models.Daak).filter(models.Daak.id == daak_id).first()
    if not daak:
        raise HTTPException(status_code=404, detail="Daak not found")
    
    if daak.current_recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the current recipient of this Daak")

    if action == "Read":
        daak.status = "Read"
        log = models.TrackingLog(daak_id=daak.id, user_id=current_user.id, action="Read", comments=comments)
        db.add(log)
    
    elif action == "Forward":
        if not next_recipient_id:
            raise HTTPException(status_code=400, detail="Next recipient is required for forwarding")
        
        daak.current_recipient_id = next_recipient_id
        daak.status = "Pending" # Reset to pending for the next user
        log = models.TrackingLog(daak_id=daak.id, user_id=current_user.id, action="Forwarded", comments=comments)
        db.add(log)
        
    elif action == "Complete":
        daak.current_recipient_id = None
        daak.status = "Completed"
        log = models.TrackingLog(daak_id=daak.id, user_id=current_user.id, action="Completed", comments=comments)
        db.add(log)
    
    db.commit()
    return {"message": "Daak processed successfully"}

@router.get("/{daak_id}/history", response_model=List[schemas.TrackingLogResponse])
def get_daak_history(daak_id: int, db: Session = Depends(database.get_db)):
    logs = db.query(models.TrackingLog).filter(models.TrackingLog.daak_id == daak_id).order_by(models.TrackingLog.timestamp).all()
    # Attach username for response
    for log in logs:
        log.username = log.user.username
    return logs
