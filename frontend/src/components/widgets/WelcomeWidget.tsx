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
        ? "bg-gradient-to-br from-[#6BAF92]/10 to-[#5E9C7E]/10 border-[#6BAF92]/30"
        : "bg-gradient-to-br from-[#6BAF92]/10 to-[#5E9C7E]/10 border-[#6BAF92]/30"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          "flex items-center gap-2",
          theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
        )}>
          <Sparkles className="h-5 w-5" />
          Welcome to Bêre Bietjie!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn(
          theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
        )}>
          <p className="text-lg font-medium">Hi there! Ready to take control of your finances?</p>
          <p className={cn(
            "text-sm mt-2",
            theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
          )}>
            You've successfully registered and can now start managing your budget, tracking expenses, and achieving your financial goals.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className={cn(
            "border",
            theme === "light"
              ? "bg-[#6BAF92]/20 text-[#6BAF92] border-[#6BAF92]/40"
              : "bg-[#6BAF92]/20 text-[#A8D5BA] border-[#6BAF92]/40"
          )}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Account Created
          </Badge>
          <Badge className={cn(
            "border",
            theme === "light"
              ? "bg-[#6BAF92]/20 text-[#6BAF92] border-[#6BAF92]/40"
              : "bg-[#6BAF92]/20 text-[#A8D5BA] border-[#6BAF92]/40"
          )}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready to Start
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
