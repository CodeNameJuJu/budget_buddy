import { createContext, useContext, useState, ReactNode } from "react"

export interface TutorialStep {
  id: string
  title: string
  description: string
  target: string // CSS selector or element ID
  position: "top" | "bottom" | "left" | "right"
  route: string // The route where this step should be shown
}

interface TutorialContextType {
  isActive: boolean
  currentStepIndex: number
  steps: TutorialStep[]
  startTutorial: (steps: TutorialStep[]) => void
  nextStep: () => void
  previousStep: () => void
  skipTutorial: () => void
  goToStep: (index: number) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<TutorialStep[]>([])

  const startTutorial = (tutorialSteps: TutorialStep[]) => {
    setSteps(tutorialSteps)
    setCurrentStepIndex(0)
    setIsActive(true)
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      setIsActive(false)
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const skipTutorial = () => {
    setIsActive(false)
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
    }
  }

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStepIndex,
        steps,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        goToStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return context
}
