'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi, documentsApi, type Category } from '@/lib/api';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  Save,
  Send,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function NewDocumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCategories();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      const data = await adminApi.listAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

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
      
      // Auto-fill title from filename if empty
      if (!title) {
        const filename = selectedFile.name.replace(/\.(pdf|docx)$/i, '');
        setTitle(filename);
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!file || !title.trim()) {
      setError('Please provide a file and title');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Step 1: Upload file
      const uploadResult = await documentsApi.uploadFile(file);
      
      // Step 2: Create document with uploaded file path
      const documentData = {
        title: title.trim(),
        description: description.trim() || '',
        link: uploadResult.file_path,
        size: uploadResult.size,
        category_ids: selectedCategories,  // Send category IDs
      };

      await documentsApi.create(documentData);
      
      // Success - redirect to documents list
      router.push(ROUTES.DOCUMENTS);
    } catch (err) {
      console.error('Failed to create document:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document. Please try again.');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFileType = (file: File): 'pdf' | 'docx' | 'other' => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    return 'other';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.DOCUMENTS}>
            <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Button>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Create New Document</h1>
            <p className="text-lg text-gray-600">Upload and share your document with the team</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Upload Section */}
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
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
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">PDF or DOCX (MAX. 10MB)</p>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                  getFileType(file) === 'pdf' ? 'bg-blue-600' : 'bg-blue-600'
                }`}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {getFileType(file).toUpperCase()} · {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
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

            {/* Categories */}
            <div className="space-y-3 category-dropdown-container">
              <label className="text-sm font-semibold text-gray-900">
                Categories <span className="text-gray-500">(Select categories for this document)</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <span className="text-gray-600">
                    {selectedCategories.length > 0 
                      ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`
                      : 'Select categories...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {loadingCategories ? (
                      <div className="p-4 text-center text-sm text-gray-500">Loading categories...</div>
                    ) : categories.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No categories available. Contact your manager to create categories.
                      </div>
                    ) : (
                      <div className="py-1">
                        {categories.map((category) => (
                          <button
                            key={category.oid}
                            type="button"
                            onClick={() => toggleCategory(category.oid)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-blue-50"
                          >
                            <div className={`h-4 w-4 shrink-0 rounded border ${
                              selectedCategories.includes(category.oid)
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300 bg-white'
                            } flex items-center justify-center`}>
                              {selectedCategories.includes(category.oid) && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-gray-500">{category.description}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((catId) => {
                    const category = categories.find(c => c.oid === catId);
                    return category ? (
                      <Badge
                        key={catId}
                        variant="outline"
                        className="gap-1.5 border-blue-300 bg-blue-50 px-3 py-1 text-sm text-blue-700"
                      >
                        {category.name}
                        <button
                          onClick={() => removeCategory(catId)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!file || !title.trim() || isUploading || selectedCategories.length === 0}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    </div>
  );
}
