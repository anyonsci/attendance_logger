/**
 * @typedef {'read' | 'create' | 'edit' | 'delete'} Permission
 * @typedef {Record<string, Permission[]>} PermissionMap  resource → allowed ops
 */

/** Thrown when the current user lacks a required permission. */
export class PermissionError extends Error {
  /**
   * @param {string} resource
   * @param {Permission} action
   */
  constructor(resource, action) {
    super(`Permission denied: cannot '${action}' on '${resource}'`)
    this.name = 'PermissionError'
    this.resource = resource
    this.action = action
  }
}

/**
 * Default: full access to every resource.
 * Replace after login once the backend sends real role data.
 * @type {PermissionMap}
 */
let _permissionMap = {
  people:     ['read', 'create', 'edit', 'delete'],
  attendance: ['read', 'create', 'edit', 'delete'],
  notes:      ['read', 'create', 'edit', 'delete'],
}

/**
 * Overwrite the permission map from backend role data.
 * Called once after a successful login response.
 * @param {PermissionMap} permMap
 */
export function setPermissions(permMap) {
  _permissionMap = permMap
}

/**
 * Returns true if the current user holds `action` on `resource`.
 * @param {string} resource  e.g. 'people', 'attendance', 'notes'
 * @param {Permission} action
 */
export function hasPermission(resource, action) {
  return (_permissionMap[resource] || []).includes(action)
}

/**
 * Throws a `PermissionError` if the current user lacks the given permission.
 * Place at the top of every mutating repository method.
 * @param {string} resource
 * @param {Permission} action
 * @throws {PermissionError}
 */
export function assertPermission(resource, action) {
  if (!hasPermission(resource, action)) {
    throw new PermissionError(resource, action)
  }
}
