from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import verify_token
from app.utils.role_checker import is_admin, is_creator, is_approver, is_reader

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    uid = verify_token(token)
    if uid is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.uid == uid).first()
    if user is None:
        raise credentials_exception
    
    return user


def require_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require the current user to be an admin (MANAGER role only)"""
    if not is_admin(db, current_user.uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_creator(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require the current user to be a creator (CREATOR role)"""
    if not is_creator(db, current_user.uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator access required"
        )
    return current_user


def require_approver(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require the current user to be an approver (APPROVER role)"""
    if not is_approver(db, current_user.uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Approver access required"
        )
    return current_user


def require_reader(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require the current user to be at least a reader (READER, CREATOR, or APPROVER role)"""
    if not (is_reader(db, current_user.uid) or is_creator(db, current_user.uid) or is_approver(db, current_user.uid)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reader access required"
        )
    return current_user
