from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from app.models.document import Document
from app.models.category import Category
from app.models.hashtag import Hashtag
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentService:
    @staticmethod
    def get_by_id(db: Session, did: str) -> Optional[Document]:
        """Get document by ID"""
        return db.query(Document).filter(Document.did == did).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[int] = None,
        uid: Optional[str] = None
    ):
        """Get all documents with filters"""
        query = db.query(Document)
        
        if status is not None:
            query = query.filter(Document.status == status)
        
        if uid:
            query = query.filter(Document.uid == uid)
        
        return query.order_by(Document.updated_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, uid: str, document_create: DocumentCreate) -> Document:
        """Create a new document"""
        db_document = Document(
            did=str(uuid.uuid4()),
            uid=uid,
            title=document_create.title,
            description=document_create.description,
            link=document_create.link,
            size=document_create.size,
            status=0  # Default to draft
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Collect all tags to save
        all_tags = []
        
        # Handle category_ids - convert to category names
        if document_create.category_ids:
            categories = db.query(Category).filter(Category.oid.in_(document_create.category_ids)).all()
            category_names = [cat.name for cat in categories]
            all_tags.extend(category_names)
        
        # Handle additional tags
        if document_create.tags:
            all_tags.extend(document_create.tags)
        
        # Save all tags at once
        if all_tags:
            DocumentService._update_tags(db, db_document.did, all_tags)
        
        return db_document
    
    @staticmethod
    def update(db: Session, did: str, document_update: DocumentUpdate) -> Optional[Document]:
        """Update a document"""
        db_document = DocumentService.get_by_id(db, did)
        if not db_document:
            return None
        
        update_data = document_update.dict(exclude_unset=True, exclude={'tags'})
        for field, value in update_data.items():
            setattr(db_document, field, value)
        
        # Handle tags update
        if document_update.tags is not None:
            DocumentService._update_tags(db, did, document_update.tags)
        
        db.commit()
        db.refresh(db_document)
        return db_document
    
    @staticmethod
    def delete(db: Session, did: str) -> bool:
        """Delete a document"""
        db_document = DocumentService.get_by_id(db, did)
        if not db_document:
            return False
        
        db.delete(db_document)
        db.commit()
        return True
    
    @staticmethod
    def _update_tags(db: Session, did: str, tags: List[str]):
        """Update document tags"""
        # Remove existing tags
        db.query(Hashtag).filter(Hashtag.did == did).delete()
        
        # Add new tags
        for tag_name in tags:
            # Get or create category
            category = db.query(Category).filter(Category.name == tag_name).first()
            if not category:
                category = Category(
                    oid=str(uuid.uuid4()),
                    name=tag_name
                )
                db.add(category)
                db.flush()
            
            # Create hashtag relationship
            hashtag = Hashtag(did=did, oid=category.oid)
            db.add(hashtag)
        
        db.commit()
    
    @staticmethod
    def get_tags(db: Session, did: str) -> List[str]:
        """Get document tags"""
        hashtags = db.query(Hashtag).filter(Hashtag.did == did).all()
        tags = []
        for hashtag in hashtags:
            category = db.query(Category).filter(Category.oid == hashtag.oid).first()
            if category:
                tags.append(category.name)
        return tags
