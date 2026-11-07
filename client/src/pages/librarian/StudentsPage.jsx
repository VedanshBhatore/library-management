import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';
import { SearchIcon, AlertTriangleIcon } from '../../components/icons.jsx';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query = '') => {
    try {
      const { students } = await api.get(`/students${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setStudents(students);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    await load(search);
  }

  async function toggleActive(student) {
    setError('');
    try {
      await api.patch(`/students/${student.id}/status`, { isActive: !student.isActive });
      await load(search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function collectFine(fineId) {
    setError('');
    try {
      await api.post(`/fines/${fineId}/collect`);
      await load(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <h1 className="page-title">Students</h1>
      <p className="mt-1 text-sm text-slate-500">Look up accounts, manage status, and collect fines.</p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or enrollment no."
          className="input flex-1"
        />
        <button className="btn-secondary">
          <SearchIcon size={15} /> Search
        </button>
      </form>

      <div className="mt-2">
        <Banner type="error">{error}</Banner>
      </div>

      <div className="mt-4 card divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading...</p>
        ) : students.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No students found.</p>
        ) : (
          students.map((s) => (
            <div key={s.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {s.name} <span className="text-slate-400 font-normal text-sm">({s.enrollmentNo})</span>
                  </p>
                  <p className="text-sm text-slate-500">{s.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{s.activeRentalsCount} active rental(s)</span>
                  <span className={`badge ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className={`badge-dot ${s.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {s.isActive ? 'Active' : 'Deactivated'}
                  </span>
                  <button onClick={() => toggleActive(s)} className="link text-sm">
                    {s.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {s.unpaidFines.length > 0 && (
                <div className="mt-3 rounded-xl bg-rose-50 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 mb-2">
                    <AlertTriangleIcon size={13} /> Unpaid fines — ₹{s.unpaidFinesTotal} total
                  </p>
                  <ul className="space-y-1.5">
                    {s.unpaidFines.map((f) => (
                      <li key={f.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">
                          {f.bookTitle} — ₹{f.amount}
                        </span>
                        <button onClick={() => collectFine(f.id)} className="link text-xs">
                          Mark collected
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
