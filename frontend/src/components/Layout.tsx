import { NavLink, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  Wallet,
  Landmark,
  BarChart3,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/budgets", icon: PiggyBank, label: "Budgets" },
  { to: "/savings", icon: Landmark, label: "Savings" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-800 to-zinc-700">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shadow-xl">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">Budget Buddy</h1>
              <p className="text-xs text-muted-foreground">Your financial companion</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg transform scale-105"
                    : "text-muted-foreground hover:bg-zinc-700 hover:text-foreground hover:shadow-md"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
