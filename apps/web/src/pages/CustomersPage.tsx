import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/states/EmptyState';

export function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" description="Customers Collections has on file." />
      <EmptyState
        title="No customers yet"
        description="Customers you add will appear here."
      />
    </div>
  );
}
