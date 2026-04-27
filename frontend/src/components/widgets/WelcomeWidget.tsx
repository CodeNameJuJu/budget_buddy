import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Sparkles } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function WelcomeWidget() {
  const { theme } = useTheme()
  
  return (
    <Card className={cn(
      "border",
      theme === "light"
        ? "bg-gradient-to-br from-[#8B9A6B]/10 to-[#6B7A4F]/10 border-[#8B9A6B]/30"
        : "bg-gradient-to-br from-[#8B9A6B]/10 to-[#6B7A4F]/10 border-[#8B9A6B]/30"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          "flex items-center gap-2",
          theme === "light" ? "text-[#8B9A6B]" : "text-[#A8B78F]"
        )}>
          <Sparkles className="h-5 w-5" />
          Welcome to Bêre Bietjie!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn(
          theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
        )}>
          <p className="text-lg font-medium">Hi there! Ready to take control of your finances?</p>
          <p className={cn(
            "text-sm mt-2",
            theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
          )}>
            You've successfully registered and can now start managing your budget, tracking expenses, and achieving your financial goals.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className={cn(
            "border",
            theme === "light"
              ? "bg-[#8B9A6B]/20 text-[#8B9A6B] border-[#8B9A6B]/40"
              : "bg-[#8B9A6B]/20 text-[#A8B78F] border-[#8B9A6B]/40"
          )}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Account Created
          </Badge>
          <Badge className="bg-green-800/30 text-green-300 border border-green-700/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready to Start
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
