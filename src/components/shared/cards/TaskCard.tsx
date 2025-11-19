'use client'

import React from 'react'
import { Task } from '@/types/shared/entities/task'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit2, Trash2, CheckCircle2, AlertCircle, Clock, User } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatRelativeTime } from '@/lib/shared/formatters'

interface TaskCardProps extends CardComponentProps<Task> {
  /** The task to display */
  data: Task
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to edit task */
  onEdit?: (id: string) => void
  /** Called to delete task */
  onDelete?: (id: string) => void
  /** Called to change status (portal: update own) */
  onStatusChange?: (id: string, status: string) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
}

/**
 * TaskCard Component
 *
 * Displays task information in a card format.
 * Portal variant: View assigned tasks, update status, add comments
 * Admin variant: Full CRUD, assign team members
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <TaskCard task={task} variant="portal" onStatusChange={handleStatusChange} />
 *
 * // Admin usage
 * <TaskCard task={task} variant="admin" onEdit={handleEdit} onDelete={handleDelete} />
 * ```
 */
export default function TaskCard({
  data: task,
  variant = 'portal',
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  loading = false,
  showActions = true,
  className = '',
}: TaskCardProps) {
  const { has } = usePermissions()
  const canEditTask = has(PERMISSIONS.TASKS_EDIT)
  const canDeleteTask = has(PERMISSIONS.TASKS_DELETE)
  const canUpdateOwnTask = has(PERMISSIONS.TASKS_UPDATE_OWN)

  if (!task) return null

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    IN_REVIEW: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  const priorityColors = {
    LOW: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  }

  const dueDate = task.dueAt ? new Date(task.dueAt) : null
  const isOverdue = dueDate && dueDate < new Date()

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Task: ${task.title}`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{task.title}</p>
          {dueDate && (
            <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              Due {formatDate(dueDate, 'short')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Badge className={statusColors[task.status] || 'bg-gray-100 text-gray-800'}>
            {task.status.replace('_', ' ')}
          </Badge>
          {task.priority && (
            <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    if (onEdit && canEditTask && !loading) {
      onEdit(task.id)
    }
  }

  const handleDelete = () => {
    if (onDelete && canDeleteTask && !loading) {
      onDelete(task.id)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && (canEditTask || canUpdateOwnTask) && !loading) {
      onStatusChange(task.id, newStatus)
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${className}`}
      onClick={onClick}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : task.status === 'BLOCKED' ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : null}
              <CardTitle className="truncate">{task.title}</CardTitle>
            </div>
            {task.description && (
              <CardDescription className="text-xs mt-1">{task.description}</CardDescription>
            )}
          </div>
          <Badge className={statusColors[task.status] || 'bg-gray-100 text-gray-800'}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Priority & Due Date */}
        <div className="flex items-center gap-4 text-sm">
          {task.priority && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            </div>
          )}
          {dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
              <Clock className="h-4 w-4" />
              <span>{formatDate(dueDate, 'short')}</span>
              {isOverdue && <span className="text-xs">(overdue)</span>}
            </div>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t">
            <User className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{task.assignee.name}</p>
              <p className="text-xs text-gray-500">Assigned to</p>
            </div>
          </div>
        )}

        {/* Progress (if applicable) */}
        {task.progress != null && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
                role="progressbar"
                aria-valuenow={task.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Description (full) */}
        {task.description && variant === 'admin' && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-3">{task.description}</p>
          </div>
        )}

        {/* Status Select (Portal) */}
        {variant === 'portal' && showActions && (
          <div className="pt-2 border-t">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Change Status</label>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded-md"
              disabled={loading}
              aria-label="Change task status"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        )}

        {/* Actions (Admin) */}
        {variant === 'admin' && showActions && (
          <div className="pt-2 border-t flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              disabled={!canEditTask || loading}
              className="flex-1"
              aria-label={`Edit task ${task.id.slice(0, 8)}`}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={!canDeleteTask || loading}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Delete task ${task.id.slice(0, 8)}`}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>

      {/* Footer - Created/Updated info */}
      {task.createdAt && (
        <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 border-t">
          {task.status === 'COMPLETED' && task.updatedAt
            ? `Completed ${formatRelativeTime(new Date(task.updatedAt))}`
            : `Created ${formatRelativeTime(new Date(task.createdAt))}`}
        </div>
      )}
    </Card>
  )
}
