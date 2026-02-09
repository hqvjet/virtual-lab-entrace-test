'use client';

import { useEffect, useState } from 'react';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle, 
  Star,
  MessageCircle,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
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

export default function WorkspacePage() {
  const [myDocs, setMyDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMyDocs = async () => {
      try {
        const apiDocs = await documentsApi.getMyDocuments();
        const mapped = apiDocs.map(mapApiDocumentToDocument);
        setMyDocs(mapped);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMyDocs();
  }, []);
  
  const draftDocs = myDocs.filter((d) => d.status === 'draft');
  const pendingDocs = myDocs.filter((d) => d.status === 'pending');
  const publishedDocs = myDocs.filter((d) => d.status === 'published');
  
  const totalStars = myDocs.reduce((sum, doc) => sum + doc.stars, 0);
  const totalComments = myDocs.reduce((sum, doc) => sum + doc.commentsCount, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container mx-auto space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">My Workspace</h1>
            <p className="text-lg text-gray-600">Manage your documents and track your progress</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-3xl font-bold text-gray-900">{publishedDocs.length}</p>
                  <p className="text-xs text-gray-500">Live documents</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingDocs.length}</p>
                  <p className="text-xs text-gray-500">Under review</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-3xl font-bold text-gray-900">{draftDocs.length}</p>
                  <p className="text-xs text-gray-500">Work in progress</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <Edit className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Total Stars</p>
                  <p className="text-3xl font-bold text-gray-900">{totalStars.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">From readers</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <Star className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Stars</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStars}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <MessageCircle className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Tabs */}
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-900">My Documents</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All ({myDocs.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({publishedDocs.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingDocs.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({draftDocs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <DocumentGrid documents={myDocs} />
              </TabsContent>

              <TabsContent value="published">
                <DocumentGrid documents={publishedDocs} />
              </TabsContent>

              <TabsContent value="pending">
                <DocumentGrid documents={pendingDocs} />
              </TabsContent>

              <TabsContent value="draft">
                <DocumentGrid documents={draftDocs} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
