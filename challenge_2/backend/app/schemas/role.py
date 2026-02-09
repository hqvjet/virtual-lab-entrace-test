from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Role Schemas
class RoleBase(BaseModel):
    name: str


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    rid: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Category Schemas  
class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    oid: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Permission Schemas
class PermissionAssign(BaseModel):
    role_id: str
    category_ids: List[str]


class UserRoleAssign(BaseModel):
    user_id: str
    role_ids: List[str]
