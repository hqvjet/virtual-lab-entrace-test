from pydantic import BaseModel
from datetime import datetime


# Category Schemas
class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryInDB(CategoryBase):
    oid: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Category(CategoryInDB):
    document_count: int = 0
