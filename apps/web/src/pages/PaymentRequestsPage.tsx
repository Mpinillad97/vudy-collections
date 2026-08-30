import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/states/EmptyState';

export function PaymentRequestsPage() {
  return (
    <div>
      <PageHeader
        title="Payment Requests"
        description="Payment requests created through Vudy."
      />
      <EmptyState
        title="No payment requests yet"
        description="Payment requests created from an invoice will appear here."
      />
    </div>
  );
}
