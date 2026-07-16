import api from '../client'

export async function loginRequest(credentials) {
  const { data } = await api.post('/auth/login/', credentials)
  return data
}

export async function logoutRequest() {
  const { data } = await api.post('/auth/logout/')
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me/')
  return data.user
}
