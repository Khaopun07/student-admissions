import { StudentProfile as PrismaStudentProfile, User as PrismaUser } from '@prisma/client';

// Extend Prisma's generated types for more specific use in the frontend
export interface StudentProfileWithUser extends PrismaStudentProfile {
  scienceScore: string;
  gpaxScore: string;
  school: string;
  province: string;
  lasercode: string;
  dateofbirth: string;
  user: Pick<PrismaUser, 'nationalId' | 'email' | 'createdAt'>;
}
