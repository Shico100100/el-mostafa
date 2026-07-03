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
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager)
export class SalesController {
  constructor(private salesService: SalesService) {}

  // Customers
  @Get('customers')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Returns all customers' })
  getAllCustomers() {
    return this.salesService.getAllCustomers();
  }

  @Get('customers/aging')
  @ApiOperation({ summary: 'Get customer aging report' })
  @ApiResponse({ status: 200, description: 'Returns customer aging data' })
  getCustomerAging() {
    return this.salesService.getCustomerAging();
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Returns the customer' })
  getCustomer(@Param('id') id: string) {
    return this.salesService.getCustomer(+id);
  }

  @Post('customers/:id/payments')
  @ApiOperation({ summary: 'Add a customer payment' })
  @ApiResponse({ status: 201, description: 'Payment added' })
  addPayment(@Param('id') id: string, @Body() data: CreateCustomerPaymentDto) {
    return this.salesService.addPayment({ ...data, customer_id: +id });
  }

  @Get('customers/:id/payments')
  @ApiOperation({ summary: 'Get customer payments' })
  @ApiResponse({ status: 200, description: 'Returns customer payments' })
  getPayments(@Param('id') id: string) {
    return this.salesService.getCustomerPayments(+id);
  }

  @Get('customers/:id/statement')
  @ApiOperation({ summary: 'Get customer statement of account' })
  @ApiResponse({ status: 200, description: 'Returns statement' })
  getStatement(@Param('id') id: string) {
    return this.salesService.getStatementOfAccount(+id);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create a customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  createCustomer(@Body() data: CreateCustomerDto) {
    return this.salesService.createCustomer(data);
  }

  @Put('customers/:id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  updateCustomer(@Param('id') id: string, @Body() data: CreateCustomerDto) {
    return this.salesService.updateCustomer(+id, data);
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  deleteCustomer(@Param('id') id: string) {
    return this.salesService.deleteCustomer(+id);
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'Get all sales orders' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  getAllOrders(@Query() query: any) {
    return this.salesService.getAllOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a sales order by ID' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  getOrder(@Param('id') id: string) {
    return this.salesService.getOrder(+id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a sales order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  createOrder(@Body() data: CreateOrderDto) {
    return this.salesService.createOrder(data);
  }

  @Get('orders/:id/items')
  @ApiOperation({ summary: 'Get order items' })
  @ApiResponse({ status: 200, description: 'Returns order items' })
  getOrderItems(@Param('id') id: string) {
    return this.salesService.getOrderItems(+id);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete a sales order' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  deleteOrder(@Param('id') id: string) {
    return this.salesService.deleteOrder(+id);
  }

  // Quotes
  @Get('quotes')
  @ApiOperation({ summary: 'Get all quotes' })
  @ApiResponse({ status: 200, description: 'Returns all quotes' })
  getAllQuotes() {
    return this.salesService.getAllQuotes();
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  @ApiResponse({ status: 200, description: 'Returns the quote' })
  getQuote(@Param('id') id: string) {
    return this.salesService.getQuote(+id);
  }

  @Post('quotes')
  @ApiOperation({ summary: 'Create a quote' })
  @ApiResponse({ status: 201, description: 'Quote created' })
  createQuote(@Body() data: CreateQuoteDto) {
    return this.salesService.createQuote(data);
  }

  @Put('quotes/:id/status')
  @ApiOperation({ summary: 'Update quote status' })
  @ApiResponse({ status: 200, description: 'Quote status updated' })
  updateQuoteStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.salesService.updateQuoteStatus(+id, status as QuoteStatus);
  }

  @Post('quotes/:id/convert')
  @ApiOperation({ summary: 'Convert quote to order' })
  @ApiResponse({ status: 201, description: 'Order created from quote' })
  convertToOrder(@Param('id') id: string) {
    return this.salesService.convertToOrder(+id);
  }

  @Delete('quotes/:id')
  @ApiOperation({ summary: 'Delete a quote' })
  @ApiResponse({ status: 200, description: 'Quote deleted' })
  deleteQuote(@Param('id') id: string) {
    return this.salesService.deleteQuote(+id);
  }

  // Returns
  @Get('returns')
  @ApiOperation({ summary: 'Get all sales returns' })
  @ApiResponse({ status: 200, description: 'Returns all returns' })
  getAllReturns() {
    return this.salesService.getAllReturns();
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get a sales return by ID' })
  @ApiResponse({ status: 200, description: 'Returns the return record' })
  getReturn(@Param('id') id: string) {
    return this.salesService.getReturn(+id);
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create a sales return' })
  @ApiResponse({ status: 201, description: 'Return created' })
  createReturn(@Body() data: CreateSalesReturnDto) {
    return this.salesService.createReturn(data);
  }

  // Excel Exports
  @Get('export/orders')
  @ApiOperation({ summary: 'Export sales orders to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
  @ApiOperation({ summary: 'Export customers to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
