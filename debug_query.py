from backend.database import SessionLocal
from backend.models import Daak, User

db = SessionLocal()
user_id = 2 # spts_user
tasks = db.query(Daak).filter(
    Daak.current_recipient_id == user_id,
    Daak.status != "Completed"
).all()

print(f"Tasks for user_id {user_id}: {len(tasks)}")
for t in tasks:
    print(f"ID: {t.id}, DaakID: {t.daak_id}, Status: {t.status}")

db.close()
