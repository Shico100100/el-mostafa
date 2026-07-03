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
  getAllSuppliers() {
    return this.purchasesService.getAllSuppliers();
  }

  @Get('suppliers/aging')
  getSupplierAging() {
    return this.purchasesService.getSupplierAging();
  }

  @Get('suppliers/:id')
  getSupplier(@Param('id') id: string) {
    return this.purchasesService.getSupplier(+id);
  }

  @Post('suppliers')
  createSupplier(@Body() data: any) {
    return this.purchasesService.createSupplier(data);
  }

  @Put('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateSupplier(+id, data);
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.purchasesService.deleteSupplier(+id);
  }

  // Orders
  @Get('orders')
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
  getOrder(@Param('id') id: string) {
    return this.purchasesService.getOrder(+id);
  }

  @Post('orders')
  createOrder(@Body() data: any) {
    return this.purchasesService.createOrder(data);
  }

  @Put('orders/:id')
  updateOrder(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateOrder(+id, data);
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.purchasesService.deleteOrder(+id);
  }

  @Get('orders/:id/items')
  getOrderItems(@Param('id') id: string) {
    return this.purchasesService.getOrderItems(+id);
  }

  // Supplier Payments
  @Post('suppliers/:id/payments')
  addPayment(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.addPayment({ supplier_id: +id, ...data });
  }

  @Get('suppliers/:id/payments')
  getSupplierPayments(@Param('id') id: string) {
    return this.purchasesService.getSupplierPayments(+id);
  }

  @Get('suppliers/:id/statement')
  getStatement(@Param('id') id: string) {
    return this.purchasesService.getStatementOfAccount(+id);
  }

  @Get('suppliers/:id/balance')
  getSupplierBalance(@Param('id') id: string) {
    return this.purchasesService.getSupplierBalance(+id);
  }

  // Returns
  @Get('returns')
  getAllReturns() {
    return this.purchasesService.getAllReturns();
  }

  @Get('returns/:id')
  getReturn(@Param('id') id: string) {
    return this.purchasesService.getReturn(+id);
  }

  @Post('returns')
  createReturn(@Body() data: any) {
    return this.purchasesService.createReturn(data);
  }

  // ==================== CURRENCY MANAGEMENT ====================

  @Get('currencies')
  getCurrencies() {
    return this.purchasesService.getCurrencies();
  }

  @Get('currencies/all')
  getAllCurrencies() {
    return this.purchasesService.getAllCurrencies();
  }

  @Post('currencies')
  createCurrency(@Body() data: any) {
    return this.purchasesService.createCurrency(data);
  }

  @Put('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateCurrency(+id, data);
  }

  @Delete('currencies/:id')
  deleteCurrency(@Param('id') id: string) {
    return this.purchasesService.deleteCurrency(+id);
  }

  // ==================== FX RATES ====================

  @Get('fx-rates')
  getFxRates(@Query('currency_id') currencyId?: string) {
    return this.purchasesService.getFxRates(
      currencyId ? +currencyId : undefined,
    );
  }

  @Post('fx-rates')
  addFxRate(@Body() data: any) {
    return this.purchasesService.addFxRate(data);
  }

  @Get('fx-rates/weighted-average/:currencyId')
  weightedAverageFx(@Param('currencyId') currencyId: string) {
    return this.purchasesService.calculateWeightedAverageFx(+currencyId);
  }

  // ==================== LANDED COST ====================

  @Get('orders/:id/landed-cost')
  getLandedCost(@Param('id') id: string) {
    return this.purchasesService.calculateLandedCost(+id);
  }

  @Put('orders/:id/landed-cost')
  updateLandedCost(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateLandedCost(+id, data);
  }

  // ==================== CONTAINERS ====================

  @Get('containers')
  getContainers() {
    return this.purchasesService.getContainers();
  }

  @Get('containers/:id')
  getContainer(@Param('id') id: string) {
    return this.purchasesService.getContainer(+id);
  }

  @Post('containers')
  createContainer(@Body() data: any) {
    return this.purchasesService.createContainer(data);
  }

  @Put('containers/:id')
  updateContainer(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.updateContainer(+id, data);
  }

  @Delete('containers/:id')
  deleteContainer(@Param('id') id: string) {
    return this.purchasesService.deleteContainer(+id);
  }

  // ==================== CBM CALCULATION ====================

  @Get('cbm')
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
  getPackingList(@Param('id') id: string) {
    return this.purchasesService.getPackingList(+id);
  }

  @Post('orders/:id/packing-list')
  createOrUpdatePackingList(@Param('id') id: string, @Body() data: any) {
    return this.purchasesService.createOrUpdatePackingList(+id, data);
  }

  // ==================== SMART REORDER ALERTS ====================

  @Get('reorder-suggestions/:containerId')
  getReorderSuggestions(@Param('containerId') containerId: string) {
    return this.purchasesService.getReorderSuggestions(+containerId);
  }

  @Get('products/latest-prices/batch')
  getLatestPurchasePrices(@Query('ids') ids: string) {
    const productIds = ids
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    return this.purchasesService.getLatestPurchasePrices(productIds);
  }

  @Get('products/:id/latest-price')
  getLatestPurchasePrice(@Param('id') id: string) {
    return this.purchasesService.getLatestPurchasePrice(+id);
  }
}
