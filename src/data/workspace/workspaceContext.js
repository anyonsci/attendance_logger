import api from '../../api/client'

const WORKSPACE_STORAGE_KEY = 'active_workspace_id'
const WORKSPACE_CACHE_KEY = 'workspaces_list'

let _activeWorkspaceId = typeof localStorage !== 'undefined' ? localStorage.getItem(WORKSPACE_STORAGE_KEY) : null

export function getWorkspaceId() {
  return _activeWorkspaceId
}

export function setWorkspaceId(workspaceId) {
  _activeWorkspaceId = workspaceId || null
  if (workspaceId) {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
  } else {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('workspaceChange'))
  }
}

export function clearWorkspaceId() {
  _activeWorkspaceId = null
  localStorage.removeItem(WORKSPACE_STORAGE_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('workspaceChange'))
  }
}

export async function fetchWorkspaces() {
  try {
    const response = await api.get('/workspace')
    const data = Array.isArray(response.data) ? response.data : []
    localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(data))
    return data
  } catch (err) {
    console.error('Failed to fetch workspaces', err)
    return getCachedWorkspaces()
  }
}

export function getCachedWorkspaces() {
  try {
    const raw = localStorage.getItem(WORKSPACE_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function createWorkspace(name) {
  let ownerEmail = ''
  try {
    const userObj = JSON.parse(localStorage.getItem('auth_user') || '{}')
    ownerEmail = userObj.email || ''
  } catch {}

  const response = await api.post('/workspace', {
    name,
    ownerEmail,
  })

  await fetchWorkspaces()
  return response.data
}

