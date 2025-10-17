"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { Stock, StockState } from "@/types/stock"

type StockAction =
  | { type: "SET_SELECTED_STOCK"; payload: Stock | null }
  | { type: "ADD_TO_RECENT"; payload: Stock }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }
  | { type: "INITIALIZE_DATA" }

const initialState: StockState = {
  selectedStock: null,
  recentlyViewed: [],
  portfolioStocks: [],
  searchResults: [],
  isLoading: false,
  error: null,
}

function stockReducer(state: StockState, action: StockAction): StockState {
  switch (action.type) {
    case "SET_SELECTED_STOCK":
      return {
        ...state,
        selectedStock: action.payload,
        error: null,
      }

    case "ADD_TO_RECENT":
      const filteredRecent = state.recentlyViewed.filter((stock) => stock.symbol !== action.payload.symbol)
      return {
        ...state,
        recentlyViewed: [action.payload, ...filteredRecent].slice(0, 10),
      }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      }

    case "INITIALIZE_DATA":
      const savedRecent = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("recent-stocks") || "[]") : []

      return {
        ...state,
        recentlyViewed: savedRecent,
      }

    default:
      return state
  }
}

const StockContext = createContext<{
  state: StockState
  dispatch: React.Dispatch<StockAction>
  actions: {
    selectStock: (stock: Stock | null) => void
    addToRecent: (stock: Stock) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void
  }
} | null>(null)

interface StockProviderProps {
  children: ReactNode
}

export function StockProvider({ children }: StockProviderProps) {
  const [state, dispatch] = useReducer(stockReducer, initialState)

  useEffect(() => {
    dispatch({ type: "INITIALIZE_DATA" })
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && state.recentlyViewed.length > 0) {
      localStorage.setItem("recent-stocks", JSON.stringify(state.recentlyViewed))
    }
  }, [state.recentlyViewed])

  const actions = {
    selectStock: (stock: Stock | null) => {
      dispatch({ type: "SET_SELECTED_STOCK", payload: stock })
      if (stock) {
        dispatch({ type: "ADD_TO_RECENT", payload: stock })
      }
    },
    addToRecent: (stock: Stock) => {
      dispatch({ type: "ADD_TO_RECENT", payload: stock })
    },
    setLoading: (loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading })
    },
    setError: (error: string | null) => {
      dispatch({ type: "SET_ERROR", payload: error })
    },
    clearError: () => {
      dispatch({ type: "CLEAR_ERROR" })
    },
  }

  return <StockContext.Provider value={{ state, dispatch, actions }}>{children}</StockContext.Provider>
}

export function useStock() {
  const context = useContext(StockContext)
  if (!context) {
    throw new Error("useStock must be used within a StockProvider")
  }
  return context
}

export function useSelectedStock() {
  const { state } = useStock()
  return state.selectedStock
}

export function useRecentStocks() {
  const { state } = useStock()
  return state.recentlyViewed
}

export function usePortfolioStocks() {
  const { state } = useStock()
  return state.portfolioStocks
}

export function useStockLoading() {
  const { state } = useStock()
  return state.isLoading
}

export function useStockError() {
  const { state } = useStock()
  return state.error
}
