import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Plus,
  Target,
  PiggyBank,
  Bell,
  CreditCard,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Home,
  Wallet,
  Settings,
  LogOut
} from "lucide-react"

export default function UserGuidePage() {
  const { theme } = useTheme()

  const steps = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      title: "Dashboard Overview",
      description: "Your financial command center showing income, expenses, balance, and recent activity.",
      details: [
        "Summary cards at the top show your total income, expenses, and current balance",
        "Recent transactions widget displays your latest financial activity",
        "Budget progress tracks spending against your set budgets",
        "Quick stats provide insights into transaction counts and categories"
      ]
    },
    {
      icon: <Plus className="h-5 w-5" />,
      title: "Adding Transactions",
      description: "Quickly add income or expense transactions to track your finances.",
      details: [
        "Use the Quick Add widget on the dashboard for fast transaction entry",
        "Navigate to the Finance page and click the Transactions tab",
        "Select transaction type (income or expense)",
        "Enter amount, description, and choose a category",
        "Add tags for better organization",
        "Transactions automatically update your balance and budgets"
      ]
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Finance Management",
      description: "Combined hub for managing categories, budgets, and transactions in one place.",
      details: [
        "Navigate to the Finance page to access all finance features",
        "Use tabs to switch between Categories, Budgets, and Transactions",
        "Create and organize categories for better transaction tracking",
        "Set and monitor budgets with visual progress indicators",
        "Add, edit, and filter transactions easily",
        "Click on budget cards to view related transactions"
      ]
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Organizing Categories",
      description: "Create and manage categories to organize your transactions effectively.",
      details: [
        "Navigate to the Finance page and click the Categories tab",
        "Create custom categories for income and expenses",
        "Set icons and colors for easy identification",
        "Filter by income or expense type",
        "Edit or delete categories as needed"
      ]
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      title: "Savings Goals",
      description: "Create savings pots and track progress toward your financial goals.",
      details: [
        "Go to the Savings page to create savings pots",
        "Name your goal (e.g., 'Emergency Fund', 'Vacation')",
        "Set a target amount and allocate funds",
        "Track progress with visual indicators",
        "Withdraw funds when you reach your goals"
      ]
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Alerts & Notifications",
      description: "Stay informed about important financial events and warnings.",
      details: [
        "Set up custom alerts for budget thresholds",
        "Get notified about unusual spending patterns",
        "Receive alerts for upcoming bills",
        "Configure alert preferences in your profile",
        "View recent alerts in the Alerts widget"
      ]
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Analytics & Insights",
      description: "Analyze your spending patterns and make informed financial decisions.",
      details: [
        "View detailed spending trends over time",
        "See category breakdowns to understand where money goes",
        "Track financial health scores",
        "Compare spending across different time periods",
        "Use insights to optimize your budget"
      ]
    }
  ]

  const navigation = [
    { icon: <Home className="h-4 w-4" />, label: "Dashboard", path: "/dashboard" },
    { icon: <Wallet className="h-4 w-4" />, label: "Finance", path: "/finance" },
    { icon: <PiggyBank className="h-4 w-4" />, label: "Savings", path: "/savings" },
    { icon: <Bell className="h-4 w-4" />, label: "Alerts", path: "/alerts" },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Analytics", path: "/analytics" },
    { icon: <Settings className="h-4 w-4" />, label: "Profile", path: "/profile" }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn("text-3xl font-bold tracking-tight mb-2", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
          User Guide
        </h1>
        <p className={cn("text-lg", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
          Learn how to use <span className={cn("brand-name", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>Bêre Bietjie</span> to manage your finances effectively
        </p>
      </div>

      {/* Getting Started Section */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
            <CheckCircle className={cn("h-5 w-5", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
            Welcome to <span className={cn("brand-name", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>Bêre Bietjie</span>! Here's how to get started with managing your finances:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                1
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                <span className="font-semibold">Register or log in</span> to create your account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                2
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                <span className="font-semibold">Add your first transaction</span> using the Quick Add widget or Finance page
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                3
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                <span className="font-semibold">Create categories</span> in the Finance page to organize transactions
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                4
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                <span className="font-semibold">Set up budgets</span> in the Finance page to track spending limits
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                5
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                <span className="font-semibold">Create savings goals</span> to build your financial future
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Guide */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
            <LayoutDashboard className={cn("h-5 w-5", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
            Use the sidebar to navigate between different sections of the app:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {navigation.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-2 p-3 rounded-lg border transition-colors text-center sm:text-left",
                  theme === "light"
                    ? "bg-white/60 border-[#E6E0D6]/50 hover:border-[#6BAF92]"
                    : "bg-[#201E1B]/60 border-[#38352F]/50 hover:border-[#88B39B]"
                )}
              >
                <span className={cn(theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
                  {item.icon}
                </span>
                <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Details */}
      <div className="space-y-6">
        <h2 className={cn("text-2xl font-bold", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
          Key Features
        </h2>
        {steps.map((step, index) => (
          <Card key={index} className={cn(
            "transition-all duration-200 hover:shadow-lg",
            theme === "light" ? "bg-white/60 border-[#E6E0D6]" : "bg-[#201E1B]/60 border-[#38352F]"
          )}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
                <span className={cn("p-2 rounded-full", theme === "light" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-[#88B39B]/20 text-[#88B39B]")}>
                  {step.icon}
                </span>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                {step.description}
              </p>
              <div className="space-y-2">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
                    <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Widget Descriptions */}
      <div className="space-y-6">
        <h2 className={cn("text-2xl font-bold", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
          Dashboard Widgets
        </h2>
        <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
          Customize your dashboard with these widgets to track what matters most to you. Visit the Customize Dashboard page to enable or disable widgets.
        </p>
      </div>

      {/* Tips Section */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
            <TrendingUp className={cn("h-5 w-5", theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]")} />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              <span className="font-semibold">Be consistent:</span> Add transactions regularly for accurate tracking
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              <span className="font-semibold">Review regularly:</span> Check your dashboard weekly to stay on track
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              <span className="font-semibold">Use the Finance page:</span> Access categories, budgets, and transactions in one place
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              <span className="font-semibold">Set realistic budgets:</span> Start conservative and adjust as needed
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              <span className="font-semibold">Save automatically:</span> Allocate a portion of income to savings pots
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
