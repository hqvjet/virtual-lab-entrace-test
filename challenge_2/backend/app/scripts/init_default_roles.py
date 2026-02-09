"""
Initialize default roles in the system
"""
import sys
import uuid
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.role import Role


def init_default_roles():
    """Create default roles: ADMIN, CREATOR, READER"""
    init_db()
    db: Session = SessionLocal()
    
    try:
        default_roles = [
            {"name": "MANAGER", "description": "System manager - manages users and resources"},
            {"name": "CREATOR", "description": "Content creator - can create and manage documents"},
            {"name": "APPROVER", "description": "Content approver - can approve or reject pending documents"},
            {"name": "READER", "description": "Content reader - can read approved documents, comment, and star"}
        ]
        
        for role_data in default_roles:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            
            if existing_role:
                print(f"✅ Role '{role_data['name']}' already exists")
                continue
            
            role = Role(rid=str(uuid.uuid4()), name=role_data["name"])
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"✅ Created role: {role.name} (ID: {role.rid})")
        
        print("\n✅ All default roles initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_default_roles()
