// frontend/app/register/page.js
"use client";

import { useState } from "react";
import { registerUser } from "../../lib/api";
import PrimaryButton from "../../components/PrimaryButton";

const ROLES = [
  { value: "suster", label: "Suster" },
  { value: "doc", label: "Dokter" },
  { value: "komite_medis", label: "Komite Medis" },
  { value: "direktur", label: "Direktur" },
  { value: "patient", label: "Patient" },
  { value: "ex-patient", label: "Ex-Patient" },
  { value: "family", label: "Family" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    role: "",
    nama: "",
    umur: "",
    no_identitas: "",
    alamat: "",
    no_telp: "",
    specialization: "",
    patient_id: "",
    private_key_hex: "",
    useExistingKey: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        role: form.role,
        nama: form.nama,
        umur: form.umur,
        no_identitas: form.no_identitas,
        alamat: form.alamat,
        no_telp: form.no_telp,
        specialization:
          form.role === "doc" ? form.specialization || null : null,
        patient_id:
          ["patient", "ex-patient", "family"].includes(form.role) &&
          form.patient_id
            ? form.patient_id
            : null,
        private_key_hex: form.useExistingKey
          ? form.private_key_hex || null
          : null,
      };

      const res = await registerUser(payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Registrasi gagal. Periksa input dan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const isPatientRole = ["patient", "ex-patient", "family"].includes(form.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Registrasi Pengguna
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftarkan tenaga medis, pasien, atau keluarga. Untuk tenaga medis,
          dompet (wallet) blockchain akan dibuat otomatis atau menggunakan
          private key yang sudah ada.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="">Pilih role</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {form.role === "doc" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Spesialisasi Dokter
              </label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Contoh: Cardiologist"
              />
            </div>
          )}

          {isPatientRole && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Patient ID
              </label>
              <input
                name="patient_id"
                value={form.patient_id}
                onChange={handleChange}
                placeholder="Misal: P001"
                required
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nama Lengkap
            </label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Umur
            </label>
            <input
              name="umur"
              value={form.umur}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              No Identitas (KTP/SIP/STR)
            </label>
            <input
              name="no_identitas"
              value={form.no_identitas}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              No Telepon
            </label>
            <input
              name="no_telp"
              value={form.no_telp}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Alamat
          </label>
          <input
            name="alamat"
            value={form.alamat}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mt-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-xs text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="useExistingKey"
              checked={form.useExistingKey}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
            />
            <span>
              Saya sudah punya <strong>private key</strong> dan ingin
              menggunakannya.
            </span>
          </label>
          {form.useExistingKey && (
            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Private Key (64 hex)
              </label>
              <input
                name="private_key_hex"
                value={form.private_key_hex}
                onChange={handleChange}
                placeholder="Masukkan private key yang sudah ada"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Daftarkan Pengguna"}
        </PrimaryButton>
      </form>

      {result && (
        <div className="rounded-2xl bg-white p-5 text-sm shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Wallet Berhasil Dibuat
          </h2>
          <p className="mb-1 text-xs text-slate-600">
            Simpan data berikut dengan aman (terutama private key):
          </p>
          <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-800">
            <p>
              <span className="font-semibold">Address:</span> {result.address}
            </p>
            <p className="break-all">
              <span className="font-semibold">Private Key:</span>{" "}
              {result.private_key_hex}
            </p>
            <p className="break-all">
              <span className="font-semibold">Public Key:</span>{" "}
              {result.public_key_hex}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
