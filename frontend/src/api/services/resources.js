import api from '../client'

const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.results ?? []
}

const formatApiError = (error) => {
  const data = error.response?.data
  if (!data) return error.message
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')
  return Object.entries(data)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' | ')
}

export async function listResource(path) {
  try {
    const { data } = await api.get(path)
    return unwrapList(data)
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function getResource(path) {
  try {
    const { data } = await api.get(path)
    return data
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function createResource(path, payload) {
  try {
    const { data } = await api.post(path, payload)
    return data
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function updateResource(path, payload) {
  try {
    const { data } = await api.patch(path, payload)
    return data
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function deleteResource(path) {
  try {
    const { data } = await api.delete(path)
    return data
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function postAction(path, payload = {}) {
  try {
    const { data } = await api.post(path, payload)
    return data
  } catch (error) {
    throw new Error(formatApiError(error))
  }
}

export async function issueInvoice(id) {
  return postAction(`/invoices/${id}/issue/`)
}
