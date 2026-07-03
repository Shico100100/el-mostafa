'use client';

import type { TabId } from './types';

const tabs: { id: TabId; label: string; color: string }[] = [
  { id: 'SALES', label: 'المبيعات', color: 'bg-blue-600' },
  { id: 'PURCHASES', label: 'المشتريات', color: 'bg-purple-600' },
  { id: 'STOCK', label: 'المخزون', color: 'bg-green-600' },
  { id: 'PROFIT_LOSS', label: 'الأرباح والخسائر', color: 'bg-yellow-600' },
  { id: 'ANALYTICS', label: 'الرسوم البيانية', color: 'bg-emerald-600' },
  { id: 'SHIPMENT_PROFIT', label: 'ربحية الشحنات', color: 'bg-cyan-600' },
];

export function ReportTabs({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  return (
    <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.id ? `${tab.color} text-white` : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
