import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import BookForm from '../../components/BookForm.jsx';
import BookRow from '../../components/BookRow.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query = '') => {
    try {
      const { books } = await api.get(`/books${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setBooks(books);
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

  async function handleAddBook(data) {
    setError('');
    try {
      await api.post('/books', data);
      setShowAddForm(false);
      await load(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Books</h1>
        <button
          onClick={() => setShowAddForm((x) => !x)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showAddForm ? 'Cancel' : 'Add book'}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <BookForm submitLabel="Create book" onSubmit={handleAddBook} />
        </div>
      )}

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or ISBN"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">Search</button>
      </form>

      <div className="mt-2">
        <Banner type="error">{error}</Banner>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-5 text-sm text-gray-400">Loading...</p>
        ) : books.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No books found.</p>
        ) : (
          books.map((book) => <BookRow key={book.id} book={book} onChange={() => load(search)} />)
        )}
      </div>
    </Layout>
  );
}
