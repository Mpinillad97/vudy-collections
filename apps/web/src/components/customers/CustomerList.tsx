import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';
import type { Customer } from '../../types/customer';

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Contacto</th>
            <th scope="col" className="px-4 py-3">Cliente desde</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="transition-colors hover:bg-stone-100">
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
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Ver facturas →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
