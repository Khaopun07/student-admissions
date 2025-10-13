'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus, DocumentType } from '@prisma/client';

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
}

interface ExamDetails {
  id: string;
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
}

interface AdmissionResult {
  id: string;
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
  confirmationDate: string | null;
}

interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  examDetails: ExamDetails | null;
  admissionResult: AdmissionResult | null;
  documents: Document[];
}

export default function StudentStatusTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/status-tracking');
          const data = await response.json();
          if (response.ok) {
            setApplication(data);
          } else {
            setError(data.message || 'Failed to fetch application status');
          }
        } catch (err) {
          console.error('Failed to fetch application status:', err);
          setError('An unexpected error occurred while fetching application status.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchApplicationStatus();
  }, [session]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Application Status Tracking</h1>

        {application ? (
          <div>
            <p className="mb-2">
              <strong>Current Status:</strong>{' '}
              <span className="font-semibold">{application.status.replace(/_/g, ' ')}</span>
            </p>
            <p className="mb-2">
              <strong>Application Date:</strong> {new Date(application.createdAt).toLocaleDateString()}
            </p>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">Exam Details</h2>
              {application.examDetails ? (
                <div>
                  <p>
                    <strong>Eligible for Exam:</strong>{' '}
                    <span className={application.examDetails.examEligible ? 'text-green-600' : 'text-red-600'}>
                      {application.examDetails.examEligible ? 'Yes' : 'No'}
                    </span>
                  </p>
                  {application.examDetails.examEligible && (
                    <>
                      <p><strong>Room Number:</strong> {application.examDetails.roomNumber || 'N/A'}</p>
                      <p><strong>Seat Number:</strong> {application.examDetails.seatNumber || 'N/A'}</p>
                    </>
                  )}
                </div>
              ) : (
                <p>No exam details available yet.</p>
              )}
            </div>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">Admission Result</h2>
              {application.admissionResult ? (
                <div>
                  <p>
                    <strong>Result:</strong>{' '}
                    {application.admissionResult.isAdmitted === true ? (
                      <span className="text-green-600">Admitted (ตัวจริง)</span>
                    ) : application.admissionResult.isAdmitted === false ? (
                      <span className="text-yellow-600">Reserve (สำรอง)</span>
                    ) : (
                      <span className="text-gray-600">Not yet announced</span>
                    )}
                  </p>
                  <p>
                    <strong>Confirmation:</strong>{' '}
                    {application.admissionResult.isConfirmed === true ? (
                      <span className="text-green-600">Confirmed</span>
                    ) : application.admissionResult.isConfirmed === false ? (
                      <span className="text-red-600">Rejected</span>
                    ) : (
                      <span className="text-gray-600">Pending Decision</span>
                    )}
                  </p>
                  {application.admissionResult.confirmationDate && (
                    <p>
                      <strong>Decision Date:</strong> {new Date(application.admissionResult.confirmationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p>Admission results are not yet available.</p>
              )}
            </div>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">Uploaded Documents</h2>
              {application.documents.length > 0 ? (
                <ul className="list-disc pl-5">
                  {application.documents.map((doc) => (
                    <li key={doc.id} className="mb-2">
                      <strong>{doc.documentType.replace(/_/g, ' ')}:</strong>{' '}
                      <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {doc.filePath.split('/').pop()}
                      </a>{' '}
                      (Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents uploaded yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p>No application data available yet.</p>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
