from sqlalchemy.orm import Session
from typing import List
from app.models.comment import Comment
from app.schemas.comment import CommentCreate


class CommentService:
    @staticmethod
    def get_by_document(db: Session, did: str) -> List[Comment]:
        """Get all comments for a document"""
        return db.query(Comment).filter(Comment.did == did).order_by(Comment.created_at.desc()).all()
    
    @staticmethod
    def get_count(db: Session, did: str) -> int:
        """Get the number of comments for a document"""
        return db.query(Comment).filter(Comment.did == did).count()
    
    @staticmethod
    def create(db: Session, uid: str, comment_create: CommentCreate) -> Comment:
        """Create a new comment"""
        db_comment = Comment(
            uid=uid,
            did=comment_create.did,
            content=comment_create.content
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment
    
    @staticmethod
    def delete(db: Session, uid: str, did: str, created_at) -> bool:
        """Delete a comment"""
        db_comment = db.query(Comment).filter(
            Comment.uid == uid,
            Comment.did == did,
            Comment.created_at == created_at
        ).first()
        
        if not db_comment:
            return False
        
        db.delete(db_comment)
        db.commit()
        return True
