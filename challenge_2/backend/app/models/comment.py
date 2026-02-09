from sqlalchemy import Column, String, DateTime, ForeignKey, Text, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"
    
    uid = Column(String, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
    did = Column(String, ForeignKey("documents.did", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('uid', 'did', 'created_at'),
    )
    
    # Relationships
    user = relationship("User", back_populates="comments")
    document = relationship("Document", back_populates="comments")
