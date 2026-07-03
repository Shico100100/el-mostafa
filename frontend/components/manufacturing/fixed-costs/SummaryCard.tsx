'use client';

interface Props {
  totalAmount: number;
  currentYear: string;
  onYearChange: (year: string) => void;
}

export function SummaryCard({ totalAmount, currentYear, onYearChange }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-blue-200 mb-1">إجمالي المصروفات لعام {currentYear}</p>
          <h2 className="text-4xl font-bold">{totalAmount.toFixed(2)} ج.م</h2>
        </div>
        <select
          value={currentYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="bg-white/20 border border-white/30 text-black rounded-lg px-4 py-2 focus:outline-none text-xl font-bold"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
            <option key={year} value={year} className="text-black">{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
