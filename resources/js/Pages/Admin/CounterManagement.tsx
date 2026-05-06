import { useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar.tsx';
import Header from '../../Components/Header.tsx';
import { Edit3, Plus, Save, Trash2, UserMinus, X } from 'lucide-react';
import { useAdminAPI } from '../../lib/useAdminAPI.ts';
import { cn } from '../../lib/utils.ts';

interface Counter {
  id: number;
  code: string;
  counter_number: number;
  service: {
    id: number;
    code: string;
    name: string;
  };
  officer?: {
    id: number;
    nip: string;
    name: string;
  } | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

interface Officer {
  id: number;
  nip: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  role: 'OFFICER' | 'CS';
  counter?: {
    id: number;
    code: string;
  } | null;
}

interface ServiceCategory {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  max_counters: number;
}

interface CounterForm {
  service_category_id: string;
  counter_number: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  officer_id: string;
}

interface EditForm {
  counter_number: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

const defaultCreateForm: CounterForm = {
  service_category_id: '',
  counter_number: '',
  status: 'ACTIVE',
  officer_id: '',
};

export default function CounterManagement() {
  const {
    getCounters,
    getOfficers,
    createCounter,
    updateCounter,
    assignOfficerToCounter,
    deleteCounter,
    loading,
    error,
  } = useAdminAPI();

  const [counters, setCounters] = useState<Counter[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<Record<number, string>>({});
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [createForm, setCreateForm] = useState<CounterForm>(defaultCreateForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [countersData, officersData, servicesResponse] = await Promise.all([
        getCounters(),
        getOfficers(),
        fetch('/api/services', {
          headers: {
            Accept: 'application/json',
          },
        }),
      ]);

      const servicesResult = await servicesResponse.json();
      if (!servicesResponse.ok) {
        throw new Error(servicesResult.message || 'Failed to fetch services');
      }

      setCounters(countersData);
      setOfficers(officersData);
      setServices(servicesResult.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setLocalError('Gagal memuat data loket, officer, atau layanan.');
    }
  };

  const resetMessages = () => {
    setLocalError('');
    setSuccessMessage('');
  };

  const availableOfficers = officers.filter((officer) => officer.role === 'OFFICER');

  const handleEditStart = (counter: Counter) => {
    resetMessages();
    setEditingId(counter.id);
    setEditForm({
      counter_number: String(counter.counter_number),
      status: counter.status,
    });
    setSelectedOfficer((current) => ({
      ...current,
      [counter.id]: counter.officer ? String(counter.officer.id) : '',
    }));
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditSave = async (counterId: number) => {
    if (!editForm) return;

    resetMessages();

    const counterNumber = Number(editForm.counter_number);
    if (!Number.isInteger(counterNumber) || counterNumber < 1) {
      setLocalError('Nomor loket harus berupa angka minimal 1.');
      return;
    }

    try {
      await updateCounter(counterId, {
        counter_number: counterNumber,
        status: editForm.status,
      });

      const officerValue = selectedOfficer[counterId] ?? '';
      await assignOfficerToCounter(counterId, officerValue ? Number(officerValue) : null);

      await loadData();
      setSuccessMessage('Loket berhasil diperbarui.');
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        'Gagal memperbarui loket.';
      setLocalError(String(message));
    }
  };

  const handleCreateCounter = async () => {
    resetMessages();

    const serviceCategoryId = Number(createForm.service_category_id);
    const counterNumber = Number(createForm.counter_number);

    if (!serviceCategoryId) {
      setLocalError('Pilih layanan terlebih dahulu.');
      return;
    }

    if (!Number.isInteger(counterNumber) || counterNumber < 1) {
      setLocalError('Nomor loket harus berupa angka minimal 1.');
      return;
    }

    try {
      await createCounter({
        service_category_id: serviceCategoryId,
        counter_number: counterNumber,
        status: createForm.status,
        officer_id: createForm.officer_id ? Number(createForm.officer_id) : null,
      });

      await loadData();
      setCreateForm(defaultCreateForm);
      setShowCreateForm(false);
      setSuccessMessage('Loket baru berhasil dibuat.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        'Gagal membuat loket.';
      setLocalError(String(message));
    }
  };

  const handleUnassignOfficer = async (counterId: number) => {
    resetMessages();

    try {
      await assignOfficerToCounter(counterId, null);
      await loadData();
      setSuccessMessage('Petugas berhasil dilepas dari loket.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Gagal melepas petugas dari loket.';
      setLocalError(String(message));
    }
  };

  const handleDelete = async (counterId: number) => {
    resetMessages();

    if (!confirm('Hapus loket ini?')) {
      return;
    }

    try {
      await deleteCounter(counterId);
      await loadData();
      setSuccessMessage('Loket berhasil dihapus.');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Gagal menghapus loket.';
      setLocalError(String(message));
    }
  };

  const currentService = services.find(
    (service) => service.id === Number(createForm.service_category_id)
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">Counter Management</h2>
            <p className="text-xs text-outline mt-1">
              Loket aktif dan penugasan officer menentukan dashboard petugas berjalan.
            </p>
          </div>
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

          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-manrope font-bold text-lg text-primary">Buat Loket Baru</h3>
                <p className="text-sm text-outline mt-1">
                  Tambahkan loket agar officer bisa ditugaskan dan melihat antrian berjalan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm((current) => !current);
                  resetMessages();
                }}
                className="px-5 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showCreateForm ? 'Tutup Form' : 'Tambah Loket'}
              </button>
            </div>

            {showCreateForm && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Layanan</label>
                  <select
                    value={createForm.service_category_id}
                    onChange={(e) =>
                      setCreateForm((current) => ({
                        ...current,
                        service_category_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Pilih layanan</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.code} - {service.name}
                      </option>
                    ))}
                  </select>
                  {currentService && (
                    <p className="text-xs text-outline mt-1">
                      Maksimal loket untuk layanan ini: {currentService.max_counters}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Nomor Loket</label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.counter_number}
                    onChange={(e) =>
                      setCreateForm((current) => ({
                        ...current,
                        counter_number: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Contoh: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm((current) => ({
                        ...current,
                        status: e.target.value as CounterForm['status'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-outline mb-1">Officer</label>
                  <select
                    value={createForm.officer_id}
                    onChange={(e) =>
                      setCreateForm((current) => ({
                        ...current,
                        officer_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Belum ditugaskan</option>
                    {availableOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name}
                        {officer.counter ? ` - saat ini ${officer.counter.code}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 xl:col-span-4 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateCounter}
                    disabled={loading}
                    className="px-5 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Loket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateForm(defaultCreateForm);
                      setShowCreateForm(false);
                    }}
                    className="px-5 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-none">
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Counter #</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Officer</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant">
                {counters.map((counter) => (
                  <tr key={counter.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-5 font-headline font-bold text-primary">{counter.code}</td>

                    <td className="px-6 py-5">
                      {editingId === counter.id ? (
                        <input
                          type="number"
                          min={1}
                          value={editForm?.counter_number || ''}
                          onChange={(e) =>
                            setEditForm((current) =>
                              current
                                ? { ...current, counter_number: e.target.value }
                                : current
                            )
                          }
                          className="w-24 px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        counter.counter_number
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-medium">{counter.service.name}</div>
                      <div className="text-xs text-outline">{counter.service.code}</div>
                    </td>

                    <td className="px-6 py-5">
                      {editingId === counter.id ? (
                        <select
                          value={selectedOfficer[counter.id] ?? ''}
                          onChange={(e) =>
                            setSelectedOfficer((current) => ({
                              ...current,
                              [counter.id]: e.target.value,
                            }))
                          }
                          className="min-w-[220px] px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Belum ditugaskan</option>
                          {availableOfficers.map((officer) => (
                            <option key={officer.id} value={officer.id}>
                              {officer.name}
                              {officer.counter ? ` - saat ini ${officer.counter.code}` : ''}
                            </option>
                          ))}
                        </select>
                      ) : counter.officer ? (
                        <div>
                          <div className="font-medium text-on-surface">{counter.officer.name}</div>
                          <div className="text-xs text-outline">{counter.officer.nip}</div>
                        </div>
                      ) : (
                        <span className="text-outline">Belum ditugaskan</span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {editingId === counter.id ? (
                        <select
                          value={editForm?.status || 'ACTIVE'}
                          onChange={(e) =>
                            setEditForm((current) =>
                              current
                                ? { ...current, status: e.target.value as EditForm['status'] }
                                : current
                            )
                          }
                          className="px-3 py-2 border border-outline rounded-lg focus:ring-2 focus:ring-primary"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      ) : (
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-bold uppercase',
                            counter.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : counter.status === 'MAINTENANCE'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {counter.status}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {editingId === counter.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditSave(counter.id)}
                              className="text-emerald-600 hover:text-emerald-800 transition-colors"
                              title="Simpan"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Batal"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditStart(counter)}
                              className="text-primary hover:text-secondary transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUnassignOfficer(counter.id)}
                              className="text-amber-600 hover:text-amber-700 transition-colors"
                              title="Lepas petugas"
                              disabled={!counter.officer}
                            >
                              <UserMinus className={cn('w-5 h-5', !counter.officer && 'opacity-30')} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(counter.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {counters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-outline">
                      Belum ada loket. Tambahkan loket terlebih dahulu agar officer bisa ditugaskan dan dashboard petugas bisa melihat antrian berjalan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
