"""
Role checking utilities
"""
from sqlalchemy.orm import Session
from app.models.user import User


def has_role(db: Session, user_id: str, role_name: str) -> bool:
    """Check if user has a specific role"""
    user = db.query(User).filter(User.uid == user_id).first()
    if not user:
        return False
    
    return any(role.name == role_name for role in user.roles)


def is_admin(db: Session, user_id: str) -> bool:
    """Check if user has MANAGER role (admin)"""
    return has_role(db, user_id, "MANAGER")


def is_creator(db: Session, user_id: str) -> bool:
    """Check if user has CREATOR role"""
    return has_role(db, user_id, "CREATOR")


def is_approver(db: Session, user_id: str) -> bool:
    """Check if user has APPROVER role"""
    return has_role(db, user_id, "APPROVER")


def is_reader(db: Session, user_id: str) -> bool:
    """Check if user has READER role"""
    return has_role(db, user_id, "READER")


def get_user_roles(db: Session, user_id: str) -> list[str]:
    """Get list of role names for a user"""
    user = db.query(User).filter(User.uid == user_id).first()
    if not user:
        return []
    
    return [role.name for role in user.roles]
