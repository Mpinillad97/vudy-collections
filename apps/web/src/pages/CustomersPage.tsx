import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CustomerList } from '../components/customers/CustomerList';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { SuccessState } from '../components/states/SuccessState';
import { ApiError } from '../lib/api/client';
import { getCustomers } from '../lib/api/customers';
import type { Customer } from '../types/customer';

type ListStatus = 'loading' | 'success' | 'error';

export function CustomersPage() {
  const [status, setStatus] = useState<ListStatus>('loading');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getCustomers();
      setCustomers(data);
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load customers.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  function handleToggleForm() {
    setSuccessMessage(null);
    setIsFormOpen((open) => !open);
  }

  function handleCreated(customer: Customer) {
    setIsFormOpen(false);
    setSuccessMessage(`Customer created — "${customer.name}" is ready for invoicing.`);
    loadCustomers();
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="The businesses you invoice and collect payments from."
        action={
          <Button variant={isFormOpen ? 'secondary' : 'primary'} onClick={handleToggleForm}>
            {isFormOpen ? 'Cancel' : 'New customer'}
          </Button>
        }
      />

      {successMessage ? <SuccessState message={successMessage} /> : null}

      {isFormOpen ? (
        <Card className="mb-6">
          <CustomerForm onCreated={handleCreated} />
        </Card>
      ) : null}

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState message={errorMessage} /> : null}
      {status === 'success' && customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start managing invoices and collections."
        />
      ) : null}
      {status === 'success' && customers.length > 0 ? <CustomerList customers={customers} /> : null}
    </div>
  );
}
