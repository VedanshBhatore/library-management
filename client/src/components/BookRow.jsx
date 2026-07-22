import { useState } from 'react';
import { api } from '../lib/api.js';
import BookForm from './BookForm.jsx';
import CopyStatusBadge from './CopyStatusBadge.jsx';
import Banner from './Banner.jsx';

export default function BookRow({ book, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  const [error, setError] = useState('');

  const available = book.copies.filter((c) => c.status === 'AVAILABLE').length;

  async function withErrorHandling(fn) {
    setError('');
    try {
      await fn();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddCopy(e) {
    e.preventDefault();
    if (!newBarcode.trim()) return;
    await withErrorHandling(async () => {
      await api.post(`/books/${book.id}/copies`, { barcode: newBarcode.trim() });
      setNewBarcode('');
    });
  }

  async function handleCopyStatus(copy, status) {
    await withErrorHandling(() => api.patch(`/copies/${copy.id}`, { status }));
  }

  async function handleDeleteCopy(copy) {
    if (!confirm(`Delete copy ${copy.barcode}?`)) return;
    await withErrorHandling(() => api.delete(`/copies/${copy.id}`));
  }

  async function handleDeleteBook() {
    if (!confirm(`Delete "${book.title}"? This only works if it has no copies.`)) return;
    await withErrorHandling(() => api.delete(`/books/${book.id}`));
  }

  async function handleUpdateBook(data) {
    await withErrorHandling(async () => {
      await api.patch(`/books/${book.id}`, data);
      setEditing(false);
    });
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setExpanded((x) => !x)} className="flex-1 text-left">
          <p className="font-medium text-gray-900">{book.title}</p>
          <p className="text-sm text-gray-500">
            {book.author} &middot; {book.category} &middot; {book.year} &middot; {available} of {book.copies.length} available
          </p>
        </button>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setEditing((x) => !x)} className="text-indigo-600 hover:underline">
            Edit
          </button>
          <button onClick={handleDeleteBook} className="text-red-600 hover:underline">
            Delete
          </button>
          <button onClick={() => setExpanded((x) => !x)} className="text-gray-400 hover:text-gray-600">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 pb-2">
          <Banner type="error">{error}</Banner>
        </div>
      )}

      {editing && (
        <div className="px-4 pb-4">
          <BookForm initial={book} submitLabel="Save changes" onSubmit={handleUpdateBook} onCancel={() => setEditing(false)} />
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1.5 pr-4">Barcode</th>
                <th className="py-1.5 pr-4">Status</th>
                <th className="py-1.5 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {book.copies.map((copy) => (
                <tr key={copy.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-4 font-mono text-xs">{copy.barcode}</td>
                  <td className="py-1.5 pr-4">
                    <CopyStatusBadge status={copy.status} />
                  </td>
                  <td className="py-1.5 pr-4 space-x-2">
                    {copy.status !== 'AVAILABLE' && copy.status !== 'ISSUED' && (
                      <button onClick={() => handleCopyStatus(copy, 'AVAILABLE')} className="text-green-700 hover:underline">
                        Mark available
                      </button>
                    )}
                    {copy.status !== 'LOST' && (
                      <button onClick={() => handleCopyStatus(copy, 'LOST')} className="text-red-600 hover:underline">
                        Mark lost
                      </button>
                    )}
                    {copy.status !== 'DAMAGED' && (
                      <button onClick={() => handleCopyStatus(copy, 'DAMAGED')} className="text-gray-600 hover:underline">
                        Mark damaged
                      </button>
                    )}
                    {copy.status !== 'ISSUED' && (
                      <button onClick={() => handleDeleteCopy(copy)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={handleAddCopy} className="mt-3 flex gap-2">
            <input
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              placeholder="New copy barcode"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">Add copy</button>
          </form>
        </div>
      )}
    </div>
  );
}
