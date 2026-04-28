# Sprint 1 Migration Checklist

## Pre-Migration

### 1. Backup Current State
- [ ] Commit current changes: `git add . && git commit -m "Pre-Sprint 1 backup"`
- [ ] Create backup branch: `git checkout -b pre-sprint-1-backup`
- [ ] Return to main: `git checkout improvements`

### 2. Verify Dependencies
- [ ] Run `npm install framer-motion --save`
- [ ] Check package.json includes: `"framer-motion": "^11.x.x"`
- [ ] Run `npm install` to ensure lock file is updated

### 3. Test Current Functionality
- [ ] Run dev server: `npm run dev`
- [ ] Test all tabs work correctly
- [ ] Test keyboard navigation (arrow keys)
- [ ] Test accessibility with screen reader
- [ ] Take screenshots for comparison

---

## Migration Steps

### Step 1: Deploy Enhanced Tabs Component

**Option A: Direct Replacement (Recommended)**
```bash
# Backup original
cp src/components/Tabs.tsx src/components/Tabs.legacy.tsx

# Replace with enhanced version
cp src/components/Tabs.enhanced.tsx src/components/Tabs.tsx
```

**Option B: Gradual Migration**
```bash
# Keep both versions, update imports manually
# In files using Tabs:
# import Tabs from './components/Tabs.enhanced';
```

- [ ] Choose migration option
- [ ] Execute file operations
- [ ] Verify no import errors: `npm run build`

### Step 2: Verify CSS Utilities

- [ ] Check `src/index.css` includes new classes:
  - [ ] `.elevation-multi-layer`
  - [ ] `.shadow-elevation-active`
  - [ ] `.shadow-elevation-hover`
  - [ ] `.focus-ring-enhanced`
  - [ ] `@keyframes focusPulse`
  - [ ] `@keyframes focusGlow`

- [ ] Verify reduced motion support updated

### Step 3: Update Component Imports

Files that import Tabs component (verify these exist in your project):
- [ ] `src/components/PensionCalculator.tsx`
- [ ] `src/components/PensionStats.tsx`
- [ ] Any other files using Tabs

**If using Option A**: No import changes needed
**If using Option B**: Update each import to `.enhanced`

---

## Testing & Validation

### Visual Testing

- [ ] **Light Mode**
  - [ ] Tabs render correctly
  - [ ] Shadows are visible and multi-layered
  - [ ] Active tab has elevation
  - [ ] Hover states work
  - [ ] Ripple effect appears on click

- [ ] **Dark Mode**
  - [ ] Toggle dark mode
  - [ ] Shadows adjusted for dark background
  - [ ] Focus ring visible (3:1 contrast)
  - [ ] Ripple effect visible

- [ ] **Responsive**
  - [ ] Desktop (1920px): Keyboard shortcuts visible
  - [ ] Tablet (768px): Tabs scroll horizontally
  - [ ] Mobile (375px): Shortcuts hidden, touch works

### Animation Testing

- [ ] **Spring Physics**
  - [ ] Click through all tabs
  - [ ] Indicator slides with spring bounce
  - [ ] Content slides smoothly
  - [ ] Feels natural and responsive

- [ ] **Ripple Effect**
  - [ ] Click center of tab → ripple from center
  - [ ] Click edge of tab → ripple from edge
  - [ ] Click corner → ripple from corner
  - [ ] Ripple fades after 600ms

- [ ] **Badge Animations**
  - [ ] Change badge count → see spring scale
  - [ ] Multiple badges animate independently

### Keyboard Testing

- [ ] **Arrow Key Navigation**
  - [ ] Right arrow: Next tab
  - [ ] Left arrow: Previous tab
  - [ ] Home: First tab
  - [ ] End: Last tab
  - [ ] Wraps around at edges

- [ ] **Keyboard Shortcuts**
  - [ ] Ctrl+1: Jump to first tab
  - [ ] Ctrl+2: Jump to second tab
  - [ ] Ctrl+3: Jump to third tab
  - [ ] Ctrl+4+: Works if more tabs
  - [ ] Hint toast appears on first use
  - [ ] Hint disappears after 3 seconds

- [ ] **Focus Management**
  - [ ] Tab key: Focus moves to tab button
  - [ ] Focus ring is 3px thick
  - [ ] Focus ring has visible contrast
  - [ ] Focus ring pulses gently
  - [ ] Focus never lost during tab change

### Accessibility Audits

- [ ] **Automated Testing**
  - [ ] Run `axe DevTools` → 0 violations
  - [ ] Run `WAVE` → WCAG AAA pass
  - [ ] Lighthouse Accessibility → 100 score

- [ ] **Screen Reader Testing** (choose one)
  - [ ] **NVDA (Windows)**
    - [ ] Tab list announced
    - [ ] Tab count announced ("3 of 3")
    - [ ] Active tab announced
    - [ ] Badge counts announced

  - [ ] **JAWS (Windows)**
    - [ ] All ARIA roles recognized
    - [ ] Tab changes announced

  - [ ] **VoiceOver (Mac)**
    - [ ] Tab navigation clear
    - [ ] Shortcut hints not confusing

- [ ] **Keyboard-Only Navigation**
  - [ ] Unplug mouse
  - [ ] Navigate entire interface
  - [ ] All features accessible
  - [ ] Focus always visible

### Reduced Motion Testing

- [ ] **Enable Reduced Motion**
  - **Windows**: Settings → Accessibility → Visual effects → "Show animations in Windows"
  - **Mac**: System Preferences → Accessibility → Display → Reduce motion
  - **Browser DevTools**: Rendering → Emulate CSS media → prefers-reduced-motion

- [ ] **Verify Fallbacks**
  - [ ] Spring animations → instant transitions
  - [ ] Ripple effect → disabled
  - [ ] Focus pulse → static outline
  - [ ] Badge animations → instant scale
  - [ ] Content slides → instant change

### Performance Testing

- [ ] **Frame Rate**
  - [ ] Open Chrome DevTools → Performance
  - [ ] Record tab switching
  - [ ] Verify 60fps maintained
  - [ ] No dropped frames

- [ ] **Bundle Size**
  - [ ] Run `npm run build`
  - [ ] Check bundle size increased by ~52KB
  - [ ] Verify tree-shaking working

- [ ] **Memory Leaks**
  - [ ] Open Chrome DevTools → Memory
  - [ ] Take heap snapshot
  - [ ] Switch tabs 20 times
  - [ ] Take another snapshot
  - [ ] Compare: No significant growth

---

## Browser Compatibility

Test in multiple browsers:

- [ ] **Chrome/Edge 90+**
  - [ ] All features work
  - [ ] Smooth animations
  - [ ] No console errors

- [ ] **Firefox 90+**
  - [ ] All features work
  - [ ] Spring physics smooth
  - [ ] Focus ring visible

- [ ] **Safari 14+**
  - [ ] All features work
  - [ ] Backdrop blur renders
  - [ ] Touch interactions work

- [ ] **Mobile Browsers**
  - [ ] Chrome Mobile: Ripple on touch
  - [ ] Safari iOS: Smooth animations
  - [ ] Samsung Internet: No issues

---

## User Acceptance Testing

### User Feedback Checklist

Gather feedback from 3-5 users:

- [ ] **First Impressions**
  - "Does the interface feel more polished?"
  - "Do the animations feel natural or distracting?"

- [ ] **Keyboard Shortcuts**
  - "Did you notice the keyboard shortcuts?"
  - "Are the shortcut hints helpful or cluttered?"

- [ ] **Accessibility**
  - "Can you navigate using only the keyboard?"
  - "Is the focus ring visible enough?"

- [ ] **Performance**
  - "Does the app feel faster or slower?"
  - "Do animations feel smooth?"

### Expected User Responses

✅ **Positive Indicators**:
- "Feels more professional"
- "Love the smooth animations"
- "Keyboard shortcuts are handy"
- "Easy to see what's focused"

⚠️ **Red Flags**:
- "Animations are too slow"
- "Focus ring is distracting"
- "Ripple effect lags"
- "Keyboard shortcuts don't work"

---

## Rollback Plan

If issues arise, rollback is simple:

### Option 1: Git Revert
```bash
git checkout pre-sprint-1-backup
git checkout -b sprint-1-rollback
```

### Option 2: File Swap
```bash
cp src/components/Tabs.legacy.tsx src/components/Tabs.tsx
npm install  # Restore original package.json
```

### Option 3: Partial Rollback
Keep enhanced version but disable features:
```typescript
// In Tabs.tsx, wrap features in feature flags:
const ENABLE_SPRING_PHYSICS = false;
const ENABLE_RIPPLE = false;
const ENABLE_SHORTCUTS = false;
```

---

## Post-Migration

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Core Web Vitals
- [ ] Watch for user-reported issues
- [ ] Check analytics for tab usage patterns

### Documentation

- [ ] Update README with new keyboard shortcuts
- [ ] Add to user documentation
- [ ] Create internal demo video
- [ ] Update onboarding materials

### Cleanup

- [ ] Remove `Tabs.legacy.tsx` after 2 weeks stable
- [ ] Remove `Tabs.enhanced.tsx` (now `Tabs.tsx`)
- [ ] Update Storybook stories
- [ ] Archive old screenshots

---

## Success Criteria

Sprint 1 is successfully deployed when:

✅ **All tests pass** (visual, keyboard, a11y, performance)
✅ **Zero regressions** in existing functionality
✅ **Positive user feedback** (3+ users confirm improvement)
✅ **No accessibility violations** (axe, WAVE, Lighthouse)
✅ **60fps animations** maintained
✅ **Bundle size** increase acceptable (<100KB)

---

## Timeline

### Recommended Schedule

**Day 1: Pre-Migration**
- Morning: Backup and dependency installation
- Afternoon: Current state testing and screenshots

**Day 2: Migration**
- Morning: Deploy enhanced component
- Afternoon: Visual and animation testing

**Day 3: Testing**
- Morning: Keyboard and accessibility testing
- Afternoon: Browser compatibility testing

**Day 4: UAT**
- Morning: User acceptance testing
- Afternoon: Fix any issues found

**Day 5: Monitoring**
- All day: Monitor production, gather feedback

**Week 2: Stabilization**
- Monday: Review analytics and user feedback
- Tuesday-Thursday: Address any edge cases
- Friday: Clean up, mark Sprint 1 complete

---

## Support

If you encounter issues:

1. **Check the docs**: `docs/SPRINT_1_IMPLEMENTATION.md`
2. **Search issues**: GitHub Issues for similar problems
3. **Rollback if critical**: Use rollback plan above
4. **Create issue**: Include browser, OS, steps to reproduce

---

## Next Steps After Sprint 1

Once stable, consider Sprint 2 features:

**Immediate Wins**:
- Status badges with validation counts
- Hover preview panels
- Sparklines in tab labels

**See**: `docs/PHASE_2_PLAN.md` for full roadmap

---

## Sign-Off

- [ ] **Developer**: All code changes committed
- [ ] **QA**: All tests passed
- [ ] **Accessibility**: WCAG AAA compliance verified
- [ ] **Product Owner**: User feedback positive
- [ ] **DevOps**: Production monitoring active

**Sprint 1 Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Testing | ⬜ Complete

**Date Deployed**: _______________

**Deployed By**: _______________

**Notes**: _______________
