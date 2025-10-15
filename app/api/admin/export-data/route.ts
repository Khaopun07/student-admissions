import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { utils, write } from 'xlsx';
import { ApplicationStatus, DocumentType, UserRole } from '@prisma/client';

const statusTranslations: Record<ApplicationStatus, string> = {
  PENDING_REVIEW: 'รอตรวจสอบ',
  DOCUMENTS_SUBMITTED: 'ยื่นเอกสารแล้ว',
  ELIGIBLE_FOR_EXAM: 'มีสิทธิ์สอบ',
  ADMISSION_ANNOUNCED: 'ประกาศผลแล้ว',
  CONFIRMED_ADMISSION: 'ยืนยันสิทธิ์แล้ว',
  REJECTED_ADMISSION: 'สละสิทธิ์',
  NOT_PROCESSED: 'ไม่ดำเนินการ',
  WAITING_FOR_CALL: 'รอเรียก (ตัวสำรอง)',
  ADMISSION_COMPLETED: 'การสมัครเสร็จสมบูรณ์',
};

const documentTypeTranslations: Record<DocumentType, string> = {
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชำระเงินค่าธรรมเนียม',
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
};
export async function GET() {
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
      'รหัสใบสมัคร': app.id,
      'เลขประจำตัวประชาชน': app.user.nationalId,
      'อีเมล': app.user.email,
      'บทบาท': app.user.role === UserRole.ADMIN ? 'แอดมิน' : 'นักเรียน',
      'ชื่อจริง': app.user.studentProfile?.firstName || '',
      'นามสกุล': app.user.studentProfile?.lastName || '',
      'คะแนนคณิตศาสตร์': app.user.studentProfile?.mathScore || '',
      'ยอมรับ PDPA': app.user.studentProfile?.pdpaAccepted ? 'ใช่' : 'ไม่',
      'สถานะใบสมัคร': statusTranslations[app.status] || app.status,
      'มีสิทธิ์สอบ': app.examDetails?.examEligible ? 'ใช่' : 'ไม่',
      'ห้องสอบ': app.examDetails?.roomNumber || '',
      'เลขที่นั่งสอบ': app.examDetails?.seatNumber || '',
      'ผลการคัดเลือก': app.admissionResult?.isAdmitted === true ? 'ตัวจริง' : (app.admissionResult?.isAdmitted === false ? 'ตัวสำรอง' : 'ยังไม่ประกาศ'),
      'ยืนยันสิทธิ์': app.admissionResult?.isConfirmed === true ? 'ยืนยันแล้ว' : (app.admissionResult?.isConfirmed === false ? 'สละสิทธิ์' : 'รอดำเนินการ'),
      'วันที่ยืนยันสิทธิ์': app.admissionResult?.confirmationDate ? new Date(app.admissionResult.confirmationDate).toLocaleString('th-TH') : '',
      'เอกสารที่อัปโหลด': app.documents.map(doc => `${documentTypeTranslations[doc.documentType] || doc.documentType}: ${doc.filePath}`).join('; '),
      'วันที่สร้าง': new Date(app.createdAt).toLocaleString('th-TH'),
      'วันที่อัปเดต': new Date(app.updatedAt).toLocaleString('th-TH'),
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
