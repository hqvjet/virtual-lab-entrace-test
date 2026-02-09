'use client';

import { useAuth } from '@/contexts/auth-context';

export function useRole() {
  const { user } = useAuth();
  
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };
  
  const isManager = hasRole('MANAGER');
  const isCreator = hasRole('CREATOR');
  const isApprover = hasRole('APPROVER');
  const isReader = hasRole('READER');
  
  // Role capabilities - STRICT business rules:
  // MANAGER: Only manages users, roles, categories. CANNOT create documents.
  // CREATOR: Creates and manages documents using categories.
  // APPROVER: Approves/rejects documents, requests edits.
  // READER: Reads, stars, comments on documents.
  
  const canRead = isReader || isCreator || isApprover;  // Reader, Creator, Approver can read
  const canCreate = isCreator;  // ONLY Creator can create/edit documents
  const canApprove = isApprover;  // ONLY Approver can approve/reject
  const canManageSystem = isManager;  // ONLY Manager manages system resources
  const canComment = isReader || isCreator || isApprover;  // Can comment
  const canStar = isReader || isCreator || isApprover;  // Can star/bookmark
  
  return {
    user,
    roles: user?.roles || [],
    hasRole,
    isManager,
    isCreator,
    isApprover,
    isReader,
    canRead,
    canCreate,
    canApprove,
    canManageSystem,
    canComment,
    canStar,
  };
}
