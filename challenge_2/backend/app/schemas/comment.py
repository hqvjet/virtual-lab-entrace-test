from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Comment Schemas
class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    did: str


class CommentInDB(CommentBase):
    uid: str
    did: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Comment(CommentInDB):
    user_name: Optional[str] = None
