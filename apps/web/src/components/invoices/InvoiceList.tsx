import { Link } from 'react-router-dom';
import { formatAmount, formatDate } from '../../lib/format';
import type { Customer } from '../../types/customer';
import type { Invoice } from '../../types/invoice';
import type { PaymentRequest } from '../../types/payment-request';
import { CollectionStatusBadge } from './CollectionStatusBadge';

interface InvoiceListProps {
  invoices: Invoice[];
  customersById: Map<string, Customer>;
  paymentRequestsByInvoiceId: Map<string, PaymentRequest>;
}

export function InvoiceList({ invoices, customersById, paymentRequestsByInvoiceId }: InvoiceListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Factura</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Monto adeudado</th>
            <th scope="col" className="px-4 py-3">Fecha de vencimiento</th>
            <th scope="col" className="px-4 py-3">Cobranza</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => {
            const customer = customersById.get(invoice.customerId);

            return (
              <tr key={invoice.id} className="transition-colors hover:bg-stone-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link to={`/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {customer ? (
                    <Link to={`/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  ) : (
                    invoice.customerId
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatAmount(invoice.amount)} {invoice.currency}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <CollectionStatusBadge paymentRequest={paymentRequestsByInvoiceId.get(invoice.id) ?? null} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="text-sm font-medium text-teal-700 hover:underline"
                  >
                    Ver detalles →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
