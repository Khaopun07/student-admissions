import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            nationalId: true,
            email: true,
            studentProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        examDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications, { status: 200 });

  } catch (error) {
    console.error('Get exam management data error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, examEligible, roomNumber, seatNumber } = await request.json();

    if (!applicationId || typeof examEligible !== 'boolean') {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const updatedExamDetails = await prisma.examDetails.upsert({
      where: { applicationId },
      update: {
        examEligible,
        roomNumber,
        seatNumber,
      },
      create: {
        applicationId,
        examEligible,
        roomNumber,
        seatNumber,
      },
    });

    // Update application status if examEligible is true
    if (examEligible) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.ELIGIBLE_FOR_EXAM },
      });
    }

    return NextResponse.json({ message: 'Exam details updated successfully', examDetails: updatedExamDetails }, { status: 200 });

  } catch (error) {
    console.error('Update exam details error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
