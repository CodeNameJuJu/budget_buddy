import { useState } from "react"
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
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-800 to-zinc-700 relative mobile-safe-area">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 xs:w-72 bg-card border-r shadow-xl transform transition-all duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0 animate-slide-in" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-3 xs:p-4 lg:p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="p-1.5 xs:p-2 rounded-full bg-primary text-white">
                  <Wallet className="h-4 w-4 xs:h-5 xs:w-5" />
                </div>
                <div>
                  <h1 className="text-base xs:text-lg lg:text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">Budget Buddy</h1>
                  <p className="text-xs text-muted-foreground hidden md:block">Your financial companion</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 xs:p-2 rounded-md hover:bg-zinc-700 mobile-button-sm"
              >
                <X className="h-4 w-4 xs:h-5 xs:w-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 p-3 xs:p-4 space-y-1 overflow-y-auto mobile-scroll">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 xs:gap-3 px-2 xs:px-3 py-2 xs:py-2.5 rounded-md text-xs xs:text-sm font-medium transition-all duration-300 mobile-button",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg transform scale-105"
                      : "text-muted-foreground hover:bg-zinc-700 hover:text-foreground hover:shadow-md"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                <span className="truncate mobile-text">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto mobile-scroll">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b responsive-padding">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 xs:p-2 rounded-md hover:bg-zinc-700 mobile-button-sm"
            >
              <Menu className="h-4 w-4 xs:h-5 xs:w-5" />
            </button>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <div className="p-1 xs:p-1.5 rounded-full bg-primary text-white">
                <Wallet className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </div>
              <span className="font-semibold text-xs xs:text-sm mobile-text">Budget Buddy</span>
            </div>
            <div className="w-6 xs:w-8"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page content */}
        <div className="responsive-padding animate-fade-in">
          <div className="responsive-container">
            <Outlet />
          </div>
        </div>
      </main>
    </div  )
}
