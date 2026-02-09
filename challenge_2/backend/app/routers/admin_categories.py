from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.role import Category, CategoryCreate
from app.services.category_service import CategoryService
from app.utils.dependencies import require_admin, get_current_user
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["Admin - Categories"])


@router.get("", response_model=List[Category])
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all categories.
    - MANAGER: sees all categories
    - CREATOR: sees all categories (for document creation/categorization)
    - Others: sees only accessible categories
    """
    from app.services.role_service import RoleService
    from app.utils.role_checker import is_creator
    
    if RoleService.is_admin(db, current_user.uid) or is_creator(db, current_user.uid):
        return CategoryService.get_all(db, skip, limit)
    else:
        return CategoryService.get_accessible_categories_for_user(db, current_user.uid)


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category(
    category_create: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new category (Admin only)"""
    # Check if category already exists
    existing = CategoryService.get_by_name(db, category_create.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    return CategoryService.create(db, category_create.name)


@router.delete("/{oid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    oid: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a category (Admin only)"""
    success = CategoryService.delete(db, oid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
