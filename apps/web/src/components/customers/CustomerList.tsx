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
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Email</th>
            <th scope="col" className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{customer.name}</td>
              <td className="px-4 py-3 text-slate-600">{customer.email}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
