'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ApplicationStatus, DocumentType } from '@prisma/client';

interface UserProfile {
  firstName: ReactNode;
  lastName: ReactNode;
  nationalId: string;
  email: string;
  studentProfile: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface ApplicationDetails {
  id: string;
  status: ApplicationStatus;
  user: UserProfile;
}

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
  application: ApplicationDetails;
}

const statusTranslations: Record<ApplicationStatus, string> = {
  PENDING_REVIEW: 'รอตรวจสอบ',
  DOCUMENTS_SUBMITTED: 'ยื่นเอกสารแล้ว',
  ELIGIBLE_FOR_EXAM: 'มีสิทธิ์สอบ',
  ADMISSION_ANNOUNCED: 'ประกาศผลแล้ว',
  CONFIRMED_ADMISSION: 'ยืนยันสิทธิ์แล้ว',
  REJECTED_ADMISSION: 'สละสิทธิ์',
  NOT_PROCESSED: 'ไม่ดำเนินการ',
  WAITING_FOR_CALL: 'รอเรียก (ตัวสำรอง)',
  ADMISSION_COMPLETED: 'การสมัครเสร็จสมบูรณ์',
}

export default function AdminDocumentReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');  
  const [missingDocsNotification, setMissingDocsNotification] = useState({
    show: false,
    applicationId: '',
    missingTypes: [] as DocumentType[],
    message: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDocuments = async () => {
        try {
          setLoading(true);
          const query = filterStatus ? `?status=${filterStatus}` : '';
          const response = await fetch(`/api/admin/document-review${query}`);
          if (!response.ok) throw new Error('Failed to fetch documents for review');
          const data = await response.json();
          setDocuments(data);
        } catch (err) {
          console.error('Failed to fetch documents for review:', err);
          setError('An unexpected error occurred while fetching documents.');
        } finally {
          setLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [session, filterStatus, submitSuccess, status]);

  const handleConfirmDocuments = async (applicationId: string) => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'confirm_documents',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
      } else {
        setError(data.message || 'Failed to confirm documents');
      }
    } catch (err) {
      console.error('Confirm documents error:', err);
      setError('An unexpected error occurred while confirming documents.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyMissingDocuments = (applicationId: string) => {
    setMissingDocsNotification({
      show: true,
      applicationId,
      missingTypes: [],
      message: '',
    });
  };

  const handleSendNotification = async () => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    if (!missingDocsNotification.applicationId || missingDocsNotification.missingTypes.length === 0) {
      setError('Please select missing document types.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: missingDocsNotification.applicationId,
          action: 'notify_missing_documents',
          missingDocumentTypes: missingDocsNotification.missingTypes,
          message: missingDocsNotification.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
        setMissingDocsNotification({ show: false, applicationId: '', missingTypes: [], message: '' });
      } else {
        setError(data.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Send notification error:', err);
      setError('An unexpected error occurred while sending notification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  const uniqueApplications = Array.from(new Map(documents.map(doc => [doc.application.id, doc.application])).values());

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">ผู้ดูแลระบบ: ตรวจสอบเอกสาร</h1>

        {submitSuccess && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert"><p>{submitSuccess}</p></div>}
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}

        <div className="mb-6">
          <label htmlFor="statusFilter" className="block text-gray-700 text-sm font-bold mb-2">
            กรองตามสถานะใบสมัคร:
          </label>
          <select
            id="statusFilter"
            className="block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | '')}
          >
            <option value="">ทุกสถานะ</option>
            {Object.values(ApplicationStatus).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusTranslations[statusOption] || statusOption}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm text-left text-gray-500">
            <thead className="text-xs text-blue-800 uppercase bg-blue-50">
              <tr>
                <th scope="col" className="py-3 px-6">เลขประจำตัวประชาชน</th>
                <th scope="col" className="py-3 px-6">ชื่อ-สกุล</th>
                <th scope="col" className="py-3 px-6">อีเมล</th>
                <th scope="col" className="py-3 px-6">สถานะใบสมัคร</th>
                <th scope="col" className="py-3 px-6">เอกสาร</th>
                <th scope="col" className="py-3 px-6 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {uniqueApplications.length > 0 ? (
                uniqueApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{app.user.nationalId}</td>
                    <td className="py-2 px-4 border-b font-medium text-gray-900">
                      {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                    </td>
                    <td className="py-2 px-4 border-b">{app.user.email}</td>
                    <td className="py-2 px-4 border-b">{statusTranslations[app.status] || app.status}</td>
                    <td className="py-2 px-4 border-b">
                      <ul className="space-y-1">
                        {documents.filter(doc => doc.application.id === app.id).map(doc => (
                          <li key={doc.id}>
                            <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              ดู
                            </a>
                            <span className="text-gray-600 ml-2">({doc.documentType.replace(/_/g, ' ')})</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-2 px-4 border-b text-center space-x-2">
                      <button
                        onClick={() => handleConfirmDocuments(app.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                        disabled={submitting}
                      >
                        ยืนยันเอกสาร
                      </button>
                      <button
                        onClick={() => handleNotifyMissingDocuments(app.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                        disabled={submitting}
                      >
                        แจ้งเอกสารขาด
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center">ไม่พบเอกสารที่ต้องตรวจสอบ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {missingDocsNotification.show && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-blue-900">แจ้งนักเรียนเกี่ยวกับเอกสารที่ขาด</h2>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  เลือกประเภทเอกสารที่ขาด:
                </label>
                {Object.values(DocumentType).map((type) => (
                  <div key={type} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`missing-${type}`}
                      checked={missingDocsNotification.missingTypes.includes(type)}
                      onChange={(e) => {
                        const newMissingTypes = e.target.checked
                          ? [...missingDocsNotification.missingTypes, type]
                          : missingDocsNotification.missingTypes.filter((t) => t !== type);
                        setMissingDocsNotification((prev) => ({ ...prev, missingTypes: newMissingTypes }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor={`missing-${type}`}>{type.replace(/_/g, ' ')}</label>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label htmlFor="notificationMessage" className="block text-gray-700 text-sm font-bold mb-2">
                  ข้อความเพิ่มเติม (ถ้ามี):
                </label>
                <textarea
                  id="notificationMessage"
                  rows={4}
                  className="block w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                  value={missingDocsNotification.message}
                  onChange={(e) => setMissingDocsNotification((prev) => ({ ...prev, message: e.target.value }))}
                ></textarea>
              </div>
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><p>{error}</p></div>}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setMissingDocsNotification({ show: false, applicationId: '', missingTypes: [], message: '' })}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSendNotification}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                  disabled={submitting}
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
