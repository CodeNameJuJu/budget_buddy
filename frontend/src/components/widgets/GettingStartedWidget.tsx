import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlusCircle, TrendingUp, PiggyBank } from "lucide-react"

export default function GettingStartedWidget() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Getting Started
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Here are the first steps to get your budget up and running:
        </p>

        <div className="space-y-3">
          <div
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => navigate("/budgets")}
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Add Budgets</h4>
              <p className="text-xs text-muted-foreground">Set up your budget limits</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => navigate("/categories")}
          >
            <div className="bg-green-100 p-2 rounded-full">
              <PiggyBank className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Add Categories</h4>
              <p className="text-xs text-muted-foreground">Organize your spending by category</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => navigate("/transactions")}
          >
            <div className="bg-purple-100 p-2 rounded-full">
              <PlusCircle className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Track Transactions</h4>
              <p className="text-xs text-muted-foreground">Start recording your income and expenses</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Button className="w-full mt-4" size="sm" onClick={() => navigate("/budgets")}>
          Start Setup
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
