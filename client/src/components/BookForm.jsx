import { useState } from 'react';

const emptyForm = { isbn: '', title: '', author: '', publisher: '', category: '', year: '' };

export default function BookForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initial ? { ...initial, year: String(initial.year) } : emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...form, year: Number(form.year) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input required placeholder="ISBN" value={form.isbn} onChange={(e) => set('isbn', e.target.value)} className="input" />
      <input required placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} className="input" />
      <input required placeholder="Author" value={form.author} onChange={(e) => set('author', e.target.value)} className="input" />
      <input required placeholder="Publisher" value={form.publisher} onChange={(e) => set('publisher', e.target.value)} className="input" />
      <input required placeholder="Category" value={form.category} onChange={(e) => set('category', e.target.value)} className="input" />
      <input required type="number" placeholder="Year" value={form.year} onChange={(e) => set('year', e.target.value)} className="input" />
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={submitting} className="btn-primary">
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
