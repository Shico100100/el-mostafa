import { Injectable } from '@nestjs/common';
import { AccountType } from '../accounting/entities/account.entity';

@Injectable()
export class PeachtreeMappingService {
  private parsePeachtreeDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const dotNetMatch = dateStr.match(/\/Date\((\d+)\)\//);
    if (dotNetMatch) {
      const ts = parseInt(dotNetMatch[1], 10);
      if (!isNaN(ts)) return new Date(ts);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  mapCustomer(ptRow: any) {
    return {
      name: ptRow.Customer_Bill_Name || ptRow.CustomerID || '',
      phone: ptRow.Phone_Number || ptRow.PhoneNumber2 || '',
      email: ptRow.eMail_Address || '',
      address: '',
      balance: parseFloat(ptRow.Balance || '0') || 0,
    };
  }

  mapSupplier(ptRow: any) {
    return {
      name: ptRow.Name || ptRow.VendorID || '',
      phone: ptRow.PhoneNumber || ptRow.PhoneNumber2 || '',
      email: ptRow.Email || '',
      address: '',
      balance: parseFloat(ptRow.Balance || '0') || 0,
    };
  }

  mapProduct(ptRow: any) {
    return {
      name: ptRow.ItemDescription || ptRow.ItemID || '',
      sku: ptRow.UPC_SKU || ptRow.ItemID || '',
      barcode: ptRow.UPC_SKU || '',
      cost_price: parseFloat(ptRow.LaborCost || '0') || 0,
      selling_price:
        parseFloat(ptRow.PriceLevel1Amount || ptRow.SalesAmt1 || '0') || 0,
      unit: ptRow.StockingUM || 'piece',
      description:
        ptRow.SalesDescription || ptRow.PurchaseDescription || ptRow.Note || '',
      type: 'RAW',
    };
  }

  mapGLAccount(ptRow: any) {
    const at = Number(ptRow.AccountType || 0);
    let type: AccountType;
    if (at >= 0 && at <= 6) {
      type = AccountType.ASSET;
    } else if (at >= 10 && at <= 14) {
      type = AccountType.LIABILITY;
    } else if (at >= 16 && at <= 19) {
      type = AccountType.EQUITY;
    } else if (at === 21) {
      type = AccountType.REVENUE;
    } else if (at >= 23 && at <= 24) {
      type = AccountType.EXPENSE;
    } else {
      type = AccountType.EXPENSE;
    }
    return {
      code: String(ptRow.GLAcntNumber || ptRow.AccountID || ''),
      name: ptRow.AccountDescription || '',
      type,
      description: ptRow.AccountDescription || '',
      balance: parseFloat(ptRow.Balance0Net || '0') || 0,
    };
  }

  mapJournalEntry(ptRow: any) {
    const date = this.parsePeachtreeDate(ptRow.RowDate) || new Date();
    return {
      date,
      description: ptRow.RowDescription || '',
      reference: String(ptRow.DistNumber || ''),
      account_code: String(ptRow.GLAcntNumber || ''),
      debit:
        parseFloat(ptRow.Amount || '0') >= 0
          ? parseFloat(ptRow.Amount || '0')
          : 0,
      credit:
        parseFloat(ptRow.Amount || '0') < 0
          ? Math.abs(parseFloat(ptRow.Amount || '0'))
          : 0,
    };
  }

  mapBudget(ptRow: any) {
    return {
      name: ptRow.BudgetID || 'Unknown',
      period: ptRow.BudgetID || 'unknown',
      description: ptRow.BudgetDescription || ptRow.Notes || '',
      status: 'ACTIVE',
    };
  }

  mapBudgetLine(ptRow: any) {
    return {
      account_code: '',
      budgeted_amount: 0,
      notes: ptRow.BudgetDescription || '',
    };
  }

  mapEmployee(ptRow: any) {
    return {
      firstName: ptRow.Employee_FirstName || ptRow.EmployeeName || '',
      lastName: ptRow.Employee_LastName || '',
      email:
        ptRow.Email ||
        `${(ptRow.Employee_FirstName || 'emp').toLowerCase().replace(/\s+/g, '.')}@peachtree.local`,
      phone: ptRow.PhoneNumber || '',
    };
  }

  mapBOMItem(ptRow: any) {
    return {
      parent_item: String(ptRow.AssemblyRecordNo || ''),
      component_item: String(ptRow.ComponentRecordNo || ''),
      quantity: parseFloat(ptRow.QtyRequired || '0') || 0,
      description: '',
    };
  }

  mapBankAccount(ptRow: any) {
    return {
      name: ptRow.BankAccount || '',
      bank_name: '',
      account_number: ptRow.BankAccount || '',
      balance: parseFloat(ptRow.EndingBalance1 || '0') || 0,
    };
  }

  mapJob(ptRow: any) {
    return {
      name: ptRow.JobDescription || '',
      code: ptRow.JobID || '',
      estimated_cost: 0,
      estimated_revenue: 0,
      description: ptRow.JobDescription || ptRow.Note || '',
      status: ptRow.JobIsInactive ? 'INACTIVE' : 'ACTIVE',
    };
  }

  mapJobPhase(ptRow: any) {
    return {
      name: ptRow.PhaseDescription || '',
      code: ptRow.PhaseID || '',
      estimated_cost: 0,
      status: ptRow.PhaseIsInactive ? 'INACTIVE' : 'ACTIVE',
    };
  }

  mapTaxConfig(ptRow: any) {
    return {
      year: new Date().getFullYear(),
      bracket_min: parseFloat(ptRow.GrossMoreThan0 || '0') || 0,
      bracket_max: parseFloat(ptRow.GrossMoreThan1 || '999999') || 999999,
      rate: parseFloat(ptRow.Withhold0 || '0') || 0,
      country: ptRow.State || 'EG',
    };
  }

  mapSalesInvoice(ptRow: any) {
    return {
      total_amount: parseFloat(ptRow.MainAmount || '0') || 0,
      status: ptRow.TrxIsPosted === 1 ? 'COMPLETED' : 'PENDING',
      order_date: this.parsePeachtreeDate(ptRow.TransactionDate),
      notes: ptRow.Description || ptRow.TrxName || '',
      invoice_number: ptRow.Reference || ptRow.CustomerInvoiceNo || '',
      payment_method: ptRow.PaymentMethod || '',
      amount_paid: parseFloat(ptRow.AmountPaid || '0') || 0,
      customer_vend_id: parseInt(ptRow.CustVendId || '0', 10),
    };
  }

  mapPurchaseInvoice(ptRow: any) {
    return {
      total_amount: parseFloat(ptRow.MainAmount || '0') || 0,
      status: ptRow.TrxIsPosted === 1 ? 'COMPLETED' : 'PENDING',
      order_date: this.parsePeachtreeDate(ptRow.TransactionDate),
      notes: ptRow.Description || ptRow.TrxName || '',
      invoice_number: ptRow.Reference || '',
      payment_method: ptRow.PaymentMethod || '',
      amount_paid: parseFloat(ptRow.AmountPaid || '0') || 0,
      customer_vend_id: parseInt(ptRow.CustVendId || '0', 10),
    };
  }

  mapSalesInvoiceItem(ptRow: any) {
    return {
      quantity: Math.abs(
        parseFloat(ptRow.Quantity || ptRow.StockingQuantity || '0') || 0,
      ),
      price: Math.abs(
        parseFloat(ptRow.UnitCost || ptRow.StockingUnitCost || '0') || 0,
      ),
      total: Math.abs(parseFloat(ptRow.Amount || '0') || 0),
      item_record_number: parseInt(ptRow.ItemRecordNumber || '0', 10),
      gl_acnt_number: parseInt(ptRow.GLAcntNumber || '0', 10),
      description: ptRow.RowDescription || '',
    };
  }

  mapPurchaseInvoiceItem(ptRow: any) {
    return {
      quantity: Math.abs(
        parseFloat(ptRow.Quantity || ptRow.StockingQuantity || '0') || 0,
      ),
      price: Math.abs(
        parseFloat(ptRow.UnitCost || ptRow.StockingUnitCost || '0') || 0,
      ),
      total: Math.abs(parseFloat(ptRow.Amount || '0') || 0),
      item_record_number: parseInt(ptRow.ItemRecordNumber || '0', 10),
      gl_acnt_number: parseInt(ptRow.GLAcntNumber || '0', 10),
      description: ptRow.RowDescription || '',
    };
  }
}
