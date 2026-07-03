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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  // Suppliers
  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiResponse({ status: 200, description: 'Returns all suppliers' })
  getAllSuppliers() {
    return this.purchasesService.getAllSuppliers();
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
    return this.purchasesService.getSupplier(+id);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  createSupplier(@Body() data: any) {
    return this.purchasesService.createSupplier(data);
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  updateSupplier(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateSupplier(+id, data);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  deleteSupplier(@Param('id') id: string) {
    return this.purchasesService.deleteSupplier(+id);
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  getAllOrders(@Query() query: any) {
    return this.purchasesService.getAllOrders({
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
    return this.purchasesService.getOrder(+id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a purchase order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  createOrder(@Body() data: any) {
    return this.purchasesService.createOrder(data);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  updateOrder(@Param('id') id: string, @Body() data: any) {
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
    return this.purchasesService.getOrderItems(+id);
  }

  // Supplier Payments
  @Post('suppliers/:id/payments')
  @ApiOperation({ summary: 'Add a supplier payment' })
  @ApiResponse({ status: 201, description: 'Payment added' })
  addPayment(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.addPayment({ supplier_id: +id, ...data });
  }

  @Get('suppliers/:id/payments')
  @ApiOperation({ summary: 'Get supplier payments' })
  @ApiResponse({ status: 200, description: 'Returns supplier payments' })
  getSupplierPayments(@Param('id') id: string) {
    return this.purchasesService.getSupplierPayments(+id);
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
    return this.purchasesService.getAllReturns();
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get a purchase return by ID' })
  @ApiResponse({ status: 200, description: 'Returns the return record' })
  getReturn(@Param('id') id: string) {
    return this.purchasesService.getReturn(+id);
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create a purchase return' })
  @ApiResponse({ status: 201, description: 'Return created' })
  createReturn(@Body() data: any) {
    return this.purchasesService.createReturn(data);
  }

  // ==================== CURRENCY MANAGEMENT ====================

  @Get('currencies')
  @ApiOperation({ summary: 'Get active currencies' })
  @ApiResponse({ status: 200, description: 'Returns active currencies' })
  getCurrencies() {
    return this.purchasesService.getCurrencies();
  }

  @Get('currencies/all')
  @ApiOperation({ summary: 'Get all currencies' })
  @ApiResponse({ status: 200, description: 'Returns all currencies' })
  getAllCurrencies() {
    return this.purchasesService.getAllCurrencies();
  }

  @Post('currencies')
  @ApiOperation({ summary: 'Create a currency' })
  @ApiResponse({ status: 201, description: 'Currency created' })
  createCurrency(@Body() data: any) {
    return this.purchasesService.createCurrency(data);
  }

  @Put('currencies/:id')
  @ApiOperation({ summary: 'Update a currency' })
  @ApiResponse({ status: 200, description: 'Currency updated' })
  updateCurrency(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateCurrency(+id, data);
  }

  @Delete('currencies/:id')
  @ApiOperation({ summary: 'Delete a currency' })
  @ApiResponse({ status: 200, description: 'Currency deleted' })
  deleteCurrency(@Param('id') id: string) {
    return this.purchasesService.deleteCurrency(+id);
  }

  // ==================== FX RATES ====================

  @Get('fx-rates')
  @ApiOperation({ summary: 'Get FX rates' })
  @ApiResponse({ status: 200, description: 'Returns FX rates' })
  getFxRates(@Query('currency_id') currencyId?: string) {
    return this.purchasesService.getFxRates(
      currencyId ? +currencyId : undefined,
    );
  }

  @Post('fx-rates')
  @ApiOperation({ summary: 'Add an FX rate' })
  @ApiResponse({ status: 201, description: 'FX rate added' })
  addFxRate(@Body() data: any) {
    return this.purchasesService.addFxRate(data);
  }

  @Get('fx-rates/weighted-average/:currencyId')
  @ApiOperation({ summary: 'Calculate weighted average FX rate' })
  @ApiResponse({ status: 200, description: 'Returns weighted average' })
  weightedAverageFx(@Param('currencyId') currencyId: string) {
    return this.purchasesService.calculateWeightedAverageFx(+currencyId);
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
  updateLandedCost(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateLandedCost(+id, data);
  }

  // ==================== CONTAINERS ====================

  @Get('containers')
  @ApiOperation({ summary: 'Get all containers' })
  @ApiResponse({ status: 200, description: 'Returns all containers' })
  getContainers() {
    return this.purchasesService.getContainers();
  }

  @Get('containers/:id')
  @ApiOperation({ summary: 'Get a container by ID' })
  @ApiResponse({ status: 200, description: 'Returns the container' })
  getContainer(@Param('id') id: string) {
    return this.purchasesService.getContainer(+id);
  }

  @Post('containers')
  @ApiOperation({ summary: 'Create a container' })
  @ApiResponse({ status: 201, description: 'Container created' })
  createContainer(@Body() data: any) {
    return this.purchasesService.createContainer(data);
  }

  @Put('containers/:id')
  @ApiOperation({ summary: 'Update a container' })
  @ApiResponse({ status: 200, description: 'Container updated' })
  updateContainer(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateContainer(+id, data);
  }

  @Delete('containers/:id')
  @ApiOperation({ summary: 'Delete a container' })
  @ApiResponse({ status: 200, description: 'Container deleted' })
  deleteContainer(@Param('id') id: string) {
    return this.purchasesService.deleteContainer(+id);
  }

  // ==================== CBM CALCULATION ====================

  @Get('cbm')
  @ApiOperation({ summary: 'Calculate CBM for cartons' })
  @ApiResponse({ status: 200, description: 'Returns CBM calculation' })
  calculateCBM(
    @Query('length') length: string,
    @Query('width') width: string,
    @Query('height') height: string,
    @Query('cartons') cartons: string,
  ) {
    return this.purchasesService.calculateCBM(
      +length,
      +width,
      +height,
      +cartons,
    );
  }

  // ==================== PACKING LIST ====================

  @Get('orders/:id/packing-list')
  @ApiOperation({ summary: 'Get packing list for an order' })
  @ApiResponse({ status: 200, description: 'Returns packing list' })
  getPackingList(@Param('id') id: string) {
    return this.purchasesService.getPackingList(+id);
  }

  @Post('orders/:id/packing-list')
  @ApiOperation({ summary: 'Create or update packing list' })
  @ApiResponse({ status: 200, description: 'Packing list saved' })
  createOrUpdatePackingList(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.createOrUpdatePackingList(+id, data);
  }

  // ==================== SMART REORDER ALERTS ====================

  @Get('reorder-suggestions/:containerId')
  @ApiOperation({ summary: 'Get reorder suggestions' })
  @ApiResponse({ status: 200, description: 'Returns reorder suggestions' })
  getReorderSuggestions(@Param('containerId') containerId: string) {
    return this.purchasesService.getReorderSuggestions(+containerId);
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
