import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <main className="text-center bg-white p-10 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          ยินดีต้อนรับสู่พอร์ทัลรับสมัครนักเรียน
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          กรุณาเลือกประเภทการเข้าสู่ระบบของคุณ
        </p>
        <div className="flex justify-center gap-6">
          <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            เข้าสู่ระบบสำหรับนักเรียน / ทั่วไป
          </Link>
          <Link href="/admin/login" className="bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            เข้าสู่ระบบสำหรับผู้ดูแลระบบ
          </Link>
        </div>
      </main>
    </div>
  );
}
