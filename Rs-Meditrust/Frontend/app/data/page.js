// frontend/app/data/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addHealthData } from "../../lib/api";
import PrimaryButton from "../../components/PrimaryButton";

const ACCESS_LEVELS = [
  { value: "public", label: "Public (untuk tenaga medis)" },
  {
    value: "private",
    label: "Private (butuh multi-sig untuk pasien/family)",
  },
  {
    value: "patient",
    label: "Patient (khusus pasien/family + staff tertentu)",
  },
];

export default function AddDataPage() {
  const [session, setSession] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [accessLevel, setAccessLevel] = useState("public");
  const [expiryYears, setExpiryYears] = useState(5);
  const [dataJson, setDataJson] = useState(
    '{ "diagnosis": "Hipertensi ringan", "tensi": "120/80" }'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
    setMessage("");

    try {
      let payloadData;
      try {
        payloadData = JSON.parse(dataJson);
        if (typeof payloadData !== "object" || Array.isArray(payloadData)) {
          throw new Error();
        }
      } catch {
        setError(
          'Format data harus JSON object yang valid. Contoh: { "diagnosis": "Diabetes" }'
        );
        setLoading(false);
        return;
      }

      const payload = {
        patient_id: patientId,
        data: payloadData,
        access_level: accessLevel,
        user_address: session.address,
        expiry_years: Number(expiryYears) || 5,
      };

      const res = await addHealthData(payload);
      if (res.success) {
        setMessage("Data kesehatan berhasil ditambahkan ke blockchain.");
      } else {
        setError("Gagal menambahkan data. Cek hak akses Anda.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Terjadi kesalahan saat menyimpan data kesehatan."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Tambah Data Kesehatan
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Data akan disimpan sebagai block baru di blockchain dengan hak akses
          sesuai level yang dipilih.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Patient ID
            </label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="P001"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Access Level
            </label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
            >
              {ACCESS_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,140px]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Data (JSON)
            </label>
            <textarea
              className="h-40 w-full resize-none font-mono text-xs"
              value={dataJson}
              onChange={(e) => setDataJson(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Contoh: {'{ "diagnosis": "Diabetes", "tensi": "130/90" }'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Expiry (tahun)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={expiryYears}
              onChange={(e) => setExpiryYears(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Default backend: 5 tahun.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            Data akan dibuat oleh address:{" "}
            <span className="font-mono text-[11px]">
              {session.address.slice(0, 18)}...
            </span>
          </p>
          <p>
            Backend menggunakan fungsi{" "}
            <span className="font-mono">add_block</span> untuk menyimpan block
            baru dengan hash dan expiry date.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan ke Blockchain"}
        </PrimaryButton>
      </form>
    </div>
  );
}
