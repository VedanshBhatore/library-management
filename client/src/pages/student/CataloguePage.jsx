import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';
import { SearchIcon, BookOpenIcon } from '../../components/icons.jsx';

export default function CataloguePage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (searchValue = '', categoryValue = '') => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (categoryValue) params.set('category', categoryValue);
    const qs = params.toString();
    const { books } = await api.get(`/catalogue${qs ? `?${qs}` : ''}`);
    setBooks(books);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    await load(search, category);
  }

  async function handleReserve(book) {
    setError('');
    setMessage('');
    try {
      await api.post('/reservations', { bookId: book.id });
      setMessage(`Reserved "${book.title}".`);
      await load(search, category);
    } catch (err) {
      setError(err.message);
    }
  }

  const categories = [...new Set(books.map((b) => b.category))].sort();

  return (
    <Layout>
      <h1 className="page-title">Catalogue</h1>
      <p className="mt-1 text-sm text-slate-500">Search the full collection and reserve what's checked out.</p>

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, ISBN, or category"
          className="input flex-1 min-w-[200px]"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="select w-auto">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn-secondary">
          <SearchIcon size={15} /> Search
        </button>
      </form>

      <div className="mt-2 space-y-2">
        <Banner type="error">{error}</Banner>
        <Banner type="success">{message}</Banner>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="card p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-400 text-white">
                  <BookOpenIcon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 leading-tight">{book.title}</p>
                  <p className="text-sm text-slate-500">
                    {book.author} &middot; {book.category} &middot; {book.year}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm">
                <span className={book.availableCopies > 0 ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'}>
                  {book.availableCopies} of {book.totalCopies}
                </span>{' '}
                <span className="text-slate-500">available</span>
              </p>

              <div className="mt-3 flex-1 flex items-end">
                {book.myReservationStatus ? (
                  <p className="badge bg-brand-50 text-brand-700 w-full justify-center py-1.5">
                    {book.myReservationStatus === 'READY' ? 'Ready for pickup' : 'You are on the waiting list'}
                  </p>
                ) : book.availableCopies === 0 ? (
                  <button onClick={() => handleReserve(book)} className="btn-primary w-full">
                    Reserve
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
