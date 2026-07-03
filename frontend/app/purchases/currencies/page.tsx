'use client';

import { useCurrencies } from '@/hooks/purchases/useCurrencies';
import { CurrenciesHeader } from '@/components/purchases/currencies/CurrenciesHeader';
import { CurrenciesTable } from '@/components/purchases/currencies/CurrenciesTable';
import { FxRatesTable } from '@/components/purchases/currencies/FxRatesTable';
import { AddEditCurrencyDialog } from '@/components/purchases/currencies/AddEditCurrencyDialog';
import { AddFxRateDialog } from '@/components/purchases/currencies/AddFxRateDialog';

export default function CurrenciesPage() {
  const h = useCurrencies();

  if (h.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <CurrenciesHeader onAdd={() => { h.resetCurrencyForm(); h.setShowAddCurrency(true); }} />
      <main className="container mx-auto px-6 py-8 space-y-8">
        <CurrenciesTable currencies={h.currencies}
          onEdit={h.openEditCurrency} onDelete={h.handleDeleteCurrency} onFxRate={h.openFxRate} />
        <FxRatesTable fxRates={h.fxRates} />
      </main>
      <AddEditCurrencyDialog visible={h.showAddCurrency} isEdit={false}
        formCode={h.formCode} formName={h.formName} formSymbol={h.formSymbol} formRate={h.formRate}
        onCodeChange={h.setFormCode} onNameChange={h.setFormName} onSymbolChange={h.setFormSymbol}
        onRateChange={h.setFormRate} onSave={h.handleCreateCurrency} onClose={() => h.setShowAddCurrency(false)} />
      <AddEditCurrencyDialog visible={h.showEditCurrency} isEdit={true}
        formCode={h.formCode} formName={h.formName} formSymbol={h.formSymbol} formRate={h.formRate}
        onCodeChange={h.setFormCode} onNameChange={h.setFormName} onSymbolChange={h.setFormSymbol}
        onRateChange={h.setFormRate} onSave={h.handleUpdateCurrency} onClose={() => h.setShowEditCurrency(false)} />
      <AddFxRateDialog visible={h.showFxRate} currency={h.selectedCurrency}
        fxRateValue={h.fxRateValue} fxAmount={h.fxAmount} fxDate={h.fxDate} fxNotes={h.fxNotes}
        weightedAvg={h.weightedAvg}
        onRateChange={h.setFxRateValue} onAmountChange={h.setFxAmount} onDateChange={h.setFxDate}
        onNotesChange={h.setFxNotes} onCalcWeightedAvg={() => h.selectedCurrency && h.calcWeightedAvg(h.selectedCurrency.id)}
        onSave={h.handleAddFxRate} onClose={() => h.setShowFxRate(false)} />
    </div>
  );
}
