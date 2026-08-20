import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { SupplierService } from './suppliers/supplier.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PackingListService } from './packing-lists/packing-list.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { PaymentService } from './supplier-payments/payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateSupplierPaymentDto,
  CreatePurchaseReturnDto,
  CreatePackingListDto,
  UpdateLandedCostDto,
} from './dto';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager)
export class PurchasesController {
  constructor(
    private purchasesService: PurchasesService,
    private supplierService: SupplierService,
    private purchaseOrderService: PurchaseOrderService,
    private packingListService: PackingListService,
    private purchaseReturnService: PurchaseReturnService,
    private paymentService: PaymentService,
  ) {}

  // Suppliers
  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiResponse({ status: 200, description: 'Returns all suppliers' })
  getAllSuppliers() {
    return this.supplierService.getAllSuppliers();
  }

  @Get('suppliers/aging')
  @ApiOperation({ summary: 'Get supplier aging report' })
  @ApiResponse({ status: 200, description: 'Returns supplier aging data' })
  getSupplierAging() {
    return this.purchasesService.getSupplierAging();
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Returns the supplier' })
  getSupplier(@Param('id') id: string) {
    return this.supplierService.getSupplier(+id);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.createSupplier(createSupplierDto);
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  updateSupplier(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.supplierService.updateSupplier(+id, data);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  deleteSupplier(@Param('id') id: string) {
    return this.supplierService.deleteSupplier(+id);
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  getAllOrders(@Query() query: Record<string, any>) {
    return this.purchaseOrderService.getAllOrders({
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 10,
      search: query.search,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  getOrder(@Param('id') id: string) {
    return this.purchaseOrderService.getOrder(+id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a purchase order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  createOrder(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchasesService.createOrder(createPurchaseOrderDto);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  updateOrder(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.purchasesService.updateOrder(+id, data);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  deleteOrder(@Param('id') id: string) {
    return this.purchasesService.deleteOrder(+id);
  }

  @Get('orders/:id/items')
  @ApiOperation({ summary: 'Get order items' })
  @ApiResponse({ status: 200, description: 'Returns order items' })
  getOrderItems(@Param('id') id: string) {
    return this.purchaseOrderService.getOrderItems(+id);
  }

  // Supplier Payments
  @Post('suppliers/:id/payments')
  @ApiOperation({ summary: 'Add a supplier payment' })
  @ApiResponse({ status: 201, description: 'Payment added' })
  addPayment(
    @Param('id') id: string,
    @Body() createSupplierPaymentDto: CreateSupplierPaymentDto,
  ) {
    return this.purchasesService.addPayment({
      supplier_id: +id,
      ...createSupplierPaymentDto,
    });
  }

  @Get('suppliers/:id/payments')
  @ApiOperation({ summary: 'Get supplier payments' })
  @ApiResponse({ status: 200, description: 'Returns supplier payments' })
  getSupplierPayments(@Param('id') id: string) {
    return this.paymentService.getSupplierPayments(+id);
  }

  @Get('suppliers/:id/statement')
  @ApiOperation({ summary: 'Get supplier statement of account' })
  @ApiResponse({ status: 200, description: 'Returns statement' })
  getStatement(@Param('id') id: string) {
    return this.purchasesService.getStatementOfAccount(+id);
  }

  @Get('suppliers/:id/balance')
  @ApiOperation({ summary: 'Get supplier balance' })
  @ApiResponse({ status: 200, description: 'Returns supplier balance' })
  getSupplierBalance(@Param('id') id: string) {
    return this.purchasesService.getSupplierBalance(+id);
  }

  // Returns
  @Get('returns')
  @ApiOperation({ summary: 'Get all purchase returns' })
  @ApiResponse({ status: 200, description: 'Returns all returns' })
  getAllReturns() {
    return this.purchaseReturnService.getAllReturns();
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get a purchase return by ID' })
  @ApiResponse({ status: 200, description: 'Returns the return record' })
  getReturn(@Param('id') id: string) {
    return this.purchaseReturnService.getReturn(+id);
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create a purchase return' })
  @ApiResponse({ status: 201, description: 'Return created' })
  createReturn(@Body() createPurchaseReturnDto: CreatePurchaseReturnDto) {
    return this.purchasesService.createReturn(createPurchaseReturnDto);
  }

  // ==================== LANDED COST ====================

  @Get('orders/:id/landed-cost')
  @ApiOperation({ summary: 'Calculate landed cost' })
  @ApiResponse({ status: 200, description: 'Returns landed cost' })
  getLandedCost(@Param('id') id: string) {
    return this.purchasesService.calculateLandedCost(+id);
  }

  @Put('orders/:id/landed-cost')
  @ApiOperation({ summary: 'Update landed cost' })
  @ApiResponse({ status: 200, description: 'Landed cost updated' })
  updateLandedCost(
    @Param('id') id: string,
    @Body() updateLandedCostDto: UpdateLandedCostDto,
  ) {
    return this.purchasesService.updateLandedCost(+id, updateLandedCostDto);
  }

  // ==================== PACKING LIST ====================

  @Get('orders/:id/packing-list')
  @ApiOperation({ summary: 'Get packing list for an order' })
  @ApiResponse({ status: 200, description: 'Returns packing list' })
  getPackingList(@Param('id') id: string) {
    return this.packingListService.getPackingList(+id);
  }

  @Post('orders/:id/packing-list')
  @ApiOperation({ summary: 'Create or update packing list for an order' })
  @ApiResponse({ status: 201, description: 'Packing list saved' })
  savePackingList(
    @Param('id') id: string,
    @Body() createPackingListDto: CreatePackingListDto,
  ) {
    return this.packingListService.savePackingList(+id, createPackingListDto);
  }

  @Get('products/latest-prices/batch')
  @ApiOperation({ summary: 'Get latest purchase prices in batch' })
  @ApiResponse({ status: 200, description: 'Returns latest prices' })
  getLatestPurchasePrices(@Query('ids') ids: string) {
    const productIds = ids
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    return this.purchasesService.getLatestPurchasePrices(productIds);
  }

  @Get('products/:id/latest-price')
  @ApiOperation({ summary: 'Get latest purchase price for a product' })
  @ApiResponse({ status: 200, description: 'Returns latest price' })
  getLatestPurchasePrice(@Param('id') id: string) {
    return this.purchasesService.getLatestPurchasePrice(+id);
  }
}
