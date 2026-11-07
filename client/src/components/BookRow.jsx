import { useState } from 'react';
import { api } from '../lib/api.js';
import BookForm from './BookForm.jsx';
import CopyStatusBadge from './CopyStatusBadge.jsx';
import Banner from './Banner.jsx';
import { ChevronDownIcon } from './icons.jsx';

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
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
        <button onClick={() => setExpanded((x) => !x)} className="flex-1 text-left">
          <p className="font-medium text-slate-900">{book.title}</p>
          <p className="text-sm text-slate-500">
            {book.author} &middot; {book.category} &middot; {book.year} &middot;{' '}
            <span className={available > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
              {available} of {book.copies.length} available
            </span>
          </p>
        </button>
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => setEditing((x) => !x)} className="btn-ghost px-2.5 py-1.5">
            Edit
          </button>
          <button onClick={handleDeleteBook} className="btn-ghost px-2.5 py-1.5 hover:text-rose-600 hover:bg-rose-50">
            Delete
          </button>
          <button
            onClick={() => setExpanded((x) => !x)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <ChevronDownIcon size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
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
        <div className="px-4 pb-4 animate-fade-in">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-100">
                  <th className="py-2 px-3 font-medium">Barcode</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {book.copies.map((copy) => (
                  <tr key={copy.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 px-3 font-mono text-xs text-slate-600">{copy.barcode}</td>
                    <td className="py-2 px-3">
                      <CopyStatusBadge status={copy.status} />
                    </td>
                    <td className="py-2 px-3 space-x-3">
                      {copy.status !== 'AVAILABLE' && copy.status !== 'ISSUED' && (
                        <button onClick={() => handleCopyStatus(copy, 'AVAILABLE')} className="text-emerald-700 hover:underline text-xs font-medium">
                          Mark available
                        </button>
                      )}
                      {copy.status !== 'LOST' && (
                        <button onClick={() => handleCopyStatus(copy, 'LOST')} className="text-rose-600 hover:underline text-xs font-medium">
                          Mark lost
                        </button>
                      )}
                      {copy.status !== 'DAMAGED' && (
                        <button onClick={() => handleCopyStatus(copy, 'DAMAGED')} className="text-slate-600 hover:underline text-xs font-medium">
                          Mark damaged
                        </button>
                      )}
                      {copy.status !== 'ISSUED' && (
                        <button onClick={() => handleDeleteCopy(copy)} className="text-rose-600 hover:underline text-xs font-medium">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddCopy} className="mt-3 flex gap-2">
            <input
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              placeholder="New copy barcode"
              className="input flex-1"
            />
            <button className="btn-secondary">Add copy</button>
          </form>
        </div>
      )}
    </div>
  );
}
