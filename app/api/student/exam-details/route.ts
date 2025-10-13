import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const examDetails = await prisma.examDetails.findFirst({
      where: {
        application: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!examDetails) {
      return NextResponse.json({ message: 'Exam details not found' }, { status: 404 });
    }

    return NextResponse.json(examDetails, { status: 200 });

  } catch (error) {
    console.error('Get exam details error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
