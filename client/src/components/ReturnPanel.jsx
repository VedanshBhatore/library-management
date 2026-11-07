import { useState } from 'react';
import { api } from '../lib/api.js';
import Banner from './Banner.jsx';
import { SearchIcon } from './icons.jsx';

// A USB barcode scanner just types digits into a focused text input and
// hits Enter — no scanner-specific code needed, plain form submission works.
export default function ReturnPanel({ onReturned }) {
  const [barcode, setBarcode] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function lookUp(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPreview(null);
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/rentals/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReturn() {
    setLoading(true);
    setError('');
    try {
      const { rental, daysLate, fineAmount } = await api.post('/rentals/return', { barcode: barcode.trim() });
      setSuccess(
        daysLate > 0
          ? `Returned "${rental.copy.book.title}" — ${daysLate} day(s) late, fine of ₹${fineAmount}.`
          : `Returned "${rental.copy.book.title}" on time.`
      );
      setPreview(null);
      setBarcode('');
      onReturned?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-slate-900">Return a book</h3>

      <form onSubmit={lookUp} className="mt-4 flex gap-2">
        <input
          autoFocus
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan or type barcode"
          className="input flex-1"
        />
        <button disabled={loading} className="btn-secondary">
          <SearchIcon size={15} /> Look up
        </button>
      </form>

      {preview && (
        <div className="mt-3 rounded-xl border border-slate-200 p-3.5 text-sm space-y-1.5 animate-fade-in">
          <p>
            <span className="text-slate-500">Book:</span> {preview.rental.copy.book.title}
          </p>
          <p>
            <span className="text-slate-500">Student:</span> {preview.rental.student.name}
          </p>
          <p>
            <span className="text-slate-500">Due date:</span> {new Date(preview.rental.dueDate).toLocaleDateString()}
          </p>
          <p>
            <span className="text-slate-500">Days late:</span>{' '}
            <span className={preview.daysLate > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
              {preview.daysLate}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Fine owed:</span>{' '}
            <span className="font-medium">₹{preview.fineOwed}</span>
          </p>
          <button onClick={confirmReturn} disabled={loading} className="btn-primary w-full mt-1 py-2">
            {loading ? 'Returning...' : 'Confirm return'}
          </button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Banner type="error">{error}</Banner>
        <Banner type="success">{success}</Banner>
      </div>
    </div>
  );
}
