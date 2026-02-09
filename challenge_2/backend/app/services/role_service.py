from sqlalchemy.orm import Session
from app.models.role import Role, user_role, access_permission
from app.models.user import User
from app.models.category import Category
from typing import List, Optional
from uuid import uuid4


class RoleService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        """Get all roles"""
        return db.query(Role).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, rid: str) -> Optional[Role]:
        """Get role by ID"""
        return db.query(Role).filter(Role.rid == rid).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Role]:
        """Get role by name"""
        return db.query(Role).filter(Role.name == name).first()

    @staticmethod
    def create(db: Session, name: str) -> Role:
        """Create a new role"""
        role = Role(
            rid=str(uuid4()),
            name=name
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        return role

    @staticmethod
    def delete(db: Session, rid: str) -> bool:
        """Delete a role"""
        role = db.query(Role).filter(Role.rid == rid).first()
        if not role:
            return False
        db.delete(role)
        db.commit()
        return True

    @staticmethod
    def assign_to_user(db: Session, user_id: str, role_ids: List[str]) -> bool:
        """Assign roles to a user (replace existing)"""
        user = db.query(User).filter(User.uid == user_id).first()
        if not user:
            return False
        
        # Clear existing roles
        db.execute(user_role.delete().where(user_role.c.uid == user_id))
        
        # Add new roles
        for rid in role_ids:
            role = db.query(Role).filter(Role.rid == rid).first()
            if role:
                db.execute(user_role.insert().values(uid=user_id, rid=rid))
        
        db.commit()
        return True

    @staticmethod
    def get_user_roles(db: Session, user_id: str) -> List[Role]:
        """Get all roles for a user"""
        return db.query(Role).join(user_role).filter(user_role.c.uid == user_id).all()

    @staticmethod
    def set_permissions(db: Session, role_id: str, category_ids: List[str]) -> bool:
        """Set category permissions for a role (replace existing)"""
        role = db.query(Role).filter(Role.rid == role_id).first()
        if not role:
            return False
        
        # Clear existing permissions
        db.execute(access_permission.delete().where(access_permission.c.rid == role_id))
        
        # Add new permissions
        for oid in category_ids:
            category = db.query(Category).filter(Category.oid == oid).first()
            if category:
                db.execute(access_permission.insert().values(rid=role_id, oid=oid))
        
        db.commit()
        return True

    @staticmethod
    def get_accessible_categories(db: Session, role_id: str) -> List[Category]:
        """Get all categories accessible by a role"""
        return db.query(Category).join(access_permission).filter(access_permission.c.rid == role_id).all()

    @staticmethod
    def check_user_access_to_category(db: Session, user_id: str, category_id: str) -> bool:
        """Check if user has access to a specific category through any of their roles"""
        user_roles = RoleService.get_user_roles(db, user_id)
        for role in user_roles:
            accessible_cats = RoleService.get_accessible_categories(db, role.rid)
            if any(cat.oid == category_id for cat in accessible_cats):
                return True
        return False

    @staticmethod
    def is_admin(db: Session, user_id: str) -> bool:
        """Check if user has MANAGER role (highest role)"""
        user_roles = RoleService.get_user_roles(db, user_id)
        return any(role.name.upper() == "MANAGER" for role in user_roles)
