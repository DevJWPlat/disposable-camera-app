import { API_BASE_URL } from '@/utils/api.js'

// JSON request helper shared by the organiser, gallery and setup screens.
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw Object.assign(new Error(`Server error (${response.status})`), { status: response.status })
  }
  if (!response.ok || data?.ok === false) {
    throw Object.assign(new Error(data?.error || `Request failed (${response.status})`), { status: response.status })
  }
  return data
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Reads the file name from Content-Disposition, falling back to the given name.
export function filenameFrom(response, fallback) {
  const header = response.headers.get('Content-Disposition') || ''
  const match = header.match(/filename="?([^";]+)"?/i)
  return match ? match[1] : fallback
}
