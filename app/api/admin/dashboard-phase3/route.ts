import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const totalApplicants = 80; // As per requirements

    const confirmedCount = await prisma.application.count({
      where: { status: ApplicationStatus.CONFIRMED_ADMISSION },
    });

    const rejectedCount = await prisma.application.count({
      where: { status: ApplicationStatus.REJECTED_ADMISSION },
    });

    const notProcessedCount = await prisma.application.count({
      where: { status: ApplicationStatus.NOT_PROCESSED },
    });

    const waitingForCallCount = await prisma.application.count({
      where: { status: ApplicationStatus.WAITING_FOR_CALL },
    });

    // Placeholder for counts by school and province (requires schema update)
    const countBySchool = await prisma.application.groupBy({
      by: ['status'], // Placeholder
      _count: { id: true },
    });

    const countByProvince = await prisma.application.groupBy({
      by: ['status'], // Placeholder
      _count: { id: true },
    });

    return NextResponse.json({
      totalApplicants,
      confirmedCount,
      rejectedCount,
      notProcessedCount,
      waitingForCallCount,
      countBySchool,
      countByProvince,
    }, { status: 200 });

  } catch (error) {
    console.error('Get dashboard phase 3 data error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
