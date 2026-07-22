import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

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
      <h1 className="text-xl font-semibold text-gray-900">Catalogue</h1>

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, ISBN, or category"
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">Search</button>
      </form>

      <div className="mt-2 space-y-2">
        <Banner type="error">{error}</Banner>
        <Banner type="success">{message}</Banner>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{book.title}</p>
              <p className="text-sm text-gray-500">
                {book.author} &middot; {book.category} &middot; {book.year}
              </p>
              <p className="mt-2 text-sm">
                <span className={book.availableCopies > 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                  {book.availableCopies} of {book.totalCopies}
                </span>{' '}
                available
              </p>

              {book.myReservationStatus ? (
                <p className="mt-3 text-xs rounded bg-indigo-50 text-indigo-700 px-2 py-1 inline-block">
                  {book.myReservationStatus === 'READY' ? 'Ready for pickup' : 'You are on the waiting list'}
                </p>
              ) : book.availableCopies === 0 ? (
                <button
                  onClick={() => handleReserve(book)}
                  className="mt-3 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Reserve
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
