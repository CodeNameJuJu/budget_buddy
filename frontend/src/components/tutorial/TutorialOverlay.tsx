import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTutorial } from "@/contexts/TutorialContext"
import TutorialBubble from "./TutorialBubble"

export default function TutorialOverlay() {
  const { isActive, currentStepIndex, steps, nextStep, previousStep, skipTutorial } = useTutorial()
  const location = useLocation()
  const navigate = useNavigate()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [bubblePosition, setBubblePosition] = useState<{ top: number; left: number } | null>(null)

  const currentStep = steps[currentStepIndex]
  const shouldShow = isActive && currentStep && currentStep.route === location.pathname

  useEffect(() => {
    if (!shouldShow || !currentStep) {
      setTargetElement(null)
      setBubblePosition(null)
      return
    }

    // Find target element
    let element: HTMLElement | null = null

    // Try to find element by ID first
    if (currentStep.target.startsWith("#")) {
      element = document.querySelector(currentStep.target) as HTMLElement
    } else {
      // Try to find by data-tutorial attribute
      element = document.querySelector(`[data-tutorial="${currentStep.target}"]`) as HTMLElement
    }

    // If still not found, try to find by common selectors
    if (!element) {
      switch (currentStep.target) {
        case "dashboard":
        case "dashboard-summary":
          element = document.querySelector(".mobile-title") as HTMLElement
          break
        case "budgets-page":
          element = document.querySelector("button:has(.PiggyBank)") as HTMLElement
          break
        case "categories-page":
          element = document.querySelector("button:has(.Tags)") as HTMLElement
          break
        case "transactions-page":
          element = document.querySelector("button:has(.ArrowLeftRight)") as HTMLElement
          break
        case "quick-add-button":
          element = document.querySelector("button:has(.Plus)") as HTMLElement
          break
        case "savings-page":
        case "savings-pots":
        case "savings-allocations":
          element = document.querySelector("h1") as HTMLElement
          break
        case "savings-forecast":
          element = document.querySelector('[data-tutorial="savings-forecast"]') as HTMLElement
          break
        case "analytics-page":
        case "analytics-trends":
        case "analytics-breakdown":
        case "analytics-health":
          element = document.querySelector("h1") as HTMLElement
          break
        case "alerts-page":
        case "alerts-preferences":
          element = document.querySelector("h1") as HTMLElement
          break
        case "partners-page":
          element = document.querySelector("h1") as HTMLElement
          break
        case "profile-page":
          element = document.querySelector("h1") as HTMLElement
          break
      }
    }

    if (element) {
      setTargetElement(element)
      const rect = element.getBoundingClientRect()
      let top = 0
      let left = 0

      switch (currentStep.position) {
        case "top":
          top = rect.top - 350
          left = rect.left + rect.width / 2 - 160
          break
        case "bottom":
          top = rect.bottom + 20
          left = rect.left + rect.width / 2 - 160
          break
        case "left":
          top = rect.top + rect.height / 2 - 50
          left = rect.left - 340
          break
        case "right":
          top = rect.top + rect.height / 2 - 50
          left = rect.right + 20
          break
      }

      // Ensure bubble stays within viewport
      if (left < 20) left = 20
      if (left > window.innerWidth - 340) left = window.innerWidth - 340
      if (top < 20) top = 20
      if (top > window.innerHeight - 200) top = window.innerHeight - 200

      setBubblePosition({ top, left })

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [shouldShow, currentStep, location.pathname])

  const handleNext = () => {
    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < steps.length) {
      const nextStepData = steps[nextStepIndex]
      if (nextStepData.route !== location.pathname) {
        navigate(nextStepData.route)
      }
    }
    nextStep()
  }

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      const prevStepData = steps[prevStepIndex]
      if (prevStepData.route !== location.pathname) {
        navigate(prevStepData.route)
      }
    }
    previousStep()
  }

  if (!shouldShow || !currentStep || !bubblePosition) {
    return null
  }

  return (
    <>
      {/* Dimmed background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 40,
          pointerEvents: "none",
        }}
      />

      {/* Highlight overlay */}
      {targetElement && (
        <>
          <div
            style={{
              position: "fixed",
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
              boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.3)",
              zIndex: 41,
              pointerEvents: "none",
              borderRadius: "12px",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes pulse {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.3);
              }
              50% {
                box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.3);
              }
            }
          `}</style>
        </>
      )}

      {/* Tutorial Bubble */}
      <div
        style={{
          position: "fixed",
          top: bubblePosition.top,
          left: bubblePosition.left,
          zIndex: 50,
        }}
      >
        <TutorialBubble
          title={currentStep.title}
          description={currentStep.description}
          position={currentStep.position}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={skipTutorial}
          currentStep={currentStepIndex + 1}
          totalSteps={steps.length}
          isLastStep={currentStepIndex === steps.length - 1}
          isFirstStep={currentStepIndex === 0}
        />
      </div>
    </>
  )
}
