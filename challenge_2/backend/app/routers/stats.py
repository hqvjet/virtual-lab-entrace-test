from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.category import Category
from app.models.hashtag import Hashtag
from app.utils.dependencies import require_admin
from typing import List, Dict

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/overview")
def get_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get comprehensive system statistics for dashboard"""
    
    # Basic counts
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()
    approved_docs = db.query(Document).filter(Document.status == 1).count()
    pending_docs = db.query(Document).filter(Document.status == 0).count()
    rejected_docs = db.query(Document).filter(Document.status == 2).count()
    
    # Documents created over time (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    docs_by_day = db.query(
        func.date(Document.created_at).label('date'),
        func.count(Document.did).label('count')
    ).filter(
        Document.created_at >= thirty_days_ago
    ).group_by(
        func.date(Document.created_at)
    ).order_by(
        func.date(Document.created_at)
    ).all()
    
    # Users registered over time (last 30 days)
    users_by_day = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.uid).label('count')
    ).filter(
        User.created_at >= thirty_days_ago
    ).group_by(
        func.date(User.created_at)
    ).order_by(
        func.date(User.created_at)
    ).all()
    
    # Documents by status
    status_breakdown = [
        {"name": "Approved", "value": approved_docs, "color": "#10b981"},
        {"name": "Pending", "value": pending_docs, "color": "#f59e0b"},
        {"name": "Rejected", "value": rejected_docs, "color": "#ef4444"}
    ]
    
    # Documents by category (top 5)
    category_docs = db.query(
        Category.name,
        func.count(Hashtag.did).label('count')
    ).join(
        Hashtag, Category.oid == Hashtag.oid
    ).group_by(
        Category.name
    ).order_by(
        func.count(Hashtag.did).desc()
    ).limit(5).all()
    
    # Approval timeline (last 30 days)
    approvals_by_day = db.query(
        func.date(Document.approved_at).label('date'),
        func.count(Document.did).label('count')
    ).filter(
        Document.approved_at >= thirty_days_ago,
        Document.status == 1
    ).group_by(
        func.date(Document.approved_at)
    ).order_by(
        func.date(Document.approved_at)
    ).all()
    
    return {
        "overview": {
            "total_users": total_users,
            "total_documents": total_documents,
            "approved_documents": approved_docs,
            "pending_documents": pending_docs,
            "rejected_documents": rejected_docs
        },
        "documents_over_time": [
            {"date": str(row.date), "count": row.count}
            for row in docs_by_day
        ],
        "users_over_time": [
            {"date": str(row.date), "count": row.count}
            for row in users_by_day
        ],
        "status_breakdown": status_breakdown,
        "category_distribution": [
            {"name": row.name, "count": row.count}
            for row in category_docs
        ],
        "approvals_over_time": [
            {"date": str(row.date), "count": row.count}
            for row in approvals_by_day
        ]
    }
