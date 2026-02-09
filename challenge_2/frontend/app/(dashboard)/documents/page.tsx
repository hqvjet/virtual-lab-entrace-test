'use client';

import { useEffect, useState } from 'react';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Search, FileText, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { documentsApi, type Document as ApiDocument } from '@/lib/api';
import { Document } from '@/types';
import { useRole } from '@/hooks/use-role';

// Map API document to component document
const mapApiDocumentToDocument = (apiDoc: ApiDocument): Document => {
  // Determine status string from number
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

  // Determine file type from link
  let fileType: 'pdf' | 'docx' | 'other' = 'other';
  if (apiDoc.link) {
    const ext = apiDoc.link.toLowerCase().split('.').pop();
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'docx' || ext === 'doc') fileType = 'docx';
  }

  return {
    id: apiDoc.did,
    title: apiDoc.title,
    content: '', // API doesn't provide content field
    description: apiDoc.description,
    author: {
      id: apiDoc.uid,
      name: apiDoc.author_name || 'Unknown',
      email: '', // API doesn't provide author email
      role: [], // API doesn't provide author roles in document
      createdAt: new Date(),
    },
    status,
    tags: apiDoc.tags || [],
    createdAt: new Date(apiDoc.created_at),
    updatedAt: new Date(apiDoc.updated_at),
    stars: apiDoc.stars_count || 0,
    views: 0, // API doesn't provide views
    commentsCount: apiDoc.comments_count || 0,
    fileUrl: apiDoc.link,
    fileType,
    fileSize: apiDoc.size,
  };
};

const ITEMS_PER_PAGE = 10;

export default function DocumentsPage() {
  const { canCreate } = useRole();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const apiDocs = await documentsApi.list();
      const mappedDocs = apiDocs.map(mapApiDocumentToDocument);
      setDocuments(mappedDocs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDocuments = documents.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="container mx-auto space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-lg">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Document Library</h1>
                <p className="text-lg text-gray-600">Browse, search and discover all your team's documents</p>
              </div>
              {canCreate && (
                <Link href={ROUTES.DOCUMENT_NEW}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700">
                    <PlusCircle className="h-5 w-5" />
                    New Document
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input 
                type="text"
                placeholder="Search documents by title, author, or tags..."
                className="h-14 border-gray-300 bg-white pl-12 pr-4 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200 bg-white shadow-md">
          <CardContent className="p-6">
            <DocumentFilters />
          </CardContent>
        </Card>

        {/* Documents Column List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Showing {startIndex + 1}-{Math.min(endIndex, documents.length)} of {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
            </div>
          </div>
          
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Document List - Column Layout */}
          {currentDocuments.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-lg font-medium text-gray-600">No documents found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`${ROUTES.DOCUMENTS}/${doc.id}`}
                  className="block"
                >
                  <Card className="border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              by <span className="font-medium text-gray-700">{doc.author.name}</span>
                            </span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {doc.stars}
                            </span>
                            <span>•</span>
                            <span>{doc.commentsCount} comments</span>
                            {doc.tags && doc.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex gap-1">
                                  {doc.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {doc.fileType && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                            <span className="text-xs font-semibold text-blue-700 uppercase">
                              {doc.fileType}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
