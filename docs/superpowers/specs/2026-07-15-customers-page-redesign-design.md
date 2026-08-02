# Customers Page Redesign - Design Spec

**Date:** 2026-07-15  
**Author:** opencode  
**Status:** Approved  

---

## Overview

Redesign the customers page at `/sales/customers/` with a modern glassmorphism design, card-based layout, advanced filtering, quick view panel, charts, and export functionality.

---

## Goals

1. **Modern Visual Design** - Glassmorphism with gradient backgrounds, blur effects, and smooth animations
2. **Improved UX** - Card-based layout, quick view panel, advanced filtering
3. **Better Insights** - Charts for debt distribution and sales trends
4. **Export Capability** - Excel and PDF export for customer data

---

## Architecture

### Component Structure

```
app/sales/customers/page.tsx          ← Main page (orchestrator)
components/sales/customers/
  ├── CustomersHeader.tsx             ← Header + stats + export buttons
  ├── CustomerFilters.tsx             ← Search + status filter + sort
  ├── CustomerCard.tsx                ← Individual customer card
  ├── CustomerQuickView.tsx           ← Slide-out detail panel
  ├── CustomerCharts.tsx              ← Charts section (PieChart + BarChart)
  ├── AddEditCustomerDialog.tsx       ← Create/edit modal (existing)
  ├── CollectionDialog.tsx            ← Payment modal (existing)
  ├── StatementModal.tsx              ← Statement modal (existing)
  └── types.ts                        ← Shared types (existing)
hooks/sales/useCustomers.ts           ← Updated hook with filtering/sorting
```

### File Responsibilities

| File | Responsibility |
|------|----------------|
| `page.tsx` | Orchestrate components, manage layout, pass props |
| `CustomersHeader.tsx` | Display title, stats cards, export buttons, "New Customer" button |
| `CustomerFilters.tsx` | Search input, status dropdown, sort dropdown |
| `CustomerCard.tsx` | Render single customer with info, status, actions |
| `CustomerQuickView.tsx` | Slide-out panel with summary + recent transactions |
| `CustomerCharts.tsx` | PieChart (debt distribution) + BarChart (monthly sales) |
| `useCustomers.ts` | State management, API calls, filtering/sorting logic |

---

## Design Details

### 1. Overall Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Title + Stats + Export + New Customer       │
├─────────────────────────────────────────────────────┤
│  Filter Bar: Search + Status + Sort                  │
├─────────────────────────────────────────────────────┤
│  Charts Section: PieChart + BarChart                 │
├─────────────────────────────────────────────────────┤
│  Customer Cards Grid (3 columns on desktop)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Card 1  │ │ Card 2  │ │ Card 3  │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Card 4  │ │ Card 5  │ │ Card 6  │               │
│  └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────┘
```

**Background:** `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`  
**Sections:** Glass panels `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`  
**RTL:** `dir="rtl"` on root container

### 2. Customer Card Design

```
┌─────────────────────────────────────┐
│  🟢 اسم العميل              [···]   │
│  ─────────────────────────────────  │
│  📱 0123456789                      │
│  📧 email@example.com               │
│  📍 القاهرة، مصر                    │
│  ─────────────────────────────────  │
│  💰 الرصيد: 15,000 ج.م              │
│  📊 الحالة: مدين                     │
│  ─────────────────────────────────  │
│  [📄 كشف حساب] [💰 سند قبض] [✏️ تعديل] │
└─────────────────────────────────────┘
```

**Structure:**
- **Header:** Name + status dot + options menu
- **Info:** Phone, email, address (with lucide-react icons)
- **Balance:** Amount + status badge
- **Actions:** 3 action buttons (Statement, Payment, Edit)

**Styling:**
- Container: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6`
- Hover: `hover:scale-[1.02] transition-all duration-300 hover:border-white/20`
- Status dot: `w-2 h-2 rounded-full` (green=clean, amber=recent debt, red=overdue)

**Status Colors:**
- Clean/Paid: `text-emerald-400` + `bg-emerald-500/10`
- Recent Debt: `text-amber-400` + `bg-amber-500/10`
- Overdue: `text-red-400` + `bg-red-500/10`

### 3. Quick View Panel (Slide-out)

```
┌─────────────────────────────────────┐
│  ✕  كشف حساب العميل: محمد أحمد      │
├─────────────────────────────────────┤
│  📊 ملخص سريع                       │
│  ─────────────────────────────────  │
│  إجمالي المبيعات: 50,000 ج.م        │
│  إجمالي السندات: 35,000 ج.م         │
│  الرصيد المتبقي: 15,000 ج.م         │
├─────────────────────────────────────┤
│  📅 آخر 5 معاملات                   │
│  ─────────────────────────────────  │
│  15/07 - مبيعات - 5,000 ج.م         │
│  10/07 - سند قبض - 2,000 ج.م        │
│  05/07 - مبيعات - 3,000 ج.م         │
│  ...                                │
├─────────────────────────────────────┤
│  [📄 كشف حساب كامل] [💰 سند قبض]    │
└─────────────────────────────────────┘
```

**Behavior:**
- Opens from right side (RTL) when clicking customer name or "Quick View" button
- Width: 350px
- Overlay: `bg-black/50 backdrop-blur-sm`
- Slide animation: `transform transition-transform duration-300`

**Content:**
1. Summary (total sales, payments, remaining balance)
2. Last 5 transactions (from statement API)
3. Quick action buttons

### 4. Charts Section

**Chart 1: Debt Distribution (PieChart)**
- Displays: Clean (40%), Recent Debt (35%), Overdue (25%)
- Colors: Emerald, Amber, Red
- Library: recharts PieChart

**Chart 2: Monthly Sales (BarChart)**
- Displays: Last 6 months sales trend
- Colors: Gradient from slate to emerald
- Library: recharts BarChart

**Container:** Glass panel matching card style

### 5. Filter Bar

```
┌─────────────────────────────────────────────────────┐
│  🔍بحث...  │  الحالة: [الكل ▼]  │  الترتيب: [الاسم ▼] │
└─────────────────────────────────────────────────────┘
```

**Filters:**
- **Search:** Text input for name/phone/email search
- **Status:** Dropdown (All, Clean, Recent Debt, Overdue)
- **Sort:** Dropdown (Name, Balance, Last Transaction, Created Date)

**Styling:**
- Container: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4`
- Inputs: `bg-white/10 border border-white/20 rounded-lg px-4 py-2`

### 6. Export Functionality

**Buttons:** `[📊 تصدير Excel] [📄 تصدير PDF]`

**Location:** Top-right area (next to "New Customer" button)

**Implementation:**
- **Excel:** Using `exceljs` (already installed)
- **PDF:** Using `jspdf` + `jspdf-autotable` (already installed)

**Exported Fields:**
- Name, Phone, Email, Address, Balance, Status

**Formatting:**
- RTL support
- Colors matching theme
- Professional layout

---

## Data Flow

### Hook Updates (`useCustomers.ts`)

**New State:**
```typescript
// Filtering
filterStatus: 'all' | 'clean' | 'debt' | 'overdue'
searchQuery: string
sortBy: 'name' | 'balance' | 'lastTransaction' | 'createdAt'
sortOrder: 'asc' | 'desc'

// Quick View
showQuickView: boolean
quickViewCustomer: Customer | null
```

**New Methods:**
```typescript
handleFilterChange(status: string): void
handleSearch(query: string): void
handleSort(field: string): void
openQuickView(customer: Customer): void
closeQuickView(): void
exportToExcel(): void
exportToPDF(): void
```

**Computed Values:**
```typescript
filteredCustomers: Customer[]  // Apply filters + sorting
```

### API Requirements

**Existing Endpoints (sufficient):**
- `GET /sales/customers` - List all customers
- `GET /sales/customers/:id/statement` - Get customer statement

**No new API endpoints needed** - All data available from existing endpoints.

---

## Technical Details

### Libraries Used

| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | ^4 | Styling |
| lucide-react | ^0.561.0 | Icons |
| recharts | ^3.9.2 | Charts |
| exceljs | ^4.4.0 | Excel export |
| jspdf | ^4.0.0 | PDF generation |
| jspdf-autotable | ^5.0.7 | PDF tables |
| date-fns | ^4.1.0 | Date formatting |
| sonner | ^2.0.7 | Toast notifications |

### Responsive Design

- **Desktop (lg+):** 3 columns grid
- **Tablet (md):** 2 columns grid
- **Mobile (sm):** 1 column grid

### RTL Support

- All layouts use `dir="rtl"`
- Text alignment: `text-right`
- Margins/paddings: RTL-aware (ms-*, me-* instead of ml-*, mr-*)

---

## Implementation Steps

1. Update `useCustomers.ts` with filtering/sorting state and methods
2. Create `CustomerFilters.tsx` component
3. Update `CustomerCard.tsx` with modern design
4. Create `CustomerQuickView.tsx` slide-out panel
5. Create `CustomerCharts.tsx` with recharts
6. Update `CustomersHeader.tsx` with stats and export buttons
7. Update `page.tsx` to orchestrate all components
8. Add export functionality (Excel + PDF)
9. Test and refine

---

## Success Criteria

- [x] Modern glassmorphism design
- [x] Card-based layout (3 columns desktop)
- [x] Advanced filtering (status, search, sort)
- [x] Quick View slide-out panel
- [x] Charts (debt distribution + monthly sales)
- [x] Export to Excel and PDF
- [x] RTL support
- [x] Responsive design
- [x] Smooth animations
- [x] Consistent with suppliers page pattern

---

## Notes

- Reuse existing components: `AddEditCustomerDialog`, `CollectionDialog`, `StatementModal`
- Follow suppliers page pattern for consistency
- All UI is hand-built with Tailwind (no component library)
- Dark glassmorphism theme matches existing design system
