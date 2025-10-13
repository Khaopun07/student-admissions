'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent } from 'react';
import { ApplicationStatus } from '@prisma/client';

interface AdmissionResult {
  id: string;
  applicationId: string;
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
  confirmationDate: string | null;
  application: {
    status: ApplicationStatus;
  };
}

export default function StudentAdmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admissionResult, setAdmissionResult] = useState<AdmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchAdmissionResult = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/admission-status');
          const data = await response.json();
          if (response.ok) {
            setAdmissionResult(data);
          } else {
            setError(data.message || 'Failed to fetch admission status');
          }
        } catch (err) {
          console.error('Failed to fetch admission status:', err);
          setError('An unexpected error occurred while fetching admission status.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAdmissionResult();
  }, [session, confirmationSuccess]);

  const handleDocumentChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedDocuments(Array.from(e.target.files));
    }
  };

  const handleConfirmAdmission = async (confirm: boolean) => {
    setError('');
    setConfirmationSuccess('');

    if (!admissionResult?.applicationId) {
      setError('No application found to confirm/reject.');
      return;
    }

    if (selectedDocuments.length === 0 && confirm) {
      setError('Please upload all required documents to confirm admission.');
      return;
    }

    setConfirming(true);
    try {
      // In a real app, you'd upload files first and get their paths
      // For now, we'll simulate paths
      const documentPaths = selectedDocuments.map(file => `/uploads/${session?.user?.id}/admission/${file.name}`);

      const response = await fetch('/api/student/admission-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: admissionResult.applicationId,
          confirmAdmission: confirm,
          documentPaths: documentPaths, // Pass simulated paths
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmationSuccess(data.message);
        setSelectedDocuments([]);
      } else {
        setError(data.message || 'Failed to update admission status');
      }
    } catch (err) {
      console.error('Admission confirmation error:', err);
      setError('An unexpected error occurred during admission confirmation.');
    } finally {
      setConfirming(false);
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
        <h1 className="text-3xl font-bold mb-6 text-center">สถานะการรับเข้าศึกษา</h1>

        {admissionResult ? (
          <div>
            <p className="mb-2">
              <strong>ผลการรับเข้าศึกษา:</strong>{' '}
              {admissionResult.isAdmitted === true ? (
                <span className="text-green-600">Admitted (ตัวจริง)</span>
              ) : admissionResult.isAdmitted === false ? (
                <span className="text-yellow-600">Reserve (สำรอง)</span>
              ) : (
                <span className="text-gray-600">Not yet announced</span>
              )}
            </p>
            <p className="mb-2">
              <strong>สถานะของคุณ:</strong>{' '}
              <span className="font-semibold">{admissionResult.application.status.replace(/_/g, ' ')}</span>
            </p>

            {admissionResult.isAdmitted !== null && admissionResult.isConfirmed === null && (
              <div className="mt-6 p-4 border rounded-md bg-blue-50">
                <h2 className="text-xl font-semibold mb-3">ยืนยัน หรือ สละสิทธิ์การเข้าศึกษา</h2>
                <p className="mb-4">กรุณาตัดสินใจและอัปโหลดเอกสารที่จำเป็น</p>

                <div className="mb-4">
                  <label htmlFor="admissionDocuments" className="block text-gray-700 text-sm font-bold mb-2">
                    อัป로드เอกสารที่จำเป็น (4 ไฟล์)
                  </label>
                  <input
                    type="file"
                    id="admissionDocuments"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    onChange={handleDocumentChange}
                    multiple
                    accept=".pdf,.doc,.docx"
                  />
                  {selectedDocuments.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">ไฟล์ที่เลือก: {selectedDocuments.map(f => f.name).join(', ')}</p>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                {confirmationSuccess && <p className="text-green-500 text-xs italic mb-4">{confirmationSuccess}</p>}

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleConfirmAdmission(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={confirming}
                  >
                    {confirming ? 'กำลังยืนยัน...' : 'ยืนยันสิทธิ์'}
                  </button>
                  <button
                    onClick={() => handleConfirmAdmission(false)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={confirming}
                  >
                    {confirming ? 'กำลังสละสิทธิ์...' : 'สละสิทธิ์'}
                  </button>
                </div>
              </div>
            )}

            {admissionResult.isConfirmed !== null && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <h2 className="text-xl font-semibold mb-3">การตัดสินใจของคุณ</h2>
                <p>
                  คุณได้{' '}
                  <span className={admissionResult.isConfirmed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {admissionResult.isConfirmed ? 'Confirmed' : 'Rejected'}
                  </span>{' '}
                  your admission on {new Date(admissionResult.confirmationDate!).toLocaleDateString()}.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p>ยังไม่มีผลการรับเข้าศึกษา</p>
        )}

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
