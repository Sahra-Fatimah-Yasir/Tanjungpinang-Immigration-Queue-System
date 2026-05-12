import { useState, useEffect } from 'react';
import Sidebar from '../../Components/Sidebar.tsx';
import Header from '../../Components/Header.tsx';
import { Edit3, Trash2, Plus, Key, RefreshCw } from 'lucide-react';
import { useAdminAPI } from '../../lib/useAdminAPI.ts';
import { cn } from '../../lib/utils.ts';

interface Officer {
  id: number;
  nip: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  role: 'OFFICER' | 'CS';
  counter?: {
    id: number;
    code: string;
  };
}

type OfficerForm = Partial<Officer> & {
  password?: string;
  password_confirmation?: string;
};

const passwordWords = ['Kanim', 'Paspor', 'Loket', 'Antrian', 'TPI', 'Imigrasi'];
const passwordSymbols = ['!', '#', '@', '$'];

const generateOfficerPassword = () => {
  const word = passwordWords[Math.floor(Math.random() * passwordWords.length)] || 'Kanim';
  const symbol = passwordSymbols[Math.floor(Math.random() * passwordSymbols.length)] || '!';
  const number = Math.floor(1000 + Math.random() * 9000);

  return `${word}${number}${symbol}Tpi`;
};

const getRoleLabel = (role?: Officer['role']) =>
  role === 'CS' ? 'Customer Service' : 'Officer Loket';

export default function OfficerManagement() {
  const {
    getOfficers,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    resetOfficerPassword,
    loading,
    error,
  } = useAdminAPI();

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<OfficerForm | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; officer: Officer | null }>({
    show: false,
    officer: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const officersData = await getOfficers();
      setOfficers(officersData);
    } catch (err) {
      console.error('Failed to load officers:', err);
    }
  };

  const resetMessages = () => {
    setLocalError('');
    setSuccessMessage('');
  };

  const handleEditStart = (officer: Officer) => {
    resetMessages();
    setEditingId(officer.id);
    setFormData({
      nip: officer.nip,
      name: officer.name,
      email: officer.email,
      phone: officer.phone,
      status: officer.status,
      role: officer.role,
    });
    setShowCreateForm(false);
  };

  const handleCreateStart = () => {
    const generatedPassword = generateOfficerPassword();

    resetMessages();
    setFormData({
      nip: '',
      name: '',
      email: '',
      phone: '',
      status: 'ACTIVE',
      role: 'OFFICER',
      password: generatedPassword,
      password_confirmation: generatedPassword,
    });
    setShowCreateForm(true);
    setEditingId(null);
  };

  const handleGeneratePassword = () => {
    const generatedPassword = generateOfficerPassword();

    setFormData({
      ...formData,
      password: generatedPassword,
      password_confirmation: generatedPassword,
    });
  };

  const validateForm = () => {
    if (!formData?.nip?.trim()) return 'NIP wajib diisi.';
    if (formData.nip.length !== 18) return 'NIP harus 18 digit.';
    if (!formData?.name?.trim()) return 'Nama wajib diisi.';
    if (showCreateForm && !formData?.email?.trim()) {
      return 'Email wajib diisi agar NIP, role, dan password login bisa dikirim.';
    }
    if (formData?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Format email tidak valid.';
    }

    if (showCreateForm) {
      if (!formData.password || formData.password.length < 6) {
        return 'Password minimal 6 karakter.';
      }
      if (formData.password !== formData.password_confirmation) {
        return 'Konfirmasi password tidak sama.';
      }
    }

    return '';
  };

  const handleSave = async () => {
    resetMessages();

    if (!formData) return;

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      if (showCreateForm) {
        const roleLabel = getRoleLabel(formData.role);
        const createResult = await createOfficer({
          nip: formData.nip,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          status: formData.status || 'ACTIVE',
          role: formData.role || 'OFFICER',
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        } as any);

        if (createResult?.email_sent) {
          setSuccessMessage(`${roleLabel} berhasil ditambahkan. NIP, role, dan password login sudah dikirim ke email.`);
        } else if (createResult?.email_not_configured) {
          setSuccessMessage(`${roleLabel} berhasil ditambahkan, tetapi SMTP belum aktif. Atur MAIL_MAILER=smtp agar email masuk ke inbox petugas.`);
        } else if (formData.email) {
          setSuccessMessage(`${roleLabel} berhasil ditambahkan, tetapi email kredensial belum berhasil dikirim. Cek konfigurasi mail server.`);
        } else {
          setSuccessMessage(`${roleLabel} berhasil ditambahkan. Isi email petugas jika ingin kredensial dikirim otomatis.`);
        }
      } else if (editingId) {
        await updateOfficer(editingId, {
          nip: formData.nip,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          status: formData.status,
          role: formData.role,
        } as any);

        setSuccessMessage('Officer berhasil diperbarui.');
      }

      await loadData();
      setEditingId(null);
      setFormData(null);
      setShowCreateForm(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        'Gagal menyimpan officer.';
      setLocalError(String(message));
    }
  };

  const handleDelete = async (officerId: number) => {
    const officer = officers.find((o) => o.id === officerId);
    if (officer) {
      setDeleteModal({ show: true, officer });
    }
  };

  const confirmDelete = async () => {
    resetMessages();

    if (!deleteModal.officer) return;

    try {
      await deleteOfficer(deleteModal.officer.id);
      await loadData();
      setDeleteModal({ show: false, officer: null });
      setSuccessMessage('Officer berhasil dihapus.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Gagal menghapus officer.';
      setLocalError(message);
    }
  };

  const handleResetPassword = async (officerId: number) => {
    resetMessages();
    const officer = officers.find((item) => item.id === officerId);

    const newPassword = prompt('Masukkan password baru minimal 6 karakter:');

    if (!newPassword) return;

    if (newPassword.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }

    try {
      const resetResult = await resetOfficerPassword(officerId, newPassword);
      const roleLabel = getRoleLabel(officer?.role);

      if (resetResult?.email_sent) {
        setSuccessMessage(`Password ${roleLabel} berhasil direset dan dikirim ke email.`);
      } else if (resetResult?.email_not_configured) {
        setSuccessMessage(`Password ${roleLabel} berhasil direset, tetapi SMTP belum aktif sehingga email belum terkirim.`);
      } else if (officer?.email) {
        setSuccessMessage(`Password ${roleLabel} berhasil direset, tetapi email kredensial belum berhasil dikirim.`);
      } else {
        setSuccessMessage(`Password ${roleLabel} berhasil direset. Isi email petugas jika ingin password baru dikirim otomatis.`);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        'Gagal reset password.';
      setLocalError(String(message));
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">
            Officer Management
          </h2>
          <Header showUser title="" className="p-0 shadow-none sticky-none" />
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {localError || error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div></div>
            <button
              onClick={handleCreateStart}
              className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Officer
            </button>
          </div>

          {(showCreateForm || editingId) && (
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <h3 className="font-manrope font-bold text-lg text-primary mb-4">
                {showCreateForm ? 'Add New Officer' : 'Edit Officer'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-outline mb-1">NIP</label>
                  <input
                    type="text"
                    value={formData?.nip || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nip: e.target.value.replace(/\D/g, '').slice(0, 18),
                      })
                    }
                    maxLength={18}
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-outline">
                    NIP menjadi username login officer.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Name</label>
                  <input
                    type="text"
                    value={formData?.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Email</label>
                  <input
                    type="email"
                    value={formData?.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {showCreateForm && (
                    <p className="mt-1 text-xs text-outline">
                      Wajib diisi untuk mengirim NIP, role, dan password login.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData?.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {showCreateForm && (
                  <>
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-outline">Password</label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData?.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-outline">
                        Password otomatis dibuat lebih unik dan akan ikut dikirim lewat email petugas.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-outline mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData?.password_confirmation || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, password_confirmation: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Status</label>
                  <select
                    value={formData?.status || 'ACTIVE'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'ON_BREAK',
                      })
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_BREAK">On Break</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Role</label>
                  <select
                    value={formData?.role || 'OFFICER'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as 'OFFICER' | 'CS',
                      })
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="OFFICER">Officer Loket</option>
                    <option value="CS">Customer Service</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>

                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData(null);
                    setShowCreateForm(false);
                    resetMessages();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
            <table className="min-w-[1120px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-none">
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">NIP</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Counter</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="sticky right-0 z-10 bg-surface-container-low px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider shadow-[-8px_0_12px_rgba(15,23,42,0.06)]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant">
                {officers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-5 font-headline font-bold text-primary">{officer.nip}</td>
                    <td className="px-6 py-5">{officer.name}</td>
                    <td className="px-6 py-5">{officer.email || '-'}</td>
                    <td className="px-6 py-5">{officer.phone || '-'}</td>
                    <td className="px-6 py-5">{officer.counter?.code || '-'}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                        {officer.role || 'OFFICER'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase',
                          officer.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : officer.status === 'ON_BREAK'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {officer.status}
                      </span>
                    </td>

                    <td className="sticky right-0 z-10 bg-surface-container-lowest px-6 py-5 shadow-[-8px_0_12px_rgba(15,23,42,0.06)]">
                      <div className="flex min-w-[164px] items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditStart(officer)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                        title="Edit officer"
                        aria-label={`Edit ${officer.name}`}
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetPassword(officer.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                        title="Reset password"
                        aria-label={`Reset password ${officer.name}`}
                      >
                        <Key className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(officer.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
                        title="Hapus officer"
                        aria-label={`Hapus ${officer.name}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {officers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-outline">
                      Belum ada officer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {deleteModal.show && deleteModal.officer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
              <h3 className="font-manrope font-bold text-xl text-primary mb-4">
                Delete Officer
              </h3>

              <p className="text-outline mb-6">
                Are you sure you want to delete officer{' '}
                <strong>{deleteModal.officer.name}</strong> (NIP: {deleteModal.officer.nip})?
                This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal({ show: false, officer: null })}
                  className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
