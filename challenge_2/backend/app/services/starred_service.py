from sqlalchemy.orm import Session
from typing import List
from app.models.starred_document import StarredDocument
from app.models.document import Document


class StarredDocumentService:
    @staticmethod
    def get_user_starred(db: Session, uid: str) -> List[Document]:
        """Get all documents starred by a user"""
        starred = db.query(StarredDocument).filter(StarredDocument.uid == uid).all()
        return [db.query(Document).filter(Document.did == s.did).first() for s in starred]
    
    @staticmethod
    def is_starred(db: Session, uid: str, did: str) -> bool:
        """Check if a document is starred by a user"""
        return db.query(StarredDocument).filter(
            StarredDocument.uid == uid,
            StarredDocument.did == did
        ).first() is not None
    
    @staticmethod
    def star(db: Session, uid: str, did: str) -> StarredDocument:
        """Star a document"""
        # Check if already starred
        existing = db.query(StarredDocument).filter(
            StarredDocument.uid == uid,
            StarredDocument.did == did
        ).first()
        
        if existing:
            return existing
        
        starred = StarredDocument(uid=uid, did=did)
        db.add(starred)
        db.commit()
        db.refresh(starred)
        return starred
    
    @staticmethod
    def unstar(db: Session, uid: str, did: str) -> bool:
        """Unstar a document"""
        starred = db.query(StarredDocument).filter(
            StarredDocument.uid == uid,
            StarredDocument.did == did
        ).first()
        
        if not starred:
            return False
        
        db.delete(starred)
        db.commit()
        return True
    
    @staticmethod
    def get_star_count(db: Session, did: str) -> int:
        """Get the number of stars for a document"""
        return db.query(StarredDocument).filter(StarredDocument.did == did).count()
