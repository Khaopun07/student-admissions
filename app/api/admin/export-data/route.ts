import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { utils, write } from 'xlsx';

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
            role: true,
            studentProfile: true,
          },
        },
        examDetails: true,
        admissionResult: true,
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const dataForExport = applications.map(app => ({
      ApplicationId: app.id,
      NationalId: app.user.nationalId,
      Email: app.user.email,
      Role: app.user.role,
      FirstName: app.user.studentProfile?.firstName || '',
      LastName: app.user.studentProfile?.lastName || '',
      MathScore: app.user.studentProfile?.mathScore || '',
      PdpaAccepted: app.user.studentProfile?.pdpaAccepted ? 'Yes' : 'No',
      ApplicationStatus: app.status,
      ExamEligible: app.examDetails?.examEligible ? 'Yes' : 'No',
      RoomNumber: app.examDetails?.roomNumber || '',
      SeatNumber: app.examDetails?.seatNumber || '',
      AdmissionResult: app.admissionResult?.isAdmitted === true ? 'Admitted' : (app.admissionResult?.isAdmitted === false ? 'Reserve' : 'N/A'),
      AdmissionConfirmed: app.admissionResult?.isConfirmed === true ? 'Confirmed' : (app.admissionResult?.isConfirmed === false ? 'Rejected' : 'N/A'),
      ConfirmationDate: app.admissionResult?.confirmationDate?.toISOString() || '',
      DocumentsUploaded: app.documents.map(doc => `${doc.documentType}: ${doc.filePath}`).join('; '),
      CreatedAt: app.createdAt.toISOString(),
      UpdatedAt: app.updatedAt.toISOString(),
    }));

    const ws = utils.json_to_sheet(dataForExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "StudentAdmissions");

    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'buffer' });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="student_admissions_data.xlsx"');

    return new NextResponse(excelBuffer, { headers });

  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
