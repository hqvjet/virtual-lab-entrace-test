'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  Plus,
  Save,
  Send,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { getDocumentById } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const document = getDocumentById(id);
  
  if (!document) {
    notFound();
  }

  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description);
  const [tags, setTags] = useState<string[]>(document.tags);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [replaceFile, setReplaceFile] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        alert('Please upload only PDF or DOCX files');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setReplaceFile(true);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (status: 'draft' | 'pending' | 'published') => {
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    setIsUploading(true);

    // Mock upload - replace with actual API call
    setTimeout(() => {
      setIsUploading(false);
      router.push(ROUTES.DOCUMENT_DETAIL(id));
    }, 2000);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      // Mock delete - replace with actual API call
      setTimeout(() => {
        router.push(ROUTES.DOCUMENTS);
      }, 500);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFileTypeDisplay = (): string => {
    if (file) {
      if (file.type === 'application/pdf') return 'PDF';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    }
    if (document.fileType) {
      return document.fileType.toUpperCase();
    }
    return 'FILE';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.DOCUMENT_DETAIL(id)}>
            <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Document
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Edit Document</h1>
            <p className="text-lg text-gray-600">Update document details and file</p>
          </div>
        </div>

        {/* Current/Upload File Section */}
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5" />
              {replaceFile ? 'New File' : 'Current File'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!replaceFile && document.fileUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{document.title}.{document.fileType}</p>
                    <p className="text-sm text-gray-600">
                      {getFileTypeDisplay()} · {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplaceFile(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {file ? (
                  <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {getFileTypeDisplay()} · {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setReplaceFile(false);
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 hover:bg-blue-50"
                    >
                      <Upload className="mb-4 h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-lg font-semibold text-gray-700">
                        Click to upload new file
                      </p>
                      <p className="text-sm text-gray-500">PDF or DOCX (MAX. 10MB)</p>
                    </label>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Document Details */}
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-gray-900">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 border-gray-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Provide a brief description of the document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={5}
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Tags</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="h-10 border-gray-300"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1.5 border-gray-300 px-3 py-1 text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={!title.trim() || isUploading}
            className="gap-2 border-gray-300 hover:bg-gray-50"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(document.status === 'published' ? 'published' : 'pending')}
            disabled={!title.trim() || isUploading}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            {isUploading ? 'Saving...' : document.status === 'published' ? 'Update & Publish' : 'Update & Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
