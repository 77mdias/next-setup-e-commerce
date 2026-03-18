# Admin Mobile-First Refactor — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Approach:** Progressive enhancement (A) — purely additive Tailwind breakpoint changes + CSS-conditional master/detail

---

## Context

The `/admin` route and all sub-routes were built desktop-first, with most multi-column grids only activating at `xl:` (1280px+). On screens below 1280px — including tablets and phones — content either collapses into a single unreadable column or overflows. The goal is mobile-first layouts that look great from 320px up and preserve the existing desktop experience.

No new files. No logic changes (except one: a "back" button in master/detail panels).

---

## Scope — 9 files

| File | Nature of change |
|---|---|
| `src/components/admin/AdminShell.tsx` | Padding reduction on mobile |
| `src/components/admin/AdminSidebar.tsx` | Minor pill sizing on mobile |
| `src/components/admin/dashboard/AdminDashboardView.tsx` | Grid breakpoints |
| `src/app/admin/page.tsx` | Grid breakpoints |
| `src/components/admin/audit/AdminAuditClient.tsx` | Filter bar intermediate breakpoints |
| `src/components/admin/customers/AdminCustomersClient.tsx` | Filter bar intermediate breakpoints |
| `src/components/admin/orders/AdminOrdersView.tsx` | Master/detail option B + grid breakpoints |
| `src/components/admin/catalog/AdminCatalogClient.tsx` | Master/detail option B + grid breakpoints |
| `src/components/admin/AdminModulePlaceholder.tsx` | Minor grid breakpoint |

---

## Section 1 — Shell & Navigation

### AdminShell.tsx
- `p-5` on header inner sections → `p-4 sm:p-5` for mobile breathing room
- Title size already has `sm:text-3xl`; verify `text-2xl` base is present on xs
- No structural changes — `flex-col lg:flex-row` shell layout is already correct

### AdminSidebar.tsx
- Mobile nav pills: ensure `py-1.5` and `gap-1.5` so pills don't overflow on very small screens
- Desktop sidebar: no changes

---

## Section 2 — Dashboard & Home Page

### AdminDashboardView.tsx

| Element | Before | After |
|---|---|---|
| KPI cards grid | `xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Loading skeletons | `xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Signals + stock section | `xl:grid-cols-[0.8fr_1.2fr]` | `grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]` |
| Signals inner cards | `md:grid-cols-2 xl:grid-cols-1` | unchanged (md breakpoint is fine) |

### admin/page.tsx

| Element | Before | After |
|---|---|---|
| Module highlight cards | `xl:grid-cols-[1fr_1fr]` | `grid-cols-1 sm:grid-cols-2` |
| Info + KPI text block | `xl:grid-cols-[1.35fr_0.65fr]` | unchanged (stacking is acceptable here) |
| Nav routes bottom | `md:grid-cols-2 xl:grid-cols-5` | unchanged (already has md) |

---

## Section 3 — Filter Bars

### AdminAuditClient.tsx

| Element | Before | After |
|---|---|---|
| Filter row | `xl:grid-cols-[1fr_170px_180px_220px_140px]` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_170px_180px] xl:grid-cols-[1fr_170px_180px_220px_140px]` |
| Snapshots before/after | `xl:grid-cols-3` | `grid-cols-1 md:grid-cols-3` |

### AdminCustomersClient.tsx

| Element | Before | After |
|---|---|---|
| Filter row | `lg:grid-cols-[1fr_220px_140px]` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_220px_140px]` |

---

## Section 4 — Master/Detail: Orders & Catalog

Both panels use the same CSS-conditional pattern. No new state needed — both components already have a selected-ID state.

### Pattern

```tsx
{/* Outer grid — single column on mobile, two columns on xl */}
<div className="grid gap-5 xl:grid-cols-[LEFT_RIGHT]">

  {/* Left/List panel — hidden on mobile when item is selected */}
  <div className={selectedId !== null ? "hidden xl:block" : "block"}>
    {/* list content */}
  </div>

  {/* Right/Detail panel — hidden on mobile when nothing selected */}
  <div className={selectedId !== null ? "block" : "hidden xl:block"}>
    {/* Back button — mobile only */}
    <button
      className="xl:hidden mb-4 flex items-center gap-2 rounded-full border border-white/6 bg-[#12151a] px-4 py-2 text-sm text-[#f1f3f5] [font-family:var(--font-arimo)] transition hover:border-white/10"
      type="button"
      onClick={() => setSelectedId(null)}
    >
      ← Voltar à lista
    </button>
    {/* detail content */}
  </div>

</div>
```

### AdminOrdersView.tsx
- `selectedId` = `selectedOrderId` prop
- The clear action = `onSelectOrder(0)` or equivalent — check the client component for the actual clear call
- The filter bar above the grid: `xl:grid-cols-[1.2fr_repeat(3,0.35fr)]` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.2fr_repeat(3,0.35fr)]`
- Inner detail grids: `xl:grid-cols-2` → `grid-cols-1 sm:grid-cols-2`; `xl:grid-cols-[1fr_0.9fr]` → `grid-cols-1 lg:grid-cols-[1fr_0.9fr]`

### AdminCatalogClient.tsx
- `selectedId` = `selectedProductId` state
- The clear action = `setSelectedProductId(null)` (already exists in the component)
- Top grid: `xl:grid-cols-[1.05fr_1.45fr]` → `grid-cols-1 xl:grid-cols-[1.05fr_1.45fr]`
- Bottom grid: `xl:grid-cols-[2.8fr_1fr]` → `grid-cols-1 xl:grid-cols-[2.8fr_1fr]`
- Stock form inner: `xl:grid-cols-4` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`

---

## Section 5 — AdminModulePlaceholder

| Element | Before | After |
|---|---|---|
| Checklist + next step | `xl:grid-cols-[1.2fr_0.8fr]` | `grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]` |

---

## Constraints

- **Desktop must not regress.** Every change is additive — existing `xl:` and `lg:` classes are kept, new smaller breakpoints are prepended.
- **No new files.** All changes are within the 9 files listed.
- **No logic changes** except: adding a "Voltar à lista" button (type="button", onClick clears selected ID) inside the detail panel of Orders and Catalog. This button renders only on mobile (`xl:hidden`).
- **No style redesign.** Colors, fonts, borders, surface system — all unchanged.

---

## Breakpoint Reference (Tailwind defaults)

| Prefix | Min-width |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
