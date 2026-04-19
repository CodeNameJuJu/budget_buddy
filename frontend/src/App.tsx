import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import DashboardPage from "./pages/DashboardPage"
import CustomDashboardPage from "./pages/CustomDashboardPage"
import TransactionsPage from "./pages/TransactionsPage"
import BudgetsPage from "./pages/BudgetsPage"
import CategoriesPage from "./pages/CategoriesPage"
import SavingsPage from "./pages/SavingsPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import AlertsPage from "./pages/AlertsPage"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CustomDashboardPage />} />
        <Route path="/dashboard" element={<CustomDashboardPage />} />
        <Route path="/dashboard-old" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
  )
}
