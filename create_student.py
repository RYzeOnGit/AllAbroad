"""Script to create a student account from an existing lead."""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel, select
from app.models.lead import Lead
from app.models.student import Student
from app.utils.auth import hash_password

# Database URL - adjust if needed
DATABASE_URL = "sqlite+aiosqlite:///./allabroad.db"

async def create_student_from_lead():
    """Create a student account from the first lead in the database."""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        # Get the first lead
        statement = select(Lead).limit(1)
        result = await session.execute(statement)
        lead = result.scalar_one_or_none()
        
        if not lead:
            print("No leads found in database!")
            return
        
        print(f"Found lead: {lead.name} (ID: {lead.id})")
        print(f"Phone: {lead.phone}")
        print(f"Country: {lead.country} → {lead.target_country}")
        
        # Generate email from name (lowercase, replace spaces with dots)
        email = f"{lead.name.lower().replace(' ', '.')}@student.allabroad.com"
        
        # Check if student already exists
        existing_student = await session.execute(select(Student).where(Student.lead_id == lead.id))
        if existing_student.scalar_one_or_none():
            print(f"Student already exists for lead ID {lead.id}!")
            return
        
        # Check if email already exists
        existing_email = await session.execute(select(Student).where(Student.email == email))
        if existing_email.scalar_one_or_none():
            print(f"Email {email} already exists! Using a different email...")
            email = f"{lead.name.lower().replace(' ', '.')}.{lead.id}@student.allabroad.com"
        
        # Generate password: "Student123!"
        password = "Student123!"
        password_hash = hash_password(password)
        
        # Create student
        student = Student(
            lead_id=lead.id,
            email=email,
            password_hash=password_hash,
            full_name=lead.name,
            is_active=True,
            documents_total=10,  # Default required documents
            applications_total=0
        )
        
        session.add(student)
        await session.commit()
        await session.refresh(student)
        
        print("\n" + "="*50)
        print("Student account created successfully!")
        print("="*50)
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Student ID: {student.id}")
        print(f"Lead ID: {lead.id}")
        print("="*50)
        print("\nYou can now sign in as a student with these credentials.")

if __name__ == "__main__":
    asyncio.run(create_student_from_lead())

