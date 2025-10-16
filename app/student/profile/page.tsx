'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { StudentProfileWithUser } from '@/types/prisma';
import { User, AlertCircle, CheckCircle, Save, X, Edit2, ArrowLeft } from 'lucide-react';

type ProfileFormData = Omit<StudentProfileWithUser, 'user' | 'id' | 'userId'> & {
  email: string;
  nationalId: string;
};

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileWithUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '', lastName: '', dateofbirth: '', lasercode: '',
    province: '', school: '', gpaxScore: 0, mathScore: 0,
    scienceScore: 0, pdpaAccepted: false,
    email: '', nationalId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchProfile = async () => {
        try {
          setLoadingProfile(true);
          const response = await fetch('/api/student/profile');
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'ไม่สามารถดึงข้อมูลส่วนตัวได้' }));
            throw new Error(errorData.message);
          }
          const data = await response.json();
          // Set both profile for viewing and formData for editing
          const initialData = {
            ...data,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            // ensure other fields have default values if they can be null
          };
          setProfile(initialData);
          setFormData(initialData);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิดขณะดึงข้อมูล');
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [session, status]);

  const handleEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        dateofbirth: profile.dateofbirth || '',
        lasercode: profile.lasercode || '',
        province: profile.province || '',
        school: profile.school || '',
        gpaxScore: profile.gpaxScore || 0,
        mathScore: profile.mathScore || 0,
        scienceScore: profile.scienceScore || 0,
        pdpaAccepted: profile.pdpaAccepted,
        email: profile.user.email,
        nationalId: profile.user.nationalId,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handlePdpaChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    // ไม่ต้องทำอะไรถ้าค่าเหมือนเดิม
    if (formData.pdpaAccepted === checked) return;

    // Optimistically update UI
    setFormData(prev => ({ ...prev, pdpaAccepted: checked }));
    if (profile) {
        setProfile(prev => prev ? { ...prev, pdpaAccepted: checked } : null);
    }

    try {
      // Create a new object for the request body to ensure it has the latest `checked` value
      const updatedData = { ...formData, pdpaAccepted: checked };

      const response = await fetch('/api/student/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        setFormData(prev => ({ ...prev, pdpaAccepted: !checked })); // Revert on failure
        throw new Error((await response.json()).message || 'ไม่สามารถอัปเดต PDPA ได้');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดต PDPA');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/student/profile', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData) 
      });
      if (!response.ok) throw new Error((await response.json()).message || 'ไม่สามารถอัปเดตข้อมูลได้');
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setFormData(updatedProfile); // Also update formData to be in sync
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-blue-700 font-semibold">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-red-600">เกิดข้อผิดพลาด</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <User size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">ข้อมูลส่วนตัวของคุณ</h1>
            </div>
            <p className="text-blue-100">จัดการและอัปเดตข้อมูลส่วนตัวของคุณ</p>
          </div>
        </div>

        {/* Error Message */}
        {error && isEditing && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {isEditing ? (
          // Edit Form
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">แก้ไขข้อมูลส่วนตัว</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read-only fields */}
                <div>
                  <label htmlFor="nationalId" className="block text-sm font-semibold text-gray-700 mb-2">
                    เลขประจำตัวประชาชน
                  </label>
                  <input
                    type="text"
                    id="nationalId"
                    value={formData.nationalId}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Editable fields */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="กรอกชื่อ"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="กรอกนามสกุล"
                  />
                </div>

                <div>
                  <label htmlFor="dateofbirth" className="block text-sm font-semibold text-gray-700 mb-2">
                    วัน/เดือน/ปีเกิด
                  </label>
                  <input
                    type="text"
                    id="dateofbirth"
                    name="dateofbirth"
                    value={formData.dateofbirth || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="วว/ดด/ปปปป"
                  />
                </div>

                <div>
                  <label htmlFor="lasercode" className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสหลังบัตรประชาชน
                  </label>
                  <input
                    type="text"
                    id="lasercode"
                    name="lasercode"
                    value={formData.lasercode || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="กรอกรหัสหลังบัตร"
                  />
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">
                    จังหวัด
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    value={formData.province || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="school" className="block text-sm font-semibold text-gray-700 mb-2">
                    โรงเรียน
                  </label>
                  <input
                    type="text"
                    id="school"
                    name="school"
                    value={formData.school || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="กรอกโรงเรียน"
                  />
                </div>

                <div>
                  <label htmlFor="gpaxScore" className="block text-sm font-semibold text-gray-700 mb-2">
                    GPAX
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="gpaxScore"
                    name="gpaxScore"
                    value={formData.gpaxScore || 0}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="mathScore" className="block text-sm font-semibold text-gray-700 mb-2">
                    คะแนนคณิตศาสตร์
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="mathScore"
                    name="mathScore"
                    value={formData.mathScore || 0}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="scienceScore" className="block text-sm font-semibold text-gray-700 mb-2">
                    คะแนนวิทยาศาสตร์
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="scienceScore"
                    name="scienceScore"
                    value={formData.scienceScore || 0}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* PDPA Checkbox */}
              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="pdpaAccepted"
                      name="pdpaAccepted"
                      type="checkbox"
                      checked={formData.pdpaAccepted}
                      onChange={handlePdpaChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="pdpaAccepted" className="font-medium text-gray-700">
                      การยินยอมให้ใช้ข้อมูลส่วนบุคคล (PDPA)
                    </label>
                    <p className="text-gray-500">ข้าพเจ้ายินยอมให้โรงเรียนเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้าเพื่อวัตถุประสงค์ในการรับสมัคร</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <X size={18} />
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <Save size={18} />
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        ) : profile ? (
          // View Profile
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">ข้อมูลส่วนตัว</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">เลขประจำตัวประชาชน</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.user.nationalId}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">อีเมล</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.user.email}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">ชื่อ</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.firstName || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">นามสกุล</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.lastName || 'ไม่มีข้อมูล'}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">วัน/เดือน/ปีเกิด</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.dateofbirth || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">รหัสหลังบัตรประชาชน</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.lasercode || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">จังหวัด</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.province || 'ไม่มีข้อมูล'}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">โรงเรียน</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.school || 'ไม่มีข้อมูล'}</p>
                </div>
              </div>
            </div>

            {/* Academic Scores */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ผลการศึกษา</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">GPAX</p>
                  <p className="text-3xl font-bold text-green-600">{profile.gpaxScore || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">คณิตศาสตร์</p>
                  <p className="text-3xl font-bold text-yellow-600">{profile.mathScore || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">วิทยาศาสตร์</p>
                  <p className="text-3xl font-bold text-orange-600">{profile.scienceScore || 0}</p>
                </div>
              </div>
            </div>

            {/* PDPA Status */}
            <div className="mb-8">
              <div className={`p-4 rounded-lg flex items-center gap-3 ${profile.pdpaAccepted ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-500'}`}>
                {profile.pdpaAccepted ? (
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-gray-800">ยอมรับ PDPA</p>
                  <p className={profile.pdpaAccepted ? 'text-green-700' : 'text-yellow-700'}>
                    {profile.pdpaAccepted ? 'ยอมรับแล้ว' : 'ยังไม่ยอมรับ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-center pt-4 border-t-2 border-gray-200">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Edit2 size={18} />
                แก้ไขข้อมูล
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-4">ไม่มีข้อมูลส่วนตัว</p>
            <p className="text-gray-600 mb-6">กรุณาอัปเดตข้อมูลของคุณเพื่อให้สมบูรณ์</p>
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
              เพิ่มข้อมูล
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}