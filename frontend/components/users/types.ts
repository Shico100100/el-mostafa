export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: number; name: string };
  status: { id: number; name: string };
}

export interface UserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: { id: number };
  status: { id: number };
}

export const ROLES = [
  { id: 1, name: 'Admin', label: 'مدير نظام' },
  { id: 3, name: 'Manager', label: 'مدير' },
  { id: 4, name: 'Accountant', label: 'محاسب' },
  { id: 5, name: 'Storekeeper', label: 'أمين مخزن' },
  { id: 6, name: 'Worker', label: 'عامل' },
  { id: 2, name: 'User', label: 'مستخدم' },
].sort((a, b) => a.label.localeCompare(b.label, 'ar'));
