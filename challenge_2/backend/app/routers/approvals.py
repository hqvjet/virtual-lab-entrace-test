from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.schemas.document import Document
from app.services.document_service import DocumentService
from app.utils.dependencies import require_approver
from app.models.user import User
from app.models.document import Document as DocumentModel

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("/pending", response_model=List[Document])
def get_pending_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approver)
):
    """Get all pending approval documents (Approver role required)"""
    # Get documents with status=0 (pending approval)
    documents = db.query(DocumentModel).filter(
        DocumentModel.status == 0
    ).offset(skip).limit(limit).all()
    
    # Enrich with additional data
    from app.services.starred_service import StarredDocumentService
    from app.services.comment_service import CommentService
    
    result = []
    for doc in documents:
        doc_dict = {
            "did": doc.did,
            "uid": doc.uid,
            "title": doc.title,
            "description": doc.description,
            "link": doc.link,
            "size": doc.size,
            "status": doc.status,
            "approved_by": doc.approved_by,
            "approved_at": doc.approved_at,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "author_name": doc.author.name if doc.author else None,
            "approver_name": None,
            "tags": DocumentService.get_tags(db, doc.did),
            "stars_count": StarredDocumentService.get_star_count(db, doc.did),
            "comments_count": CommentService.get_count(db, doc.did),
            "is_starred": StarredDocumentService.is_starred(db, current_user.uid, doc.did)
        }
        result.append(doc_dict)
    
    return result


@router.post("/{did}/approve", response_model=Document)
def approve_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approver)
):
    """Approve a document (Approver role required)"""
    document = DocumentService.get_by_id(db, did)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.status != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not pending approval"
        )
    
    # Update document status to approved (1)
    document.status = 1
    document.approved_by = current_user.uid
    document.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(document)
    
    from app.services.starred_service import StarredDocumentService
    from app.services.comment_service import CommentService
    
    return {
        **document.__dict__,
        "author_name": document.author.name if document.author else None,
        "approver_name": current_user.name,
        "tags": DocumentService.get_tags(db, did),
        "stars_count": StarredDocumentService.get_star_count(db, did),
        "comments_count": CommentService.get_count(db, did),
        "is_starred": StarredDocumentService.is_starred(db, current_user.uid, did)
    }


@router.post("/{did}/reject", response_model=Document)
def reject_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approver)
):
    """Reject a document (Approver role required)"""
    document = DocumentService.get_by_id(db, did)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.status != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not pending approval"
        )
    
    # Update document status to rejected (2)
    document.status = 2
    document.approved_by = current_user.uid
    document.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(document)
    
    from app.services.starred_service import StarredDocumentService
    from app.services.comment_service import CommentService
    
    return {
        **document.__dict__,
        "author_name": document.author.name if document.author else None,
        "approver_name": current_user.name,
        "tags": DocumentService.get_tags(db, did),
        "stars_count": StarredDocumentService.get_star_count(db, did),
        "comments_count": CommentService.get_count(db, did),
        "is_starred": StarredDocumentService.is_starred(db, current_user.uid, did)
    }
