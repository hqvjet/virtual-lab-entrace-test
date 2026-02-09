from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


# Association table for user-role many-to-many relationship
user_role = Table(
    'user_role',
    Base.metadata,
    Column('uid', String, ForeignKey('users.uid', ondelete='CASCADE'), primary_key=True),
    Column('rid', String, ForeignKey('roles.rid', ondelete='CASCADE'), primary_key=True)
)


# Association table for role-category permissions
access_permission = Table(
    'access_permission',
    Base.metadata,
    Column('rid', String, ForeignKey('roles.rid', ondelete='CASCADE'), primary_key=True),
    Column('oid', String, ForeignKey('categories.oid', ondelete='CASCADE'), primary_key=True)
)


class Role(Base):
    __tablename__ = "roles"

    rid = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", secondary=user_role, back_populates="roles")
    accessible_categories = relationship("Category", secondary=access_permission, back_populates="authorized_roles")
