from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Category(Base):
    __tablename__ = "categories"
    
    oid = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    hashtags = relationship("Hashtag", back_populates="category", cascade="all, delete-orphan")
    authorized_roles = relationship("Role", secondary="access_permission", back_populates="accessible_categories")
