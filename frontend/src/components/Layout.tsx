import { useState, useEffect, useRef } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Tags,
  Wallet,
  Landmark,
  BarChart3,
  Bell,
  Users,
  Menu,
  X,
  ChevronLeft,
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
  { to: "/partners", icon: Users, label: "Partners" },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  // Handle swipe gestures for mobile
  useEffect(() => {
    const handleSwipe = (e: TouchEvent) => {
      if (!sidebarRef.current) return
      
      const touchStartX = e.changedTouches[0].clientX
      const touchEndX = e.changedTouches[0].clientX
      const swipeThreshold = 50

      if (touchEndX - touchStartX > swipeThreshold && !sidebarOpen) {
        // Swipe right to open
        setSidebarOpen(true)
      } else if (touchStartX - touchEndX > swipeThreshold && sidebarOpen) {
        // Swipe left to close
        closeSidebar()
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touchStartX = e.touches[0].clientX
      const sidebar = sidebarRef.current
      
      if (sidebar && !sidebarOpen && touchStartX < 20) {
        // Touch started near left edge - enable swipe to open
        document.addEventListener('touchend', handleSwipe, { once: true })
      } else if (sidebar && sidebarOpen) {
        // Touch anywhere when sidebar is open - enable swipe to close
        document.addEventListener('touchend', handleSwipe, { once: true })
      }
    }

    if (window.innerWidth < 1024) {
      document.addEventListener('touchstart', handleTouchStart)
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleSwipe)
    }
  }, [sidebarOpen])

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar()
      }
    }

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [sidebarOpen])

  const closeSidebar = () => {
    // Simulate haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setIsClosing(true)
    setTimeout(() => {
      setSidebarOpen(false)
      setIsClosing(false)
    }, 300)
  }

  const openSidebar = () => {
    // Simulate haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setSidebarOpen(true)
    setIsClosing(false)
  }

  const handleNavClick = () => {
    // Simulate haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative mobile-safe-area">
      {/* Mobile overlay with backdrop blur */}
      {sidebarOpen && (
        <div 
          className={cn(
            "fixed inset-0 bg-black/60 mobile-backdrop z-40 lg:hidden transition-opacity duration-300",
            isClosing ? "opacity-0" : "opacity-100"
          )}
          onClick={closeSidebar}
        />
      )}

      {/* Swipe indicator for mobile */}
      {!sidebarOpen && (
        <div className="swipe-indicator lg:hidden" />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 xs:w-80 bg-slate-800/95 backdrop-blur-xl border-r border-blue-900/50 shadow-2xl transform transition-all duration-300 ease-out",
          sidebarOpen && !isClosing ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:w-64 lg:bg-slate-800/90 lg:backdrop-blur-md lg:shadow-xl lg:border-blue-900/30"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 xs:p-5 lg:p-6 border-b border-blue-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 xs:gap-4">
                <div className="p-2.5 xs:p-3 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 text-white shadow-lg transition-transform duration-300 hover:scale-110">
                  <Wallet className="h-5 w-5 xs:h-6 xs:w-6" />
                </div>
                <div>
                  <h1 className="text-lg xs:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-300 to-teal-300 bg-clip-text text-transparent">Budget Buddy</h1>
                  <p className="text-xs xs:text-sm text-slate-400 hidden md:block">Your elegant financial companion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeSidebar}
                  className="lg:hidden p-2 xs:p-2.5 rounded-full hover:bg-zinc-700/50 transition-colors mobile-button-sm"
                >
                  <ChevronLeft className="h-5 w-5 xs:h-6 xs:w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 xs:p-5 lg:p-6 space-y-1 overflow-y-auto mobile-scroll">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => {
                    closeSidebar()
                    handleNavClick()
                  }}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 xs:gap-4 px-3 xs:px-4 py-3 xs:py-3.5 rounded-xl text-sm xs:text-base font-medium transition-all duration-200 mobile-app-button nav-item-mobile",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg transform scale-[1.02]"
                        : "text-slate-300 hover:bg-blue-900/30 hover:text-blue-200 hover:shadow-md hover:transform hover:translate-x-1"
                    )
                  }
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                    "group-hover:bg-blue-900/30 group-hover:scale-110",
                    "group-[.active]:bg-blue-800/50"
                  )}>
                    <item.icon className="h-5 w-5 xs:h-6 xs:w-6" />
                  </div>
                  <span className="truncate font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 xs:p-5 lg:p-6 border-t border-blue-900/50">
            <div className="status-indicator online">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-400/50"></div>
              <span className="text-xs xs:text-sm text-slate-400">Connected and ready to serve</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto mobile-scroll">
        {/* Mobile header with enhanced design */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-800/90 backdrop-blur-md border-b border-blue-900/50 responsive-padding">
          <div className="flex items-center justify-between">
            <button
              onClick={openSidebar}
              className="p-2.5 xs:p-3 rounded-full hover:bg-blue-900/30 transition-all duration-200 mobile-app-button group text-slate-300"
            >
              <Menu className="h-5 w-5 xs:h-6 xs:w-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="p-1.5 xs:p-2 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 text-white shadow-md transition-transform duration-300 hover:scale-110">
                <Wallet className="h-4 w-4 xs:h-5 xs:w-5" />
              </div>
              <span className="font-bold text-sm xs:text-base text-slate-200">Budget Buddy</span>
            </div>
            <div className="w-8 xs:w-10"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page content with smooth transitions */}
        <div className={cn(
          "responsive-padding transition-all duration-300",
          sidebarOpen ? "opacity-50" : "opacity-100"
        )}>
          <div className="responsive-container">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
