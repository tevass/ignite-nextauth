type User = {
  permissions: string[];
  roles: string[];
}

type validateUsePermissionParams = {
  user?: User;
  permissions?: string[];
  roles?: string[];
}

export function validateUsePermission({ user, permissions, roles }: validateUsePermissionParams) {
  if(permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every(permission => {
      return user?.permissions.includes(permission)
    })

    if(!hasAllPermissions) return false
  }

  if(roles && roles.length > 0) {
    const hasAllRoles = roles.some(role => {
      return user?.roles.includes(role)
    })

    if(!hasAllRoles) return false
  }

  return true
}