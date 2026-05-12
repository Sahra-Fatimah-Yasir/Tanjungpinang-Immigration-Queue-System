import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Loader } from 'lucide-react';

export default function OfficerLogin() {
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ nip: false, password: false });

  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('officer_data');

    const savedNip = localStorage.getItem('officer_nip');
    const savedRemember = localStorage.getItem('officer_remember');
    if (savedNip && savedRemember === 'true') {
      setNip(savedNip);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!nip.trim()) {
      setError('NIP tidak boleh kosong');
      return false;
    }
    if (nip.trim().length < 18) {
      setError('NIP harus 18 digit');
      return false;
    }
    if (!password) {
      setError('Password tidak boleh kosong');
      return false;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!validateForm()) return;

  setLoading(true);

  try {
    const response = await fetch('/api/officer/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        nip: nip.trim(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login gagal');
    }

    // Simpan token & data
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('officer_data', JSON.stringify(data.data.officer));
    localStorage.removeItem('admin_data');

    if (rememberMe) {
      localStorage.setItem('officer_nip', nip.trim());
      localStorage.setItem('officer_remember', 'true');
    } else {
      localStorage.removeItem('officer_nip');
      localStorage.removeItem('officer_remember');
    }

    if (data.data.officer.role === "CS") {
      navigate("/cs");
    } else {
      navigate("/officer/dashboard");
    }

  } catch (err: any) {
    setError(err.message || 'Terjadi kesalahan');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-12 text-center">
            <div className="text-6xl mb-3">🛂</div>
            <h1 className="text-3xl font-black text-white">Petugas Imigrasi</h1>
            <p className="text-blue-100 text-sm mt-3 font-medium">Kantor Imigrasi Kelas I TPI Tanjungpinang</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* NIP Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  NIP (Nomor Induk Pegawai)
                </div>
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 18))}
                onBlur={() => setTouched({ ...touched, nip: true })}
                placeholder="Contoh: 19800101200001001"
                maxLength={18}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoFocus
                required
              />
              <p className="text-xs text-slate-500 mt-1">{nip.length}/18 digit</p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">
                Ingat NIP saya
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Sedang Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t space-y-3">
            <div className="text-xs text-slate-600 text-center font-medium">
              Sistem Antrian Terintegrasi • v1.0
            </div>
            <div className="text-center">
              <a href="/admin/login" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                Login sebagai Admin →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
