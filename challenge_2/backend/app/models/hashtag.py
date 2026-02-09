from sqlalchemy import Column, String, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Hashtag(Base):
    __tablename__ = "hashtag"
    
    did = Column(String, ForeignKey("documents.did", ondelete="CASCADE"), nullable=False)
    oid = Column(String, ForeignKey("categories.oid", ondelete="CASCADE"), nullable=False)
    
    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('did', 'oid'),
    )
    
    # Relationships
    document = relationship("Document", back_populates="hashtags")
    category = relationship("Category", back_populates="hashtags")
