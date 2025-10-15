'use client';

import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Award, Zap, FileText } from 'lucide-react';

interface Step {
  title: string;
  status: ApplicationStatusKey;
  icon: any; // You might want to refine this type if you have a specific icon type
  content: React.JSX.Element;
}

const ApplicationStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  DOCUMENTS_SUBMITTED: 'DOCUMENTS_SUBMITTED',
  ELIGIBLE_FOR_EXAM: 'ELIGIBLE_FOR_EXAM',
  ADMISSION_ANNOUNCED: 'ADMISSION_ANNOUNCED',
  CONFIRMED_ADMISSION: 'CONFIRMED_ADMISSION',
  REJECTED_ADMISSION: 'REJECTED_ADMISSION',
  WAITING_FOR_CALL: 'WAITING_FOR_CALL',
  ADMISSION_COMPLETED: 'ADMISSION_COMPLETED',
} as const;

const statusTranslations = {
  PENDING_REVIEW: 'รอตรวจสอบ',
  DOCUMENTS_SUBMITTED: 'ยื่นเอกสารแล้ว',
  ELIGIBLE_FOR_EXAM: 'มีสิทธิ์สอบ',
  ADMISSION_ANNOUNCED: 'ประกาศผลแล้ว',
  CONFIRMED_ADMISSION: 'ยืนยันสิทธิ์แล้ว',
  REJECTED_ADMISSION: 'สละสิทธิ์',
  WAITING_FOR_CALL: 'รอการติดต่อกลับ',
  ADMISSION_COMPLETED: 'การสมัครเสร็จสมบูรณ์',
};

const statusOrder: ApplicationStatusKey[] = [
  'PENDING_REVIEW',
  'DOCUMENTS_SUBMITTED',
  'ELIGIBLE_FOR_EXAM',
  'ADMISSION_ANNOUNCED',
  'CONFIRMED_ADMISSION',
  'ADMISSION_COMPLETED',
  'REJECTED_ADMISSION',
];

type ApplicationStatusKey = keyof typeof ApplicationStatus;

const getStatusIndex = (status: ApplicationStatusKey) => {
  return statusOrder.findIndex(s => s === status);
};

interface Application {
  id: string;
  createdAt: string;
  status: ApplicationStatusKey;
  examDetails: {
    examEligible: boolean;
    roomNumber: string;
    seatNumber: string;
  } | null;
  admissionResult: {
    isAdmitted: boolean | null;
    isConfirmed: boolean | null;
    confirmationDate: string | null;
  } | null;
}

export default function StudentStatusTrackingPage() {
  const [application] = useState<Application>({
    id: 'APP-001',
    createdAt: '2024-10-01T00:00:00Z',
    status: ApplicationStatus.ADMISSION_COMPLETED,
    examDetails: {
      examEligible: true,
      roomNumber: '101',
      seatNumber: '25',
    },
    admissionResult: {
      isAdmitted: true,
      isConfirmed: true,
      confirmationDate: '2024-10-15T00:00:00Z',
    },
  });

  const [loading] = useState(false);
  const [error] = useState('');

  const steps: Step[] = [
    {
      title: 'ยื่นเอกสารสมัคร',
      status: ApplicationStatus.DOCUMENTS_SUBMITTED,
      icon: FileText,
      content: (
        <>
          <p className="mb-3 text-gray-700">
            คุณได้ยื่นเอกสารสำหรับการสมัครเรียบร้อยแล้วเมื่อวันที่{' '}
            <span className="font-semibold">{new Date(application.createdAt).toLocaleDateString('th-TH')}</span>
          </p>
          <p className="text-gray-600">เจ้าหน้าที่กำลังตรวจสอบเอกสารของคุณ</p>
        </>
      ),
    },
    {
      title: 'ประกาศสิทธิ์สอบ',
      status: ApplicationStatus.ELIGIBLE_FOR_EXAM,
      icon: Zap,
      content: application?.examDetails ? (
        application.examDetails.examEligible ? (
          <>
            <p className="mb-3 text-green-700 font-semibold text-lg">✓ คุณมีสิทธิ์เข้าสอบ</p>
            <div className="space-y-2 bg-green-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <span className="font-semibold text-gray-800">ห้องสอบ:</span>{' '}
                <span className="font-mono bg-green-100 px-3 py-1 rounded text-green-900">
                  {application.examDetails.roomNumber || '-'}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-800">เลขที่นั่ง:</span>{' '}
                <span className="font-mono bg-green-100 px-3 py-1 rounded text-green-900">
                  {application.examDetails.seatNumber || '-'}
                </span>
              </p>
            </div>
          </>
        ) : (
          <p className="text-red-700 font-semibold text-lg">✗ คุณไม่มีสิทธิ์เข้าสอบ กรุณาติดต่อเจ้าหน้าที่</p>
        )
      ) : (
        <p className="text-gray-500 italic">รอดำเนินการประกาศสิทธิ์สอบ</p>
      ),
    },
    {
      title: 'ประกาศผลการคัดเลือก',
      status: ApplicationStatus.ADMISSION_ANNOUNCED,
      icon: Award,
      content: application?.admissionResult ? (
        <>
          <p className="mb-3 text-gray-700">
            ผลการคัดเลือก:{' '}
            {application.admissionResult.isAdmitted === true ? (
              <span className="font-bold text-green-600 text-lg">✓ ผ่านการคัดเลือก (ตัวจริง)</span>
            ) : application.admissionResult.isAdmitted === false ? (
              <span className="font-bold text-orange-600 text-lg">→ ผ่านการคัดเลือก (ตัวสำรอง)</span>
            ) : (
              <span className="text-gray-600">ยังไม่ประกาศผล</span>
            )}
          </p>
          <p className="text-gray-600 italic">กรุณาดำเนินการยืนยันสิทธิ์ในขั้นตอนถัดไป</p>
        </>
      ) : (
        <p className="text-gray-500 italic">รอดำเนินการประกาศผล</p>
      ),
    },
    {
      title: 'ยืนยันสิทธิ์เข้าศึกษา',
      status: ApplicationStatus.CONFIRMED_ADMISSION,
      icon: CheckCircle,
      content:
        application?.admissionResult && application.admissionResult.isConfirmed !== null ? (
          <p className="text-gray-700">
            คุณได้ทำการ{' '}
            <span
              className={
                application.admissionResult.isConfirmed
                  ? 'font-bold text-green-700 text-lg'
                  : 'font-bold text-red-700 text-lg'
              }
            >
              {application.admissionResult.isConfirmed ? '✓ ยืนยันสิทธิ์' : '✗ สละสิทธิ์'}
            </span>
            {application.admissionResult.confirmationDate && (
              <>
                {' '}เมื่อวันที่{' '}
                <span className="font-semibold">
                  {new Date(application.admissionResult.confirmationDate).toLocaleDateString('th-TH')}
                </span>
              </>
            )}
          </p>
        ) : (
          <p className="text-gray-500 italic">รอดำเนินการยืนยันสิทธิ์</p>
        ),
    },
    {
      title: 'การสมัครเสร็จสมบูรณ์',
      status: ApplicationStatus.ADMISSION_COMPLETED,
      icon: Award,
      content: (
        <p className="text-gray-700">
          <span className="font-bold text-green-700 text-lg">ขอแสดงความยินดี!</span> การสมัครของคุณเสร็จสมบูรณ์แล้ว และคุณได้เป็นนักเรียนของเราอย่างเป็นทางการ
        </p>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-700">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">
            ติดตามสถานะการสมัคร
          </h1>
          <p className="text-gray-600">ตรวจสอบความคืบหน้าการสมัครของคุณ</p>
        </div>

        {application ? (
          <div className="relative">
            {/* Timeline */}
            <div className="space-y-8">
              {steps.map((step, index) => {
                const currentStatusIndex = getStatusIndex(application.status);
                const stepStatusIndex = getStatusIndex(step.status);
                const isRejected = application.status === ApplicationStatus.REJECTED_ADMISSION;

                let statusType: keyof typeof colors = 'upcoming';
                if (currentStatusIndex > stepStatusIndex) {
                  statusType = 'completed';
                } else if (
                  currentStatusIndex === stepStatusIndex ||
                  (isRejected && step.status === ApplicationStatus.CONFIRMED_ADMISSION) ||
                  (application.status === ApplicationStatus.WAITING_FOR_CALL && step.status === ApplicationStatus.ADMISSION_ANNOUNCED) ||
                  (application.status === ApplicationStatus.PENDING_REVIEW && step.status === ApplicationStatus.DOCUMENTS_SUBMITTED)
                ) {
                  statusType = 'current';
                }

                // Special case for the final completed step
                if (step.status === ApplicationStatus.ADMISSION_COMPLETED && statusType === 'current') {
                  statusType = 'completed';
                }

                const StepIcon = step.icon;

                const colors = {
                  completed: {
                    circle: 'bg-gradient-to-r from-blue-500 to-blue-600 ring-blue-200',
                    line: 'from-blue-500 to-blue-600',
                    card: 'border-l-4 border-blue-500 bg-blue-50',
                    title: 'text-blue-800',
                    badge: 'bg-blue-100 text-blue-700',
                  },
                  current: {
                    circle: 'bg-gradient-to-r from-orange-500 to-orange-600 ring-orange-200 animate-pulse',
                    line: 'from-orange-500 to-orange-600',
                    card: 'border-l-4 border-orange-500 bg-orange-50',
                    title: 'text-orange-800',
                    badge: 'bg-orange-100 text-orange-700',
                  },
                  upcoming: {
                    circle: 'bg-gray-300 ring-gray-200',
                    line: 'from-gray-300 to-gray-200',
                    card: 'border-l-4 border-gray-300 bg-gray-50',
                    title: 'text-gray-600',
                    badge: 'bg-gray-100 text-gray-600',
                  },
                };

                type StatusType = keyof typeof colors;
                const color = colors[statusType as StatusType];

                return (
                  <div key={index} className="relative">
                    {/* Vertical Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-6 top-16 w-1 h-20 bg-gradient-to-b ${color.line} opacity-30`}
                      />
                    )}

                    {/* Timeline Item */}
                    <div className="flex gap-6">
                      {/* Circle */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full ${color.circle} ring-8 ring-white flex items-center justify-center shadow-lg transition-all duration-300`}
                        >
                          <StepIcon className="w-6 h-6 text-white" />
                        </div>

                        {/* Status Indicator */}
                        {statusType === 'current' && (
                          <div className="absolute -top-2 -right-2 animate-bounce">
                            <div className="w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
                          </div>
                        )}
                      </div>

                      {/* Card */}
                      <div className="flex-1 pt-1">
                        <div className={`rounded-xl shadow-md p-6 ${color.card} transition-all hover:shadow-lg`}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-xl font-bold ${color.title}`}>{step.title}</h3>
                            {(statusType === 'completed' ||
                              (statusType === 'current' && step.status === ApplicationStatus.ADMISSION_COMPLETED)) && (
                              <span className="inline-block">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </span>
                            )}
                            {statusType === 'current' && step.status !== ApplicationStatus.ADMISSION_COMPLETED && (
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${color.badge}`}>
                                กำลังดำเนินการ
                              </span>
                            )}
                          </div>

                          <div className="text-gray-700">
                            {step.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100">
              <p className="text-sm font-semibold text-gray-600 mb-3">ความคืบหน้าโดยรวม</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((getStatusIndex(application.status) + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                ขั้นตอนที่ {getStatusIndex(application.status) + 1} จาก {steps.length}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">ยังไม่มีข้อมูลการสมัคร</p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-lg shadow-md border border-gray-200 transition-all transform hover:scale-105 flex items-center gap-2"
          >
            ← กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
