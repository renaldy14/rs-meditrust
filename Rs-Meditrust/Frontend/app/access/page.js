// frontend/app/access/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAccessRequest, signAccessRequest } from "../../lib/api";
import PrimaryButton from "../../components/PrimaryButton";

export default function AccessPage() {
  const [session, setSession] = useState(null);
  const [createForm, setCreateForm] = useState({
    patient_id: "",
    data_type: "private",
  });
  const [signForm, setSignForm] = useState({
    request_id: "",
    private_key_hex: "",
  });
  const [createResult, setCreateResult] = useState("");
  const [signResult, setSignResult] = useState("");
  const [errorCreate, setErrorCreate] = useState("");
  const [errorSign, setErrorSign] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSign, setLoadingSign] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("rsmt_session");
    if (!saved) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(saved);
    setSession(parsed);
    if (parsed.patient_id) {
      setCreateForm((prev) => ({
        ...prev,
        patient_id: parsed.patient_id,
      }));
    }
  }, [router]);

  if (!session) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    setErrorCreate("");
    setCreateResult("");

    try {
      const payload = {
        patient_id: createForm.patient_id.trim(),
        requester_address: session.address,
        data_type: createForm.data_type,
      };
      const res = await createAccessRequest(payload);
      setCreateResult(res.request_id);
    } catch (err) {
      console.error(err);
      setErrorCreate("Gagal membuat access request.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleSign = async (e) => {
    e.preventDefault();
    setLoadingSign(true);
    setErrorSign("");
    setSignResult("");

    try {
      const payload = {
        request_id: signForm.request_id.trim(),
        signer_address: session.address,
        private_key_hex: signForm.private_key_hex.trim(),
      };
      const res = await signAccessRequest(payload);
      if (res.success) {
        setSignResult(res.message);
      } else {
        setErrorSign(res.detail || "Gagal menandatangani request.");
      }
    } catch (err) {
      console.error(err);
      setErrorSign(
        err.response?.data?.detail || "Gagal menandatangani request."
      );
    } finally {
      setLoadingSign(false);
    }
  };

  const isDoctorOrKomite = ["doc", "komite_medis"].includes(session.role);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Multi-Signature Access Request
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Halaman ini menerapkan alur akses multi-signature persis seperti di
          fungsi <span className="font-mono">create_access_request</span> dan{" "}
          <span className="font-mono">sign_access_request</span> di backend.
        </p>
      </div>

      {/* CREATE */}
      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            1. Buat Access Request (Pasien / Keluarga)
          </h2>
          <p className="text-xs text-slate-600">
            Request ini digunakan agar pasien/family dapat mengakses data
            private setelah mendapat 2 tanda tangan (dokter + komite medis).
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Patient ID
            </label>
            <input
              value={createForm.patient_id}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, patient_id: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Data Type
            </label>
            <select
              value={createForm.data_type}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, data_type: e.target.value }))
              }
            >
              <option value="private">private (sensitive data)</option>
              <option value="patient">patient</option>
            </select>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p>
              Requester:{" "}
              <span className="font-mono text-[11px]">
                {session.address.slice(0, 18)}...
              </span>{" "}
              (role: {session.role})
            </p>
          </div>

          {errorCreate && <p className="text-xs text-red-600">{errorCreate}</p>}
          {createResult && (
            <div className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
              <p className="font-semibold">Request ID berhasil dibuat:</p>
              <p className="break-all font-mono text-[11px]">{createResult}</p>
              <p className="mt-1">
                Bagikan Request ID ini ke dokter & komite medis untuk
                ditandatangani.
              </p>
            </div>
          )}

          <PrimaryButton type="submit" disabled={loadingCreate}>
            {loadingCreate ? "Membuat..." : "Buat Access Request"}
          </PrimaryButton>
        </form>

        {/* SIGN */}
        <form
          onSubmit={handleSign}
          className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            2. Tanda Tangan Request (Dokter / Komite Medis)
          </h2>
          <p className="text-xs text-slate-600">
            Fungsi ini langsung memanggil{" "}
            <span className="font-mono">/access-request/sign</span> yang di
            backend akan memverifikasi role dan menambah signature.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Request ID
            </label>
            <input
              value={signForm.request_id}
              onChange={(e) =>
                setSignForm((p) => ({ ...p, request_id: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Private Key (penandatangan)
            </label>
            <textarea
              className="h-20 w-full resize-none font-mono text-xs"
              value={signForm.private_key_hex}
              onChange={(e) =>
                setSignForm((p) => ({
                  ...p,
                  private_key_hex: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p>
              Signer address:{" "}
              <span className="font-mono text-[11px]">
                {session.address.slice(0, 18)}...
              </span>{" "}
              (role: {session.role})
            </p>
            {!isDoctorOrKomite && (
              <p className="mt-1 text-amber-700">
                Hanya role <strong>doc</strong> atau{" "}
                <strong>komite_medis</strong> yang akan diterima oleh backend.
              </p>
            )}
          </div>

          {errorSign && <p className="text-xs text-red-600">{errorSign}</p>}
          {signResult && (
            <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
              {signResult}
            </p>
          )}

          <PrimaryButton type="submit" disabled={loadingSign}>
            {loadingSign ? "Mengirim..." : "Tanda Tangani Request"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
