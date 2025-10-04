import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import ExpensesPage from "./pages/ExpensesPage";
import UsersPage from "./pages/UsersPage";
import FarmsPage from "./pages/FarmsPage";
import LoginPage from "./pages/LoginPage";
import LotsPage from "./pages/LotsPage";
import RoastsPage from "./pages/RoastsPage";
import SalesPage from "./pages/SalesPage";
import VarietiesPage from "./pages/VarietiesPage";
import DebtsPage from "./pages/DebtsPage";
import PriceReferencePage from "./pages/PriceReferencePage";
import InventoryPage from "./pages/InventoryPage";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="farms" element={<FarmsPage />} />
        <Route path="varieties" element={<VarietiesPage />} />
        <Route path="lots" element={<LotsPage />} />
        <Route path="roasts" element={<RoastsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="debts" element={<DebtsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="price-references" element={<PriceReferencePage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
