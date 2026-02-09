from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import User, UserUpdate
from app.services.user_service import UserService
from app.services.role_service import RoleService
from app.utils.dependencies import get_current_user, require_admin
from app.models.user import User as UserModel

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=User)
def get_current_user_info(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information with roles"""
    user_roles = RoleService.get_user_roles(db, current_user.uid)
    user_dict = {
        "uid": current_user.uid,
        "email": current_user.email,
        "name": current_user.name,
        "created_at": current_user.created_at,
        "roles": [role.name for role in user_roles]
    }
    return user_dict


@router.get("", response_model=List[User])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Get all users (admin only)"""
    return UserService.get_all(db, skip, limit)


@router.get("/{uid}", response_model=User)
def get_user(
    uid: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user)
):
    """Get user by ID"""
    user = UserService.get_by_id(db, uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{uid}", response_model=User)
def update_user(
    uid: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Update user (own profile or manager)"""
    # Only allow users to update their own profile or managers to update any
    if current_user.uid != uid and not RoleService.is_admin(db, current_user.uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    user = UserService.update(db, uid, user_update)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    uid: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_admin)
):
    """Delete user (admin only)"""
    success = UserService.delete(db, uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
