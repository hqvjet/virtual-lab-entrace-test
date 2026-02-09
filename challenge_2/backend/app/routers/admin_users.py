from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import User, UserCreate
from app.schemas.role import UserRoleAssign
from app.services.user_service import UserService
from app.services.role_service import RoleService
from app.utils.dependencies import require_admin
from app.models.user import User as UserModel

router = APIRouter(prefix="/users", tags=["Admin - Users"])


@router.get("", response_model=List[User])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Get all users with their roles (Admin only)"""
    users = UserService.get_all(db, skip, limit)
    result = []
    for user in users:
        user_roles = RoleService.get_user_roles(db, user.uid)
        user_dict = {
            "uid": user.uid,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "roles": [role.name for role in user_roles]
        }
        result.append(user_dict)
    return result


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Create a new user (Admin only)"""
    # Check if user already exists
    existing = UserService.get_by_email(db, user_create.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = UserService.create(db, user_create)
    return {
        "uid": user.uid,
        "email": user.email,
        "name": user.name,
        "created_at": user.created_at,
        "roles": []
    }


@router.post("/{uid}/roles", status_code=status.HTTP_200_OK)
def assign_user_roles(
    uid: str,
    role_ids: List[str],
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Assign roles to a user (Admin only)"""
    # Check if user exists
    user = UserService.get_by_id(db, uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    success = RoleService.assign_to_user(db, uid, role_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign roles"
        )
    
    return {"message": "Roles assigned successfully"}


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    uid: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Delete a user (Admin only)"""
    success = UserService.delete(db, uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
