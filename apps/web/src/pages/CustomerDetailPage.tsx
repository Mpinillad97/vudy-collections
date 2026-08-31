import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getCustomer } from '../lib/api/customers';
import { getInvoices } from '../lib/api/invoices';
import { formatAmount, formatDate } from '../lib/format';
import type { Customer } from '../types/customer';
import type { Invoice } from '../types/invoice';

type Status = 'loading' | 'success' | 'error';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Invoice.customerId already exists on every invoice — filtering the
  // existing list client-side avoids needing a new backend endpoint just to
  // scope invoices to one customer.
  const load = useCallback(async () => {
    if (!id) {
      setErrorMessage('No customer id was provided.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const [customerData, allInvoices] = await Promise.all([getCustomer(id), getInvoices()]);
      setCustomer(customerData);
      setInvoices(allInvoices.filter((invoice) => invoice.customerId === id));
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this customer.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Customers', to: '/customers' }, { label: customer?.name ?? 'Customer' }]} />
      <PageHeader
        title={customer ? customer.name : 'Customer'}
        description="Contact details and outstanding invoices for this customer."
      />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState title="Could not load customer" message={errorMessage} /> : null}

      {status === 'success' && customer ? (
        <div className="flex flex-col gap-4">
          <Card>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</dt>
                <dd className="mt-1 text-sm text-slate-900">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Customer since
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Invoices</h2>

            {invoices.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No invoices yet"
                  description="Create an invoice for this customer to start a collection."
                  action={
                    <Link
                      to="/invoices"
                      className="text-sm font-medium text-indigo-600 underline hover:no-underline"
                    >
                      Go to Invoices →
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Invoice
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Amount due
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Currency
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Due date
                      </th>
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
                        <td className="px-4 py-3 text-slate-600">{formatAmount(invoice.amount)}</td>
                        <td className="px-4 py-3 text-slate-600">{invoice.currency}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(invoice.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Link to="/customers" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to customers
          </Link>
        </div>
      ) : null}
    </div>
  );
}
