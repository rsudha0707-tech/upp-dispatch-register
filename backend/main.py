import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import auth, daak
from . import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Daak Register API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(daak.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Digital Daak Register API"}

# Pre-populate some dummy users if they don't exist
def populate_users():
    db = SessionLocal()
    roles = [
        ("digts_user", models.RoleEnum.DIGTS),
        ("spts_user", models.RoleEnum.SPTS),
        ("spad_user", models.RoleEnum.SPAD),
        ("account_user", models.RoleEnum.ACCOUNTANT),
        ("pradhan_user", models.RoleEnum.PRADHAN_LIPIK),
        ("computer_user", models.RoleEnum.COMPUTER_CENTRE),
        ("creator", models.RoleEnum.OTHERS)
    ]
    for username, role in roles:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            from .routers.auth import get_password_hash
            new_user = models.User(
                username=username,
                email=f"{username}@example.com",
                mobile_number="1234567890",
                hashed_password=get_password_hash("password123"), # Default password
                role=role
            )
            db.add(new_user)
    db.commit()
    db.close()

@app.on_event("startup")
def startup_event():
    populate_users()

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
