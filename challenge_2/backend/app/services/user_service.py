from sqlalchemy.orm import Session
from typing import Optional
import uuid
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.auth import get_password_hash, verify_password


class UserService:
    @staticmethod
    def get_by_id(db: Session, uid: str) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.uid == uid).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        """Get all users with pagination"""
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, user_create: UserCreate) -> User:
        """Create a new user"""
        hashed_password = get_password_hash(user_create.password)
        db_user = User(
            uid=str(uuid.uuid4()),
            name=user_create.name,
            email=user_create.email,
            password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update(db: Session, uid: str, user_update: UserUpdate) -> Optional[User]:
        """Update a user"""
        db_user = UserService.get_by_id(db, uid)
        if not db_user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def delete(db: Session, uid: str) -> bool:
        """Delete a user"""
        db_user = UserService.get_by_id(db, uid)
        if not db_user:
            return False
        
        db.delete(db_user)
        db.commit()
        return True
    
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user"""
        user = UserService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user
