// frontend/app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithPrivateKey } from "../../lib/api";
import PrimaryButton from "../../components/PrimaryButton";

export default function LoginPage() {
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // kalau sudah login, langsung ke dashboard
    const saved = localStorage.getItem("rsmt_session");
    if (saved) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginWithPrivateKey(privateKey.trim());
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        // simpan session di localStorage
        localStorage.setItem(
          "rsmt_session",
          JSON.stringify({
            ...res.data,
            private_key_hex: privateKey.trim(), // disimpan di frontend saja
          })
        );
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Login gagal. Periksa private key Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Login dengan Private Key
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sistem backend akan mencocokkan private key Anda dengan address dan
          role yang sudah terdaftar di blockchain.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Private Key (64 hex)
          </label>
          <textarea
            className="h-24 w-full resize-none"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            required
            placeholder="Masukkan private key yang Anda simpan saat registrasi"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Login"}
        </PrimaryButton>
      </form>

      <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-700">
        <p className="font-semibold">Catatan Keamanan</p>
        <p>
          Private key <strong>tidak pernah disimpan di backend</strong>, hanya
          dikirim saat login & penandatanganan akses. Simpan baik-baik di sisi
          Anda.
        </p>
      </div>
    </div>
  );
}
