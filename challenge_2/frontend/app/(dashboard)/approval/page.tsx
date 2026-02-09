'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { approvalsApi, type Document as ApiDocument } from '@/lib/api';
import { Document } from '@/types';

// Map API document to component document
const mapApiDocumentToDocument = (apiDoc: ApiDocument): Document => {
  let status: 'published' | 'pending' | 'draft' | 'rejected';
  switch (apiDoc.status) {
    case 1:
      status = 'published';
      break;
    case 2:
      status = 'rejected';
      break;
    default:
      status = 'pending';
      break;
  }

  let fileType: 'pdf' | 'docx' | 'other' = 'other';
  if (apiDoc.link) {
    const ext = apiDoc.link.toLowerCase().split('.').pop();
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'docx' || ext === 'doc') fileType = 'docx';
  }

  return {
    id: apiDoc.did,
    title: apiDoc.title,
    content: '',
    description: apiDoc.description,
    author: {
      id: apiDoc.uid,
      name: apiDoc.author_name || 'Unknown',
      email: '',
      role: [],
      createdAt: new Date(),
    },
    status,
    tags: apiDoc.tags || [],
    createdAt: new Date(apiDoc.created_at),
    updatedAt: new Date(apiDoc.updated_at),
    stars: apiDoc.stars_count || 0,
    views: 0,
    commentsCount: apiDoc.comments_count || 0,
    fileUrl: apiDoc.link,
    fileType,
    fileSize: apiDoc.size,
    isStarred: apiDoc.is_starred,
  };
};

export default function ApprovalPage() {
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendingDocs = async () => {
    try {
      const apiDocs = await approvalsApi.getPending();
      const mapped = apiDocs.map(mapApiDocumentToDocument);
      setPendingDocs(mapped);
    } catch (err) {
      console.error('Failed to load pending documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingDocs();
  }, []);

  const handleApprove = async (docId: string) => {
    try {
      await approvalsApi.approve(docId);
      await loadPendingDocs(); // Reload list
    } catch (err) {
      console.error('Failed to approve document:', err);
      alert('Failed to approve document');
    }
  };

  const handleReject = async (docId: string) => {
    try {
      await approvalsApi.reject(docId);
      await loadPendingDocs(); // Reload list
    } catch (err) {
      console.error('Failed to reject document:', err);
      alert('Failed to reject document');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container mx-auto max-w-6xl space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Approval Center</h1>
            <p className="text-lg text-gray-600">Review and approve pending documents</p>
          </div>
        </div>

        {/* Stats - Only Pending Reviews */}
        <div className="grid gap-6">
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-4xl font-bold text-gray-900">{pendingDocs.length}</p>
                  <p className="text-xs text-gray-500">Documents awaiting approval</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Queue */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Pending Queue</CardTitle>
                <p className="text-sm text-gray-600">{pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} to review</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {pendingDocs.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-gray-400" />
                    <p className="mt-4 text-lg font-medium text-gray-600">All caught up!</p>
                    <p className="mt-1 text-sm text-gray-500">No pending documents to review</p>
                  </div>
                </div>
              ) : (
                pendingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                  >
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                    >
                      HIGH PRIORITY
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6 border border-gray-300">
                            <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
                              {doc.author.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">by {doc.author.name}</span>
                        </div>
                        <span className="text-gray-400">·</span>
                        <span>Submitted {doc.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={ROUTES.DOCUMENT_DETAIL(doc.id)}>
                        <Button variant="outline" size="sm" className="gap-2 border-gray-300 hover:bg-gray-100">
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(doc.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleReject(doc.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
