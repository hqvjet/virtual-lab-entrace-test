from sqlalchemy import Column, String, DateTime, Double, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Document(Base):
    __tablename__ = "documents"
    
    did = Column(String, primary_key=True, index=True)
    uid = Column(String, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    link = Column(String, nullable=False)  # File URL/path
    size = Column(Double, nullable=False)  # File size in bytes
    status = Column(Integer, default=0, nullable=False)  # 0=pending_approval, 1=approved, 2=rejected
    approved_by = Column(String, ForeignKey("users.uid", ondelete="SET NULL"), nullable=True)  # Approver user ID
    approved_at = Column(DateTime, nullable=True)  # Approval timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="documents", foreign_keys=[uid])
    approver = relationship("User", foreign_keys=[approved_by])
    comments = relationship("Comment", back_populates="document", cascade="all, delete-orphan")
    starred_by = relationship("StarredDocument", back_populates="document", cascade="all, delete-orphan")
    hashtags = relationship("Hashtag", back_populates="document", cascade="all, delete-orphan")
