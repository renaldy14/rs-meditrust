// frontend/app/page.js
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <section>
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-sky-600">
          BLOCKCHAIN HEALTH RECORDS
        </p>
        <h1 className="mb-4 text-3xl font-semibold text-slate-900 md:text-4xl">
          Rekam Medis Aman, Transparan, dan Terverifikasi untuk{" "}
          <span className="text-sky-600">RS MediTrust</span>
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          Sistem ini memanfaatkan blockchain untuk menyimpan data kesehatan,
          mengelola hak akses bertingkat (public, private, patient), dan
          mendukung persetujuan multi-signature antara dokter, komite medis, dan
          pasien.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/register">
            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700">
              Daftar Pengguna
            </button>
          </Link>
          <Link href="/login">
            <button className="rounded-lg border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50">
              Login dengan Private Key
            </button>
          </Link>
        </div>

        <div className="mt-6 grid gap-3 text-xs text-slate-600 md:grid-cols-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-slate-800">Akses Bertingkat</p>
            <p>Public, private, dan patient dengan kontrol ketat.</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-slate-800">Multi-Signature</p>
            <p>Persetujuan dokter & komite medis untuk data sensitif.</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="font-semibold text-slate-800">Kedaluwarsa Data</p>
            <p>Data otomatis ditandai expired setelah 5 tahun.</p>
          </div>
        </div>
      </section>

      <section className="hidden md:block">
        <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-slate-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Live Overview
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Secure by Design
            </span>
          </div>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[11px] text-slate-500">Contoh Alur</p>
              <p className="font-semibold text-slate-800">
                Register → Tambah Data → Request Akses → Multi-Sig Approve →
                Lihat Rekam Medis
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="text-[11px] text-slate-500">Role</p>
                <p className="text-sm font-semibold text-slate-800">
                  Doc / Nurse
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="text-[11px] text-slate-500">Patient</p>
                <p className="text-sm font-semibold text-slate-800">P001</p>
              </div>
              <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="text-[11px] text-slate-500">Access</p>
                <p className="text-sm font-semibold text-emerald-600">
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
