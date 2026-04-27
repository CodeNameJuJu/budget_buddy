import { useState, useEffect, useRef } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
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
  User,
  LogOut,
  ChevronUp,
  Moon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import TutorialOverlay from "@/components/tutorial/TutorialOverlay"
import { useAuth } from "@/hooks"
import { alertsApi, accountsApi, type Alert } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/ThemeContext"

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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [unreadAlertCount, setUnreadAlertCount] = useState(0)
  const sidebarRef = useRef<HTMLElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Load unread alert count
  useEffect(() => {
    async function loadUnreadAlerts() {
      try {
        const accountResponse = await accountsApi.getMyAccount()
        if (accountResponse.data && accountResponse.data.length > 0) {
          const accountId = accountResponse.data[0].id
          const alertsResponse = await alertsApi.list(accountId)
          const unreadCount = alertsResponse.data?.filter((a: Alert) => !a.is_read).length || 0
          setUnreadAlertCount(unreadCount)
        }
      } catch (error) {
        console.error('Failed to load unread alerts:', error)
      }
    }
    loadUnreadAlerts()
  }, [])

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
      if (e.key === 'Escape' && profileDropdownOpen) {
        setProfileDropdownOpen(false)
      }
    }

    if (sidebarOpen || profileDropdownOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [sidebarOpen, profileDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

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

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen)
  }

  const handleViewProfile = () => {
    setProfileDropdownOpen(false)
    navigate('/profile')
  }

  const handleLogout = async () => {
    try {
      await logout()
      setProfileDropdownOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavClick = () => {
    // Simulate haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  return (
    <div className={cn(
      "flex h-screen relative mobile-safe-area transition-colors duration-300",
      theme === "light" 
        ? "bg-[#F5F0E8]" 
        : "bg-gradient-to-br from-[#1A1D1A] via-[#242824] to-[#1A1D1A]"
    )}>
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
          "fixed lg:static inset-y-0 left-0 z-50 w-72 xs:w-80 backdrop-blur-xl border-r shadow-2xl transform transition-all duration-300 ease-out",
          sidebarOpen && !isClosing ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          theme === "light"
            ? "bg-[#E8E3D8] border-[#C5C0B5]"
            : "bg-[#242824]/95 border-[#3A4038]",
          "lg:w-64 lg:shadow-xl"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={cn(
            "p-4 xs:p-5 lg:p-6 border-b",
            theme === "light" ? "border-[#C5C0B5]" : "border-[#3A4038]"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 xs:gap-4">
                <div className={cn(
                  "p-1.5 xs:p-2 rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-110",
                  theme === "light" 
                    ? "bg-gradient-to-br from-[#9EC489] to-[#7BA35E]" 
                    : "bg-gradient-to-br from-[#9EC489] to-[#7BA35E]"
                )}>
                  <img src="/src/images/bere_bietjie_logo.jpeg" alt="Bêre Bietjie" className="h-6 w-6 xs:h-7 xs:w-7 lg:h-8 lg:w-8 object-cover rounded-full" />
                </div>
                <div>
                  <h1 className={cn(
                    "text-lg xs:text-xl lg:text-2xl font-bold bg-clip-text text-transparent",
                    theme === "light"
                      ? "bg-gradient-to-r from-[#7BA35E] to-[#9EC489]"
                      : "bg-gradient-to-r from-[#B8D5A8] to-[#9EC489]"
                  )}>Bêre Bietjie</h1>
                  <p className={cn(
                    "text-xs xs:text-sm hidden md:block",
                    theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
                  )}>Your elegant financial companion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "p-2 rounded-lg transition-colors duration-200",
                    theme === "light"
                      ? "hover:bg-[#D4C4A8] text-[#5A6B55]"
                      : "hover:bg-[#4A5048] text-[#B8B3A8]"
                  )}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
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
          <nav className="flex-1 p-4 xs:p-5 lg:p-6 space-y-1 overflow-y-auto mobile-scroll flex flex-col justify-start">
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
                        ? theme === "light"
                          ? "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] text-white shadow-lg transform scale-[1.02]"
                          : "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] text-white shadow-lg transform scale-[1.02]"
                        : theme === "light"
                          ? "text-[#5A6B55] hover:bg-[#D4C4A8] hover:text-[#2D3A28] hover:shadow-md hover:transform hover:translate-x-1"
                          : "text-[#B8B3A8] hover:bg-[#4A5048] hover:text-[#E8E3D8] hover:shadow-md hover:transform hover:translate-x-1"
                    )
                  }
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200 flex-shrink-0 relative",
                    theme === "light"
                      ? "group-hover:bg-[#D4C4A8] group-hover:scale-110 group-[.active]:bg-[#9EC489]/50"
                      : "group-hover:bg-[#4A5048] group-hover:scale-110 group-[.active]:bg-[#9EC489]/50"
                  )}>
                    <item.icon className="h-5 w-5 xs:h-6 xs:w-6" />
                    {item.to === "/alerts" && unreadAlertCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                        {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                      </Badge>
                    )}
                  </div>
                  <span className="truncate font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className={cn(
            "p-4 xs:p-5 lg:p-6 border-t relative",
            theme === "light" ? "border-[#C5C0B5]" : "border-[#3A4038]"
          )} ref={profileDropdownRef}>
            <button
              onClick={handleProfileClick}
              className={cn(
                "group flex items-center gap-3 xs:gap-4 w-full px-3 xs:px-4 py-3 xs:py-3.5 rounded-xl text-sm xs:text-base font-medium transition-all duration-200 mobile-app-button shadow-lg hover:shadow-xl border",
                theme === "light"
                  ? "bg-gradient-to-r from-[#9EC489]/20 to-[#7BA35E]/20 text-[#5A6B55] hover:from-[#9EC489]/30 hover:to-[#7BA35E]/30 hover:text-[#2D3A28] border-[#9EC489]/30 hover:border-[#9EC489]/50"
                  : "bg-gradient-to-r from-[#9EC489]/20 to-[#7BA35E]/20 text-[#B8B3A8] hover:from-[#9EC489]/30 hover:to-[#7BA35E]/30 hover:text-[#E8E3D8] border-[#9EC489]/30 hover:border-[#9EC489]/50"
              )}
            >
              {user?.profile_picture_url ? (
                <img 
                  src={user.profile_picture_url} 
                  alt="Profile" 
                  className={cn(
                    "w-8 h-8 xs:w-10 xs:h-10 rounded-full object-cover border-2 group-hover:scale-110 transition-all duration-200 flex-shrink-0",
                    theme === "light" ? "border-[#9EC489]" : "border-[#9EC489]"
                  )}
                />
              ) : (
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200 flex-shrink-0 group-hover:scale-110",
                  theme === "light" ? "bg-[#9EC489]/30 group-hover:bg-[#9EC489]/50" : "bg-[#9EC489]/30 group-hover:bg-[#9EC489]/50"
                )}>
                  <User className="h-5 w-5 xs:h-6 xs:w-6" />
                </div>
              )}
              <span className="truncate font-medium flex-1 text-left">
                {user?.first_name || user?.email || 'Profile'}
              </span>
              <ChevronUp className={cn(
                "h-4 w-4 xs:h-5 xs:w-5 transition-transform duration-200 flex-shrink-0",
                profileDropdownOpen ? "rotate-180" : ""
              )} />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className={cn(
                "absolute bottom-full left-4 xs:left-5 lg:left-6 right-4 xs:right-5 lg:right-6 mb-2 backdrop-blur-xl rounded-xl shadow-2xl border overflow-hidden z-50",
                theme === "light"
                  ? "bg-[#E8E3D8]/95 border-[#C5C0B5]"
                  : "bg-[#242824]/95 border-[#3A4038]"
              )}>
                <button
                  onClick={handleViewProfile}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200",
                    theme === "light"
                      ? "text-[#5A6B55] hover:bg-[#D4C4A8] hover:text-[#2D3A28]"
                      : "text-[#B8B3A8] hover:bg-[#4A5048] hover:text-[#E8E3D8]"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">View Profile</span>
                </button>
                <div className={cn("border-t", theme === "light" ? "border-[#C5C0B5]" : "border-[#3A4038]")} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto mobile-scroll">
        {/* Mobile header with enhanced design */}
        <div className={cn(
          "lg:hidden sticky top-0 z-30 backdrop-blur-md border-b responsive-padding transition-colors duration-300",
          theme === "light"
            ? "bg-[#E8E3D8]/90 border-[#C5C0B5]"
            : "bg-[#242824]/90 border-[#3A4038]"
        )}>
          <div className="flex items-center justify-between">
            <button
              onClick={openSidebar}
              className={cn(
                "p-2.5 xs:p-3 rounded-full transition-all duration-200 mobile-app-button group",
                theme === "light"
                  ? "text-[#5A6B55] hover:bg-[#D4C4A8]"
                  : "text-[#B8B3A8] hover:bg-[#4A5048]"
              )}
            >
              <Menu className="h-5 w-5 xs:h-6 xs:w-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-2 xs:gap-3">
              <div className={cn(
                "p-1 xs:p-1.5 rounded-full text-white shadow-md transition-transform duration-300 hover:scale-110",
                theme === "light"
                  ? "bg-gradient-to-br from-[#9EC489] to-[#7BA35E]"
                  : "bg-gradient-to-br from-[#9EC489] to-[#7BA35E]"
              )}>
                <img src="/src/images/bere_bietjie_logo.jpeg" alt="Bêre Bietjie" className="h-4 w-4 xs:h-5 xs:w-5 object-cover rounded-full" />
              </div>
              <span className={cn(
                "font-bold text-sm xs:text-base",
                theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
              )}>Bêre Bietjie</span>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2.5 xs:p-3 rounded-full transition-all duration-200",
                theme === "light"
                  ? "text-[#5A6B55] hover:bg-[#D4C4A8]"
                  : "text-[#B8B3A8] hover:bg-[#4A5048]"
              )}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5 xs:h-6 xs:w-6" /> : <Sun className="h-5 w-5 xs:h-6 xs:w-6" />}
            </button>
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

      {/* Tutorial Overlay */}
      <TutorialOverlay />
    </div>
  )
}
