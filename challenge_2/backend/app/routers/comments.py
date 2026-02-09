from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.comment import Comment, CommentCreate
from app.services.comment_service import CommentService
from app.services.document_service import DocumentService
from app.utils.dependencies import get_current_user, require_reader
from app.models.user import User

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.get("/document/{did}", response_model=List[Comment])
def get_document_comments(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Get all comments for a document (Reader or Creator role required)"""
    # Check if document exists
    if not DocumentService.get_by_id(db, did):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    comments = CommentService.get_by_document(db, did)
    
    # Enrich with user names
    result = []
    for comment in comments:
        result.append({
            **comment.__dict__,
            "user_name": comment.user.name if comment.user else None
        })
    
    return result


@router.post("", response_model=Comment, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_create: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Create a new comment (Reader or Creator role required)"""
    # Check if document exists
    if not DocumentService.get_by_id(db, comment_create.did):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    comment = CommentService.create(db, current_user.uid, comment_create)
    
    return {
        **comment.__dict__,
        "user_name": current_user.name
    }


@router.delete("/{did}/{created_at}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    did: str,
    created_at: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Delete a comment (Reader or Creator role required, owner only)"""
    success = CommentService.delete(db, current_user.uid, did, created_at)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or not authorized"
        )
