'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Currency, FxRate } from '@/components/purchases/currencies/types';

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [showEditCurrency, setShowEditCurrency] = useState(false);
  const [showFxRate, setShowFxRate] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formRate, setFormRate] = useState('');
  const [fxCurrencyId, setFxCurrencyId] = useState('');
  const [fxRateValue, setFxRateValue] = useState('');
  const [fxAmount, setFxAmount] = useState('');
  const [fxDate, setFxDate] = useState('');
  const [fxNotes, setFxNotes] = useState('');
  const [weightedAvg, setWeightedAvg] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [currenciesData, fxRatesData] = await Promise.all([
        api.getAllCurrencies(),
        api.getFxRates(),
      ]);
      setCurrencies(currenciesData);
      setFxRates(fxRatesData);
    } catch (error) {
      console.error('Failed to load currency data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetCurrencyForm = () => {
    setFormCode('');
    setFormName('');
    setFormSymbol('');
    setFormRate('');
  };

  const openEditCurrency = (c: Currency) => {
    setSelectedCurrency(c);
    setFormCode(c.code);
    setFormName(c.name);
    setFormSymbol(c.symbol || '');
    setFormRate(String(c.exchange_rate_to_egp));
    setShowEditCurrency(true);
  };

  const openFxRate = (c: Currency) => {
    setSelectedCurrency(c);
    setFxCurrencyId(String(c.id));
    setFxRateValue('');
    setFxAmount('');
    setFxDate(new Date().toISOString().split('T')[0]);
    setFxNotes('');
    setWeightedAvg(null);
    setShowFxRate(true);
  };

  const calcWeightedAvg = async (currencyId: number) => {
    try {
      const avg = await api.getWeightedAverageFx(currencyId);
      setWeightedAvg(avg);
    } catch {
      setWeightedAvg(null);
    }
  };

  const handleCreateCurrency = async () => {
    try {
      await api.createCurrency({
        code: formCode.toUpperCase(),
        name: formName,
        symbol: formSymbol,
        exchange_rate_to_egp: Number(formRate),
      });
      setShowAddCurrency(false);
      loadData();
      toast.success('تم إضافة العملة');
    } catch {
      toast.error('فشل إضافة العملة');
    }
  };

  const handleUpdateCurrency = async () => {
    if (!selectedCurrency) return;
    try {
      await api.updateCurrency(selectedCurrency.id, {
        code: formCode.toUpperCase(),
        name: formName,
        symbol: formSymbol,
        exchange_rate_to_egp: Number(formRate),
      });
      setShowEditCurrency(false);
      loadData();
      toast.success('تم تحديث العملة');
    } catch {
      toast.error('فشل تحديث العملة');
    }
  };

  const handleAddFxRate = async () => {
    try {
      await api.addFxRate({
        currency_id: Number(fxCurrencyId),
        rate_to_egp: Number(fxRateValue),
        amount_paid: fxAmount ? Number(fxAmount) : null,
        rate_date: fxDate,
        notes: fxNotes || undefined,
      });
      setShowFxRate(false);
      loadData();
      toast.success('تم إضافة سعر الصرف');
    } catch {
      toast.error('فشل إضافة سعر الصرف');
    }
  };

  const handleDeleteCurrency = async (id: number) => {
    try {
      await api.deleteCurrency(id);
      loadData();
      toast.success('تم حذف العملة');
    } catch {
      toast.error('فشل حذف العملة');
    }
  };

  return {
    currencies, fxRates, loading,
    showAddCurrency, setShowAddCurrency, showEditCurrency, setShowEditCurrency,
    showFxRate, setShowFxRate, selectedCurrency, setSelectedCurrency,
    formCode, setFormCode, formName, setFormName, formSymbol, setFormSymbol, formRate, setFormRate,
    fxCurrencyId, setFxCurrencyId, fxRateValue, setFxRateValue,
    fxAmount, setFxAmount, fxDate, setFxDate, fxNotes, setFxNotes,
    weightedAvg,
    resetCurrencyForm, openEditCurrency, openFxRate,
    calcWeightedAvg, handleCreateCurrency, handleUpdateCurrency, handleAddFxRate, handleDeleteCurrency,
  };
}
