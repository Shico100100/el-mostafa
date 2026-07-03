'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BOM, Product, ExplosionResult, CostResult, BOMFormItem } from '@/components/bom/types';

export function useBOM() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExplodeDialog, setShowExplodeDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<BOM | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formPcsPerCarton, setFormPcsPerCarton] = useState('1');
  const [formPcsPerBox, setFormPcsPerBox] = useState('1');
  const [formCartonProductId, setFormCartonProductId] = useState('');
  const [formBoxProductId, setFormBoxProductId] = useState('');
  const [formItems, setFormItems] = useState<BOMFormItem[]>([]);
  const [explodeQuantity, setExplodeQuantity] = useState('1');
  const [explosionResult, setExplosionResult] = useState<ExplosionResult | null>(null);
  const [exploding, setExploding] = useState(false);
  const [costResult, setCostResult] = useState<CostResult | null>(null);

  const bomProducts = products.filter(p => p.type === 'FINISHED' || (p.type === 'SEMI_FINISHED' && p.name.startsWith('بلاستيك')));
  const productOptions = products.map(p => ({ value: p.id, label: `${p.name} (${p.type})` }));
  const filteredBoms = boms.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const loadData = useCallback(async () => {
    try {
      const [bomsData, defaultProducts, semiFinished] = await Promise.all([
        api.getBOMs(),
        api.getProducts(),
        api.getProducts('SEMI_FINISHED'),
      ]);
      setBoms(bomsData || []);
      const merged = [...(defaultProducts || []), ...(semiFinished || [])];
      setProducts(merged);
    } catch (error) {
      console.error('Failed to load BOM data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormProductId('');
    setFormPcsPerCarton('1');
    setFormPcsPerBox('1');
    setFormCartonProductId('');
    setFormBoxProductId('');
    setFormItems([]);
  };

  const openCreate = () => { resetForm(); setShowCreateDialog(true); };

  const openEdit = (bom: BOM) => {
    setSelectedBOM(bom);
    setFormName(bom.name);
    setFormDescription(bom.description || '');
    setFormProductId(String(bom.product_id));
    setFormPcsPerCarton(String(bom.pcs_per_carton || 1));
    setFormPcsPerBox(String(bom.pcs_per_box || 1));
    setFormCartonProductId(bom.carton_product_id ? String(bom.carton_product_id) : '');
    setFormBoxProductId(bom.box_product_id ? String(bom.box_product_id) : '');
    setFormItems(bom.items.map(i => ({ product_id: String(i.product_id), quantity: String(i.quantity) })));
    setShowEditDialog(true);
  };

  const openExplode = (bom: BOM) => {
    setSelectedBOM(bom);
    setExplodeQuantity('1');
    setExplosionResult(null);
    setCostResult(null);
    setShowExplodeDialog(true);
  };

  const addItem = () => setFormItems([...formItems, { product_id: '', quantity: '1' }]);
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: 'product_id' | 'quantity', value: string) => {
    const updated = [...formItems];
    updated[idx][field] = value;
    setFormItems(updated);
  };

  const handleSave = async (isEdit: boolean) => {
    try {
      const payload = {
        name: formName,
        product_id: Number(formProductId),
        description: formDescription,
        pcs_per_carton: Number(formPcsPerCarton),
        pcs_per_box: Number(formPcsPerBox),
        carton_product_id: formCartonProductId ? Number(formCartonProductId) : null,
        box_product_id: formBoxProductId ? Number(formBoxProductId) : null,
        items: formItems.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      };

      if (isEdit && selectedBOM) {
        await api.updateBOM(selectedBOM.id, payload);
      } else {
        await api.createBOM(payload);
      }

      setShowCreateDialog(false);
      setShowEditDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save BOM:', error);
    }
  };

  const handleDelete = async (bom: BOM) => {
    try {
      await api.deleteBOM(bom.id);
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete BOM:', error);
    }
  };

  const handleDuplicate = async (bom: BOM) => {
    try {
      const payload = {
        name: `${bom.name} (نسخة)`,
        product_id: bom.product_id,
        description: bom.description,
        pcs_per_carton: bom.pcs_per_carton,
        pcs_per_box: bom.pcs_per_box,
        carton_product_id: bom.carton_product_id,
        box_product_id: bom.box_product_id,
        items: bom.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      };
      await api.createBOM(payload);
      loadData();
    } catch (error) {
      console.error('Failed to duplicate BOM:', error);
    }
  };

  const handleExplode = async () => {
    if (!selectedBOM) return;
    const parsedQty = parseInt(explodeQuantity, 10);
    if (!parsedQty || parsedQty < 1) return;
    setExploding(true);
    setCostResult(null);
    try {
      const cartonQty = parsedQty;
      const ppc = selectedBOM.pcs_per_carton || 1;
      const pieces = cartonQty * ppc;
      const [result, cost] = await Promise.all([
        api.explodeBOM(selectedBOM.id, pieces),
        api.getBOMCost(selectedBOM.id, pieces),
      ]);
      setExplosionResult({ ...result, requested_quantity: cartonQty, pcs_per_carton: ppc, pcs_per_box: selectedBOM.pcs_per_box || 1 });
      setCostResult(cost);
    } catch (error) {
      console.error('Failed to explode BOM:', error);
    } finally {
      setExploding(false);
    }
  };

  const generatePDF = (result: ExplosionResult) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`BOM Explosion Report: ${result.bom_name}`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Product: ${result.product_name}`, 14, 32);
    doc.text(`Requested Quantity: ${result.requested_quantity.toLocaleString()}`, 14, 40);
    doc.text(`Total Components: ${result.total_components}`, 14, 48);
    doc.text(`Total Weight: ${(result.total_weight_kg ?? 0).toFixed(3)} kg`, 14, 56);

    if (costResult) {
      doc.text(`Total Cost: ${(costResult.total_cost ?? 0).toFixed(2)} EGP`, 14, 64);
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    doc.text(`Generated: ${currentDate}`, pageWidth - 14, 32, { align: 'right' });

    const startY = costResult ? 73 : 65;

    const tableData = result.components.map((comp, idx) => [
      idx + 1,
      comp.product_name,
      comp.sku || '—',
      comp.weight_grams > 0 ? `${comp.weight_grams}` : '—',
      comp.raw_material_type || '—',
      comp.total_quantity.toLocaleString(),
      `${(comp.total_weight_kg ?? 0).toFixed(3)}`,
    ]);

    autoTable(doc, {
      startY,
      head: [['#', 'Component', 'SKU', 'Weight (g)', 'Material', 'Quantity', 'Total Weight (kg)']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      foot: [['', '', '', '', 'Total', '', `${(result.total_weight_kg ?? 0).toFixed(3)} kg`]],
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    });

    doc.save(`BOM_${result.bom_name.replace(/\s+/g, '_')}_${result.requested_quantity}.pdf`);
  };

  const getProductName = (id: number) => products.find(p => p.id === id)?.name || `#${id}`;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-EG');

  return {
    boms, loading, products, search, setSearch,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showExplodeDialog, setShowExplodeDialog,
    showDeleteConfirm, setShowDeleteConfirm,
    selectedBOM,
    formName, setFormName, formDescription, setFormDescription,
    formProductId, setFormProductId,
    formPcsPerCarton, setFormPcsPerCarton,
    formPcsPerBox, setFormPcsPerBox,
    formCartonProductId, setFormCartonProductId,
    formBoxProductId, setFormBoxProductId,
    formItems,
    explodeQuantity, setExplodeQuantity,
    explosionResult, costResult, exploding,
    bomProducts, productOptions, filteredBoms,
    openCreate, openEdit, openExplode,
    addItem, removeItem, updateItem,
    handleSave, handleDelete, handleDuplicate,
    handleExplode, generatePDF, getProductName, formatDate, loadData,
  };
}
