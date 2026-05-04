from backend.database import SessionLocal
from backend.models import Daak, User

db = SessionLocal()
daaks = db.query(Daak).all()
users = db.query(User).all()

print("--- USERS ---")
for u in users:
    print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}")

print("\n--- DAAKS ---")
for d in daaks:
    print(f"ID: {d.id}, DaakID: {d.daak_id}, LetterNo: {d.letter_no}, CurrentRecipient: {d.current_recipient_id}, Status: {d.status}")

db.close()
