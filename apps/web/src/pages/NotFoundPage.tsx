import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/states/EmptyState';

export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Page not found" description="The page you're looking for doesn't exist." />
      <EmptyState
        title="404"
        description="Check the address, or head back to the dashboard."
        action={
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
