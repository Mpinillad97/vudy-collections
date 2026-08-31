import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { Customer } from '../types/customer';
import type { Invoice } from '../types/invoice';

type Status = 'loading' | 'success' | 'error';

export function InvoicesPage() {
  const [invoiceStatus, setInvoiceStatus] = useState<Status>('loading');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceError, setInvoiceError] = useState('');

  const [customersStatus, setCustomersStatus] = useState<Status>('loading');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setInvoiceStatus('loading');
    try {
      const data = await getInvoices();
      setInvoices(data);
      setInvoiceStatus('success');
    } catch (error) {
      setInvoiceError(error instanceof ApiError ? error.message : 'Could not load invoices.');
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

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [loadInvoices, loadCustomers]);

  const customersById = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const customer of customers) {
      map.set(customer.id, customer);
    }
    return map;
  }, [customers]);

  function handleToggleForm() {
    setSuccessMessage(null);
    setIsFormOpen((open) => !open);
  }

  function handleCreated(invoice: Invoice) {
    setIsFormOpen(false);
    setSuccessMessage(`Invoice created — "${invoice.number}" is ready to collect.`);
    loadInvoices();
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Outstanding payment obligations owed by your customers."
        action={
          <Button variant={isFormOpen ? 'secondary' : 'primary'} onClick={handleToggleForm}>
            {isFormOpen ? 'Cancel' : 'New invoice'}
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
          />
        </Card>
      ) : null}

      {invoiceStatus === 'loading' ? <LoadingState /> : null}
      {invoiceStatus === 'error' ? <ErrorState message={invoiceError} /> : null}
      {invoiceStatus === 'success' && invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice for a customer to start a collection."
        />
      ) : null}
      {invoiceStatus === 'success' && invoices.length > 0 ? (
        <InvoiceList invoices={invoices} customersById={customersById} />
      ) : null}
    </div>
  );
}
