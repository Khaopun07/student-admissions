'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent } from 'react';
import { DocumentType } from '@prisma/client';

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
}

interface DocumentUploadState {
  [key: string]: File | null;
}

const documentTypeTranslations: Record<DocumentType, string> = {
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชําระเงินค่าธรรมเนียม',
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
  ADMISSION_CONFIRMATION_4: 'ไฟล์ที่ 4 (สำหรับเข้าศึกษา)',
};

const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.EXAM_CONFIRMATION_1,
  DocumentType.PAYMENT_SLIP,
];

export default function StudentDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [documentUploads, setDocumentUploads] = useState<DocumentUploadState>({
    [DocumentType.EXAM_CONFIRMATION_1]: null,
    [DocumentType.PAYMENT_SLIP]: null,
  });

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentUploads(prev => ({ ...prev, [docType]: e.target.files![0] }));
    } else {
      setDocumentUploads(prev => ({ ...prev, [docType]: null }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadSuccess('');

    const allDocsUploaded = REQUIRED_DOCUMENTS.every(docType => documentUploads[docType]);
    if (!allDocsUploaded) {
      setError('กรุณาอัปโหลดเอกสารให้ครบทั้ง 2 ไฟล์');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    REQUIRED_DOCUMENTS.forEach(docType => {
      if (documentUploads[docType]) {
        formData.append(docType, documentUploads[docType]!);
      }
    });

    try {
      const response = await fetch('/api/student/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(data.message);
        setDocumentUploads({
          [DocumentType.EXAM_CONFIRMATION_1]: null,
          [DocumentType.PAYMENT_SLIP]: null,
        });
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
            {REQUIRED_DOCUMENTS.map(docType => (
              <div key={docType}>
                <label htmlFor={docType} className="block text-gray-700 text-sm font-bold mb-2">
                  {documentTypeTranslations[docType]}
                </label>
                <input
                  type="file"
                  id={docType}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  onChange={(e) => handleFileChange(e, docType)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {documentUploads[docType] && <p className="text-sm text-gray-500 mt-1">ไฟล์ที่เลือก: {documentUploads[docType]?.name}</p>}
              </div>
            ))}
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
                  <strong>{documentTypeTranslations[doc.documentType]}:</strong>{' '}
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
