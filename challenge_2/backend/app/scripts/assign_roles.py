#!/usr/bin/env python3
"""
Script to assign roles to users for testing
Usage: python assign_roles.py <email> <role1> [role2] [role3]
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, insert
from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role, user_role

def assign_role(email: str, role_name: str):
    """Assign a role to a user"""
    db = SessionLocal()
    try:
        # Find user
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            print(f"❌ User '{email}' not found")
            return False
            
        # Find role
        role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
        if not role:
            print(f"❌ Role '{role_name}' not found")
            return False
            
        # Check if already assigned
        existing = db.execute(
            select(user_role).where(
                user_role.c.uid == user.uid,
                user_role.c.rid == role.rid
            )
        ).first()
        
        if existing:
            print(f"✅ User '{email}' already has role '{role_name}'")
            return True
            
        # Assign role via insert
        db.execute(
            insert(user_role).values(uid=user.uid, rid=role.rid)
        )
        db.commit()
        
        print(f"✅ Assigned role '{role_name}' to user '{email}'")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    if len(sys.argv) < 3:
        print("Usage: python assign_roles.py <email> <role1> [role2] [role3]")
        print("Example: python assign_roles.py creator@dochub.com CREATOR")
        sys.exit(1)
        
    email = sys.argv[1]
    roles = sys.argv[2:]
    
    print(f"\n🔄 Assigning roles to '{email}'...")
    
    success = True
    for role_name in roles:
        if not assign_role(email, role_name):
            success = False
            
    if success:
        print(f"\n✅ All roles assigned successfully!")
    else:
        print(f"\n❌ Some roles failed to assign")

if __name__ == "__main__":
    main()
