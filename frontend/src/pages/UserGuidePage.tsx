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
        "Select transaction type (income or expense)",
        "Enter amount and description",
        "Choose a category for better organization",
        "Transactions automatically update your balance and budgets"
      ]
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Managing Budgets",
      description: "Set spending limits for different categories to stay on track financially.",
      details: [
        "Navigate to the Budgets page to create and manage budgets",
        "Set a monthly spending limit for each category",
        "Track progress with visual progress bars",
        "Get alerts when approaching budget limits",
        "Adjust budgets as your financial situation changes"
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
    { icon: <Wallet className="h-4 w-4" />, label: "Transactions", path: "/transactions" },
    { icon: <Target className="h-4 w-4" />, label: "Budgets", path: "/budgets" },
    { icon: <PiggyBank className="h-4 w-4" />, label: "Savings", path: "/savings" },
    { icon: <CreditCard className="h-4 w-4" />, label: "Categories", path: "/categories" },
    { icon: <Bell className="h-4 w-4" />, label: "Alerts", path: "/alerts" },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Analytics", path: "/analytics" },
    { icon: <Settings className="h-4 w-4" />, label: "Profile", path: "/profile" }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn("text-3xl font-bold tracking-tight mb-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
          User Guide
        </h1>
        <p className={cn("text-lg", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
          Learn how to use Bêre Bietjie to manage your finances effectively
        </p>
      </div>

      {/* Getting Started Section */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <CheckCircle className={cn("h-5 w-5", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
            Welcome to Bêre Bietjie! Here's how to get started with managing your finances:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                1
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                <span className="font-semibold">Register or log in</span> to create your account
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                2
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                <span className="font-semibold">Add your first transaction</span> using the Quick Add widget
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                3
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                <span className="font-semibold">Create categories</span> to organize your transactions
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                4
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                <span className="font-semibold">Set up budgets</span> to track spending limits
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", theme === "light" ? "bg-[#6BAF92] text-white" : "bg-[#88B39B] text-white")}>
                5
              </div>
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                <span className="font-semibold">Create savings goals</span> to build your financial future
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Guide */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <LayoutDashboard className={cn("h-5 w-5", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
            Use the sidebar to navigate between different sections of the app:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {navigation.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                  theme === "light"
                    ? "bg-white/60 border-[#E6E0D6]/50 hover:border-[#6BAF92]"
                    : "bg-[#18231D]/60 border-[#2E3B35]/50 hover:border-[#88B39B]"
                )}
              >
                <span className={cn(theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
                  {item.icon}
                </span>
                <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Details */}
      <div className="space-y-6">
        <h2 className={cn("text-2xl font-bold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
          Key Features
        </h2>
        {steps.map((step, index) => (
          <Card key={index} className={cn(
            "transition-all duration-200 hover:shadow-lg",
            theme === "light" ? "bg-white/60 border-[#E6E0D6]" : "bg-[#18231D]/60 border-[#2E3B35]"
          )}>
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                <span className={cn("p-2 rounded-full", theme === "light" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-[#88B39B]/20 text-[#88B39B]")}>
                  {step.icon}
                </span>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                {step.description}
              </p>
              <div className="space-y-2">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
                    <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
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
        <h2 className={cn("text-2xl font-bold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
          Dashboard Widgets
        </h2>
        <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
          Customize your dashboard with these widgets to track what matters most to you. Visit the Customize Dashboard page to enable or disable widgets.
        </p>
      </div>

      {/* Tips Section */}
      <Card className={cn(theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <TrendingUp className={cn("h-5 w-5", theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]")} />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              <span className="font-semibold">Be consistent:</span> Add transactions regularly for accurate tracking
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              <span className="font-semibold">Review regularly:</span> Check your dashboard weekly to stay on track
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              <span className="font-semibold">Use categories:</span> Organize transactions for better insights
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              <span className="font-semibold">Set realistic budgets:</span> Start conservative and adjust as needed
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
            <p className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              <span className="font-semibold">Save automatically:</span> Allocate a portion of income to savings pots
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
