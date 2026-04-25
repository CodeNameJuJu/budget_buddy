import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
  const positionClasses = {
    top: "mb-4",
    bottom: "mt-4",
    left: "mr-4",
    right: "ml-4",
  }

  return (
    <Card className={`absolute z-50 w-80 shadow-2xl border-blue-500/50 bg-slate-800/95 backdrop-blur-md ${positionClasses[position]}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-slate-400 hover:text-slate-200"
            onClick={onSkip}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-sm text-slate-300 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
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
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Arrow */}
      <div className={`absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-800 ${
        position === "top" ? "-bottom-2 left-1/2 -translate-x-1/2" :
        position === "bottom" ? "-top-2 left-1/2 -translate-x-1/2 rotate-180" :
        position === "left" ? "-right-2 top-1/2 -translate-y-1/2 -rotate-90" :
        "-left-2 top-1/2 -translate-y-1/2 rotate-90"
      }`} />
    </Card>
  )
}
