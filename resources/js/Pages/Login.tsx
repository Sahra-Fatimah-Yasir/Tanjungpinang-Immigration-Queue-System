import { ArrowLeft, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

const loginOptions = [
  {
    title: "Petugas Loket",
    description: "Akses officer dan CS untuk input tiket atau memanggil antrian.",
    path: "/officer/login",
    icon: UserRoundCog,
    accent: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    title: "Administrator",
    description: "Kelola officer, loket, antrian aktif, laporan, dan pengaturan.",
    path: "/admin/login",
    icon: ShieldCheck,
    accent: "text-slate-800",
    bg: "bg-slate-100",
  },
];

export default function Login() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Display
        </Link>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="w-full">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
                <img
                  src="/images/logo.png"
                  alt="Logo Imigrasi"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                Portal Internal
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Pilih Akses Login
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                Masuk sesuai peran akun yang sudah terdaftar di sistem antrian.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
              {loginOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <Link
                    key={option.path}
                    to={option.path}
                    className="group flex min-h-[220px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
                  >
                    <div>
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-lg ${option.bg} ${option.accent}`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                        {option.title}
                      </h2>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                        {option.description}
                      </p>
                    </div>

                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-black text-blue-700">
                      Masuk
                      <UsersRound className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
