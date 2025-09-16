import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const DataQuery = () => {
  const [query, setQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResponse, setQueryResponse] = useState('');
  const { toast } = useToast();

  // API base URL
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  
  // Debug: Log the API URL in development
  if (import.meta.env.DEV) {
    console.log('DataQuery API_BASE_URL:', API_BASE_URL);
    console.log('Environment variables:', import.meta.env);
  }


  // Fetch uploaded documents on component mount
  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  const fetchUploadedDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/uploaded-documents`);
      if (response.ok) {
        const data = await response.json();
        setUploadedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload-document`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `${file.name} has been processed successfully.`,
        });
        
        // Refresh the document list
        await fetchUploadedDocuments();
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || 'Failed to process the document.',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: 'An error occurred while uploading the file.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.tiff,.bmp';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        uploadFile(target.files[0]);
      }
    };
    input.click();
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question about your documents.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedDocuments.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload some documents first before querying.",
        variant: "destructive",
      });
      return;
    }

    setIsQuerying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/query-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          use_all_documents: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        setQueryResponse(result.response);
        toast({
          title: "Query Successful",
          description: "Your question has been processed successfully.",
        });
      } else {
        toast({
          title: "Query Failed",
          description: result.error || 'Failed to process your query.',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Query Error",
        description: 'An error occurred while processing your query.',
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };


  const deleteDocument = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Document Deleted",
          description: "Document has been removed successfully.",
        });
        await fetchUploadedDocuments();
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Error",
        description: 'An error occurred while deleting the document.',
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeFromMime = (mimeType: string | undefined) => {
    if (!mimeType) return 'File';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Excel';
    if (mimeType.includes('csv')) return 'CSV';
    if (mimeType.includes('image')) return 'Image';
    return 'File';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unstructured Data Query
          </h1>
          <p className="text-gray-600">
            استعلام البيانات غير المهيكلة | Upload and query documents with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Document Upload */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-blue-600">📤</span>
                  <span>Document Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-6xl mb-4 text-gray-400">📤</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Supports PDF, Word, Excel files up to 10MB
                  </p>
                  <Button 
                    onClick={handleFileSelect}
                    variant="outline"
                    className="bg-white"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents ({uploadedDocuments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isUploading && (
                  <div className="flex items-center justify-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-blue-600">
                      📤 Processing document...
                    </div>
                  </div>
                )}
                
                {uploadedDocuments.length === 0 && !isUploading ? (
                  <div className="text-center p-6 text-gray-500">
                    No documents uploaded yet. Upload some documents to get started!
                  </div>
                ) : (
                  uploadedDocuments.map((doc: any) => (
                    <div key={doc.file_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getFileTypeFromMime(doc.metadata?.mime_type) === 'PDF' ? '📄' : 
                           getFileTypeFromMime(doc.metadata?.mime_type) === 'Word' ? '📝' :
                           getFileTypeFromMime(doc.metadata?.mime_type) === 'Excel' ? '📊' :
                           getFileTypeFromMime(doc.metadata?.mime_type) === 'CSV' ? '📋' :
                           getFileTypeFromMime(doc.metadata?.mime_type) === 'Image' ? '🖼️' : '📄'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.metadata?.file_size || 0)} • {new Date(doc.metadata?.upload_time * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          getFileTypeFromMime(doc.metadata?.mime_type) === 'PDF' 
                            ? 'bg-red-100 text-red-700' 
                            : getFileTypeFromMime(doc.metadata?.mime_type) === 'Word'
                            ? 'bg-blue-100 text-blue-700'
                            : getFileTypeFromMime(doc.metadata?.mime_type) === 'Excel'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {getFileTypeFromMime(doc.metadata?.mime_type)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteDocument(doc.file_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Query Documents */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-blue-600">🔍</span>
                  <span>Query Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="query" className="text-sm font-medium text-gray-700">
                    Ask a question about your documents
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Example: Summarize methodology for District Pulse..."
                      className="w-full h-4 p-3 text-base resize-none"
                      style={{ minHeight: '30px', paddingTop: '1px' }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleQuerySubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!query.trim() || uploadedDocuments.length === 0 || isQuerying}
                >
                  {isQuerying ? '🔄 Processing...' : '🔍 Query Documents'}
                </Button>

              </CardContent>
            </Card>

            {/* Query Results */}
            {queryResponse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span>Query Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                      {queryResponse}
                    </pre>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(queryResponse)}
                    >
                      📋 Copy Response
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQueryResponse('')}
                    >
                      🗑️ Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQuery;
