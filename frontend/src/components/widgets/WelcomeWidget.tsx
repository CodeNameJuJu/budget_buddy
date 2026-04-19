import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Sparkles } from "lucide-react"

export default function WelcomeWidget() {
  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-teal-900/20 border-blue-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-300">
          <Sparkles className="h-5 w-5" />
          Welcome to Budget Buddy!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-slate-100">
          <p className="text-lg font-medium">Hi there! Ready to take control of your finances?</p>
          <p className="text-sm mt-2 text-slate-400">
            You've successfully registered and can now start managing your budget, tracking expenses, and achieving your financial goals.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="bg-blue-800/30 text-blue-300 border border-blue-700/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Account Created
          </Badge>
          <Badge variant="secondary" className="bg-teal-800/30 text-teal-300 border border-teal-700/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready to Start
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
