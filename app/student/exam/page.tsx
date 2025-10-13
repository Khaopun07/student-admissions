'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ExamDetails {
  id: string;
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StudentExamDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
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
    const fetchExamDetails = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/exam-details');
          const data = await response.json();
          if (response.ok) {
            setExamDetails(data);
          } else {
            setError(data.message || 'Failed to fetch exam details');
          }
        } catch (err) {
          console.error('Failed to fetch exam details:', err);
          setError('An unexpected error occurred while fetching exam details.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchExamDetails();
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
        <h1 className="text-3xl font-bold mb-6 text-center">Your Exam Details</h1>

        {examDetails ? (
          <div>
            <p className="mb-2">
              <strong>Exam Eligibility:</strong>{' '}
              <span className={examDetails.examEligible ? 'text-green-600' : 'text-red-600'}>
                {examDetails.examEligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </p>
            {examDetails.examEligible && (
              <>
                <p className="mb-2"><strong>Room Number:</strong> {examDetails.roomNumber || 'N/A'}</p>
                <p className="mb-2"><strong>Seat Number:</strong> {examDetails.seatNumber || 'N/A'}</p>
              </>
            )}
            {!examDetails.examEligible && (
              <p className="text-red-500 mt-4">You are currently not eligible for the exam. Please contact administration for more details.</p>
            )}
          </div>
        ) : (
          <p>No exam details available yet.</p>
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
