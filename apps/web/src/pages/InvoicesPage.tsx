import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/states/EmptyState';

export function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices" description="Invoices issued to your customers." />
      <EmptyState
        title="No invoices yet"
        description="Invoices you create will appear here."
      />
    </div>
  );
}
