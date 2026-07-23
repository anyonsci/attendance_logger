/**
 * The active workspace ID, injected into every API request.
 * Consumers never pass workspaceId manually — repositories read it here.
 *
 * @type {string | null}
 */
let _activeWorkspaceId = null

/**
 * Set the active workspace. Call this when the user selects a workspace
 * from the UI (e.g. after login or from a workspace-picker dropdown).
 * @param {string | null} workspaceId
 */
export function setWorkspaceId(workspaceId) {
  _activeWorkspaceId = workspaceId || null
}

/**
 * Returns the active workspace ID, or null if none has been selected.
 * Repositories call this to build request params.
 */
export function getWorkspaceId() {
  return _activeWorkspaceId
}

/** Clear the active workspace (e.g. on sign-out). */
export function clearWorkspaceId() {
  _activeWorkspaceId = null
}
