from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.role import Role, RoleCreate, UserRoleAssign, PermissionAssign
from app.services.role_service import RoleService
from app.utils.dependencies import require_admin
from app.models.user import User

router = APIRouter(prefix="/roles", tags=["Admin - Roles"])


@router.get("", response_model=List[Role])
def get_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all roles (Admin only)"""
    return RoleService.get_all(db, skip, limit)


@router.post("", response_model=Role, status_code=status.HTTP_201_CREATED)
def create_role(
    role_create: RoleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new role (Admin only)"""
    # Check if role already exists
    existing = RoleService.get_by_name(db, role_create.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists"
        )
    
    return RoleService.create(db, role_create.name)


@router.delete("/{rid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    rid: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a role (Admin only)"""
    success = RoleService.delete(db, rid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )


@router.post("/assign-user", status_code=status.HTTP_200_OK)
def assign_roles_to_user(
    assignment: UserRoleAssign,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Assign roles to a user (Admin only)"""
    success = RoleService.assign_to_user(db, assignment.user_id, assignment.role_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "Roles assigned successfully"}


@router.post("/permissions", status_code=status.HTTP_200_OK)
def set_role_permissions(
    permission: PermissionAssign,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Set category access permissions for a role (Admin only)"""
    success = RoleService.set_permissions(db, permission.role_id, permission.category_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return {"message": "Permissions set successfully"}


@router.get("/{rid}/categories")
def get_role_accessible_categories(
    rid: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get categories accessible by a role (Admin only)"""
    role = RoleService.get_by_id(db, rid)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return RoleService.get_accessible_categories(db, rid)
