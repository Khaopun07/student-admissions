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

    const application = await prisma.application.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        examDetails: true,
        admissionResult: true,
        documents: true,
      },
    });

    if (!application) {
      return NextResponse.json({ message: 'No application found' }, { status: 404 });
    }

    return NextResponse.json(application, { status: 200 });

  } catch (error) {
    console.error('Get application status tracking error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
