import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

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
      <h1 className="text-xl font-semibold text-gray-900">Students</h1>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or enrollment no."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">Search</button>
      </form>

      <div className="mt-2">
        <Banner type="error">{error}</Banner>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <p className="p-5 text-sm text-gray-400">Loading...</p>
        ) : students.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No students found.</p>
        ) : (
          students.map((s) => (
            <div key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {s.name} <span className="text-gray-400 font-normal text-sm">({s.enrollmentNo})</span>
                  </p>
                  <p className="text-sm text-gray-500">{s.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{s.activeRentalsCount} active rental(s)</span>
                  <span className={`text-xs rounded px-2 py-0.5 font-medium ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Deactivated'}
                  </span>
                  <button
                    onClick={() => toggleActive(s)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {s.unpaidFines.length > 0 && (
                <div className="mt-2 rounded-md bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Unpaid fines — ₹{s.unpaidFinesTotal} total
                  </p>
                  <ul className="space-y-1">
                    {s.unpaidFines.map((f) => (
                      <li key={f.id} className="flex items-center justify-between text-sm">
                        <span>
                          {f.bookTitle} — ₹{f.amount}
                        </span>
                        <button onClick={() => collectFine(f.id)} className="text-indigo-600 hover:underline text-xs">
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
