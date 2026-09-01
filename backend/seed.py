"""
Seed script to create default Investigating Officer and Supervisor accounts.
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def seed_users():
    db = SessionLocal()
    try:
        # Officer Seed
        officer = db.query(User).filter(User.username == "OFF-8842").first()
        if not officer:
            officer = User(
                username="OFF-8842",
                email="arjun.mehta@border.pehchaan.gov.in",
                password_hash=hash_password("Password@123"),
                role=UserRole.OFFICER,
                is_active=True,
                badge_id="IND-SEC-8842",
                checkpoint="Checkpoint Alpha",
            )
            db.add(officer)
            print("Created default Officer: OFF-8842 / arjun.mehta@border.pehchaan.gov.in (Password: Password@123)")
        else:
            print("Officer OFF-8842 already exists.")

        # Supervisor Seed
        supervisor = db.query(User).filter(User.username == "SUP-1090").first()
        if not supervisor:
            supervisor = User(
                username="SUP-1090",
                email="priya.sharma@border.pehchaan.gov.in",
                password_hash=hash_password("Password@123"),
                role=UserRole.SUPERVISOR,
                is_active=True,
                badge_id="IND-SUP-1090",
                checkpoint="Checkpoint Alpha",
            )
            db.add(supervisor)
            print("Created default Supervisor: SUP-1090 / priya.sharma@border.pehchaan.gov.in (Password: Password@123)")
        else:
            print("Supervisor SUP-1090 already exists.")

        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
