"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { getPortfolioBacktestStatuses } from '@/lib/api/backtests'

export type BacktestStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface BacktestStateInfo {
  id: string
  status: BacktestStatus
  lastUpdated: number
}

interface BacktestContextState {
  backtestStates: Record<string, Record<string, BacktestStateInfo>>
  pollingPortfolios: Set<string>
  errors: Record<string, string>
}

type BacktestContextAction =
  | { type: 'SET_BACKTEST_STATES'; portfolioId: string; states: Record<string, BacktestStateInfo> }
  | { type: 'UPDATE_BACKTEST_STATE'; portfolioId: string; backtestId: string; status: BacktestStatus }
  | { type: 'START_POLLING'; portfolioId: string }
  | { type: 'STOP_POLLING'; portfolioId: string }
  | { type: 'SET_ERROR'; portfolioId: string; error: string }
  | { type: 'CLEAR_ERROR'; portfolioId: string }

const initialState: BacktestContextState = {
  backtestStates: {},
  pollingPortfolios: new Set(),
  errors: {}
}

function backtestReducer(state: BacktestContextState, action: BacktestContextAction): BacktestContextState {
  switch (action.type) {
    case 'SET_BACKTEST_STATES':
      return {
        ...state,
        backtestStates: {
          ...state.backtestStates,
          [action.portfolioId]: action.states
        },
        errors: {
          ...state.errors,
          [action.portfolioId]: undefined
        }
      }
    
    case 'UPDATE_BACKTEST_STATE':
      return {
        ...state,
        backtestStates: {
          ...state.backtestStates,
          [action.portfolioId]: {
            ...state.backtestStates[action.portfolioId],
            [action.backtestId]: {
              id: action.backtestId,
              status: action.status,
              lastUpdated: Date.now()
            }
          }
        }
      }
    
    case 'START_POLLING':
      return {
        ...state,
        pollingPortfolios: new Set([...state.pollingPortfolios, action.portfolioId])
      }
    
    case 'STOP_POLLING':
      const newPollingPortfolios = new Set(state.pollingPortfolios)
      newPollingPortfolios.delete(action.portfolioId)
      return {
        ...state,
        pollingPortfolios: newPollingPortfolios
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.portfolioId]: action.error
        }
      }
    
    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors }
      delete newErrors[action.portfolioId]
      return {
        ...state,
        errors: newErrors
      }
    
    default:
      return state
  }
}

const BacktestContext = createContext<{
  state: BacktestContextState
  dispatch: React.Dispatch<BacktestContextAction>
  getBacktestStatus: (portfolioId: string, backtestId: string) => BacktestStatus | null
  isPolling: (portfolioId: string) => boolean
  hasRunningBacktests: (portfolioId: string) => boolean
  startPolling: (portfolioId: string) => void
  stopPolling: (portfolioId: string) => void
  updateBacktestStatus: (portfolioId: string, backtestId: string, status: BacktestStatus) => void
} | null>(null)

export function BacktestProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(backtestReducer, initialState)

  const getBacktestStatus = useCallback((portfolioId: string, backtestId: string): BacktestStatus | null => {
    return state.backtestStates[portfolioId]?.[backtestId]?.status || null
  }, [state.backtestStates])

  const isPolling = useCallback((portfolioId: string): boolean => {
    return state.pollingPortfolios.has(portfolioId)
  }, [state.pollingPortfolios])

  const hasRunningBacktests = useCallback((portfolioId: string): boolean => {
    const portfolioStates = state.backtestStates[portfolioId]
    if (!portfolioStates) return false
    
    return Object.values(portfolioStates).some(backtest => backtest.status === 'RUNNING')
  }, [state.backtestStates])

  const startPolling = useCallback((portfolioId: string) => {
    dispatch({ type: 'START_POLLING', portfolioId })
  }, [])

  const stopPolling = useCallback((portfolioId: string) => {
    dispatch({ type: 'STOP_POLLING', portfolioId })
  }, [])

  const updateBacktestStatus = useCallback((portfolioId: string, backtestId: string, status: BacktestStatus) => {
    dispatch({ type: 'UPDATE_BACKTEST_STATE', portfolioId, backtestId, status })
  }, [])

  const pollingPortfoliosArray = useMemo(() => 
    Array.from(state.pollingPortfolios), 
    [state.pollingPortfolios]
  )

  useEffect(() => {
    const pollInterval = 3000 // 3초마다 폴링

    const pollBacktestStatuses = async () => {
      const promises = pollingPortfoliosArray.map(async (portfolioId) => {
        try {
          const currentStatuses = await getPortfolioBacktestStatuses(portfolioId)
          
          const currentStates = state.backtestStates[portfolioId] || {}
          const hasChanges = Object.keys(currentStatuses).some(id => 
            currentStates[id]?.status !== currentStatuses[id]
          )

          if (hasChanges) {
            const newStates: Record<string, BacktestStateInfo> = {}
            Object.entries(currentStatuses).forEach(([id, status]) => {
              newStates[id] = {
                id,
                status: status as BacktestStatus,
                lastUpdated: Date.now()
              }
            })
            
            dispatch({ type: 'SET_BACKTEST_STATES', portfolioId, states: newStates })
          }

          const hasRunning = Object.values(currentStatuses).some(status => status === 'RUNNING')
          if (!hasRunning) {
            dispatch({ type: 'STOP_POLLING', portfolioId })
          }
        } catch (error) {
          console.error(`[BacktestContext] 포트폴리오 ${portfolioId} 폴링 실패:`, error)
          dispatch({ 
            type: 'SET_ERROR', 
            portfolioId, 
            error: error instanceof Error ? error.message : '상태 조회 실패' 
          })
        }
      })

      await Promise.allSettled(promises)
    }

    if (pollingPortfoliosArray.length > 0) {
      const interval = setInterval(pollBacktestStatuses, pollInterval)
      return () => clearInterval(interval)
    }
  }, [pollingPortfoliosArray, state.backtestStates])

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getBacktestStatus,
    isPolling,
    hasRunningBacktests,
    startPolling,
    stopPolling,
    updateBacktestStatus
  }), [
    state,
    getBacktestStatus,
    isPolling,
    hasRunningBacktests,
    startPolling,
    stopPolling,
    updateBacktestStatus
  ])

  return (
    <BacktestContext.Provider value={contextValue}>
      {children}
    </BacktestContext.Provider>
  )
}

export function useBacktest() {
  const context = useContext(BacktestContext)
  if (!context) {
    throw new Error('useBacktest must be used within a BacktestProvider')
  }
  return context
}
