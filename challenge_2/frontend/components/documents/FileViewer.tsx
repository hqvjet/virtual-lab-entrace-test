'use client';

import { FileType } from '@/types';
import { AlertCircle, FileX, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface FileViewerProps {
  documentId: string;
  fileType: FileType;
  fileName: string;
  fileSize?: number;
}

export function FileViewer({ documentId, fileType, fileName, fileSize }: FileViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let objectUrl = '';
    
    const loadFile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setFileUrl(objectUrl);
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.error('Failed to load file:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentId]);
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDownload = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file?download=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (fileType === 'pdf') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-blue-900">PDF Document</p>
              <p className="text-sm text-blue-700">{formatFileSize(fileSize)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenNewTab}
              variant="outline"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            <Button
              onClick={handleDownload}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        
        {!loadError && fileUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <iframe
              src={fileUrl}
              className="h-[800px] w-full"
              title={fileName}
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Unable to Preview</h3>
            <p className="mb-6 max-w-md text-gray-600">
              The document preview couldn't be loaded. Please download the file or open it in a new tab.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleOpenNewTab}
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                onClick={handleDownload}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (fileType === 'docx') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-indigo-900">Word Document</p>
              <p className="text-sm text-indigo-700">{formatFileSize(fileSize)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenNewTab}
              variant="outline"
              className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            <Button
              onClick={handleDownload}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        
        {!loadError ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="h-[800px] w-full"
              title={fileName}
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Unable to Preview</h3>
            <p className="mb-6 max-w-md text-gray-600">
              The document preview couldn't be loaded. Please download the file or open it in a new tab.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleOpenNewTab}
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                onClick={handleDownload}
                className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unsupported file type
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600">
            <FileX className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">Unsupported File Type</p>
            <p className="text-sm text-amber-700">{formatFileSize(fileSize)}</p>
          </div>
        </div>
        <Button
          onClick={handleDownload}
          className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-500">
          <AlertCircle className="h-10 w-10 text-white" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">Preview Not Available</h3>
        <p className="mb-6 max-w-md text-gray-600">
          This file type is not supported for preview. Currently, we only support PDF and DOCX files.
          You can download the file to view it on your device.
        </p>
        <Button
          onClick={handleDownload}
          size="lg"
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download File
        </Button>
        <p className="mt-4 text-sm text-gray-500">
          Supported formats: PDF, DOCX
        </p>
      </div>
    </div>
  );
}
