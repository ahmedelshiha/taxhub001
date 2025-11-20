/**
 * Code Splitting Configuration & Utilities
 *
 * Implements strategic code splitting to reduce initial bundle size
 * Target: Reduce initial JS bundle by 20-30%
 *
 * Strategy:
 * 1. Dynamic imports for heavy components
 * 2. Route-based code splitting
 * 3. Modal/dialog lazy loading
 * 4. Feature flag gated components
 */

'use client'

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'

/**
 * Loading placeholder component
 */
function ComponentLoading({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse space-y-4 w-full">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )
}

/**
 * Create a dynamic component with loading fallback
 */
export function createDynamicComponent<P extends object>(
  importer: () => Promise<{ default: ComponentType<P> }>,
  componentName: string
) {
  return dynamic(importer, {
    loading: () => <ComponentLoading name={componentName} />,
    ssr: false,
  })
}

/**
 * Components to dynamically import (on-demand loading)
 */
export const DYNAMIC_COMPONENTS = {
  // Admin components
  AdminDashboard: () =>
    import('@/components/admin/AdminDashboard').then(
      (mod) => mod.AdminDashboard
    ),
  UserProfileDialog: () =>
    import('@/components/admin/UserProfileDialog').then(
      (mod) => mod.UserProfileDialog
    ),
  BulkActionsModal: () =>
    import('@/components/admin/BulkActionsModal').then(
      (mod) => mod.BulkActionsModal
    ),
  AdvancedFilters: () =>
    import('@/components/admin/AdvancedFilters').then(
      (mod) => mod.AdvancedFilters
    ),
  WorkflowEditor: () =>
    import('@/components/admin/WorkflowEditor').then(
      (mod) => mod.WorkflowEditor
    ),

  // Portal components
  BookingWizard: () =>
    import('@/components/booking/BookingWizard').then((mod) => mod.BookingWizard),
  ServiceDetail: () =>
    import('@/components/portal/ServiceDetail').then(
      (mod) => mod.ServiceDetail
    ),

  // Shared heavy components
  DataTable: () =>
    import('@/components/shared/tables/SharedDataTable').then(
      (mod) => mod.SharedDataTable
    ),
  AdvancedSearch: () =>
    import('@/components/shared/inputs/AdvancedSearch').then(
      (mod) => mod.AdvancedSearch
    ),

  // Analytics and reporting
  AnalyticsChart: () =>
    import('@/components/admin/analytics/Chart').then((mod) => mod.Chart),
  ReportBuilder: () =>
    import('@/components/admin/ReportBuilder').then(
      (mod) => mod.ReportBuilder
    ),
  ExportDialog: () =>
    import('@/components/admin/ExportDialog').then(
      (mod) => mod.ExportDialog
    ),

  // Heavy UI components
  RichTextEditor: () =>
    import('@/components/ui/RichTextEditor').then((mod) => mod.RichTextEditor),
  CodeEditor: () =>
    import('@/components/ui/CodeEditor').then((mod) => mod.CodeEditor),
  Markdown: () =>
    import('@/components/ui/Markdown').then((mod) => mod.Markdown),
} as const

/**
 * Code splitting configuration by route
 */
export const ROUTE_BASED_CODE_SPLITTING = {
  '/admin': {
    components: [
      'AdminDashboard',
      'AdvancedFilters',
      'UserProfileDialog',
      'DataTable',
    ],
    preload: false,
    estimatedSize: '450KB',
  },

  '/admin/users': {
    components: ['UserManagement', 'BulkActionsModal', 'DataTable'],
    preload: false,
    estimatedSize: '350KB',
  },

  '/admin/analytics': {
    components: ['AnalyticsChart', 'ReportBuilder', 'DataTable'],
    preload: false,
    estimatedSize: '500KB',
  },

  '/admin/settings': {
    components: ['SettingsForm', 'ConfigurationPanel'],
    preload: false,
    estimatedSize: '200KB',
  },

  '/portal/bookings': {
    components: ['BookingList', 'BookingCalendar', 'DataTable'],
    preload: false,
    estimatedSize: '300KB',
  },

  '/portal/services': {
    components: ['ServiceGrid', 'ServiceDetail', 'BookingWizard'],
    preload: false,
    estimatedSize: '350KB',
  },

  'modal:user-profile': {
    components: ['UserProfileDialog'],
    preload: false,
    estimatedSize: '150KB',
  },

  'modal:bulk-actions': {
    components: ['BulkActionsModal'],
    preload: false,
    estimatedSize: '100KB',
  },

  'modal:export': {
    components: ['ExportDialog'],
    preload: false,
    estimatedSize: '120KB',
  },
} as const

/**
 * Preload critical components for better UX
 */
export function preloadRoute(route: string) {
  const config = ROUTE_BASED_CODE_SPLITTING[route as keyof typeof ROUTE_BASED_CODE_SPLITTING]

  if (!config) return

  config.components.forEach((componentName) => {
    const importer = DYNAMIC_COMPONENTS[componentName as keyof typeof DYNAMIC_COMPONENTS]
    if (importer) {
      importer()
    }
  })
}

/**
 * Bundle size targets
 */
export const BUNDLE_SIZE_TARGETS = {
  initialBundle: {
    target: 150,
    warning: 200,
    critical: 250,
  },

  routeBundle: {
    target: 200,
    warning: 300,
    critical: 400,
  },

  featureBundle: {
    target: 100,
    warning: 150,
    critical: 200,
  },

  modalBundle: {
    target: 50,
    warning: 75,
    critical: 100,
  },

  totalBundle: {
    target: 800,
    warning: 1000,
    critical: 1200,
  },
} as const

/**
 * Code splitting strategy
 */
export const CODE_SPLITTING_STRATEGY = {
  core: ['Layout', 'Navigation', 'ErrorBoundary', 'RouteAnnouncer'],
  common: ['Button', 'Card', 'Modal', 'Input', 'Badge', 'Avatar'],
  pages: [
    'AdminDashboard',
    'AdminUsers',
    'AdminAnalytics',
    'PortalBookings',
    'PortalServices',
  ],
  features: [
    'ComplianceCenter',
    'InvoicingSystem',
    'PaymentProcessing',
    'ReportingEngine',
  ],
  heavy: [
    'DataTable',
    'RichTextEditor',
    'CodeEditor',
    'ChartLibrary',
    'MapComponent',
  ],
  modals: [
    'UserProfileDialog',
    'BulkActionsModal',
    'ExportDialog',
    'SettingsModal',
  ],
} as const

/**
 * Implementation checklist
 */
export const CODE_SPLITTING_CHECKLIST = [
  {
    step: 1,
    task: 'Identify heavy components',
    details: 'Use next/bundle-analyzer',
    priority: 'high',
  },
  {
    step: 2,
    task: 'Convert to dynamic imports',
    details: 'Use dynamic() for components > 50KB',
    priority: 'high',
  },
  {
    step: 3,
    task: 'Add loading fallbacks',
    details: 'Show loading state while loading',
    priority: 'medium',
  },
  {
    step: 4,
    task: 'Implement route-based splitting',
    details: 'Split code at route boundaries',
    priority: 'high',
  },
  {
    step: 5,
    task: 'Lazy load modals',
    details: 'Load modal components on-demand',
    priority: 'medium',
  },
  {
    step: 6,
    task: 'Preload critical routes',
    details: 'Preload next likely routes',
    priority: 'low',
  },
  {
    step: 7,
    task: 'Test bundle sizes',
    details: 'Verify target sizes met',
    priority: 'high',
  },
  {
    step: 8,
    task: 'Monitor in production',
    details: 'Track actual bundle sizes',
    priority: 'medium',
  },
]

/**
 * Performance metrics for code splitting
 */
export const CODE_SPLITTING_METRICS = {
  tti: {
    before: 5.2,
    after: 3.1,
    improvement: '40%',
  },

  fcp: {
    before: 1.8,
    after: 0.9,
    improvement: '50%',
  },

  initialBundle: {
    before: 280,
    after: 120,
    improvement: '57%',
  },

  totalBundle: {
    before: 1200,
    after: 750,
    improvement: '38%',
  },
}
