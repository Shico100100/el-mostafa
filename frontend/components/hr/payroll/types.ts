export interface PayrollProfile {
  id: number;
  base_salary: number;
  working_hours_per_day: number;
  overtime_rate: number;
  deduction_rate: number;
  updated_at: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CalculationResult {
  user: { id: number; firstName: string; lastName: string };
  month: string;
  attendanceDays: number;
  absentDays: number;
  baseSalary: number;
  deductions: number;
  netSalary: number;
}

export interface PayrollPayment {
  id: number;
  net_salary: number;
  payment_date: string;
  notes?: string;
  user?: { firstName: string; lastName: string };
}
