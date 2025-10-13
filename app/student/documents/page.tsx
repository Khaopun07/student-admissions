'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentType } from '@prisma/client';

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
}

export default function StudentDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | ''>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/documents');
          const data = await response.json();
          if (response.ok) {
            setDocuments(data);
          } else {
            setError(data.message || 'Failed to fetch documents');
          }
        } catch (err) {
          console.error('Failed to fetch documents:', err);
          setError('An unexpected error occurred while fetching documents.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDocuments();
  }, [session, uploadSuccess]); // Refetch documents on upload success

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocumentType(e.target.value as DocumentType);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadSuccess('');

    if (!selectedFile || !selectedDocumentType) {
      setError('Please select a file and a document type.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', selectedDocumentType);

    try {
      const response = await fetch('/api/student/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(data.message);
        setSelectedFile(null);
        setSelectedDocumentType('');
      } else {
        setError(data.message || 'Document upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">จัดการเอกสารของคุณ</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">อัปโหลดเอกสารใหม่</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="documentType" className="block text-gray-700 text-sm font-bold mb-2">
                ประเภทเอกสาร
              </label>
              <select
                id="documentType"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={selectedDocumentType}
                onChange={handleDocumentTypeChange}
                required
              >
                <option value="">เลือกประเภทเอกสาร</option>
                {Object.values(DocumentType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="file" className="block text-gray-700 text-sm font-bold mb-2">
                ไฟล์
              </label>
              <input
                type="file"
                id="file"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                onChange={handleFileChange}
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            {uploadSuccess && <p className="text-green-500 text-xs italic mb-4">{uploadSuccess}</p>}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={uploading}
            >
              {uploading ? 'กำลังอัป로드...' : 'อัป로드เอกสาร'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">เอกสารที่คุณอัป로드แล้ว</h2>
          {documents.length > 0 ? (
            <ul className="list-disc pl-5">
              {documents.map((doc) => (
                <li key={doc.id} className="mb-2">
                  <strong>{doc.documentType.replace(/_/g, ' ')}:</strong>{' '}
                  <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {doc.filePath.split('/').pop()}
                  </a>{' '}
                  (อัปโหลดเมื่อ: {new Date(doc.uploadedAt).toLocaleDateString()})
                </li>
              ))}
            </ul>
          ) : (
            <p>ยังไม่มีเอกสารที่อัป로드</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
