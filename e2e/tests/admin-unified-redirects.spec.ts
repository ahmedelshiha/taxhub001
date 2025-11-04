import { test, expect } from '@playwright/test'

async function devLoginAndSetCookie(page: any, request: any, baseURL: string | undefined, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/_dev/login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    { name: '__Secure-next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ])
}

test.describe('Unified Admin redirects and tabs', () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')
  })

  test('permissions redirects to RBAC tab', async ({ page }) => {
    await page.goto('/admin/permissions')
    await expect(page).toHaveURL(/\/admin\/users\?/) // unified page
    expect(page.url()).toMatch(/tab=rbac/) // RBAC tab
  })

  test('roles redirects to RBAC tab', async ({ page }) => {
    await page.goto('/admin/roles')
    await expect(page).toHaveURL(/\/admin\/users\?/) // unified page
    expect(page.url()).toMatch(/tab=rbac/) // RBAC tab
  })

  test('clients redirects to Dashboard tab with CLIENT role filter', async ({ page }) => {
    await page.goto('/admin/clients')
    await expect(page).toHaveURL(/\/admin\/users\?/) // unified users page
    expect(page.url()).toMatch(/tab=dashboard/) // Dashboard tab
    expect(page.url()).toMatch(/role=CLIENT/) // CLIENT role filter
    // Verify Dashboard tab is active
    await expect(page.getByRole('tab', { name: /dashboard/i, selected: true })).toBeVisible({ timeout: 5000 })
  })

  test('team redirects to Dashboard tab with TEAM_MEMBER role filter', async ({ page }) => {
    await page.goto('/admin/team')
    await expect(page).toHaveURL(/\/admin\/users\?/) // unified users page
    expect(page.url()).toMatch(/tab=dashboard/) // Dashboard tab
    expect(page.url()).toMatch(/role=TEAM_MEMBER/) // TEAM_MEMBER role filter
    // Verify Dashboard tab is active
    await expect(page.getByRole('tab', { name: /dashboard/i, selected: true })).toBeVisible({ timeout: 5000 })
  })

  test('unified Users page shows Entities and RBAC tabs', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByRole('tab', { name: /entities/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /roles & permissions/i })).toBeVisible()
  })
})
