import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getCustomers } from '../lib/api/customers';
import { getInvoices } from '../lib/api/invoices';
import { getPaymentRequests } from '../lib/api/payment-requests';
import type { Customer } from '../types/customer';
import type { Invoice } from '../types/invoice';
import type { PaymentRequest } from '../types/payment-request';

type Status = 'loading' | 'success' | 'error';

export function DashboardPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Reuses the three list endpoints every other page already calls — no new
  // backend query, just a client-side summary of data we already fetch.
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [customersData, invoicesData, paymentRequestsData] = await Promise.all([
        getCustomers(),
        getInvoices(),
        getPaymentRequests(),
      ]);
      setCustomers(customersData);
      setInvoices(invoicesData);
      setPaymentRequests(paymentRequestsData);
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not load your Collections overview.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // An invoice is "pending collection" until it has an associated payment
  // request — derived purely from data we already have, nothing invented.
  const pendingCollectionCount = useMemo(() => {
    const invoiceIdsWithPaymentRequest = new Set(
      paymentRequests.map((paymentRequest) => paymentRequest.invoiceId).filter(Boolean),
    );
    return invoices.filter((invoice) => !invoiceIdsWithPaymentRequest.has(invoice.id)).length;
  }, [invoices, paymentRequests]);

  const metrics = [
    { label: 'Customers', value: customers.length, to: '/customers' },
    { label: 'Invoices', value: invoices.length, to: '/invoices' },
    { label: 'Pending collection', value: pendingCollectionCount, to: '/invoices' },
    { label: 'Payment requests', value: paymentRequests.length, to: '/payment-requests' },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Collections overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Vudy Collections</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Manage your B2B receivables and collect payments through Vudy's payment infrastructure.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/invoices"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            View invoices
          </Link>
          <Link
            to="/customers"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            View customers
          </Link>
        </div>
      </div>

      {status === 'loading' ? <LoadingState message="Loading your Collections overview…" /> : null}
      {status === 'error' ? <ErrorState message={errorMessage} /> : null}

      {status === 'success' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Link key={metric.label} to={metric.to} className="group block">
              <Card className="h-full transition-colors group-hover:border-indigo-200 group-hover:shadow-md">
                <p className="text-3xl font-semibold tracking-tight text-indigo-600">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
