import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import RentalCard from '../../components/RentalCard.jsx';
import { api } from '../../lib/api.js';
import { BookOpenIcon } from '../../components/icons.jsx';

export default function StudentDashboardPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { rentals } = await api.get('/rentals/mine');
    setRentals(rentals);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <h1 className="page-title">My Rentals</h1>
      <p className="mt-1 text-sm text-slate-500">Everything you currently have checked out.</p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : rentals.length === 0 ? (
        <div className="mt-5 card flex flex-col items-center justify-center text-center p-12">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <BookOpenIcon size={22} />
          </span>
          <p className="mt-4 text-sm text-slate-500 max-w-xs">
            You have no active rentals. Browse the catalogue to borrow a book.
          </p>
          <Link to="/student/catalogue" className="btn-primary mt-4">
            Browse catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} onRenewed={load} />
          ))}
        </div>
      )}
    </Layout>
  );
}
