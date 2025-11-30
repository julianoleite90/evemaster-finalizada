"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  }
  
  const displayRating = hoverRating || rating
  
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= displayRating
        const isHalf = !isFilled && starValue - 0.5 <= displayRating
        
        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            className={cn(
              "focus:outline-none transition-transform",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isHalf
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-300"
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  totalReviews: number
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
  className?: string
}

export function RatingDisplay({
  rating,
  totalReviews,
  size = "md",
  showDetails = true,
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating rating={rating} size={size} />
      {showDetails && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
          <span>•</span>
          <span>
            {totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>
      )}
    </div>
  )
}

