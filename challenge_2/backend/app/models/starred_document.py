from sqlalchemy import Column, String, DateTime, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class StarredDocument(Base):
    __tablename__ = "starred_documents"
    
    uid = Column(String, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False)
    did = Column(String, ForeignKey("documents.did", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('uid', 'did'),
    )
    
    # Relationships
    user = relationship("User", back_populates="starred_documents")
    document = relationship("Document", back_populates="starred_by")
