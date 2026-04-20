import React from "react";
import { ShieldCheck, UserSquare2, LockKeyhole, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/officer");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-white px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(30,64,175,0.08),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.08),_transparent_30%)]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-2xl backdrop-blur xl:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-10 text-white xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <ShieldCheck className="h-9 w-9 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
                  Portal Internal
                </p>
                <h1 className="text-3xl font-black tracking-tight">
                  Sistem Antrian Imigrasi
                </h1>
              </div>
            </div>

            <div className="mt-16 max-w-lg">
              <h2 className="text-5xl font-black leading-tight tracking-tight">
                Akses Petugas
                <br />
                Lebih Modern,
                <br />
                Cepat, dan Aman
              </h2>
              <p className="mt-6 text-base leading-7 text-slate-300">
                Masuk ke sistem menggunakan NIP dan password untuk mengelola
                antrean layanan secara real-time pada masing-masing loket.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
              Kantor Imigrasi Kelas I TPI Tanjungpinang
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sistem ini dirancang untuk mendukung pelayanan publik yang lebih
              tertib, profesional, dan responsif.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 xl:hidden">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 shadow-lg">
                <ShieldCheck className="h-8 w-8 text-amber-300" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Portal Internal
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Sistem Antrian Imigrasi
              </h2>
            </div>

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Login Petugas
              </p>
              <h3 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                Selamat Datang
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Silakan masuk menggunakan akun petugas yang telah terdaftar.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  NIP
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition focus-within:border-blue-500 focus-within:bg-white">
                  <UserSquare2 className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Masukkan NIP petugas"
                    className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition focus-within:border-blue-500 focus-within:bg-white">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Masukkan password"
                    className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Masuk ke Sistem
                <LogIn className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Akses hanya diperuntukkan bagi petugas yang berwenang.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}