export type UserRole = 'creator' | 'approver' | 'reader' | 'manager';

export type DocumentStatus = 'published' | 'pending' | 'draft' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  avatar?: string;
  createdAt: Date;
}

export type FileType = 'pdf' | 'docx' | 'other';

export interface Document {
  id: string;
  title: string;
  content: string;
  description: string;
  author: User;
  status: DocumentStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  stars: number;
  views: number;
  commentsCount: number;
  isStarred?: boolean;
  fileUrl?: string;
  fileType?: FileType;
  fileSize?: number; // in bytes
}

export interface Comment {
  id: string;
  documentId: string;
  author: User;
  content: string;
  createdAt: Date;
  replies?: Comment[];
  likes: number;
}

export interface ApprovalRequest {
  id: string;
  document: Document;
  submittedBy: User;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: User;
  reviewedAt?: Date;
  changeRequests?: string;
}
