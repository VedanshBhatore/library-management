import { useState } from 'react';
import { api } from '../lib/api.js';
import Banner from './Banner.jsx';

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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900">Issue a book</h3>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">1. Find student</p>
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded-md bg-indigo-50 px-3 py-2 text-sm">
              <span>
                {selectedStudent.name} ({selectedStudent.email})
              </span>
              <button className="text-indigo-600 hover:underline" onClick={() => setSelectedStudent(null)}>
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
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">
                  Search
                </button>
              </form>
              {students.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-md">
                  {students.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        disabled={!s.isActive}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {s.name} ({s.email}){!s.isActive && ' — deactivated'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">2. Find an available copy</p>
          {selectedCopy ? (
            <div className="flex items-center justify-between rounded-md bg-indigo-50 px-3 py-2 text-sm">
              <span>
                {selectedBookTitle} — barcode {selectedCopy.barcode}
              </span>
              <button className="text-indigo-600 hover:underline" onClick={() => setSelectedCopy(null)}>
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
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200">
                  Search
                </button>
              </form>
              {books.length > 0 && (
                <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-md">
                  {books.map((b) => {
                    const available = b.copies.filter((c) => c.status === 'AVAILABLE');
                    return (
                      <li key={b.id} className="px-3 py-2 text-sm">
                        <p className="font-medium text-gray-800">
                          {b.title} <span className="text-gray-400 font-normal">by {b.author}</span>
                        </p>
                        {available.length === 0 ? (
                          <p className="text-gray-400 text-xs mt-1">No available copies.</p>
                        ) : (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {available.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCopy(c);
                                  setSelectedBookTitle(b.title);
                                }}
                                className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-indigo-50 hover:border-indigo-300"
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
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-sm text-gray-700">
              Due back on <span className="font-medium">{previewDueDate.toLocaleDateString()}</span> (14-day loan).
            </p>
            <button
              onClick={confirmIssue}
              disabled={submitting}
              className="mt-2 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
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
