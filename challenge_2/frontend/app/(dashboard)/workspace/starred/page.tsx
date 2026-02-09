'use client';

import { useEffect, useState } from 'react';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { documentsApi, type Document as ApiDocument } from '@/lib/api';
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

export default function StarredPage() {
  const [starredDocs, setStarredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadStarredDocs = async () => {
      try {
        const apiDocs = await documentsApi.getStarredDocuments();
        const mapped = apiDocs.map(mapApiDocumentToDocument);
        setStarredDocs(mapped);
      } catch (err) {
        console.error('Failed to load starred documents:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStarredDocs();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold">Starred Documents</h1>
        </div>
        <p className="text-muted-foreground">Your bookmarked documents for quick access</p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Starred
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{starredDocs.length}</p>
        </CardContent>
      </Card>

      {/* Documents */}
      <DocumentGrid documents={starredDocs} />
    </div>
  );
}
