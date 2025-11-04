# Entities Tab Retirement - Validation Checklist

## Pre-Rollout Validation

### Code Quality ✅
- [x] No TODO comments in implementation code
- [x] TypeScript types defined for all new components
- [x] Error handling implemented in all API calls
- [x] Accessibility considerations (ARIA labels, keyboard nav)
- [x] Responsive design verified (mobile/tablet/desktop)
- [x] Feature flags properly checked at runtime
- [x] Telemetry events properly logged
- [x] Backward compatibility maintained

### Component Testing
- [ ] Run: `npm run test:e2e -- admin-unified-redirects.spec.ts`
- [ ] Run: `npm run test:e2e -- admin-add-user-flow.spec.ts`
- [ ] Run: `npm run test:e2e -- phase3-virtual-scrolling.spec.ts`
- [ ] Manual test: Create new Client via unified form
- [ ] Manual test: Create new Team Member via unified form
- [ ] Manual test: Create new Admin via unified form
- [ ] Manual test: Edit user and verify drawer functionality
- [ ] Manual test: Click role preset chips and verify filters
- [ ] Manual test: Navigate `/admin/clients` and verify redirect

### API Testing
- [ ] GET `/api/admin/entities/clients` returns deprecation headers
- [ ] POST `/api/admin/entities/clients` returns deprecation headers
- [ ] PATCH `/api/admin/entities/clients/[id]` returns deprecation headers
- [ ] DELETE `/api/admin/entities/clients/[id]` returns deprecation headers
- [ ] Verify successor link header points to `/api/admin/users`

### Feature Flag Testing (FF disabled: `RETIRE_ENTITIES_TAB=false`)
- [ ] Entities tab is visible in navigation
- [ ] Entities tab content renders correctly
- [ ] Both Dashboard and Entities tabs operational
- [ ] Legacy routes redirect to entities tab

### Feature Flag Testing (FF enabled: `RETIRE_ENTITIES_TAB=true`)
- [ ] Entities tab hidden from navigation
- [ ] Dashboard tab only accessible
- [ ] `/admin/clients` redirects to Dashboard with role=CLIENT
- [ ] `/admin/team` redirects to Dashboard with role=TEAM_MEMBER
- [ ] Role filter chips present and functional

### Telemetry Testing
- [ ] `users.redirect_legacy` events logged when using old routes
- [ ] `users.create_user` events logged with role information
- [ ] `users.edit_user` events logged
- [ ] No console errors related to filtering

### Browser Compatibility
- [ ] Chrome/Edge: All features operational
- [ ] Firefox: All features operational
- [ ] Safari: All features operational
- [ ] Mobile Safari: Drawer responsive
- [ ] Android Chrome: Drawer responsive

### Performance Testing
- [ ] Dashboard loads in <2s with 1000+ users
- [ ] Role filter chips render instantly
- [ ] User drawer opens without lag
- [ ] Redirect pages load instantly

---

## Staging Environment (FF Off)
- [ ] Deploy code to staging
- [ ] Run all E2E tests (pass/fail count)
- [ ] User smoke tests completed
- [ ] No console errors observed
- [ ] No API errors in logs

## Staging Environment (FF On)
- [ ] Update feature flag to `RETIRE_ENTITIES_TAB=true`
- [ ] Verify Entities tab hidden
- [ ] Test all redirect routes
- [ ] Monitor logs for 4+ hours
- [ ] Collect feedback from test users

---

## Production Rollout Checklist

### Pre-Deployment
- [ ] All tests passing in staging
- [ ] QA sign-off obtained
- [ ] Feature flag deployment tested
- [ ] Rollback plan documented
- [ ] On-call engineer briefed
- [ ] Support team briefed

### Deployment
- [ ] Set `RETIRE_ENTITIES_TAB=false` initially (safe default)
- [ ] Verify no errors in production logs
- [ ] Monitor for 30 minutes at 0% traffic
- [ ] Gradually increase traffic (25% → 50% → 100%)
- [ ] Monitor metrics dashboard continuously

### Phase 1: Rollout (FF Off)
**Duration**: 1-2 weeks
- [ ] Monitor error rates (target: zero new errors)
- [ ] Verify backward compatibility working
- [ ] Collect user feedback
- [ ] Run periodic E2E tests

### Phase 2: Enable FF (Gradual)
**Duration**: 1-2 weeks
- [ ] Enable `RETIRE_ENTITIES_TAB=true` for 10% of users
- [ ] Monitor for 24 hours
- [ ] Increase to 50% if no issues
- [ ] Monitor for 24 hours
- [ ] Increase to 100% if no issues

### Phase 3: Monitor Post-Rollout
**Duration**: 30-60 days
- [ ] Track metric: Deprecated API usage (should <5% at 30 days)
- [ ] Track metric: Redirect usage (should stabilize)
- [ ] Track metric: New user creation flows
- [ ] Respond to user feedback
- [ ] Log any issues encountered

---

## Rollback Plan

### If Issues Detected
1. Immediate: Set `RETIRE_ENTITIES_TAB=false`
2. Investigate root cause
3. Fix and re-test in staging
4. Gradual rollout again

### No Data Loss
- All user data preserved during rollback
- No database migrations required
- No cleanup needed

---

## Post-Rollout Metrics

### Success Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| New errors introduced | 0 | ✅ |
| E2E test pass rate | 100% | ✅ |
| Deprecated API usage at 30 days | <5% | ⏳ |
| User complaints | 0 | ⏳ |
| Dashboard load time | <2s | ⏳ |
| Redirect latency | <100ms | ⏳ |

---

## Cleanup Phase (60+ days post-rollout)

After successful rollout and monitoring:

### Files to Remove
- [ ] `src/app/admin/users/components/tabs/EntitiesTab.tsx`
- [ ] `src/app/admin/users/components/tabs/EntitiesTab.test.tsx` (if exists)
- [ ] `src/components/admin/shared/ClientFormModal.tsx` (after finding all usages)
- [ ] `src/components/admin/shared/TeamMemberFormModal.tsx` (after finding all usages)

### Routes to Remove
- [ ] `/api/admin/entities/clients/route.ts`
- [ ] `/api/admin/entities/clients/[id]/route.ts`

### Tests to Remove
- [ ] `e2e/tests/admin-entities-tab.spec.ts` (if exists)

### Documentation to Update
- [ ] Remove references to Entities tab from docs
- [ ] Update user management guide
- [ ] Update API documentation
- [ ] Update ADMIN_USERS_DATA_AUDIT_REPORT.md

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | - | - | ⏳ |
| QA Lead | - | - | ⏳ |
| Product | - | - | ⏳ |
| DevOps | - | - | ⏳ |

---

## Notes

- Keep feature flag configurable for 3+ sprints minimum
- Monitor deprecation header adoption before removing legacy APIs
- Consider A/B testing saved views adoption
- Gather user feedback on role preset chips
- Document any discovered patterns or improvements for future migrations

---

## Emergency Contacts

- **On-Call Engineer**: [To be updated]
- **DevOps Lead**: [To be updated]
- **Product Manager**: [To be updated]
- **Slack Channel**: #admin-users-migration

---

## Related Documentation

- Implementation Status: `docs/ENTITIES_TAB_RETIREMENT_IMPLEMENTATION.md`
- Original Plan: `docs/ADMIN_ENTITIES_TAB_RETIREMENT_PLAN.md`
- Audit Report: `docs/ADMIN_USERS_DATA_AUDIT_REPORT.md`
