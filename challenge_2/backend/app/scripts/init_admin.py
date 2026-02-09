"""  
Script to initialize the database with a MANAGER role and admin user.
Run this after first deployment to set up the admin account.

Usage:
    python -m app.scripts.init_admin
"""

from app.database import SessionLocal, init_db
from app.models.role import Role
from app.models.user import User
from app.services.role_service import RoleService
from app.utils.auth import get_password_hash
from uuid import uuid4


def create_admin_role_and_user():
    """Create MANAGER role and initial admin user"""
    db = SessionLocal()
    
    try:
        # Initialize DB first
        init_db()
        
        # Check if MANAGER role already exists
        admin_role = RoleService.get_by_name(db, "MANAGER")
        if not admin_role:
            print("Creating MANAGER role...")
            admin_role = RoleService.create(db, "MANAGER")
            print(f"✅ Created MANAGER role: {admin_role.rid}")
        else:
            print(f"✅ MANAGER role already exists: {admin_role.rid}")
        
        # Check if admin user exists
        admin_email = "admin@dochub.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        if not admin_user:
            print(f"Creating admin user ({admin_email})...")
            admin_user = User(
                uid=str(uuid4()),
                name="Admin User",
                email=admin_email,
                password=get_password_hash("admin123")  # Change this password!
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Created admin user: {admin_user.uid}")
            print(f"   Email: {admin_email}")
            print(f"   Password: admin123 (CHANGE THIS!)")
        else:
            print(f"✅ Admin user already exists: {admin_user.uid}")
        
        # Assign ADMIN role to user
        print("Assigning ADMIN role to user...")
        RoleService.assign_to_user(db, admin_user.uid, [admin_role.rid])
        print("✅ ADMIN role assigned successfully!")
        
        print("\n🎉 Setup complete!")
        print(f"\nYou can now login with:")
        print(f"  Email: {admin_email}")
        print(f"  Password: admin123")
        print(f"\n⚠️  IMPORTANT: Change the admin password immediately after first login!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_role_and_user()
