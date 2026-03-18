# Admin Mobile-First Refactor — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Approach:** Progressive enhancement (A) — purely additive Tailwind breakpoint changes + CSS-conditional master/detail

---

## Context

The `/admin` route and all sub-routes were built desktop-first, with most multi-column grids only activating at `xl:` (1280px+). On screens below 1280px — including tablets and phones — content either collapses into a single unreadable column or overflows. The goal is mobile-first layouts that look great from 320px up and preserve the existing desktop experience.

No new files. Minimal logic changes: only a type widening + "back" button in master/detail panels.

---

## Scope — 9 files

| File | Nature of change |
|---|---|
| `src/components/admin/AdminShell.tsx` | Padding reduction on mobile for heading block |
| `src/components/admin/AdminSidebar.tsx` | Minor pill sizing on mobile |
| `src/components/admin/dashboard/AdminDashboardView.tsx` | Grid breakpoints |
| `src/app/admin/page.tsx` | Grid breakpoints |
| `src/components/admin/audit/AdminAuditClient.tsx` | Filter bar intermediate breakpoints + snapshots grid |
| `src/components/admin/customers/AdminCustomersClient.tsx` | Filter bar intermediate breakpoints |
| `src/components/admin/orders/AdminOrdersView.tsx` | Type widening + master/detail option B + grid breakpoints |
| `src/components/admin/orders/AdminOrdersClient.tsx` | No changes needed (already passes `setSelectedOrderId` which accepts `null`) |
| `src/components/admin/catalog/AdminCatalogClient.tsx` | Master/detail option B + grid breakpoints |
| `src/components/admin/AdminModulePlaceholder.tsx` | Minor grid breakpoint |

---

## Section 1 — Shell & Navigation

### AdminShell.tsx
- Heading block (line 66): `px-5 py-6 sm:px-6` → `px-4 py-5 sm:px-5 sm:py-6` for mobile breathing room
- Breadcrumb row (line 38): `px-5 py-3 sm:px-6` → `px-4 py-3 sm:px-5 sm:px-6` (minor)
- No structural changes — `flex-col lg:flex-row` shell layout is already correct ✅

### AdminSidebar.tsx
- Mobile nav pills: ensure `py-1.5` and `gap-1.5` so pills don't overflow on very small screens
- Desktop sidebar: no changes

---

## Section 2 — Dashboard & Home Page

### AdminDashboardView.tsx

| Element | Before (exact class) | After |
|---|---|---|
| KPI cards grid | `xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Loading skeletons | `xl:grid-cols-4` | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Signals + stock section | `xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]` | `grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]` |
| Signals inner cards | `md:grid-cols-2 xl:grid-cols-1` | unchanged (md breakpoint is already fine) |

### admin/page.tsx

| Element | Before (exact class) | After |
|---|---|---|
| Module highlight cards | `xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` | `grid-cols-1 sm:grid-cols-2` |
| Info + KPI text block | `xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]` | unchanged (stacking is acceptable here) |
| Nav routes bottom | `md:grid-cols-2 xl:grid-cols-5` | unchanged (already has md) |

---

## Section 3 — Filter Bars

### AdminAuditClient.tsx

| Element | Before (exact class) | After |
|---|---|---|
| Filter row (line 65) | `xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_180px] xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]` |
| Snapshots before/after (line 245) | `xl:grid-cols-3` | `grid-cols-1 md:grid-cols-3` |

### AdminCustomersClient.tsx

| Element | Before (exact class) | After |
|---|---|---|
| Filter row (line 63) | `lg:grid-cols-[minmax(0,1fr)_220px_140px]` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_140px]` |

---

## Section 4 — Master/Detail: Orders & Catalog

Both panels use the same CSS-conditional pattern. No new state needed — both components already have a selected-ID state.

### Type widening — AdminOrdersView.tsx

The prop `onSelectOrder: (orderId: number) => void` must be widened to `(orderId: number | null) => void` so the back button can call `onSelectOrder(null)` to clear the selection. The parent (`AdminOrdersClient.tsx`) already passes `setSelectedOrderId` which accepts `number | null`, so no change is needed there.

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
      onClick={() => onSelectOrder(null)}  {/* or setSelectedProductId(null) for catalog */}
    >
      ← Voltar à lista
    </button>
    {/* detail content */}
  </div>

</div>
```

### AdminOrdersView.tsx — all changes

1. **Type widening:** `onSelectOrder: (orderId: number) => void` → `onSelectOrder: (orderId: number | null) => void`
2. **Outer master/detail grid (line 893):** `xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]` → `grid-cols-1 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]`
3. Apply the CSS-conditional pattern to the two children of this grid (list panel and detail panel), using `selectedOrderId` as the condition and `onSelectOrder(null)` in the back button
4. **Filter bar (line 802):** `xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.35fr))]` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.35fr))]`
5. **Inner detail grids:** `xl:grid-cols-2` → `grid-cols-1 sm:grid-cols-2`; `xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]` → `grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]`

### AdminCatalogClient.tsx — all changes

1. **Outer top grid:** `xl:grid-cols-[1.05fr_1.45fr]` → `grid-cols-1 xl:grid-cols-[1.05fr_1.45fr]`
2. Apply the CSS-conditional pattern to the two children of the top grid, using `selectedProductId` as the condition and `setSelectedProductId(null)` in the back button
3. **Bottom grid (line 1396):** `xl:grid-cols-[2.8fr_1fr]` → `grid-cols-1 xl:grid-cols-[2.8fr_1fr]`
4. **Stock form inner grid:** `xl:grid-cols-4` → `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`

---

## Section 5 — AdminModulePlaceholder

| Element | Before (exact class) | After |
|---|---|---|
| Checklist + next step | `xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]` | `grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]` |

---

## Constraints

- **Desktop must not regress.** Every change is additive — existing `xl:` and `lg:` classes are kept, new smaller breakpoints are prepended.
- **No new files.** All changes are within the files listed above.
- **Minimal logic changes:** Only `onSelectOrder` type widening + adding the "Voltar à lista" button (type="button") inside the detail panel of Orders and Catalog. Button renders only on mobile (`xl:hidden`).
- **No style redesign.** Colors, fonts, borders, surface system — all unchanged.

---

## Breakpoint Reference (Tailwind defaults)

| Prefix | Min-width |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
