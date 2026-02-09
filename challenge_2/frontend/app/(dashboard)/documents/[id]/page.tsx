'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileViewer } from '@/components/documents/FileViewer';
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Share2,
  Edit,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES, DOCUMENT_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { documentsApi, commentsApi, approvalsApi, type Document as ApiDocument, type Comment as ApiComment } from '@/lib/api';
import { Document, Comment } from '@/types';
import { useRole } from '@/hooks/use-role';

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
    content: apiDoc.description,
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
  };
};

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isApprover } = useRole();
  const [document, setDocument] = useState<Document | null>(null);
  const [relatedDocs, setRelatedDocs] = useState<Document[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [isStarring, setIsStarring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const apiDoc = await documentsApi.get(id);
        const mappedDoc = mapApiDocumentToDocument(apiDoc);
        setDocument(mappedDoc);
        setStarCount(apiDoc.stars_count);
        setIsStarred(apiDoc.is_starred || false);
        
        // Load comments
        const apiComments = await commentsApi.list(id);
        const mappedComments = apiComments.map(c => ({
          id: `${c.uid}_${c.did}_${c.created_at}`, // Composite key as unique ID
          documentId: c.did,
          author: {
            id: c.uid,
            name: c.user_name || 'Unknown',
            email: '',
            role: [],
            createdAt: new Date(),
          },
          content: c.content,
          createdAt: new Date(c.created_at),
          likes: 0,
        }));
        setComments(mappedComments);
        
        // Load related documents
        const allDocs = await documentsApi.list();
        const mapped = allDocs
          .filter(d => d.did !== id)
          .slice(0, 4)
          .map(mapApiDocumentToDocument);
        setRelatedDocs(mapped);
      } catch (err) {
        console.error('Failed to load document:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  const handleToggleStar = async () => {
    setIsStarring(true);
    try {
      if (isStarred) {
        await documentsApi.unstar(id);
        setIsStarred(false);
        setStarCount(prev => Math.max(0, prev - 1));
      } else {
        await documentsApi.star(id);
        setIsStarred(true);
        setStarCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      alert('Failed to toggle star');
    } finally {
      setIsStarring(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setCommentLoading(true);
    try {
      const created = await commentsApi.create({ did: id, content: newComment });
      const mappedComment: Comment = {
        id: `${created.uid}_${created.did}_${created.created_at}`, // Composite key as unique ID
        documentId: created.did,
        author: {
          id: created.uid,
          name: created.user_name || 'You',
          email: '',
          role: [],
          createdAt: new Date(),
        },
        content: created.content,
        createdAt: new Date(created.created_at),
        likes: 0,
      };
      setComments([...comments, mappedComment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!isApprover) return;
    
    setIsApproving(true);
    try {
      await approvalsApi.approve(id);
      // Reload document to get updated status
      const apiDoc = await documentsApi.get(id);
      setDocument(mapApiDocumentToDocument(apiDoc));
      alert('Document approved successfully!');
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve document');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Document not found</h1>
          <p className="mt-2 text-gray-600">The document you're looking for doesn't exist.</p>
          <Link href={ROUTES.DOCUMENTS}>
            <Button className="mt-4">Back to Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="container mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
        {/* Back Button */}
        <Link href={ROUTES.DOCUMENTS}>
          <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
        </Link>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">{document.title}</h1>
              <p className="text-lg leading-relaxed text-gray-600">{document.description}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn('shrink-0 text-sm font-semibold', DOCUMENT_STATUS_COLORS[document.status])}
            >
              {document.status}
            </Badge>
          </div>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-white shadow-md">
                <AvatarImage src={document.author.avatar} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {document.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{document.author.name}</p>
                <p className="text-sm text-gray-500">
                  Updated {document.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-medium border-gray-300 text-gray-700">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleToggleStar}
              disabled={isStarring}
              className={cn(
                "gap-2",
                isStarred 
                  ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Star className={cn("h-4 w-4", isStarred && "fill-current")} />
              {isStarred ? 'Starred' : 'Star'} ({starCount})
            </Button>
            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </Button>
            <Button 
              onClick={handleShare}
              variant="outline" 
              className="gap-2 border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            {document.status === 'draft' && (
              <Link href={ROUTES.DOCUMENT_EDIT(document.id)}>
                <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            {document.status === 'pending' && isApprover && (
              <Button 
                onClick={handleApprove}
                disabled={isApproving}
                className="gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                {isApproving ? 'Approving...' : 'Approve'}
              </Button>
            )}
          </div>
        </div>
        </div>

        {/* Content / File Viewer */}
        {document.fileUrl && document.fileType ? (
          <FileViewer 
            documentId={document.id}
            fileType={document.fileType}
            fileName={`${document.title}.${document.fileType === 'docx' ? 'docx' : 'pdf'}`}
            fileSize={document.fileSize}
          />
        ) : (
          <Card className="border-gray-200 shadow-lg">
            <CardContent className="p-8 lg:p-12">
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <p className="leading-relaxed text-gray-700">{document.content}</p>
                <div className="mt-8 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-6">
                  <p className="text-sm text-amber-800">
                    This document doesn't have an attached file. Upload a PDF or DOCX file to enable preview.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6 lg:p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">
              Comments ({comments.length})
            </h3>
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const timeAgo = new Date(comment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const initials = comment.author.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase();
                  
                  return (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{comment.author.name}</span>
                          <span className="text-sm text-gray-500">{timeAgo}</span>
                        </div>
                        <p className="leading-relaxed text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add Comment */}
              <div className="border-t pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea 
                      placeholder="Add a comment..."
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={commentLoading}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button 
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handlePostComment}
                        disabled={commentLoading || !newComment.trim()}
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Documents */}
        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6 lg:p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">Related Documents</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={ROUTES.DOCUMENT_DETAIL(doc.id)}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-xl hover:border-blue-300"
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</p>
                    <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {doc.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {doc.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
