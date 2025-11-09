'use client'

import React, { useCallback, useMemo } from 'react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { UsersTable } from '../UsersTable'
import { UserItem } from '../../contexts/UsersContextProvider'
import { UserProfileDialog } from '../UserProfileDialog'
import DirectoryHeader from './DirectoryHeader'
import { useUserActions } from '../../hooks/useUserActions'
import { deleteUser as deleteUserApi } from './api/users'
import { toast } from 'sonner'

interface UsersTableWrapperProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, any>
  onViewProfileInline?: (user: UserItem) => void
}

/**
 * UsersTable wrapper for AdminWorkBench
 * 
 * Adapts the existing UsersTable component to work with the new AdminWorkBench layout.
 * Handles data fetching, filtering, and selection management.
 */
export default function UsersTableWrapper({
  selectedUserIds = new Set(),
  onSelectionChange,
  filters = {},
  onViewProfileInline
}: UsersTableWrapperProps) {
  const context = useUsersContext()

  // Filter users based on provided filters
  const filteredUsers = useMemo(() => {
    let result = Array.isArray(context.users) ? [...context.users] : []

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (filters.role) {
      result = result.filter((u) => u.role === filters.role)
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((u) => u.status === filters.status)
    }

    // Apply department filter if available
    if (filters.department && 'department' in result[0]) {
      result = result.filter((u) => (u as any).department === filters.department)
    }

    return result
  }, [context.users, filters])

  const handleSelectUser = useCallback(
    (userId: string, selected: boolean) => {
      const newSelection = new Set(selectedUserIds)
      if (selected) {
        newSelection.add(userId)
      } else {
        newSelection.delete(userId)
      }
      onSelectionChange?.(newSelection)
    },
    [selectedUserIds, onSelectionChange]
  )

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        onSelectionChange?.(new Set(filteredUsers.map((u) => u.id)))
      } else {
        onSelectionChange?.(new Set())
      }
    },
    [filteredUsers, onSelectionChange]
  )

  const handleViewProfile = useCallback((user: UserItem) => {
    context.setSelectedUser(user)
    if (onViewProfileInline) {
      onViewProfileInline(user)
    } else {
      context.setProfileOpen(true)
    }
  }, [context, onViewProfileInline])

  const { updateUser, updateUserRole } = useUserActions({ onRefetchUsers: context.refreshUsers, onSuccess: (msg) => toast.success(msg), onError: (err) => toast.error(err) })

  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserItem['role']) => {
      try {
        await updateUserRole(userId, newRole)
      } catch (e) {
        console.error(e)
      }
    },
    [updateUserRole]
  )

  const handleEditInline = useCallback(async (userId: string, field: string, value: any) => {
    try {
      await updateUser(userId, { [field]: value })
    } catch (e) {
      console.error(e)
    }
  }, [updateUser])

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await deleteUserApi(userId)
      toast.success('User deleted')
      await context.refreshUsers()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete user')
    }
  }, [context])

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Password reset email queued')
    } catch (e) {
      console.error(e)
      toast.error('Failed to send reset email')
    }
  }, [])

  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <DirectoryHeader
          selectedCount={selectedUserIds.size}
          onClearSelection={() => onSelectionChange?.(new Set())}
          onColumnSettings={() => console.log('Open column settings')}
          onSidebarToggle={() => console.log('Toggle sidebar')}
        />

        <div className="flex-1 overflow-hidden min-h-0 w-full">
          <UsersTable
            users={filteredUsers}
            isLoading={context.isLoading || context.usersLoading}
            onViewProfile={handleViewProfile}
            onRoleChange={handleRoleChange}
            onEditInline={handleEditInline}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            selectedUserIds={selectedUserIds}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>

      {/* User Profile Dialog - gets state from context */}
      <UserProfileDialog />
    </>
  )
}
