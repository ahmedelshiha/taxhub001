'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Task } from '@/types/shared/entities/task'
import { TaskCreateSchema, TaskUpdateSchema } from '@/schemas/shared/task'
import { FormComponentProps } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { AlertCircle, Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react'

interface TaskFormProps extends FormComponentProps<Task> {
  /** Task to edit (if editing) */
  initialData?: Partial<Task>
  /** Called when form is submitted */
  onSubmit: (data: any) => void | Promise<void>
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Error message from submission */
  submitError?: string
  /** Display variant - admin can assign, portal cannot */
  variant?: 'portal' | 'admin'
}

/**
 * TaskForm Component
 *
 * Form for creating and editing tasks.
 * Admin variant: Full control - assign to team, set priorities, manage status
 * Portal variant: Limited - update own task status, add notes
 *
 * @example
 * ```tsx
 * // Admin: Create task and assign to team
 * <TaskForm
 *   variant="admin"
 *   onSubmit={handleSubmit}
 * />
 *
 * // Portal: Update own task
 * <TaskForm
 *   variant="portal"
 *   initialData={myTask}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export default function TaskForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitError,
  variant = 'admin',
  className,
}: TaskFormProps) {
  const { can } = usePermissions()
  const isAdmin = variant === 'admin' && can(PERMISSIONS.TASKS_CREATE)
  const isEditing = !!initialData?.id

  // Determine which schema to use
  const schema = isEditing ? TaskUpdateSchema : TaskCreateSchema

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'OPEN',
      priority: initialData?.priority || 'MEDIUM',
      dueAt: initialData?.dueAt ? new Date(initialData.dueAt).toISOString().split('T')[0] : '',
      assigneeId: initialData?.assigneeId || '',
      parentTaskId: initialData?.parentTaskId || '',
      tags: (initialData?.tags as string[]) || [],
      estimatedHours: initialData?.estimatedHours || undefined,
    },
  })

  const onSubmitHandler = async (data: any) => {
    if (data.dueAt) {
      data.dueAt = new Date(`${data.dueAt}T00:00:00`)
    }
    await onSubmit(data)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Task' : 'Create Task'}</CardTitle>
        </CardHeader>
        <CardContent>
          {submitError && (
            <div className="mb-6 flex gap-2 rounded-md bg-red-50 p-4 text-red-900">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
              {/* Task Title and Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Task Details</h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Prepare tax return"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed task description..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          value={field.value || ''}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status and Priority */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Task Status</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting || !isAdmin}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scheduling</h3>

                <FormField
                  control={form.control}
                  name="dueAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="2.5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>Time estimate for completing this task</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Assignment (Admin Only) */}
              {isAdmin && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Assignment</h3>

                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user-1">Alice Johnson</SelectItem>
                            <SelectItem value="user-2">Bob Williams</SelectItem>
                            <SelectItem value="user-3">Carol Davis</SelectItem>
                            <SelectItem value="user-4">David Martinez</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Team member responsible for this task</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentTaskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Task</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No parent task (standalone)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No parent task</SelectItem>
                            <SelectItem value="task-1">Q4 Tax Preparation</SelectItem>
                            <SelectItem value="task-2">Annual Audit</SelectItem>
                            <SelectItem value="task-3">Compliance Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Link this as a subtask (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
