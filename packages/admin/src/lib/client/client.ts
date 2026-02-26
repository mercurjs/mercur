import { createClient, InferClient } from '@mercurjs/client'
import { Routes } from '@mercurjs/core-plugin/_generated'
import config from 'virtual:mercur/config'

export const backendUrl = config.backendUrl ?? 'http://localhost:9000'

export const sdk: InferClient<Routes> = createClient({
  baseUrl: backendUrl,
  fetchOptions: {
    credentials: 'include',
  },
})

export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers,
  }: {
    method: 'GET' | 'POST' | 'DELETE'
    body?: object
    query?: Record<string, string | number | object>
    headers?: { [key: string]: string }
  }
) => {
  const params = Object.entries(query || {}).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        const arrayParams = value
          .map(
            (item) =>
              `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`
          )
          .join('&')
        if (acc) {
          acc += '&' + arrayParams
        } else {
          acc = arrayParams
        }
      } else {
        const separator = acc ? '&' : ''
        const serializedValue =
          typeof value === 'object' ? JSON.stringify(value) : value
        acc += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}`
      }
    }
    return acc
  }, '')

  const response = await fetch(
    `${backendUrl}${url}${params ? `?${params}` : ''}`,
    {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
    }
  )

  if (!response.ok) {
    const errorData = await response.json()

    if (response.status === 401) {
      window.location.href = '/login?reason=Unauthorized'
      return
    }

    const error = new Error(errorData.message || 'Server error')
      ; (error as Error & { status: number }).status = response.status
    throw error
  }

  return response.json()
}

export const uploadFilesQuery = async (files: any[]) => {
  const formData = new FormData()

  for (const { file } of files) {
    formData.append('files', file)
  }

  const response = await fetch(`${backendUrl}/vendor/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}
