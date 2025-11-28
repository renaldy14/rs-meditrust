// frontend/app/records/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPatientData } from "../../lib/api";
import PrimaryButton from "../../components/PrimaryButton";

export default function RecordsPage() {
  const [session, setSession] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("rsmt_session");
    if (!saved) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(saved);
    setSession(parsed);
    if (parsed.patient_id) setPatientId(parsed.patient_id);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecords(null);

    try {
      const res = await getPatientData(
        patientId.trim(),
        session.address,
        requestId.trim() || undefined
      );
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data pasien. Cek hak akses Anda.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const renderBlocks = (blocks) =>
    blocks.map((b, idx) => (
      <div
        key={idx}
        className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
      >
        <pre className="whitespace-pre-wrap text-[11px] text-slate-800">
          {JSON.stringify(b.data, null, 2)}
        </pre>
        <p className="text-[11px] text-slate-500">
          Dibuat oleh: {b.created_by_name} ({b.created_by.slice(0, 12)}...)
        </p>
        <p className="text-[11px] text-slate-500">
          Waktu: {b.timestamp} • Exp: {b.expiry_date}
        </p>
        <p className="truncate text-[11px] text-slate-400">
          Hash: {b.block_hash}
        </p>
      </div>
    ));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Rekam Medis Pasien
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Backend akan menerapkan logika akses bertingkat dan multi-signature
          sesuai fungsi <span className="font-mono">get_patient_data</span>.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Patient ID
            </label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              placeholder="P001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Request ID (opsional, untuk private data via multi-sig)
            </label>
            <input
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="Isi jika punya access request yang sudah approved"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            Data akan diambil sebagai user dengan address:{" "}
            <span className="font-mono text-[11px]">
              {session.address.slice(0, 18)}...
            </span>{" "}
            (role: <span className="font-mono">{session.role}</span>).
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Mengambil..." : "Lihat Rekam Medis"}
        </PrimaryButton>
      </form>

      {records && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Public
            </h2>
            {records.public?.length
              ? renderBlocks(records.public)
              : "Tidak ada data."}
          </div>

          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Private
            </h2>
            {records.private?.length
              ? renderBlocks(records.private)
              : "Tidak ada data private yang bisa diakses."}
          </div>

          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </h2>
            {records.patient?.length
              ? renderBlocks(records.patient)
              : "Tidak ada data patient-level."}
          </div>

          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expired
            </h2>
            {records.expired?.length
              ? records.expired.map((b, idx) => (
                  <div
                    key={idx}
                    className="space-y-1 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800"
                  >
                    <p>{b.data}</p>
                    <p className="text-[11px]">
                      Expired pada: {b.expired_date}
                    </p>
                  </div>
                ))
              : "Belum ada data yang expired."}
          </div>
        </div>
      )}
    </div>
  );
}
