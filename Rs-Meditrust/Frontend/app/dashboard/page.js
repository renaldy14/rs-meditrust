// frontend/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, verifyChain } from "../../lib/api";
import Link from "next/link";
import PrimaryButton from "../../components/PrimaryButton";

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [usersInfo, setUsersInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("rsmt_session");
    if (!saved) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(saved);
    setSession(parsed);

    const fetchData = async () => {
      try {
        const [chainRes, usersRes] = await Promise.all([
          verifyChain(),
          getAllUsers(),
        ]);
        setChainInfo(chainRes);
        setUsersInfo(usersRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("rsmt_session");
    router.push("/login");
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Dashboard Pengguna
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan identitas Anda di sistem blockchain RS MediTrust.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Identitas & Role
          </h2>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Nama</p>
              <p className="text-sm font-medium">
                {session.profile?.nama || "-"}
              </p>
              <p className="text-xs text-slate-500">
                Role:{" "}
                <span className="font-mono text-[11px]">{session.role}</span>
              </p>
              {session.patient_id && (
                <p className="text-xs text-slate-500">
                  Patient ID:{" "}
                  <span className="font-mono text-[11px]">
                    {session.patient_id}
                  </span>
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Address</p>
              <p className="break-all font-mono text-[11px] text-slate-800">
                {session.address}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Can access private data:{" "}
                <span className="font-mono text-[11px]">
                  {session.can_access_private ? "true" : "false"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Status Blockchain
          </h2>
          {loading || !chainInfo ? (
            <p className="text-xs text-slate-500">Memuat...</p>
          ) : (
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                Valid:{" "}
                <span
                  className={
                    chainInfo.valid ? "text-emerald-600" : "text-red-600"
                  }
                >
                  {String(chainInfo.valid)}
                </span>
              </p>
              <p>Total blocks: {chainInfo.total_blocks}</p>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/register">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50/40">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Register User
              </p>
              <p>Tambah tenaga medis atau pasien baru.</p>
            </div>
            <span className="mt-2 text-[11px] text-sky-600">
              ➜ Buka halaman
            </span>
          </div>
        </Link>
        <Link href="/data">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50/40">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Tambah Data
              </p>
              <p>Input hasil pemeriksaan pasien.</p>
            </div>
            <span className="mt-2 text-[11px] text-sky-600">
              ➜ Buka halaman
            </span>
          </div>
        </Link>
        <Link href="/records">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50/40">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Rekam Medis
              </p>
              <p>Lihat data public/private/patient.</p>
            </div>
            <span className="mt-2 text-[11px] text-sky-600">
              ➜ Buka halaman
            </span>
          </div>
        </Link>
        <Link href="/access">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50/40">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Multi-Sig Access
              </p>
              <p>Buat & tanda tangani access request.</p>
            </div>
            <span className="mt-2 text-[11px] text-sky-600">
              ➜ Buka halaman
            </span>
          </div>
        </Link>
      </div>

      {/* USERS SUMMARY */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Ringkasan Pengguna Terdaftar
        </h2>
        {loading || !usersInfo ? (
          <p className="text-xs text-slate-500">Memuat...</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-600">
              Total users: {usersInfo.total}
            </p>
            <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-3">
              {Object.entries(usersInfo.users || {}).map(([role, users]) => (
                <div key={role} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {role}
                  </p>
                  <p className="mt-1 text-[11px]">
                    Jumlah: {Object.keys(users).length}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
