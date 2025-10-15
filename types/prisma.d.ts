import { StudentProfile as PrismaStudentProfile, User as PrismaUser } from '@prisma/client';

// Extend Prisma's generated types for more specific use in the frontend
export interface StudentProfileWithUser extends PrismaStudentProfile {
  scienceScore: number | null;
  gpaxScore: number | null;
  school: string | null;
  province: string | null;
  lasercode: string | null;
  dateofbirth: string | null;
  user: Pick<PrismaUser, 'nationalId' | 'email' | 'createdAt'>;
}
