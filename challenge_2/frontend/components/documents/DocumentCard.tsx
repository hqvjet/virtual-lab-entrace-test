import { Document } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Star, Eye, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { ROUTES, DOCUMENT_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const timeAgo = new Date(document.updatedAt).toLocaleDateString();
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFileTypeIcon = (fileType?: string) => {
    const iconClass = "h-3.5 w-3.5";
    switch (fileType) {
      case 'pdf':
        return (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            <FileText className={iconClass} />
            <span>PDF</span>
          </div>
        );
      case 'docx':
        return (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            <FileText className={iconClass} />
            <span>DOCX</span>
          </div>
        );
      case 'other':
        return (
          <div className="flex items-center gap-1.5 rounded-md bg-gray-600 px-2 py-0.5 text-xs font-medium text-white">
            <FileText className={iconClass} />
            <span>File</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Link href={ROUTES.DOCUMENT_DETAIL(document.id)}>
      <Card className="group border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
              {document.title}
            </h3>
            <Badge
              variant="secondary"
              className={cn('shrink-0 text-xs font-medium', DOCUMENT_STATUS_COLORS[document.status])}
            >
              {document.status}
            </Badge>
          </div>
          {document.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{document.description}</p>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {/* File Info */}
          {(document.fileType || document.fileSize) && (
            <div className="mb-3 flex items-center gap-2">
              {getFileTypeIcon(document.fileType)}
              {document.fileSize && (
                <span className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</span>
              )}
            </div>
          )}
          
          {/* Tags */}
          {document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {document.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="border-gray-300 text-xs text-gray-700">
                  #{tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="border-gray-300 text-xs text-gray-600">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-gray-100 pt-3">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={document.author.avatar} />
              <AvatarFallback className="bg-blue-600 text-xs font-medium text-white">
                {document.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900">{document.author.name}</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-medium">{document.commentsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              <span className="font-medium">{document.stars}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{document.views}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
