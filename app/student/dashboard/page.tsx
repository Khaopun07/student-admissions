'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentProfileWithUser } from '@/types/prisma';

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileWithUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard'); // Redirect non-students
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchProfile = async () => {
          try {
            setLoadingProfile(true);
            const response = await fetch('/api/student/profile');
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
              throw new Error(errorData.message);
            }
            const data = await response.json();
            setProfile(data);
          } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while fetching profile.');
          } finally {
            setLoadingProfile(false);
          }
      };
      fetchProfile();
    }
  }, [session, status]);

  if (status === 'loading' || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Student Dashboard</h1>
        <p className="text-lg mb-4">Welcome, {session?.user?.email}!</p>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
          {profile ? (
            <div>
              <p><strong>National ID:</strong> {profile.user.nationalId}</p>
              <p><strong>Email:</strong> {profile.user.email}</p>
              <p><strong>First Name:</strong> {profile.firstName || 'N/A'}</p>
              <p><strong>Last Name:</strong> {profile.lastName || 'N/A'}</p>
              <p><strong>Math Score:</strong> {profile.mathScore || 'N/A'}</p>
              <p><strong>PDPA Accepted:</strong> {profile.pdpaAccepted ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p>No profile data available. Please update your profile.</p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => router.push('/student/documents')}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Documents
          </button>
          <button
            onClick={() => router.push('/student/exam')}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            View Exam Details
          </button>
          <button
            onClick={() => router.push('/student/admission')}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Admission Status
          </button>
          <button
            onClick={() => router.push('/student/status')}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Track Application Status
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
