import { useState, KeyboardEvent, ChangeEvent } from "react"
import { X, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  suggestions?: string[]
}

export default function TagInput({ 
  value, 
  onChange, 
  placeholder = "Add tags...", 
  className,
  suggestions = []
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag])
        setInputValue("")
      }
      setShowSuggestions(false)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      onChange(value.slice(0, -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  )

  return (
    <div className="relative">
      <div className={cn(
        "flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px]",
        "focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent",
        className
      )}>
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <Tag className="h-3 w-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-40 overflow-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addSuggestion(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
              type="button"
            >
              <Tag className="h-3 w-3" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
