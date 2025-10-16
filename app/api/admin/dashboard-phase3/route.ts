import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        status: {
          in: [
            ApplicationStatus.ADMISSION_ANNOUNCED,
            ApplicationStatus.CONFIRMED_ADMISSION,
            ApplicationStatus.REJECTED_ADMISSION,
            ApplicationStatus.WAITING_FOR_CALL,
            ApplicationStatus.ADMISSION_COMPLETED,
          ],
        },
      },
      include: {
        admissionResult: true,
      },
    });

    const totalApplicants = applications.length;
    const confirmedCount = applications.filter(app => app.status === ApplicationStatus.CONFIRMED_ADMISSION || app.status === ApplicationStatus.ADMISSION_COMPLETED).length;
    const rejectedCount = applications.filter(app => app.status === ApplicationStatus.REJECTED_ADMISSION).length;
    const waitingForCallCount = applications.filter(app => app.status === ApplicationStatus.WAITING_FOR_CALL).length;
    const notProcessedCount = applications.filter(app => app.status === ApplicationStatus.ADMISSION_ANNOUNCED && app.admissionResult?.isConfirmed === null).length;

    const admittedCount = applications.filter(app => app.admissionResult?.isAdmitted === true).length;
    const waitlistedCount = applications.filter(app => app.admissionResult?.isAdmitted === false).length;

    return NextResponse.json({
      totalApplicants,
      confirmedCount,
      rejectedCount,
      notProcessedCount,
      waitingForCallCount,
      admittedCount,
      waitlistedCount,
    });
  } catch (error) {
    console.error('Failed to fetch phase 3 dashboard data:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลระยะที่ 3' }, { status: 500 });
  }
}