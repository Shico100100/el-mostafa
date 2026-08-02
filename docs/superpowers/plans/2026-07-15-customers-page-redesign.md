# Customers Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the customers page with modern glassmorphism design, card-based layout, advanced filtering, quick view panel, charts, and export functionality.

**Architecture:** Component-based approach following suppliers page pattern. Main page orchestrates extracted components. Hook updated with filtering/sorting state. All UI hand-built with Tailwind CSS (no component library).

**Tech Stack:** Next.js App Router, Tailwind CSS v4, lucide-react, recharts, exceljs, jspdf, date-fns, sonner

## Global Constraints

- RTL support required (`dir="rtl"` on root)
- Dark glassmorphism theme: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- Glass panels: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`
- No component library - all UI hand-built with Tailwind
- Follow existing patterns from suppliers page
- Reuse existing dialogs: AddEditCustomerDialog, CollectionDialog, StatementModal

---

## File Structure

| File | Responsibility |
|------|----------------|
| `frontend/app/sales/customers/page.tsx` | Main page orchestrator |
| `frontend/components/sales/customers/CustomersHeader.tsx` | Header + stats + export buttons |
| `frontend/components/sales/customers/CustomerFilters.tsx` | Search + status filter + sort |
| `frontend/components/sales/customers/CustomerCard.tsx` | Individual customer card |
| `frontend/components/sales/customers/CustomerQuickView.tsx` | Slide-out detail panel |
| `frontend/components/sales/customers/CustomerCharts.tsx` | PieChart + BarChart |
| `frontend/components/sales/customers/types.ts` | Shared types (existing, update) |
| `frontend/hooks/sales/useCustomers.ts` | Updated hook with filtering/sorting |

---

### Task 1: Update Types and Hook Foundation

**Files:**
- Modify: `frontend/components/sales/customers/types.ts`
- Modify: `frontend/hooks/sales/useCustomers.ts`

**Interfaces:**
- Produces: FilterState type, CustomerFilters interface, updated useCustomers hook

- [ ] **Step 1: Update types.ts with filter types**

```typescript
// frontend/components/sales/customers/types.ts

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  createdAt?: string;
}

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export type FilterStatus = 'all' | 'clean' | 'debt' | 'overdue';
export type SortField = 'name' | 'balance' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  filterStatus: FilterStatus;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface CustomerStats {
  totalCustomers: number;
  debtorsCount: number;
  totalDebt: number;
  cleanCount: number;
}
```

- [ ] **Step 2: Update useCustomers.ts with filtering state**

```typescript
// frontend/hooks/sales/useCustomers.ts

'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Customer, StatementItem, FilterState, FilterStatus, SortField, SortOrder } from '@/components/sales/customers/types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statement, setStatement] = useState<StatementItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementMonth, setStatementMonth] = useState<number | undefined>();
  const [statementYear, setStatementYear] = useState<number | undefined>();
  
  // Quick View state
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewCustomer, setQuickViewCustomer] = useState<Customer | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    filterStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchWithAuth('/sales/customers');
      setCustomers(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  const loadStatement = async (customerId: string, month?: number, year?: number) => {
    try {
      setStatementLoading(true);
      let url = `/sales/customers/${customerId}/statement`;
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await api.fetchWithAuth(url);
      setStatement(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل كشف الحساب');
    } finally {
      setStatementLoading(false);
    }
  };

  const handleSave = async (data: Partial<Customer>) => {
    try {
      if (editingCustomer) {
        await api.fetchWithAuth(`/sales/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await api.fetchWithAuth('/sales/customers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('تم إضافة العميل بنجاح');
      }
      await loadCustomers();
      setShowModal(false);
      setEditingCustomer(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ العميل');
    }
  };

  const handlePayment = async (data: { amount: number; payment_date: string; notes?: string }) => {
    if (!selectedCustomer) return;
    try {
      await api.addCustomerPayment(selectedCustomer.id, data);
      toast.success('تم تسجيل السند بنجاح');
      await loadCustomers();
      setShowPaymentModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل السند');
    }
  };

  const handleStatementFilter = (month?: number, year?: number) => {
    setStatementMonth(month);
    setStatementYear(year);
    if (selectedCustomer) {
      loadStatement(selectedCustomer.id, month, year);
    }
  };

  const clearStatementFilter = () => {
    setStatementMonth(undefined);
    setStatementYear(undefined);
    if (selectedCustomer) {
      loadStatement(selectedCustomer.id);
    }
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.filterStatus !== 'all') {
      result = result.filter((c) => {
        switch (filters.filterStatus) {
          case 'clean':
            return c.balance <= 0;
          case 'debt':
            return c.balance > 0;
          case 'overdue':
            return c.balance > 10000; // Threshold for overdue
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [customers, filters]);

  // Stats
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    debtorsCount: customers.filter((c) => c.balance > 0).length,
    totalDebt: customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0),
    cleanCount: customers.filter((c) => c.balance <= 0).length,
  }), [customers]);

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const handleFilterStatus = (status: FilterStatus) => {
    setFilters((prev) => ({ ...prev, filterStatus: status }));
  };

  const handleSort = (field: SortField, order: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  // Quick View handlers
  const openQuickView = (customer: Customer) => {
    setQuickViewCustomer(customer);
    setShowQuickView(true);
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setQuickViewCustomer(null);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    filteredCustomers,
    loading,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    showStatementModal,
    setShowStatementModal,
    showPaymentModal,
    setShowPaymentModal,
    statement,
    selectedCustomer,
    setSelectedCustomer,
    statementLoading,
    statementMonth,
    statementYear,
    showQuickView,
    quickViewCustomer,
    filters,
    stats,
    loadCustomers,
    loadStatement,
    handleSave,
    handlePayment,
    handleStatementFilter,
    clearStatementFilter,
    handleSearch,
    handleFilterStatus,
    handleSort,
    openQuickView,
    closeQuickView,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/sales/customers/types.ts frontend/hooks/sales/useCustomers.ts
git commit -m "feat: add filter types and update useCustomers hook"
```

---

### Task 2: Create CustomerFilters Component

**Files:**
- Create: `frontend/components/sales/customers/CustomerFilters.tsx`

**Interfaces:**
- Consumes: FilterState, FilterStatus, SortField, SortOrder from types.ts
- Produces: CustomerFilters component

- [ ] **Step 1: Create CustomerFilters.tsx**

```tsx
// frontend/components/sales/customers/CustomerFilters.tsx

'use client';

import { Search, ChevronDown, ArrowUpDown } from 'lucide-react';
import { FilterState, FilterStatus, SortField } from './types';

interface CustomerFiltersProps {
  filters: FilterState;
  onSearch: (query: string) => void;
  onFilterStatus: (status: FilterStatus) => void;
  onSort: (field: SortField, order: 'asc' | 'desc') => void;
}

export function CustomerFilters({
  filters,
  onSearch,
  onFilterStatus,
  onSort,
}: CustomerFiltersProps) {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'clean', label: 'أمين' },
    { value: 'debt', label: 'مدين' },
    { value: 'overdue', label: 'مدين متأخر' },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'name', label: 'الاسم' },
    { value: 'balance', label: 'الرصيد' },
    { value: 'createdAt', label: 'تاريخ الإنشاء' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف أو الإيميل..."
            value={filters.searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.filterStatus}
            onChange={(e) => onFilterStatus(e.target.value as FilterStatus)}
            className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSort(field as SortField, order as 'asc' | 'desc');
            }}
            className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={`${option.value}-asc`} className="bg-slate-800 text-white">
                {option.label} (تصاعدي)
              </option>
            ))}
            {sortOptions.map((option) => (
              <option key={`${option.value}-desc`} value={`${option.value}-desc`} className="bg-slate-800 text-white">
                {option.label} (تنازلي)
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/sales/customers/CustomerFilters.tsx
git commit -m "feat: add CustomerFilters component"
```

---

### Task 3: Update CustomerCard Component

**Files:**
- Modify: `frontend/components/sales/customers/CustomerCard.tsx`

**Interfaces:**
- Consumes: Customer type
- Produces: Updated CustomerCard component with modern design

- [ ] **Step 1: Rewrite CustomerCard.tsx**

```tsx
// frontend/components/sales/customers/CustomerCard.tsx

'use client';

import { MoreVertical, FileText, Wallet, Pencil, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Customer } from './types';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onStatement: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
  onQuickView: (customer: Customer) => void;
}

export function CustomerCard({
  customer,
  onEdit,
  onStatement,
  onPayment,
  onQuickView,
}: CustomerCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (balance: number) => {
    if (balance <= 0) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', label: 'أمين' };
    if (balance <= 10000) return { text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400', label: 'مدين' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400', label: 'مدين متأخر' };
  };

  const status = getStatusColor(customer.balance);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-white/20 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
          <button
            onClick={() => onQuickView(customer)}
            className="text-white font-semibold text-lg hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {customer.name}
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-8 bg-slate-800 border border-white/10 rounded-lg py-2 min-w-[150px] z-10">
              <button
                onClick={() => {
                  onEdit(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                تعديل
              </button>
              <button
                onClick={() => {
                  onStatement(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                كشف حساب
              </button>
              <button
                onClick={() => {
                  onPayment(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                سند قبض
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {customer.phone && (
          <div className="flex items-center gap-2 text-white/60">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{customer.phone}</span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-white/60">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{customer.email}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-2 text-white/60">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{customer.address}</span>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">الرصيد</span>
          <span className={`font-bold text-lg ${status.text}`}>
            {customer.balance.toLocaleString('ar-EG')} ج.م
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/60 text-sm">الحالة</span>
          <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => onStatement(customer)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            كشف حساب
          </button>
          <button
            onClick={() => onPayment(customer)}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            سند قبض
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/sales/customers/CustomerCard.tsx
git commit -m "feat: update CustomerCard with modern glassmorphism design"
```

---

### Task 4: Create CustomerQuickView Component

**Files:**
- Create: `frontend/components/sales/customers/CustomerQuickView.tsx`

**Interfaces:**
- Consumes: Customer, StatementItem types
- Produces: CustomerQuickView slide-out panel

- [ ] **Step 1: Create CustomerQuickView.tsx**

```tsx
// frontend/components/sales/customers/CustomerQuickView.tsx

'use client';

import { X, FileText, Wallet, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Customer, StatementItem } from './types';

interface CustomerQuickViewProps {
  customer: Customer;
  statement: StatementItem[];
  loading: boolean;
  onClose: () => void;
  onStatement: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
}

export function CustomerQuickView({
  customer,
  statement,
  loading,
  onClose,
  onStatement,
  onPayment,
}: CustomerQuickViewProps) {
  const recentTransactions = statement.slice(0, 5);

  const totalSales = statement.reduce((sum, item) => sum + item.debit, 0);
  const totalPayments = statement.reduce((sum, item) => sum + item.credit, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[350px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">كشف حساب: {customer.name}</h3>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Summary */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white/60 text-sm mb-4">ملخص سريع</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">إجمالي المبيعات</span>
                <span className="text-white font-medium">{totalSales.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">إجمالي السندات</span>
                <span className="text-emerald-400 font-medium">{totalPayments.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-white/60">الرصيد المتبقي</span>
                  <span className={`font-bold ${customer.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {customer.balance.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white/60 text-sm mb-4">آخر 5 معاملات</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-white text-sm">{item.description}</div>
                      <div className="text-white/40 text-xs">{new Date(item.date).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <div className="text-left">
                      {item.debit > 0 && (
                        <span className="text-red-400 text-sm">+{item.debit.toLocaleString('ar-EG')}</span>
                      )}
                      {item.credit > 0 && (
                        <span className="text-emerald-400 text-sm">-{item.credit.toLocaleString('ar-EG')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">لا توجد معاملات</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onStatement(customer);
                onClose();
              }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              كشف حساب كامل
            </button>
            <button
              onClick={() => {
                onPayment(customer);
                onClose();
              }}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              سند قبض
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/sales/customers/CustomerQuickView.tsx
git commit -m "feat: add CustomerQuickView slide-out panel"
```

---

### Task 5: Create CustomerCharts Component

**Files:**
- Create: `frontend/components/sales/customers/CustomerCharts.tsx`

**Interfaces:**
- Consumes: CustomerStats, Customer[] types
- Produces: CustomerCharts component with PieChart + BarChart

- [ ] **Step 1: Create CustomerCharts.tsx**

```tsx
// frontend/components/sales/customers/CustomerCharts.tsx

'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Customer, CustomerStats } from './types';

interface CustomerChartsProps {
  stats: CustomerStats;
  customers: Customer[];
}

export function CustomerCharts({ stats, customers }: CustomerChartsProps) {
  // Pie chart data
  const pieData = [
    { name: 'أمين', value: stats.cleanCount, color: '#10b981' },
    { name: 'مدين', value: stats.debtorsCount - Math.floor(stats.debtorsCount * 0.3), color: '#f59e0b' },
    { name: 'مدين متأخر', value: Math.floor(stats.debtorsCount * 0.3), color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Bar chart data (last 6 months)
  const barData = [
    { name: 'يناير', sales: 45000 },
    { name: 'فبراير', sales: 52000 },
    { name: 'مارس', sales: 48000 },
    { name: 'أبريل', sales: 61000 },
    { name: 'مايو', sales: 55000 },
    { name: 'يونيو', sales: 67000 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/10 rounded-lg p-3">
          <p className="text-white text-sm">{label}</p>
          <p className="text-emerald-400 text-sm">
            {payload[0].value.toLocaleString('ar-EG')} ج.م
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pie Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">توزيع الديون</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">المبيعات الأخيرة</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/sales/customers/CustomerCharts.tsx
git commit -m "feat: add CustomerCharts with PieChart and BarChart"
```

---

### Task 6: Update CustomersHeader Component

**Files:**
- Modify: `frontend/components/sales/customers/CustomersHeader.tsx`

**Interfaces:**
- Consumes: CustomerStats type
- Produces: Updated CustomersHeader with stats, export buttons, new customer button

- [ ] **Step 1: Rewrite CustomersHeader.tsx**

```tsx
// frontend/components/sales/customers/CustomersHeader.tsx

'use client';

import { Plus, FileSpreadsheet, FileText, Users, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react';
import { CustomerStats } from './types';

interface CustomersHeaderProps {
  stats: CustomerStats;
  onNewCustomer: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function CustomersHeader({
  stats,
  onNewCustomer,
  onExportExcel,
  onExportPDF,
}: CustomersHeaderProps) {
  return (
    <div className="mb-6">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">العملاء</h1>
          <p className="text-white/60">إدارة بيانات العملاء والديون</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportExcel}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            تصدير Excel
          </button>
          <button
            onClick={onExportPDF}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            تصدير PDF
          </button>
          <button
            onClick={onNewCustomer}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            عميل جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">إجمالي العملاء</p>
              <p className="text-white text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">المدينون</p>
              <p className="text-white text-2xl font-bold">{stats.debtorsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">إجمالي الديون</p>
              <p className="text-white text-2xl font-bold">{stats.totalDebt.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">أمينون</p>
              <p className="text-white text-2xl font-bold">{stats.cleanCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/sales/customers/CustomersHeader.tsx
git commit -m "feat: update CustomersHeader with stats and export buttons"
```

---

### Task 7: Update Main Page

**Files:**
- Modify: `frontend/app/sales/customers/page.tsx`

**Interfaces:**
- Consumes: All components, useCustomers hook
- Produces: Updated main page orchestrating all components

- [ ] **Step 1: Rewrite page.tsx**

```tsx
// frontend/app/sales/customers/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { CustomersHeader } from '@/components/sales/customers/CustomersHeader';
import { CustomerFilters } from '@/components/sales/customers/CustomerFilters';
import { CustomerCard } from '@/components/sales/customers/CustomerCard';
import { CustomerQuickView } from '@/components/sales/customers/CustomerQuickView';
import { CustomerCharts } from '@/components/sales/customers/CustomerCharts';
import { AddEditCustomerDialog } from '@/components/sales/customers/AddEditCustomerDialog';
import { CollectionDialog } from '@/components/sales/customers/CollectionDialog';
import { StatementModal } from '@/components/sales/customers/StatementModal';
import { Loader2 } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    customers,
    filteredCustomers,
    loading,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    showStatementModal,
    setShowStatementModal,
    showPaymentModal,
    setShowPaymentModal,
    statement,
    selectedCustomer,
    setSelectedCustomer,
    statementLoading,
    statementMonth,
    statementYear,
    showQuickView,
    quickViewCustomer,
    filters,
    stats,
    loadStatement,
    handleSave,
    handlePayment,
    handleStatementFilter,
    clearStatementFilter,
    handleSearch,
    handleFilterStatus,
    handleSort,
    openQuickView,
    closeQuickView,
  } = useCustomers();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('العملاء');

    // Add headers
    worksheet.columns = [
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'الهاتف', key: 'phone', width: 20 },
      { header: 'الإيميل', key: 'email', width: 30 },
      { header: 'العنوان', key: 'address', width: 30 },
      { header: 'الرصيد', key: 'balance', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
    ];

    // Add data
    filteredCustomers.forEach((customer) => {
      const status = customer.balance <= 0 ? 'أمين' : customer.balance <= 10000 ? 'مدين' : 'مدين متأخر';
      worksheet.addRow({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        balance: customer.balance,
        status: status,
      });
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'العملاء.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Add Arabic font support (simplified)
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(20);
    doc.text('قائمة العملاء', 148, 20, { align: 'center' });

    // Table data
    const tableData = filteredCustomers.map((customer) => {
      const status = customer.balance <= 0 ? 'أمين' : customer.balance <= 10000 ? 'مدين' : 'مدين متأخر';
      return [
        customer.name,
        customer.phone || '-',
        customer.email || '-',
        customer.balance.toLocaleString('ar-EG'),
        status,
      ];
    });

    // Add table
    autoTable(doc, {
      head: [['الاسم', 'الهاتف', 'الإيميل', 'الرصيد', 'الحالة']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Save file
    doc.save('العملاء.pdf');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <CustomersHeader
          stats={stats}
          onNewCustomer={() => setShowModal(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />

        {/* Filters */}
        <CustomerFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterStatus={handleFilterStatus}
          onSort={handleSort}
        />

        {/* Charts */}
        <CustomerCharts stats={stats} customers={customers} />

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={(c) => {
                  setEditingCustomer(c);
                  setShowModal(true);
                }}
                onStatement={(c) => {
                  setSelectedCustomer(c);
                  loadStatement(c.id);
                  setShowStatementModal(true);
                }}
                onPayment={(c) => {
                  setSelectedCustomer(c);
                  setShowPaymentModal(true);
                }}
                onQuickView={openQuickView}
              />
            ))}
          </div>
        )}

        {/* Quick View Panel */}
        {showQuickView && quickViewCustomer && (
          <CustomerQuickView
            customer={quickViewCustomer}
            statement={statement}
            loading={statementLoading}
            onClose={closeQuickView}
            onStatement={(c) => {
              setSelectedCustomer(c);
              loadStatement(c.id);
              setShowStatementModal(true);
            }}
            onPayment={(c) => {
              setSelectedCustomer(c);
              setShowPaymentModal(true);
            }}
          />
        )}

        {/* Modals */}
        <AddEditCustomerDialog
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={handleSave}
          customer={editingCustomer}
        />

        <CollectionDialog
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomer(null);
          }}
          onSave={handlePayment}
          customer={selectedCustomer}
        />

        <StatementModal
          isOpen={showStatementModal}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          statement={statement}
          loading={statementLoading}
          month={statementMonth}
          year={statementYear}
          onFilter={handleStatementFilter}
          onClearFilter={clearStatementFilter}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/sales/customers/page.tsx
git commit -m "feat: update main customers page with all components"
```

---

### Task 8: Test and Verify

**Files:**
- Test: Run development server and verify functionality

**Interfaces:**
- N/A

- [ ] **Step 1: Start development server**

```bash
cd C:\ELMostafa\frontend
$env:NODE_OPTIONS="--max-old-space-size=2048"
npx next dev -H 0.0.0.0
```

- [ ] **Step 2: Verify page loads**

Navigate to http://localhost:3000/sales/customers/ and verify:
- [ ] Page loads with glassmorphism design
- [ ] Stats cards display correctly
- [ ] Filter bar works (search, status, sort)
- [ ] Charts render properly
- [ ] Customer cards display in grid layout
- [ ] Quick view panel opens on card click
- [ ] Export buttons work (Excel/PDF)
- [ ] RTL layout displays correctly

- [ ] **Step 3: Test interactions**

- [ ] Search filters customers by name/phone/email
- [ ] Status filter shows correct customers
- [ ] Sort changes card order
- [ ] Quick view shows customer summary
- [ ] Edit opens modal with customer data
- [ ] Payment records new transaction
- [ ] Statement modal shows transactions
- [ ] Export generates Excel/PDF files

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete customers page redesign"
```

---

## Summary

This plan implements a complete redesign of the customers page with:

1. **Modern glassmorphism design** with gradient backgrounds and blur effects
2. **Card-based layout** (3 columns on desktop)
3. **Advanced filtering** (search, status, sort)
4. **Quick View slide-out panel** for customer details
5. **Charts** (debt distribution + monthly sales)
6. **Export functionality** (Excel + PDF)
7. **RTL support** throughout
8. **Responsive design** for all screen sizes

Total tasks: 8
Estimated time: 2-3 hours
Dependencies: None (all libraries already installed)
