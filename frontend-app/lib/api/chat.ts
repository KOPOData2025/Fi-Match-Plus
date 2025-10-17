import { API_CONFIG } from '@/lib/api'
import { authenticatedFetch } from './interceptor'

export interface ChatResponse {
  answer: string
  success: boolean
  error?: string
}

export interface ChatApiData {
  category: string
  categoryDescription: string
  question: string
  answer: string
}

export interface ChatApiResponse {
  status: string
  message: string
  timestamp: string
  data: ChatApiData
}

export async function sendChatMessage(category: 'loss' | 'profit' | 'benchmark', question: string): Promise<ChatResponse> {
  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/chat/${category}?question=${encodeURIComponent(question)}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    console.error('챗봇 API 오류:', error)
    
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

export async function sendChatMessagePost(
  category: 'loss' | 'profit' | 'benchmark', 
  question: string, 
  context?: Record<string, any>
): Promise<ChatResponse> {
  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/chat/${category}`, {
      method: 'POST',
      body: JSON.stringify({
        question,
        context
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    console.error('챗봇 API 오류:', error)
    
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

export async function sendContextChatMessage(
  context: 'portfolio' | 'backtest' | 'create-portfolio',
  question: string
): Promise<ChatResponse> {
  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/chat/${context}?question=${encodeURIComponent(question)}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ChatApiResponse = await response.json()
    
    if (result.status !== 'success') {
      throw new Error(result.message || '답변을 가져오는데 문제가 발생했습니다.')
    }
    
    return {
      answer: result.data.answer || '답변을 가져오는데 문제가 발생했습니다.',
      success: true
    }
  } catch (error) {
    return {
      answer: '죄송합니다. 현재 서비스에 접속할 수 없습니다. 잠시 후 다시 시도해주세요.',
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}
