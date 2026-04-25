import { TutorialStep } from "@/contexts/TutorialContext"

export const setupTutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Budget Buddy",
    description: "Let's get you set up! We'll guide you through creating your first budget, categories, and transactions.",
    target: "dashboard",
    position: "bottom",
    route: "/",
  },
  {
    id: "budgets",
    title: "Create Your First Budget",
    description: "Budgets help you track spending limits for different categories. Click here to create your first budget.",
    target: "budgets-page",
    position: "bottom",
    route: "/budgets",
  },
  {
    id: "categories",
    title: "Add Categories",
    description: "Categories help organize your transactions. Create categories like 'Groceries', 'Transport', or 'Entertainment'.",
    target: "categories-page",
    position: "bottom",
    route: "/categories",
  },
  {
    id: "transactions",
    title: "Track Your First Transaction",
    description: "Now let's add your first transaction. This could be income or an expense.",
    target: "transactions-page",
    position: "bottom",
    route: "/transactions",
  },
  {
    id: "quick-add",
    title: "Quick Add Transaction",
    description: "Use this button to quickly add transactions without leaving the current page.",
    target: "quick-add-button",
    position: "top",
    route: "/transactions",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Congratulations! You've completed the setup. You can now track your finances with Budget Buddy.",
    target: "dashboard",
    position: "bottom",
    route: "/",
  },
]
