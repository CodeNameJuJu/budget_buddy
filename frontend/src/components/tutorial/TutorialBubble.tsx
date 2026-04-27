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
  position,
  onNext,
  onPrevious,
  onSkip,
  currentStep,
  totalSteps,
  isLastStep,
  isFirstStep,
}: TutorialBubbleProps) {
  const { theme } = useTheme()

  const positionClasses = {
    top: "mb-4",
    bottom: "mt-4",
    left: "mr-4",
    right: "ml-4",
  }

  return (
    <Card className={cn("absolute z-50 w-80 shadow-2xl backdrop-blur-md", theme === "light" ? "border-[#D9B44A]/50 bg-[#E8DCC5]/95" : "border-[#C9A24A]/50 bg-[#18231D]/95", positionClasses[position])}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className={cn("font-semibold text-sm", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-5 w-5", theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#A7B3AD] hover:text-[#E7EFEA]")}
            onClick={onSkip}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className={cn("text-sm mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{description}</p>
        <div className="flex items-center justify-between">
          <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
            {currentStep && totalSteps && `${currentStep} of ${totalSteps}`}
          </div>
          <div className="flex gap-2">
            {!isFirstStep && onPrevious && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                className="h-7 px-3 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
            )}
            {onNext && (
              <Button
                size="sm"
                onClick={onNext}
                className={cn("h-7 px-3 text-xs", theme === "light" ? "bg-[#D9B44A] hover:bg-[#C9A24A]" : "bg-[#C9A24A] hover:bg-[#B4923F]")}
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Arrow */}
      <div className={cn("absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent", theme === "light" ? "border-t-[#E8DCC5]" : "border-t-[#18231D]", 
        position === "top" ? "-bottom-2 left-1/2 -translate-x-1/2" :
        position === "bottom" ? "-top-2 left-1/2 -translate-x-1/2 rotate-180" :
        position === "left" ? "-right-2 top-1/2 -translate-y-1/2 -rotate-90" :
        "-left-2 top-1/2 -translate-y-1/2 rotate-90"
      )} />
    </Card>
  )
}
