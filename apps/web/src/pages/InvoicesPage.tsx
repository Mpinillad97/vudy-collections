import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { SuccessState } from '../components/states/SuccessState';
import { ApiError } from '../lib/api/client';
import { getCustomers } from '../lib/api/customers';
import { getInvoices } from '../lib/api/invoices';
import { getPaymentRequests } from '../lib/api/payment-requests';
import type { Customer } from '../types/customer';
import type { Invoice } from '../types/invoice';
import type { PaymentRequest } from '../types/payment-request';

type Status = 'loading' | 'success' | 'error';

export function InvoicesPage() {
  // Arriving from a Customer's "Create invoice" CTA (?customerId=...) opens
  // the form pre-scoped to that customer instead of dropping the user back
  // into a blank list.
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;

  const [invoiceStatus, setInvoiceStatus] = useState<Status>('loading');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceError, setInvoiceError] = useState('');

  const [customersStatus, setCustomersStatus] = useState<Status>('loading');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialCustomerId));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setInvoiceStatus('loading');
    try {
      const data = await getInvoices();
      setInvoices(data);
      setInvoiceStatus('success');
    } catch (error) {
      setInvoiceError(error instanceof ApiError ? error.message : 'No se pudieron cargar las facturas.');
      setInvoiceStatus('error');
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    setCustomersStatus('loading');
    try {
      const data = await getCustomers();
      setCustomers(data);
      setCustomersStatus('success');
    } catch {
      setCustomersStatus('error');
    }
  }, []);

  // Supplementary to the main invoice list — used only to show each
  // invoice's real collection status, so a failure here shouldn't block the
  // page the way a failed invoice/customer load does.
  const loadPaymentRequests = useCallback(async () => {
    try {
      setPaymentRequests(await getPaymentRequests());
    } catch {
      setPaymentRequests([]);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadPaymentRequests();
  }, [loadInvoices, loadCustomers, loadPaymentRequests]);

  const customersById = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const customer of customers) {
      map.set(customer.id, customer);
    }
    return map;
  }, [customers]);

  const paymentRequestsByInvoiceId = useMemo(() => {
    const map = new Map<string, PaymentRequest>();
    for (const paymentRequest of paymentRequests) {
      if (paymentRequest.invoiceId) {
        map.set(paymentRequest.invoiceId, paymentRequest);
      }
    }
    return map;
  }, [paymentRequests]);

  function handleToggleForm() {
    setSuccessMessage(null);
    setIsFormOpen((open) => !open);
  }

  function handleCreated(invoice: Invoice) {
    setIsFormOpen(false);
    setSuccessMessage(`Factura creada — "${invoice.number}" lista para gestionar su cobro.`);
    loadInvoices();
  }

  return (
    <div>
      <PageHeader
        title="Facturas"
        description="Obligaciones de pago pendientes de tus clientes."
        action={
          <Button variant={isFormOpen ? 'secondary' : 'primary'} onClick={handleToggleForm}>
            {isFormOpen ? 'Cancelar' : 'Crear factura'}
          </Button>
        }
      />

      {successMessage ? <SuccessState message={successMessage} /> : null}

      {isFormOpen ? (
        <Card className="mb-6">
          <InvoiceForm
            customers={customers}
            customersStatus={customersStatus}
            onCreated={handleCreated}
            initialCustomerId={initialCustomerId}
          />
        </Card>
      ) : null}

      {invoiceStatus === 'loading' ? <LoadingState /> : null}
      {invoiceStatus === 'error' ? <ErrorState message={invoiceError} /> : null}
      {invoiceStatus === 'success' && invoices.length === 0 ? (
        <EmptyState
          title="Aún no tienes facturas"
          description="Crea una factura para un cliente y comienza a gestionar su cobro."
        />
      ) : null}
      {invoiceStatus === 'success' && invoices.length > 0 ? (
        <InvoiceList
          invoices={invoices}
          customersById={customersById}
          paymentRequestsByInvoiceId={paymentRequestsByInvoiceId}
        />
      ) : null}
    </div>
  );
}
