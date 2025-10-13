'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';

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

interface ExamDetails {
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
}

interface AdmissionResult {
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
}

interface Application {
  id: string;
  user: UserProfile;
  status: ApplicationStatus;
  examDetails: ExamDetails | null;
  admissionResult: AdmissionResult | null;
}

export default function AdminAdmissionManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchApplications = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/admin/admission-management');
          if (!response.ok) throw new Error('Failed to fetch applications');
          const data = await response.json();
          setApplications(data);
        } catch (err) {
          console.error('Failed to fetch applications:', err);
          setError('An unexpected error occurred while fetching applications.');
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    }
  }, [session, submitSuccess, status]);

  const handleAnnounceResult = async (applicationId: string, isAdmitted: boolean) => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/admission-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'announce',
          isAdmitted,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
      } else {
        setError(data.message || 'Failed to announce admission result');
      }
    } catch (err) {
      console.error('Announce result error:', err);
      setError('An unexpected error occurred while announcing result.');
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin: Admission Management</h1>

        {submitSuccess && <p className="text-green-500 text-xs italic mb-4">{submitSuccess}</p>}
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">National ID</th>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Current Status</th>
                <th className="py-2 px-4 border-b">Admission Result</th>
                <th className="py-2 px-4 border-b">Student Confirmed?</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{app.user.nationalId}</td>
                    <td className="py-2 px-4 border-b">
                      {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                    </td>
                    <td className="py-2 px-4 border-b">{app.user.email}</td>
                    <td className="py-2 px-4 border-b">{app.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 border-b">
                      {app.admissionResult?.isAdmitted === true ? 'Admitted' :
                       app.admissionResult?.isAdmitted === false ? 'Reserve' : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {app.admissionResult?.isConfirmed === true ? 'Yes' :
                       app.admissionResult?.isConfirmed === false ? 'No' : 'Pending'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {app.status === ApplicationStatus.ADMISSION_ANNOUNCED || app.status === ApplicationStatus.CONFIRMED_ADMISSION || app.status === ApplicationStatus.REJECTED_ADMISSION ? (
                        <span className="text-gray-500">Result Announced</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAnnounceResult(app.id, true)}
                            className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded mr-2"
                            disabled={submitting}
                          >
                            Announce Admitted
                          </button>
                          <button
                            onClick={() => handleAnnounceResult(app.id, false)}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded"
                            disabled={submitting}
                          >
                            Announce Reserve
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center">No applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
