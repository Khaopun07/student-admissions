import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { type AuthOptions } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get total confirmed applicants
    const totalConfirmed = await prisma.application.count({
      where: {
        status: ApplicationStatus.ELIGIBLE_FOR_EXAM, // Assuming this status means confirmed for Phase 2
      },
    });

    // Get confirmed applicants by province (placeholder for now, as province is not in schema)
    // This would require adding a 'province' field to StudentProfile or User model
    const confirmedByProvince = await prisma.application.groupBy({
      by: ['status'], // Placeholder, needs actual province field
      where: {
        status: ApplicationStatus.ELIGIBLE_FOR_EXAM,
      },
      _count: {
        id: true,
      },
    });

    // Get confirmed applicants by school (placeholder for now, as school is not in schema)
    // This would require adding a 'school' field to StudentProfile or User model
    const confirmedBySchool = await prisma.application.groupBy({
      by: ['status'], // Placeholder, needs actual school field
      where: {
        status: ApplicationStatus.ELIGIBLE_FOR_EXAM,
      },
      _count: {
        id: true,
      },
    });


    return NextResponse.json({
      totalConfirmed,
      confirmedByProvince, // Will be generic until schema update
      confirmedBySchool,   // Will be generic until schema update
    }, { status: 200 });

  } catch (error) {
    console.error('Get dashboard phase 2 data error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
