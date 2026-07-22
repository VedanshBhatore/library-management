import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import RentalCard from '../../components/RentalCard.jsx';
import { api } from '../../lib/api.js';

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
      <h1 className="text-xl font-semibold text-gray-900">My Rentals</h1>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : rentals.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">You have no active rentals. Browse the catalogue to borrow a book.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} onRenewed={load} />
          ))}
        </div>
      )}
    </Layout>
  );
}
