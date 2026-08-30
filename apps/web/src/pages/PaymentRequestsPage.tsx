import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { PaymentRequestList } from '../components/payment-requests/PaymentRequestList';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getPaymentRequests } from '../lib/api/payment-requests';
import type { PaymentRequest } from '../types/payment-request';

type Status = 'loading' | 'success' | 'error';

export function PaymentRequestsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPaymentRequests = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getPaymentRequests();
      setPaymentRequests(data);
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not load payment requests.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadPaymentRequests();
  }, [loadPaymentRequests]);

  return (
    <div>
      <PageHeader
        title="Payment Requests"
        description="Payment requests created through Vudy."
      />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState message={errorMessage} /> : null}
      {status === 'success' && paymentRequests.length === 0 ? (
        <EmptyState
          title="No payment requests yet"
          description="Payment requests created from an invoice will appear here."
        />
      ) : null}
      {status === 'success' && paymentRequests.length > 0 ? (
        <PaymentRequestList paymentRequests={paymentRequests} />
      ) : null}
    </div>
  );
}
