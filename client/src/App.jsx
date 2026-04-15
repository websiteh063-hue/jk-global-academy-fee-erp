import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import FeeStructurePage from "./pages/FeeStructurePage";
import FeeCollectionPage from "./pages/FeeCollectionPage";
import FeeDiscountPage from "./pages/FeeDiscountPage";
import ReportsPage from "./pages/ReportsPage";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="fee-structures" element={<FeeStructurePage />} />
        <Route path="fee-collection" element={<FeeCollectionPage />} />
        <Route path="fee-discount" element={<FeeDiscountPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
