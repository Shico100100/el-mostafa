import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Machine } from '../manufacturing/entities/machine.entity';
import { Mold } from '../manufacturing/entities/mold.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
  ) {}

  async globalSearch(query: string) {
    const searchPattern = `%${query}%`;

    // Search Products
    const products = await this.productRepo.find({
      where: [
        { name: Like(searchPattern) },
        { sku: Like(searchPattern) },
        { barcode: Like(searchPattern) },
      ],
      take: 5,
    });

    // Search Customers
    const customers = await this.customerRepo.find({
      where: [
        { name: Like(searchPattern) },
        { phone: Like(searchPattern) },
        { email: Like(searchPattern) },
      ],
      take: 5,
    });

    // Search Suppliers
    const suppliers = await this.supplierRepo.find({
      where: [
        { name: Like(searchPattern) },
        { phone: Like(searchPattern) },
        { email: Like(searchPattern) },
      ],
      take: 5,
    });

    // Search Sales Orders (by customer name since no order number field)
    const salesOrders = await this.salesOrderRepo.find({
      relations: ['customer'],
      take: 5,
    });

    // Search Purchase Orders (by invoice number or supplier)
    const purchaseOrders = await this.purchaseOrderRepo.find({
      where: [{ invoice_number: Like(searchPattern) }],
      relations: ['supplier'],
      take: 5,
    });

    // Search Machines
    const machines = await this.machineRepo.find({
      where: [
        { name: Like(searchPattern) },
        { serial_number: Like(searchPattern) },
      ],
      take: 5,
    });

    // Search Molds
    const molds = await this.moldRepo.find({
      where: [{ name: Like(searchPattern) }],
      take: 5,
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: p.sku || p.barcode,
        url: `/inventory/products`,
        icon: 'Package',
      })),
      customers: customers.map((c) => ({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: c.phone || c.email,
        url: `/sales/customers`,
        icon: 'Users',
      })),
      suppliers: suppliers.map((s) => ({
        id: s.id,
        type: 'supplier',
        title: s.name,
        subtitle: s.phone || s.email,
        url: `/purchases/suppliers`,
        icon: 'Truck',
      })),
      salesOrders: salesOrders.map((so) => ({
        id: so.id,
        type: 'sales-order',
        title: `طلب بيع #${so.id}`,
        subtitle: so.customer?.name,
        url: `/sales/orders`,
        icon: 'ShoppingCart',
      })),
      purchaseOrders: purchaseOrders.map((po) => ({
        id: po.id,
        type: 'purchase-order',
        title: `طلب شراء ${po.invoice_number || '#' + po.id}`,
        subtitle: po.supplier?.name,
        url: `/purchases/orders`,
        icon: 'ShoppingBag',
      })),
      machines: machines.map((m) => ({
        id: m.id,
        type: 'machine',
        title: m.name,
        subtitle: m.serial_number,
        url: `/manufacturing/machines`,
        icon: 'Cog',
      })),
      molds: molds.map((m) => ({
        id: m.id,
        type: 'mold',
        title: m.name,
        subtitle: `${m.cavities} فتحة`,
        url: `/manufacturing/molds`,
        icon: 'Box',
      })),
    };
  }
}
