import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';
import type { Customer } from '../../types/customer';

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Customer</th>
            <th scope="col" className="px-4 py-3">Contact</th>
            <th scope="col" className="px-4 py-3">Customer since</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link to={`/customers/${customer.id}`} className="hover:underline">
                  {customer.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{customer.email}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/customers/${customer.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  View invoices →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
