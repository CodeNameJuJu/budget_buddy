import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTutorial } from "@/contexts/TutorialContext"
import TutorialBubble from "./TutorialBubble"

export default function TutorialOverlay() {
  const { isActive, currentStepIndex, steps, nextStep, previousStep, skipTutorial } = useTutorial()
  const location = useLocation()
  const navigate = useNavigate()

  const currentStep = steps[currentStepIndex]
  const shouldShow = isActive && currentStep && currentStep.route === location.pathname

  useEffect(() => {
    if (!shouldShow || !currentStep) {
      return
    }

    // Find target element to scroll into view
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
        case "add-budget-button":
        case "budgets-list":
          element = document.querySelector("button:has(.PiggyBank)") as HTMLElement
          if (!element) element = document.querySelector('button[aria-label*="Add"]') as HTMLElement
          break
        case "categories-page":
        case "add-category-button":
        case "categories-list":
          element = document.querySelector("button:has(.Tags)") as HTMLElement
          if (!element) element = document.querySelector('button[aria-label*="Add"]') as HTMLElement
          break
        case "transactions-page":
        case "add-transaction-button":
        case "transactions-list":
          element = document.querySelector("button:has(.ArrowLeftRight)") as HTMLElement
          if (!element) element = document.querySelector('button[aria-label*="Add"]') as HTMLElement
          break
        case "quick-add-button":
          element = document.querySelector("button:has(.Plus)") as HTMLElement
          break
        case "savings-page":
        case "add-pot-button":
        case "savings-pots":
        case "savings-allocations":
          element = document.querySelector("h1") as HTMLElement
          if (!element) element = document.querySelector('button[aria-label*="Add"]') as HTMLElement
          break
        case "savings-forecast":
          element = document.querySelector('[data-tutorial="savings-forecast"]') as HTMLElement
          break
        case "customize-button":
          element = document.querySelector('button[aria-label*="Customize"]') as HTMLElement
          if (!element) element = document.querySelector('button:has(.Settings)') as HTMLElement
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
        case "credits-page":
        case "add-credit-button":
          element = document.querySelector("h1") as HTMLElement
          if (!element) element = document.querySelector('button[aria-label*="Add"]') as HTMLElement
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

  if (!shouldShow || !currentStep) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <TutorialBubble
        title={currentStep.title}
        description={currentStep.description}
        position="bottom"
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={skipTutorial}
        currentStep={currentStepIndex + 1}
        totalSteps={steps.length}
        isLastStep={currentStepIndex === steps.length - 1}
        isFirstStep={currentStepIndex === 0}
      />
    </div>
  )
}
