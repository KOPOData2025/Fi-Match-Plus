"use client"

import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TermHelpButtonProps {
  term: 'loss' | 'profit' | 'benchmark'
  onClick: () => void
  className?: string
}

export default function TermHelpButton({ term, onClick, className = '' }: TermHelpButtonProps) {
  const tooltipText = term === 'loss' 
    ? '손절에 대해 궁금한 점이 있으시면 클릭해보세요'
    : term === 'profit'
    ? '익절에 대해 궁금한 점이 있으시면 클릭해보세요'
    : '벤치마크 지수에 대해 궁금한 점이 있으시면 클릭해보세요'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={`p-1 h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
