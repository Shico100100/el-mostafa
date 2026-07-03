import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateQuoteDto,
  CreateOrderDto,
  CreateCustomerDto,
  CreateCustomerPaymentDto,
  CreateSalesReturnDto,
} from './dto';
import { QuoteStatus } from './entities/quote.entity';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  // Customers
  @Get('customers')
  getAllCustomers() {
    return this.salesService.getAllCustomers();
  }

  @Get('customers/aging')
  getCustomerAging() {
    return this.salesService.getCustomerAging();
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.salesService.getCustomer(+id);
  }

  @Post('customers/:id/payments')
  addPayment(@Param('id') id: string, @Body() data: CreateCustomerPaymentDto) {
    return this.salesService.addPayment({ ...data, customer_id: +id });
  }

  @Get('customers/:id/payments')
  getPayments(@Param('id') id: string) {
    return this.salesService.getCustomerPayments(+id);
  }

  @Get('customers/:id/statement')
  getStatement(@Param('id') id: string) {
    return this.salesService.getStatementOfAccount(+id);
  }

  @Post('customers')
  createCustomer(@Body() data: CreateCustomerDto) {
    return this.salesService.createCustomer(data);
  }

  @Put('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() data: CreateCustomerDto) {
    return this.salesService.updateCustomer(+id, data);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.salesService.deleteCustomer(+id);
  }

  // Orders
  @Get('orders')
  getAllOrders(@Query() query: any) {
    return this.salesService.getAllOrders(query);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.salesService.getOrder(+id);
  }

  @Post('orders')
  createOrder(@Body() data: CreateOrderDto) {
    return this.salesService.createOrder(data);
  }

  @Get('orders/:id/items')
  getOrderItems(@Param('id') id: string) {
    return this.salesService.getOrderItems(+id);
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.salesService.deleteOrder(+id);
  }

  // Quotes
  @Get('quotes')
  getAllQuotes() {
    return this.salesService.getAllQuotes();
  }

  @Get('quotes/:id')
  getQuote(@Param('id') id: string) {
    return this.salesService.getQuote(+id);
  }

  @Post('quotes')
  createQuote(@Body() data: CreateQuoteDto) {
    return this.salesService.createQuote(data);
  }

  @Put('quotes/:id/status')
  updateQuoteStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.salesService.updateQuoteStatus(+id, status as QuoteStatus);
  }

  @Post('quotes/:id/convert')
  convertToOrder(@Param('id') id: string) {
    return this.salesService.convertToOrder(+id);
  }

  @Delete('quotes/:id')
  deleteQuote(@Param('id') id: string) {
    return this.salesService.deleteQuote(+id);
  }

  // Returns
  @Get('returns')
  getAllReturns() {
    return this.salesService.getAllReturns();
  }

  @Get('returns/:id')
  getReturn(@Param('id') id: string) {
    return this.salesService.getReturn(+id);
  }

  @Post('returns')
  createReturn(@Body() data: CreateSalesReturnDto) {
    return this.salesService.createReturn(data);
  }

  // Excel Exports
  @Get('export/orders')
  async exportOrders(@Res() res: Response) {
    const buffer = await this.salesService.exportOrdersToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=sales-orders.xlsx',
    });
    res.send(buffer);
  }

  @Get('export/customers')
  async exportCustomers(@Res() res: Response) {
    const buffer = await this.salesService.exportCustomersToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=customers.xlsx',
    });
    res.send(buffer);
  }
}
