import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PaymentRequestList } from '../components/payment-requests/PaymentRequestList';
import { EmptyState } from '../components/states/EmptyState';
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

export function PaymentRequestsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Customer/Invoice context for each Payment Request is resolved client-side
  // from the two lists we already have endpoints for — no new backend
  // endpoint needed just to label a table.
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [paymentRequestsData, invoicesData, customersData] = await Promise.all([
        getPaymentRequests(),
        getInvoices(),
        getCustomers(),
      ]);
      setPaymentRequests(paymentRequestsData);
      setInvoices(invoicesData);
      setCustomers(customersData);
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'No se pudieron cargar las solicitudes de pago.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invoicesById = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const invoice of invoices) {
      map.set(invoice.id, invoice);
    }
    return map;
  }, [invoices]);

  const customersById = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const customer of customers) {
      map.set(customer.id, customer);
    }
    return map;
  }, [customers]);

  return (
    <div>
      <PageHeader
        title="Solicitudes de pago"
        description="Cada cobro que hemos enviado a la infraestructura de pago de Vudy."
      />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState message={errorMessage} /> : null}
      {status === 'success' && paymentRequests.length === 0 ? (
        <EmptyState
          title="Aún no hay solicitudes de pago"
          description="Crea una solicitud de pago desde una factura pendiente cuando quieras iniciar el cobro."
          action={
            <Link to="/invoices" className="text-sm font-medium text-indigo-600 underline hover:no-underline">
              Ver facturas →
            </Link>
          }
        />
      ) : null}
      {status === 'success' && paymentRequests.length > 0 ? (
        <PaymentRequestList
          paymentRequests={paymentRequests}
          invoicesById={invoicesById}
          customersById={customersById}
        />
      ) : null}
    </div>
  );
}
