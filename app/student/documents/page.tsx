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
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">จัดการเอกสารของคุณ</h1>

        {/* Upload Form Section */}
        <div className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">อัปโหลดเอกสารสำหรับยืนยันสิทธิ์สอบ</h2>
          <p className="text-gray-600 mb-6">กรุณาอัปโหลดเอกสารยืนยันสิทธิ์การเข้าสอบและแบบยืนยันการชำระเงิน</p>
          <form onSubmit={handleUpload} className="space-y-6">
            {REQUIRED_DOCUMENTS.map(docType => (
              <div key={docType}>
                <label htmlFor={docType} className="block text-gray-700 text-sm font-bold mb-2">
                  {documentTypeTranslations[docType]}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor={docType} className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
                        <span>อัปโหลดไฟล์</span>
                        <input id={docType} name={docType} type="file" className="sr-only" onChange={(e) => handleFileChange(e, docType)} accept=".pdf,.jpg,.jpeg,.png" />
                      </label>
                      <p className="pl-1">หรือลากและวาง</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF ขนาดไม่เกิน 5MB</p>
                  </div>
                </div>
                {documentUploads[docType] && <p className="text-sm text-gray-500 mt-1">ไฟล์ที่เลือก: {documentUploads[docType]?.name}</p>}
              </div>
            ))}
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            {uploadSuccess && <p className="text-green-500 text-xs italic mb-4">{uploadSuccess}</p>}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105"
              disabled={uploading}
            >
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
            </button>
          </form>
        </div>
        
        {/* Uploaded Documents Section */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">เอกสารที่คุณอัปโหลดแล้ว</h2>
          {documents.length > 0 ? (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                  <div>
                    <strong className="text-blue-800">{documentTypeTranslations[doc.documentType]}:</strong>{' '}
                    <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{doc.filePath.split('/').pop()}</a>
                  </div>
                  <span className="text-sm text-gray-500">อัปโหลดเมื่อ: {new Date(doc.uploadedAt).toLocaleDateString('th-TH')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">ยังไม่มีเอกสารที่อัปโหลด</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
