from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Document Schemas
class DocumentBase(BaseModel):
    title: str
    description: str


class DocumentCreate(DocumentBase):
    link: str
    size: float
    tags: Optional[List[str]] = []
    category_ids: Optional[List[str]] = []  # Category IDs for the document


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    size: Optional[float] = None
    status: Optional[int] = None
    tags: Optional[List[str]] = None


class DocumentInDB(DocumentBase):
    did: str
    uid: str
    link: str
    size: float
    status: int
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Document(DocumentInDB):
    author_name: Optional[str] = None
    approver_name: Optional[str] = None
    tags: List[str] = []
    stars_count: int = 0
    comments_count: int = 0
    
    class Config:
        from_attributes = True
