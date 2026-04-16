export const API_URL = "http://localhost:8000"

function parseApiError(errorBody: any): string {
  if (typeof errorBody.detail === "string") {
    return errorBody.detail
  } else if (Array.isArray(errorBody.detail)) {
    return errorBody.detail.map((err: any) => `${err.loc?.[err.loc.length - 1] || "Field"}: ${err.msg}`).join(", ")
  } else if (errorBody.detail) {
    return JSON.stringify(errorBody.detail)
  }
  return "Что-то пошло не так"
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  })
  
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(parseApiError(errorBody))
  }
  
  return res.json()
}

export async function postApiForm(endpoint: string, formData: FormData) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(parseApiError(errorBody))
  }
  return res.json()
}
