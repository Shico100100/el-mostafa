export interface FixedCost {
  id: number;
  month: string;
  category: 'RENT' | 'ELECTRICITY' | 'WATER' | 'WAGES' | 'PRODUCTION_WAGES' | 'ASSEMBLY_WAGES' | 'MAINTENANCE' | 'TRANSPORT' | 'MISCELLANEOUS' | 'OTHER';
  amount: number;
  notes?: string;
}

export function getCategoryLabel(cat: string) {
  const labels: Record<string, string> = {
    RENT: 'إيجار 🏢', ELECTRICITY: 'كهرباء ⚡', WATER: 'مياه 💧',
    WAGES: 'أجور 👷', PRODUCTION_WAGES: 'أجور إنتاج 🏭', ASSEMBLY_WAGES: 'أجور تجميع 🔧',
    MAINTENANCE: 'صيانة 🛠️', TRANSPORT: 'نقل 🚛', MISCELLANEOUS: 'مصروفات نثرية', OTHER: 'أخرى 📦',
  };
  return labels[cat] || cat;
}

export function getMonthName(monthStr: string) {
  const date = new Date(`${monthStr}-01`);
  return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}
