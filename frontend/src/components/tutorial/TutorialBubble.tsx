import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface TutorialBubbleProps {
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  currentStep?: number
  totalSteps?: number
  isLastStep?: boolean
  isFirstStep?: boolean
}

export default function TutorialBubble({
  title,
  description,
  onNext,
  onPrevious,
  onSkip,
  currentStep,
  totalSteps,
  isLastStep,
  isFirstStep,
}: TutorialBubbleProps) {
  const { theme } = useTheme()

  return (
    <Card className={cn("w-full max-w-2xl mx-auto shadow-2xl backdrop-blur-md", theme === "light" ? "border-[#D9B44A]/50 bg-[#E8DCC5]/95" : "border-[#C9A24A]/50 bg-[#201E1B]/95")}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className={cn("font-semibold text-base", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#ABA9A2] hover:text-[#EDEBE6]")}
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className={cn("text-sm mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>{description}</p>
        <div className="flex items-center justify-between">
          <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
            {currentStep && totalSteps && `${currentStep} of ${totalSteps}`}
          </div>
          <div className="flex gap-2">
            {!isFirstStep && onPrevious && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                className="h-8 px-4 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
            )}
            {onNext && (
              <Button
                size="sm"
                onClick={onNext}
                className={cn("h-8 px-4 text-xs", theme === "light" ? "bg-[#D9B44A] hover:bg-[#C9A24A]" : "bg-[#C9A24A] hover:bg-[#B4923F]")}
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
