'use client'

import React, { memo, useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import type { Permission } from '@/lib/permissions'
import { PERMISSIONS, PERMISSION_METADATA, ROLE_PERMISSIONS } from '@/lib/permissions'

interface PermissionsTabProps {
  user: UserItem
}

export const PermissionsTab = memo(function PermissionsTab({ user }: PermissionsTabProps) {
  const { setSelectedUser } = useUsersContext()
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user.role || 'VIEWER')
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    user.permissions || []
  )
  const [error, setError] = useState<string | null>(null)

  // Check if there are changes
  const hasChanges = useMemo(() => {
    const roleChanged = selectedRole !== user.role
    const permsChanged =
      selectedPermissions.length !== (user.permissions?.length || 0) ||
      selectedPermissions.some(p => !user.permissions?.includes(p))
    return roleChanged || permsChanged
  }, [selectedRole, selectedPermissions, user])

  // Get available roles
  const availableRoles = useMemo(() => {
    return Object.keys(ROLE_PERMISSIONS || {})
  }, [])

  // Get available permissions for the selected role
  const availablePermissions = useMemo(() => {
    return Object.values(PERMISSIONS || {})
  }, [])

  const handleRoleChange = useCallback((newRole: string) => {
    setSelectedRole(newRole)
    setError(null)
    // Optionally update permissions based on role
    if (ROLE_PERMISSIONS && ROLE_PERMISSIONS[newRole]) {
      setSelectedPermissions(ROLE_PERMISSIONS[newRole] as Permission[])
    }
  }, [])

  const handlePermissionToggle = useCallback(
    (permission: Permission) => {
      setSelectedPermissions(prev => {
        if (prev.includes(permission)) {
          return prev.filter(p => p !== permission)
        } else {
          return [...prev, permission]
        }
      })
      setError(null)
    },
    []
  )

  const handleReset = useCallback(() => {
    setSelectedRole(user.role || 'VIEWER')
    setSelectedPermissions(user.permissions || [])
    setError(null)
  }, [user])

  const handleSave = useCallback(async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await apiFetch(
        `/api/admin/users/${user.id}/permissions`,
        {
          method: 'PUT',
          body: JSON.stringify({
            targetIds: [user.id],
            roleChange: {
              from: user.role,
              to: selectedRole,
            },
            permissionChanges: {
              added: selectedPermissions.filter(p => !user.permissions?.includes(p)),
              removed: (user.permissions || []).filter(p => !selectedPermissions.includes(p)),
            },
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update permissions')
      }

      toast.success('Permissions updated successfully')
      
      // Update the selected user in context
      setSelectedUser({
        ...user,
        role: selectedRole,
        permissions: selectedPermissions,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [user, selectedRole, selectedPermissions, setSelectedUser])

  return (
    <div className="max-w-2xl space-y-8">
      {/* Role Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">Role Assignment</h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="role-select" className="text-sm font-semibold text-slate-900 block mb-3">
              Select Role
            </label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-600 mt-2">
              Select a role to automatically assign standard permissions for that role
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Current Role</p>
            <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
              {selectedRole}
            </Badge>
          </div>
        </div>
      </section>

      {/* Permissions Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-semibold text-slate-900">Manage Permissions</h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          {selectedPermissions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Current Permissions ({selectedPermissions.length})
              </p>
              <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {selectedPermissions.map(perm => (
                  <Badge
                    key={perm}
                    className="bg-green-100 text-green-800 border border-green-200 font-normal cursor-pointer hover:bg-green-200"
                    onClick={() => handlePermissionToggle(perm)}
                    title={`Click to remove ${perm}`}
                  >
                    ✓ {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Available Permissions
            </p>
            <div className="space-y-2">
              {availablePermissions.map(perm => {
                const isSelected = selectedPermissions.includes(perm)
                const metadata = PERMISSION_METADATA?.[perm]
                
                return (
                  <label
                    key={perm}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePermissionToggle(perm)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{perm}</p>
                      {metadata?.description && (
                        <p className="text-xs text-slate-600 mt-1">{metadata.description}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
            {availablePermissions.length === 0 && (
              <p className="text-sm text-slate-600">No additional permissions available</p>
            )}
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <section className="border-t border-slate-200 pt-6 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            disabled={isSaving}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
        </section>
      )}

      {!hasChanges && selectedPermissions.length > 0 && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">No changes</p>
            <p className="text-sm text-green-800 mt-1">
              Current permissions are up to date
            </p>
          </div>
        </section>
      )}
    </div>
  )
})

PermissionsTab.displayName = 'PermissionsTab'
