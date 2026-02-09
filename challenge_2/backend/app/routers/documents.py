from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.document import Document, DocumentCreate, DocumentUpdate
from app.services.document_service import DocumentService
from app.services.starred_service import StarredDocumentService
from app.services.comment_service import CommentService
from app.utils.dependencies import get_current_user, require_creator, require_reader
from app.utils.role_checker import is_creator
from app.models.user import User
from app.models.document import Document as DocumentModel
import os
import shutil
from pathlib import Path
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/starred", response_model=List[Document])
def get_starred_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Get all documents starred by the current user"""
    documents = StarredDocumentService.get_user_starred(db, current_user.uid)
    
    # Filter out None values (in case document was deleted)
    documents = [doc for doc in documents if doc is not None]
    
    # Enrich with additional data
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
            "approver_name": doc.approver.name if doc.approver else None,
            "tags": DocumentService.get_tags(db, doc.did),
            "stars_count": StarredDocumentService.get_star_count(db, doc.did),
            "comments_count": CommentService.get_count(db, doc.did),
            "is_starred": True  # All documents in this list are starred by user
        }
        result.append(doc_dict)
    
    return result


@router.get("", response_model=List[Document])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[int] = None,
    uid: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """
    Get documents based on user role:
    - READER: Only approved documents (status=1)
    - CREATOR: Own documents (all status) + approved documents from others (status=1)
    """
    # Check if user is creator
    user_is_creator = is_creator(db, current_user.uid)
    
    if user_is_creator:
        # Creators see: their own documents (all status) + others' approved documents
        if uid and uid == current_user.uid:
            # Own documents - all status
            documents = DocumentService.get_all(db, skip, limit, status, uid)
        else:
            # Mix: own documents + others' approved
            query = db.query(DocumentModel)
            if uid:
                query = query.filter(DocumentModel.uid == uid, DocumentModel.status == 1)
            else:
                # Own docs OR approved docs
                query = query.filter(
                    (DocumentModel.uid == current_user.uid) | (DocumentModel.status == 1)
                )
            documents = query.offset(skip).limit(limit).all()
    else:
        # Readers see: only approved documents (status=1)
        query = db.query(DocumentModel).filter(DocumentModel.status == 1)
        if uid:
            query = query.filter(DocumentModel.uid == uid)
        documents = query.offset(skip).limit(limit).all()
    
    # Enrich with additional data
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
            "approver_name": doc.approver.name if doc.approver else None,
            "tags": DocumentService.get_tags(db, doc.did),
            "stars_count": StarredDocumentService.get_star_count(db, doc.did),
            "comments_count": len(CommentService.get_by_document(db, doc.did))
        }
        result.append(doc_dict)
    
    return result


@router.get("/{did}", response_model=Document)
def get_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Get document by ID (Reader or Creator role required)"""
    document = DocumentService.get_by_id(db, did)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {
        "did": document.did,
        "uid": document.uid,
        "title": document.title,
        "description": document.description,
        "link": document.link,
        "size": document.size,
        "status": document.status,
        "approved_by": document.approved_by,
        "approved_at": document.approved_at,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "author_name": document.author.name if document.author else None,
        "approver_name": document.approver.name if document.approver else None,
        "tags": DocumentService.get_tags(db, did),
        "stars_count": StarredDocumentService.get_star_count(db, did),
        "comments_count": len(CommentService.get_by_document(db, did)),
        "is_starred": StarredDocumentService.is_starred(db, current_user.uid, did)
    }


@router.post("", response_model=Document, status_code=status.HTTP_201_CREATED)
def create_document(
    document_create: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_creator)
):
    """Create a new document (Creator role required)"""
    document = DocumentService.create(db, current_user.uid, document_create)
    
    return {
        "did": document.did,
        "uid": document.uid,
        "title": document.title,
        "description": document.description,
        "link": document.link,
        "size": document.size,
        "status": document.status,
        "approved_by": document.approved_by,
        "approved_at": document.approved_at,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "author_name": current_user.name,
        "approver_name": None,
        "tags": DocumentService.get_tags(db, document.did),
        "stars_count": 0,
        "comments_count": 0
    }


@router.put("/{did}", response_model=Document)
def update_document(
    did: str,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_creator)
):
    """Update a document (Creator role required)"""
    # Check if document exists and user is owner or admin
    existing_doc = DocumentService.get_by_id(db, did)
    if not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only document owner can update
    if existing_doc.uid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can update this document"
        )
    
    document = DocumentService.update(db, did, document_update)
    
    return {
        "did": document.did,
        "uid": document.uid,
        "title": document.title,
        "description": document.description,
        "link": document.link,
        "size": document.size,
        "status": document.status,
        "approved_by": document.approved_by,
        "approved_at": document.approved_at,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "author_name": document.author.name if document.author else None,
        "approver_name": document.approver.name if document.approver else None,
        "tags": DocumentService.get_tags(db, did),
        "stars_count": StarredDocumentService.get_star_count(db, did),
        "comments_count": len(CommentService.get_by_document(db, did))
    }


@router.delete("/{did}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_creator)
):
    """Delete a document (Creator role required, owner only)"""
    existing_doc = DocumentService.get_by_id(db, did)
    if not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only document owner can delete
    if existing_doc.uid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only document owner can delete this document"
        )
    
    DocumentService.delete(db, did)


# File upload/download endpoints
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_creator)
):
    """Upload a document file (Creator role required)"""
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            file_content = await file.read()
            # Check file size
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                )
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    return {
        "filename": file.filename,
        "stored_filename": unique_filename,
        "file_path": str(file_path),
        "size": len(file_content),
        "message": "File uploaded successfully"
    }


@router.get("/{did}/file")
async def preview_document_file(
    did: str,
    download: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Preview or download document file (Reader or Creator role required)"""
    document = DocumentService.get_by_id(db, did)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if file exists
    file_path = Path(document.link)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    # Determine media type based on file extension
    file_ext = file_path.suffix.lower()
    media_type_map = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    media_type = media_type_map.get(file_ext, 'application/octet-stream')
    
    # Get original filename from document title
    original_filename = f"{document.title}{file_ext}"
    
    # If download=True, set Content-Disposition to attachment
    # Otherwise, set to inline for preview
    headers = {}
    if download:
        headers['Content-Disposition'] = f'attachment; filename="{original_filename}"'
    else:
        headers['Content-Disposition'] = f'inline; filename="{original_filename}"'
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers=headers
    )


# Star/Unstar endpoints
@router.post("/{did}/star", status_code=status.HTTP_201_CREATED)
def star_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Star a document (Reader or Creator role required)"""
    # Check if document exists
    if not DocumentService.get_by_id(db, did):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    StarredDocumentService.star(db, current_user.uid, did)
    return {"message": "Document starred successfully"}


@router.delete("/{did}/star", status_code=status.HTTP_204_NO_CONTENT)
def unstar_document(
    did: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reader)
):
    """Unstar a document (Reader or Creator role required)"""
    success = StarredDocumentService.unstar(db, current_user.uid, did)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Star not found"
        )
