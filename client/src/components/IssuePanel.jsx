import { useState } from 'react';
import { api } from '../lib/api.js';
import Banner from './Banner.jsx';
import { ArrowRightIcon, SearchIcon } from './icons.jsx';

// LOAN_DAYS mirrored here purely so the confirm step can show a due-date
// *preview* before the librarian commits — the server (rules.js) always
// computes the authoritative dueDate on issue; this is a display hint only.
const LOAN_DAYS_PREVIEW = 14;

export default function IssuePanel({ onIssued }) {
  const [studentQuery, setStudentQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [bookQuery, setBookQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function searchStudents(e) {
    e.preventDefault();
    setError('');
    try {
      const { students } = await api.get(`/students?search=${encodeURIComponent(studentQuery)}`);
      setStudents(students);
    } catch (err) {
      setError(err.message);
    }
  }

  async function searchBooks(e) {
    e.preventDefault();
    setError('');
    try {
      const { books } = await api.get(`/books?search=${encodeURIComponent(bookQuery)}`);
      setBooks(books);
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setSelectedStudent(null);
    setSelectedCopy(null);
    setSelectedBookTitle('');
    setStudents([]);
    setBooks([]);
    setStudentQuery('');
    setBookQuery('');
  }

  async function confirmIssue() {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { rental } = await api.post('/rentals/issue', {
        studentId: selectedStudent.id,
        barcode: selectedCopy.barcode,
      });
      setSuccess(
        `Issued "${selectedBookTitle}" to ${selectedStudent.name} — due back ${new Date(rental.dueDate).toLocaleDateString()}.`
      );
      reset();
      onIssued?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const previewDueDate = new Date(Date.now() + LOAN_DAYS_PREVIEW * 24 * 60 * 60 * 1000);

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-slate-900">Issue a book</h3>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-1.5">1</span>
            Find student
          </p>
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm">
              <span>
                {selectedStudent.name} ({selectedStudent.email})
              </span>
              <button className="link text-xs" onClick={() => setSelectedStudent(null)}>
                change
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={searchStudents} className="flex gap-2">
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search name, email, or enrollment no."
                  className="input flex-1"
                />
                <button className="btn-secondary">
                  <SearchIcon size={15} />
                </button>
              </form>
              {students.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {students.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        disabled={!s.isActive}
                        className="w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <span>
                          {s.name} ({s.email}){!s.isActive && ' — deactivated'}
                        </span>
                        {s.isActive && (
                          <span className="text-brand-600 font-medium shrink-0 ml-2 inline-flex items-center gap-1">
                            Select <ArrowRightIcon size={13} />
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-1.5">2</span>
            Find an available copy
          </p>
          {selectedCopy ? (
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm">
              <span>
                {selectedBookTitle} — barcode {selectedCopy.barcode}
              </span>
              <button className="link text-xs" onClick={() => setSelectedCopy(null)}>
                change
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={searchBooks} className="flex gap-2">
                <input
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="Search title, author, or ISBN"
                  className="input flex-1"
                />
                <button className="btn-secondary">
                  <SearchIcon size={15} />
                </button>
              </form>
              {books.length > 0 && (
                <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {books.map((b) => {
                    const available = b.copies.filter((c) => c.status === 'AVAILABLE');
                    return (
                      <li key={b.id} className="px-3 py-2 text-sm">
                        <p className="font-medium text-slate-800">
                          {b.title} <span className="text-slate-400 font-normal">by {b.author}</span>
                        </p>
                        {available.length === 0 ? (
                          <p className="text-slate-400 text-xs mt-1">No available copies.</p>
                        ) : (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {available.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCopy(c);
                                  setSelectedBookTitle(b.title);
                                }}
                                className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-brand-50 hover:border-brand-300 transition"
                              >
                                {c.barcode}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {selectedStudent && selectedCopy && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 animate-fade-in">
            <p className="text-sm text-slate-700">
              Due back on <span className="font-medium">{previewDueDate.toLocaleDateString()}</span> (14-day loan).
            </p>
            <button onClick={confirmIssue} disabled={submitting} className="btn-primary w-full mt-2 py-2">
              {submitting ? 'Issuing...' : 'Confirm issue'}
            </button>
          </div>
        )}

        <Banner type="error">{error}</Banner>
        <Banner type="success">{success}</Banner>
      </div>
    </div>
  );
}
