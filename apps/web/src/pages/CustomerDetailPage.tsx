import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { CollectionStatusBadge } from '../components/invoices/CollectionStatusBadge';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getCustomer } from '../lib/api/customers';
import { getInvoices } from '../lib/api/invoices';
import { getPaymentRequests } from '../lib/api/payment-requests';
import { formatAmount, formatDate } from '../lib/format';
import type { Customer } from '../types/customer';
import type { Invoice } from '../types/invoice';
import type { PaymentRequest } from '../types/payment-request';

type Status = 'loading' | 'success' | 'error';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Invoice.customerId already exists on every invoice — filtering the
  // existing list client-side avoids needing a new backend endpoint just to
  // scope invoices to one customer. Payment requests are fetched the same
  // way so each invoice row can show its real collection status.
  const load = useCallback(async () => {
    if (!id) {
      setErrorMessage('No se proporcionó un identificador de cliente.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const [customerData, allInvoices, allPaymentRequests] = await Promise.all([
        getCustomer(id),
        getInvoices(),
        getPaymentRequests(),
      ]);
      setCustomer(customerData);
      setInvoices(allInvoices.filter((invoice) => invoice.customerId === id));
      setPaymentRequests(allPaymentRequests);
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'No se pudo cargar este cliente.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const paymentRequestsByInvoiceId = useMemo(() => {
    const map = new Map<string, PaymentRequest>();
    for (const paymentRequest of paymentRequests) {
      if (paymentRequest.invoiceId) {
        map.set(paymentRequest.invoiceId, paymentRequest);
      }
    }
    return map;
  }, [paymentRequests]);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Clientes', to: '/customers' }, { label: customer?.name ?? 'Cliente' }]} />
      <PageHeader
        title={customer ? customer.name : 'Cliente'}
        description="Información de contacto y facturas pendientes de este cliente."
        action={
          customer ? (
            <Link
              to={`/invoices?customerId=${customer.id}`}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Crear factura
            </Link>
          ) : null
        }
      />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState title="No se pudo cargar el cliente" message={errorMessage} /> : null}

      {status === 'success' && customer ? (
        <div className="flex flex-col gap-4">
          <Card>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Contacto</dt>
                <dd className="mt-1 text-sm text-slate-900">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cliente desde
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Facturas</h2>

            {invoices.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Este cliente aún no tiene facturas"
                  description="Crea una factura para este cliente y comienza a gestionar su cobro."
                  action={
                    <Link
                      to="/invoices"
                      className="text-sm font-medium text-indigo-600 underline hover:no-underline"
                    >
                      Ir a Facturas →
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
                        Factura
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Monto adeudado
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Fecha de vencimiento
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Cobranza
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">Acción</span>
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
                        <td className="px-4 py-3 text-slate-600">
                          {formatAmount(invoice.amount)} {invoice.currency}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(invoice.dueDate)}</td>
                        <td className="px-4 py-3">
                          <CollectionStatusBadge
                            paymentRequest={paymentRequestsByInvoiceId.get(invoice.id) ?? null}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                          >
                            Ver detalles →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Link to="/customers" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Volver a Clientes
          </Link>
        </div>
      ) : null}
    </div>
  );
}
