import { Link } from 'react-router-dom';
import { formatAmount, formatDate } from '../../lib/format';
import type { Customer } from '../../types/customer';
import type { Invoice } from '../../types/invoice';
import type { PaymentRequest } from '../../types/payment-request';
import { StatusBadge } from './StatusBadge';

interface PaymentRequestListProps {
  paymentRequests: PaymentRequest[];
  invoicesById: Map<string, Invoice>;
  customersById: Map<string, Customer>;
}

export function PaymentRequestList({
  paymentRequests,
  invoicesById,
  customersById,
}: PaymentRequestListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Factura</th>
            <th scope="col" className="px-4 py-3">Monto</th>
            <th scope="col" className="px-4 py-3">Red / Token</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3">Creada</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paymentRequests.map((paymentRequest) => {
            const invoice = paymentRequest.invoiceId ? invoicesById.get(paymentRequest.invoiceId) : undefined;
            const customer = invoice ? customersById.get(invoice.customerId) : undefined;

            return (
              <tr key={paymentRequest.id} className="transition-colors hover:bg-stone-100">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {customer ? (
                    <Link to={`/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {invoice && paymentRequest.invoiceId ? (
                    <Link to={`/invoices/${paymentRequest.invoiceId}`} className="hover:underline">
                      {invoice.number}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatAmount(paymentRequest.amount)} {paymentRequest.currencyToken}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {paymentRequest.requestedChain} / {paymentRequest.requestedToken}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={paymentRequest.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(paymentRequest.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {paymentRequest.invoiceId ? (
                    <Link
                      to={`/invoices/${paymentRequest.invoiceId}`}
                      className="text-sm font-medium text-teal-700 hover:underline"
                    >
                      Ver factura →
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
