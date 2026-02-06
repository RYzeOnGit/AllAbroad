#!/usr/bin/env python3
"""Check if student account exists, create if missing."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.database import async_session_maker, init_db
from app.models.student import Student
from app.models.lead import Lead
from app.utils.auth import hash_password
from sqlmodel import select

async def main():
    email = "ryan.chattopadhyay@student.allabroad.com"
    password = "Student123!"
    
    # Initialize database
    await init_db()
    
    async with async_session_maker() as session:
        # Check if student exists
        stmt = select(Student).where(Student.email == email)
        result = await session.execute(stmt)
        student = result.scalar_one_or_none()
        
        if student:
            print(f"✓ Student account found:")
            print(f"  ID: {student.id}")
            print(f"  Email: {student.email}")
            print(f"  Full Name: {student.full_name}")
            print(f"  Is Active: {student.is_active}")
            print(f"  Lead ID: {student.lead_id}")
            
            # Check password hash
            from app.utils.auth import verify_password
            if verify_password(password, student.password_hash):
                print(f"✓ Password is correct")
            else:
                print(f"✗ Password does NOT match!")
                print(f"  Updating password...")
                student.password_hash = hash_password(password)
                session.add(student)
                await session.commit()
                print(f"✓ Password updated!")
        else:
            print(f"✗ Student account NOT found. Creating...")
            
            # Try to find a lead with this email
            lead_stmt = select(Lead).where(Lead.email == email)
            lead_result = await session.execute(lead_stmt)
            lead = lead_result.scalar_one_or_none()
            
            if not lead:
                # Create a dummy lead first
                print(f"  Creating lead entry...")
                lead = Lead(
                    name="Ryan Chattopadhyay",
                    email=email,
                    country="USA",
                    target_country="USA",
                    intake="Fall 2024",
                    degree="Bachelor's",
                    subject="Computer Science",
                    source="manual"
                )
                session.add(lead)
                await session.flush()
                print(f"  ✓ Lead created with ID: {lead.id}")
            
            # Create student account
            student = Student(
                lead_id=lead.id,
                email=email,
                password_hash=hash_password(password),
                full_name="Ryan Chattopadhyay",
                is_active=True
            )
            session.add(student)
            await session.commit()
            await session.refresh(student)
            print(f"✓ Student account created:")
            print(f"  ID: {student.id}")
            print(f"  Email: {student.email}")
            print(f"  Lead ID: {student.lead_id}")
            print(f"  Password: {password}")

if __name__ == "__main__":
    asyncio.run(main())

