'use client';

interface PayrollTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { key: 'PROFILES', label: 'إعدادات الموظفين', color: 'bg-blue-600' },
  { key: 'CALCULATION', label: 'حساب مسير الرواتب', color: 'bg-emerald-600' },
  { key: 'HISTORY', label: 'سجل المدفوعات', color: 'bg-purple-600' },
];

export function PayrollTabs({ activeTab, onTabChange }: PayrollTabsProps) {
  return (
    <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onTabChange(tab.key)}
          className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.key ? `${tab.color} text-white font-bold` : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
