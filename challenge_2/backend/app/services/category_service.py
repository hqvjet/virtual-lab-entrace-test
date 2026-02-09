from sqlalchemy.orm import Session
from app.models.category import Category
from typing import List, Optional
from uuid import uuid4


class CategoryService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
        """Get all categories"""
        return db.query(Category).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, oid: str) -> Optional[Category]:
        """Get category by ID"""
        return db.query(Category).filter(Category.oid == oid).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        """Get category by name"""
        return db.query(Category).filter(Category.name == name).first()

    @staticmethod
    def create(db: Session, name: str) -> Category:
        """Create a new category"""
        category = Category(
            oid=str(uuid4()),
            name=name
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete(db: Session, oid: str) -> bool:
        """Delete a category"""
        category = db.query(Category).filter(Category.oid == oid).first()
        if not category:
            return False
        db.delete(category)
        db.commit()
        return True

    @staticmethod
    def get_accessible_categories_for_user(db: Session, user_id: str) -> List[Category]:
        """Get all categories accessible by a user through their roles"""
        from app.services.role_service import RoleService
        
        user_roles = RoleService.get_user_roles(db, user_id)
        accessible_categories = set()
        
        for role in user_roles:
            cats = RoleService.get_accessible_categories(db, role.rid)
            accessible_categories.update(cat.oid for cat in cats)
        
        return db.query(Category).filter(Category.oid.in_(accessible_categories)).all()
