// frontend/app/layout.js
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "RS MediTrust - Blockchain Health Records",
  description: "Sistem rekam medis berbasis blockchain untuk RS MediTrust.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen flex-col">
          {/* HEADER */}
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 font-bold">
                  RS
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-slate-800">
                    RS MediTrust
                  </p>
                  <p className="text-xs text-slate-500">
                    Blockchain Health System
                  </p>
                </div>
              </div>
              <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex">
                <Link href="/" className="hover:text-sky-600">
                  Home
                </Link>
                <Link href="/register" className="hover:text-sky-600">
                  Register
                </Link>
                <Link href="/login" className="hover:text-sky-600">
                  Login
                </Link>
                <Link href="/data" className="hover:text-sky-600">
                  Add Data
                </Link>
                <Link href="/records" className="hover:text-sky-600">
                  Records
                </Link>
                <Link href="/access" className="hover:text-sky-600">
                  Access Request
                </Link>
                <Link href="/dashboard" className="hover:text-sky-600">
                  Dashboard
                </Link>
              </nav>
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} RS MediTrust.</span>
              <span>Data integrity powered by blockchain.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
    