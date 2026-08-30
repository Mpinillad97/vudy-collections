import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentRequestsPage } from './pages/PaymentRequestsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payment-requests" element={<PaymentRequestsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
