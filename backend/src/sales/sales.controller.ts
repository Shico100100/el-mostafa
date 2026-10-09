import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Request } from 'express';
import { SalesService } from './sales.service';
import { CustomerService } from './customers/customer.service';
import { SalesOrderService } from './sales-orders/sales-order.service';
import { CustomerPaymentService } from './customer-payments/customer-payment.service';
import { SalesReturnService } from './sales-returns/sales-return.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import {
  CreateOrderDto,
  UpdateOrderDto,
  CreateCustomerDto,
  CreateCustomerPaymentDto,
  CreateSalesReturnDto,
} from './dto';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager)
export class SalesController {
  constructor(
    private salesService: SalesService,
    private customerService: CustomerService,
    private salesOrderService: SalesOrderService,
    private customerPaymentService: CustomerPaymentService,
    private salesReturnService: SalesReturnService,
  ) {}

  // Customers
  @Get('customers')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Returns all customers' })
  getAllCustomers() {
    return this.customerService.getAllCustomers();
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
    return this.customerService.getCustomer(+id);
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
    return this.customerPaymentService.getCustomerPayments(+id);
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
    return this.customerService.createCustomer(data);
  }

  @Put('customers/:id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  updateCustomer(@Param('id') id: string, @Body() data: CreateCustomerDto) {
    return this.customerService.updateCustomer(+id, data);
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  deleteCustomer(@Param('id') id: string) {
    return this.customerService.deleteCustomer(+id);
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'Get all sales orders' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  getAllOrders(@Query() query: any) {
    return this.salesOrderService.getAllOrders(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a sales order by ID' })
  @ApiResponse({ status: 200, description: 'Returns the order' })
  getOrder(@Param('id') id: string) {
    return this.salesOrderService.getOrder(+id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a sales order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  createOrder(@Body() data: CreateOrderDto, @Req() req: Request) {
    const user = req.user as { id?: number };
    return this.salesService.createOrder(data, user?.id);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Update a sales order (full line replacement)' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  updateOrder(
    @Param('id') id: string,
    @Body() data: UpdateOrderDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id?: number };
    return this.salesService.updateOrder(+id, data, user?.id);
  }

  @Get('orders/:id/items')
  @ApiOperation({ summary: 'Get order items' })
  @ApiResponse({ status: 200, description: 'Returns order items' })
  getOrderItems(@Param('id') id: string) {
    return this.salesOrderService.getOrderItems(+id);
  }

  @Get('orders/:id/payments')
  @ApiOperation({ summary: 'Get payments linked to an order' })
  @ApiResponse({ status: 200, description: 'Returns order payments' })
  getOrderPayments(@Param('id') id: string) {
    return this.salesService.getOrderPayments(+id);
  }

  @Get('orders/:id/payment-summary')
  @ApiOperation({ summary: 'Get paid/remaining summary for an order' })
  @ApiResponse({ status: 200, description: 'Returns payment summary' })
  getOrderPaymentSummary(@Param('id') id: string) {
    return this.salesService.getOrderPaymentSummary(+id);
  }

  @Post('orders/:id/deliver')
  @ApiOperation({ summary: 'Mark a sales order as delivered' })
  @ApiResponse({ status: 200, description: 'Order marked delivered' })
  deliverOrder(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id?: number };
    return this.salesService.deliverOrder(+id, user?.id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a sales order (restores stock)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  cancelOrder(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id?: number };
    return this.salesService.cancelOrder(+id, user?.id);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete a sales order' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  deleteOrder(@Param('id') id: string) {
    return this.salesService.deleteOrder(+id);
  }

  // Returns
  @Get('returns')
  @ApiOperation({ summary: 'Get all sales returns' })
  @ApiResponse({ status: 200, description: 'Returns all returns' })
  getAllReturns() {
    return this.salesReturnService.getAllReturns();
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get a sales return by ID' })
  @ApiResponse({ status: 200, description: 'Returns the return record' })
  getReturn(@Param('id') id: string) {
    return this.salesReturnService.getReturn(+id);
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
    const buffer = await this.salesOrderService.exportOrdersToExcel();
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
    const buffer = await this.customerService.exportCustomersToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=customers.xlsx',
    });
    res.send(buffer);
  }
}
