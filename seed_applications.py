"""Seed fake application data for testing."""
import asyncio
import random
from datetime import datetime, timedelta
from sqlmodel import select

from app.database import init_db, async_session_maker
from app.models.student import Application, Student

# Sample data
UNIVERSITIES = [
    ("Harvard University", "Computer Science", "USA", "Master's"),
    ("MIT", "Data Science", "USA", "Master's"),
    ("Stanford University", "Business Administration", "USA", "Master's"),
    ("University of Toronto", "Engineering", "Canada", "Bachelor's"),
    ("University of Cambridge", "Economics", "UK", "Master's"),
    ("Oxford University", "Law", "UK", "Master's"),
    ("University of Melbourne", "Medicine", "Australia", "PhD"),
    ("University of British Columbia", "Psychology", "Canada", "Bachelor's"),
    ("NYU", "Film Studies", "USA", "Master's"),
    ("UC Berkeley", "Environmental Science", "USA", "Master's"),
]

STATUSES = ["submitted", "applied", "under_review", "accepted", "rejected", "deferred", "waitlisted"]
INTAKES = ["Fall 2024", "Spring 2025", "Fall 2025", "Winter 2025"]
CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD"]


async def seed_applications():
    """Seed fake applications for all students."""
    await init_db()
    
    async with async_session_maker() as session:
        # Get all students
        result = await session.execute(select(Student))
        students = result.scalars().all()
        
        if not students:
            print("No students found. Please create a student first.")
            return
        
        print(f"Found {len(students)} students. Seeding applications...")
        
        for student in students:
            # Check if student already has applications
            app_result = await session.execute(
                select(Application).where(Application.student_id == student.id)
            )
            existing_apps = app_result.scalars().all()
            
            if existing_apps:
                print(f"Student {student.email} already has {len(existing_apps)} applications. Skipping.")
                continue
            
            # Create 3-6 random applications per student
            num_apps = random.randint(3, 6)
            selected_universities = random.sample(UNIVERSITIES, min(num_apps, len(UNIVERSITIES)))
            
            for uni_name, program, country, degree in selected_universities:
                status = random.choice(STATUSES)
                intake = random.choice(INTAKES)
                
                # Random dates
                created_at = datetime.utcnow() - timedelta(days=random.randint(10, 180))
                submitted_at = created_at + timedelta(days=random.randint(1, 30)) if status != "draft" else None
                
                # Random scholarship (30% chance)
                scholarship_amount = None
                scholarship_currency = None
                if random.random() < 0.3:
                    scholarship_amount = random.randint(5000, 50000)
                    scholarship_currency = random.choice(CURRENCIES)
                
                application = Application(
                    student_id=student.id,
                    university_name=uni_name,
                    program_name=program,
                    country=country,
                    degree_level=degree,
                    intake=intake,
                    status=status,
                    submitted_at=submitted_at,
                    scholarship_amount=scholarship_amount,
                    scholarship_currency=scholarship_currency,
                    created_at=created_at,
                )
                session.add(application)
            
            print(f"Created {num_apps} applications for {student.email}")
        
        await session.commit()
        print("Done seeding applications!")


if __name__ == "__main__":
    asyncio.run(seed_applications())

