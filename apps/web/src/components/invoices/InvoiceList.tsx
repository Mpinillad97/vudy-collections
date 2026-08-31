import { Link } from 'react-router-dom';
import { formatAmount, formatDate } from '../../lib/format';
import type { Customer } from '../../types/customer';
import type { Invoice } from '../../types/invoice';

interface InvoiceListProps {
  invoices: Invoice[];
  customersById: Map<string, Customer>;
}

export function InvoiceList({ invoices, customersById }: InvoiceListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Invoice</th>
            <th scope="col" className="px-4 py-3">Customer</th>
            <th scope="col" className="px-4 py-3">Amount due</th>
            <th scope="col" className="px-4 py-3">Due date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="transition-colors hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link to={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.number}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {customersById.get(invoice.customerId)?.name ?? invoice.customerId}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatAmount(invoice.amount)} {invoice.currency}
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(invoice.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
