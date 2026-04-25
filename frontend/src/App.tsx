import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./hooks"
import { TutorialProvider } from "./contexts/TutorialContext"
import Layout from "./components/Layout"
import DashboardPage from "./pages/DashboardPage"
import CustomDashboardPage from "./pages/CustomDashboardPage"
import TransactionsPage from "./pages/TransactionsPage"
import BudgetsPage from "./pages/BudgetsPage"
import CategoriesPage from "./pages/CategoriesPage"
import SavingsPage from "./pages/SavingsPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import AlertsPage from "./pages/AlertsPage"
import PartnersPage from "./pages/PartnersPage"
import { LoginForm } from "./components/auth/LoginForm"
import { RegisterForm } from "./components/auth/RegisterForm"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"

export default function App() {
  return (
    <AuthProvider>
      <TutorialProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route element={<Layout />}>
            <Route path="/" element={
              <ProtectedRoute>
                <CustomDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CustomDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-old" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute>
                <BudgetsPage />
              </ProtectedRoute>
            } />
            <Route path="/savings" element={
              <ProtectedRoute>
                <SavingsPage />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/alerts" element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            } />
            <Route path="/partners" element={
              <ProtectedRoute>
                <PartnersPage />
              </ProtectedRoute>
            } />
        </Route>
      </Routes>
    </TutorialProvider>
    </AuthProvider>
  )
}
