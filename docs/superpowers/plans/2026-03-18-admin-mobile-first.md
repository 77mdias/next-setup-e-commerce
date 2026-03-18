# Admin Mobile-First Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all `/admin` routes fully responsive from 320px up without breaking the desktop layout.

**Architecture:** Progressive enhancement — additive Tailwind breakpoint classes (`sm:`, `md:`, `lg:`) prepended to existing `xl:`/`lg:` grids, plus a CSS-conditional show/hide pattern for master/detail panels in Orders and Catalog. No new files, no structural rewrites.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v3, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-18-admin-mobile-first-design.md`

---

## File Map

| File | Change type |
|---|---|
| `src/components/admin/AdminShell.tsx` | Padding tweak (2 lines) |
| `src/components/admin/AdminSidebar.tsx` | Pill gap/padding (1 line) |
| `src/components/admin/dashboard/AdminDashboardView.tsx` | 3 grid class changes |
| `src/app/admin/page.tsx` | 1 grid class change |
| `src/components/admin/audit/AdminAuditClient.tsx` | 2 grid class changes |
| `src/components/admin/customers/AdminCustomersClient.tsx` | 1 grid class change |
| `src/components/admin/orders/AdminOrdersView.tsx` | Type widening + 4 grid changes + master/detail pattern |
| `src/components/admin/catalog/AdminCatalogClient.tsx` | 4 grid changes + master/detail pattern |
| `src/components/admin/AdminModulePlaceholder.tsx` | 1 grid class change |

---

## Verification command (run after every task)

```bash
pnpm typecheck
```

Expected: `0 errors`. This is the only automated check available — responsive layout must be verified visually in browser DevTools at 375px width.

---

## Task 1: Shell & Sidebar — mobile padding and pill sizing

**Files:**
- Modify: `src/components/admin/AdminShell.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

### AdminShell.tsx

The heading block (below breadcrumbs) has `px-5 py-6` which is too tall on phones. The breadcrumb row has `px-5 py-3`.

- [ ] **Step 1: Edit heading block padding**

In `src/components/admin/AdminShell.tsx`, find line 66:
```tsx
<div className="px-5 py-6 sm:px-6">
```
Replace with:
```tsx
<div className="px-4 py-5 sm:px-5 sm:py-6">
```

- [ ] **Step 2: Edit breadcrumb row padding**

Find line 38:
```tsx
<div className="border-b border-white/6 px-5 py-3 sm:px-6">
```
Replace with:
```tsx
<div className="border-b border-white/6 px-4 py-3 sm:px-5">
```

### AdminSidebar.tsx

The horizontal pill bar on mobile already works, but `gap-2` can be tightened to `gap-1.5` on very small screens.

- [ ] **Step 3: Tighten mobile pill gap**

In `src/components/admin/AdminSidebar.tsx`, find:
```tsx
<div className="flex min-w-max gap-2">
```
Replace with:
```tsx
<div className="flex min-w-max gap-1.5">
```

- [ ] **Step 4: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx
git commit -m "style(admin): tighten shell padding and sidebar pill gap on mobile"
```

---

## Task 2: Dashboard KPI grid + signals section

**Files:**
- Modify: `src/components/admin/dashboard/AdminDashboardView.tsx`

Three grids jump directly from 1 column to `xl:grid-cols-4` or `xl:grid-cols-[...]` with no intermediate breakpoints.

- [ ] **Step 1: KPI cards grid — add `sm:grid-cols-2`**

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-4">
```
Replace with:
```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

- [ ] **Step 2: Loading skeleton grid — add `sm:grid-cols-2`**

Find (inside `LoadingState`):
```tsx
<div className="mt-6 grid gap-4 xl:grid-cols-4">
```
Replace with:
```tsx
<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

- [ ] **Step 3: Signals + low-stock section — add `lg:` breakpoint**

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
```
Replace with:
```tsx
<div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
```

- [ ] **Step 4: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/dashboard/AdminDashboardView.tsx
git commit -m "style(admin/dashboard): add sm/lg breakpoints to KPI and signals grids"
```

---

## Task 3: Admin home page — module cards grid

**Files:**
- Modify: `src/app/admin/page.tsx`

Four module cards are in a `xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` grid — on mobile they stack, which is fine. On sm (640px) two columns would fit cleanly.

- [ ] **Step 1: Module cards — replace xl grid with sm grid**

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
```
Replace with:
```tsx
<div className="grid gap-4 sm:grid-cols-2">
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "style(admin/dashboard): module cards 2-col from sm breakpoint"
```

---

## Task 4: Audit — filter bar and snapshots grid

**Files:**
- Modify: `src/components/admin/audit/AdminAuditClient.tsx`

The filter bar goes from 1 col directly to 5 cols at xl. Add `sm:grid-cols-2` and `lg:grid-cols-[...]` as intermediate steps. The snapshots inside `<details>` go 1→3 cols, add `md:grid-cols-3`.

- [ ] **Step 1: Filter bar — add intermediate breakpoints**

Find (line 65):
```tsx
<div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]">
```
Replace with:
```tsx
<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_180px] xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]">
```

- [ ] **Step 2: Snapshots grid — add md breakpoint**

Find (line 245):
```tsx
<div className="mt-4 grid gap-4 xl:grid-cols-3">
```
Replace with:
```tsx
<div className="mt-4 grid gap-4 md:grid-cols-3">
```

- [ ] **Step 3: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/audit/AdminAuditClient.tsx
git commit -m "style(admin/audit): add intermediate breakpoints to filter bar and snapshots"
```

---

## Task 5: Customers — filter bar intermediate breakpoints

**Files:**
- Modify: `src/components/admin/customers/AdminCustomersClient.tsx`

Filter bar goes from 1 col directly to 3 cols at `lg:`. Add `sm:grid-cols-2` so the store selector and search button pair up before `lg`.

- [ ] **Step 1: Add sm intermediate breakpoint**

Find (line 63):
```tsx
<div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
```
Replace with:
```tsx
<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/customers/AdminCustomersClient.tsx
git commit -m "style(admin/customers): add sm breakpoint to filter bar"
```

---

## Task 6: Orders — master/detail mobile pattern + grid fixes

**Files:**
- Modify: `src/components/admin/orders/AdminOrdersView.tsx`

This is the most involved change. Four sub-steps:
1. Widen `onSelectOrder` prop type to accept `null`
2. Make the outer master/detail grid mobile-first
3. Apply CSS-conditional show/hide to list and detail panels + add back button
4. Fix filter bar and inner detail grids

### Background

`AdminOrdersView` is a pure view component. Its `selectedOrderId` prop comes from `AdminOrdersClient` which stores it as `number | null`. The prop type is currently too narrow (`(orderId: number) => void`). Widening it to `(orderId: number | null) => void` lets the back button call `onSelectOrder(null)`.

- [ ] **Step 1: Widen `onSelectOrder` type**

Find in the `AdminOrdersViewProps` type (around line 120):
```tsx
  onSelectOrder: (orderId: number) => void;
```
Replace with:
```tsx
  onSelectOrder: (orderId: number | null) => void;
```

- [ ] **Step 2: Make outer grid mobile-first**

Find (line 893):
```tsx
<div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
```
Replace with:
```tsx
<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
```

- [ ] **Step 3: Apply CSS-conditional to list panel (left child)**

Find (line 894):
```tsx
        <section className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
          <OrdersListState
```
Replace with:
```tsx
        <section className={`rounded-2xl border border-white/6 bg-[#171a21] p-5 ${selectedOrderId !== null ? "hidden xl:block" : "block"}`}>
          <OrdersListState
```

- [ ] **Step 4: Apply CSS-conditional to detail panel (right child) + add back button**

Find (line 908):
```tsx
        <div>
          <OrderDetailState
```
Replace with:
```tsx
        <div className={selectedOrderId !== null ? "block" : "hidden xl:block"}>
          <button
            className="mb-4 flex items-center gap-2 rounded-full border border-white/6 bg-[#12151a] px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] transition hover:border-white/10 xl:hidden"
            type="button"
            onClick={() => onSelectOrder(null)}
          >
            ← Voltar à lista
          </button>
          <OrderDetailState
```

- [ ] **Step 5: Filter bar — add sm intermediate breakpoint**

Find (line 802):
```tsx
<div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.35fr))]">
```
Replace with:
```tsx
<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.35fr))]">
```

- [ ] **Step 6: Inner detail grids — add sm/lg breakpoints**

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-2">
```
Replace with:
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
```
Replace with:
```tsx
<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
```

- [ ] **Step 7: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors. TypeScript must accept `onSelectOrder(null)` after the type widening.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/orders/AdminOrdersView.tsx
git commit -m "style(admin/orders): mobile-first master/detail + breakpoint fixes"
```

---

## Task 7: Catalog — master/detail mobile pattern + grid fixes

**Files:**
- Modify: `src/components/admin/catalog/AdminCatalogClient.tsx`

Similar to Orders, but the condition is `selectedProductId !== null || isCreatingProduct` because the right panel shows both existing product editors and the "create new product" form. The back button must clear both states.

- [ ] **Step 1: Make top section grid mobile-first**

Find (line 673):
```tsx
      <section className="grid gap-5 xl:grid-cols-[1.05fr_1.45fr]">
```
Replace with:
```tsx
      <section className="grid gap-5 xl:grid-cols-[1.05fr_1.45fr] grid-cols-1">
```

Wait — Tailwind processes classes left-to-right but mobile-first means the base class should be explicit. Correct replacement:
```tsx
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1.45fr]">
```

- [ ] **Step 2: Apply CSS-conditional to product list panel (left child)**

Find (line 674):
```tsx
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#6a7282] uppercase">
                    Fila operacional
```
Replace with:
```tsx
        <div className={`space-y-5 ${selectedProductId !== null || isCreatingProduct ? "hidden xl:block" : "block"}`}>
          <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#6a7282] uppercase">
                    Fila operacional
```

- [ ] **Step 3: Apply CSS-conditional to product editor panel (right child) + add back button**

Find (line 876):
```tsx
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
```
Replace with:
```tsx
        <div className={`space-y-5 ${selectedProductId !== null || isCreatingProduct ? "block" : "hidden xl:block"}`}>
          <button
            className="mb-4 flex items-center gap-2 rounded-full border border-white/6 bg-[#12151a] px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] transition hover:border-white/10 xl:hidden"
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setIsCreatingProduct(false);
            }}
          >
            ← Voltar à lista
          </button>
          <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
```

- [ ] **Step 4: Bottom section grid — make mobile-first**

Find (line 1396):
```tsx
      <section className="grid gap-5 xl:grid-cols-[2.8fr_1fr]">
```
Replace with:
```tsx
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2.8fr_1fr]">
```

- [ ] **Step 5: Stock form fields — add sm breakpoint**

Find:
```tsx
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
```
Replace with:
```tsx
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

- [ ] **Step 6: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/catalog/AdminCatalogClient.tsx
git commit -m "style(admin/catalog): mobile-first master/detail + breakpoint fixes"
```

---

## Task 8: AdminModulePlaceholder — checklist grid breakpoint

**Files:**
- Modify: `src/components/admin/AdminModulePlaceholder.tsx`

- [ ] **Step 1: Add `lg:` breakpoint**

Find:
```tsx
<div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
```
Replace with:
```tsx
<div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
```

- [ ] **Step 2: Verify types**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminModulePlaceholder.tsx
git commit -m "style(admin): module placeholder grid responsive from lg"
```

---

## Final verification

- [ ] Run `pnpm typecheck` — 0 errors
- [ ] Open browser DevTools, set viewport to 375px, verify each route:
  - `/admin` — KPI cards in 2-col (sm), module cards in 2-col
  - `/admin/orders` — filters stack in 2-col (sm), list shows full-width; selecting an order hides list and shows detail with "Voltar" button
  - `/admin/catalog` — same master/detail behavior; bottom section stacks on mobile
  - `/admin/audit` — filter bar in 2-col (sm), 3-col (lg)
  - `/admin/customers` — filter bar in 2-col (sm)
- [ ] Set viewport to 768px (md) and verify intermediate layouts
- [ ] Set viewport to 1280px (xl) and verify desktop is unchanged
