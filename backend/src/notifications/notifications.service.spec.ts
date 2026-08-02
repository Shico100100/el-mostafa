import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Not, Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { MachineMaintenance, MaintenanceStatus } from '../manufacturing/entities/machine-maintenance.entity';
import { SalesOrder, OrderStatus } from '../sales/entities/sales-order.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: Repository<Notification>;
  let productRepo: Repository<Product>;
  let stockRepo: Repository<Stock>;
  let maintenanceRepo: Repository<MachineMaintenance>;
  let salesOrderRepo: Repository<SalesOrder>;
  let gateway: NotificationsGateway;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), count: jest.fn(), update: jest.fn() } },
        { provide: getRepositoryToken(Product), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Stock), useValue: {} },
        { provide: getRepositoryToken(MachineMaintenance), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(SalesOrder), useValue: { find: jest.fn() } },
        { provide: NotificationsGateway, useValue: { emitNotification: jest.fn() } },
        { provide: DataSource, useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepo = module.get(getRepositoryToken(Notification));
    productRepo = module.get(getRepositoryToken(Product));
    maintenanceRepo = module.get(getRepositoryToken(MachineMaintenance));
    salesOrderRepo = module.get(getRepositoryToken(SalesOrder));
    gateway = module.get(NotificationsGateway);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and emit a notification', async () => {
      const saved = { id: 1, title: 'Test', message: 'Hello' };
      (notificationRepo.create as jest.Mock).mockReturnValue(saved);
      (notificationRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.create('Test', 'Hello', 1, 'info', { key: 'val' });

      expect(notificationRepo.create).toHaveBeenCalledWith({ title: 'Test', message: 'Hello', userId: 1, actionType: 'info', actionData: { key: 'val' } });
      expect(notificationRepo.save).toHaveBeenCalledWith(saved);
      expect(gateway.emitNotification).toHaveBeenCalledWith(saved);
      expect(result).toEqual(saved);
    });
  });

  describe('findAll', () => {
    it('should return last 20 notifications', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      (notificationRepo.find as jest.Mock).mockResolvedValue(items);

      const result = await service.findAll();

      expect(notificationRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' }, take: 20 });
      expect(result).toEqual(items);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread', async () => {
      (notificationRepo.count as jest.Mock).mockResolvedValue(5);
      expect(await service.getUnreadCount()).toBe(5);
      expect(notificationRepo.count).toHaveBeenCalledWith({ where: { isRead: false } });
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true', async () => {
      (notificationRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });
      await service.markAsRead(3);
      expect(notificationRepo.update).toHaveBeenCalledWith(3, { isRead: true });
    });
  });

  describe('runSystemChecks', () => {
    it('should run all checks', async () => {
      const checkLowStock = jest.spyOn(service as any, 'checkLowStock').mockResolvedValue(undefined);
      const checkUpcoming = jest.spyOn(service as any, 'checkUpcomingMaintenance').mockResolvedValue(undefined);
      const checkOverdue = jest.spyOn(service as any, 'checkOverdueSalesOrders').mockResolvedValue(undefined);

      await service.runSystemChecks();

      expect(checkLowStock).toHaveBeenCalled();
      expect(checkUpcoming).toHaveBeenCalled();
      expect(checkOverdue).toHaveBeenCalled();
    });
  });

  describe('checkLowStock', () => {
    it('should create notification when stock is below min_stock', async () => {
      (productRepo.find as jest.Mock).mockResolvedValue([{ id: 1, name: 'Pipe 50', min_stock: 10, unit: 'pieces' }]);
      (dataSource.query as jest.Mock).mockResolvedValue([{ total: 3 }]);
      (notificationRepo.findOne as jest.Mock).mockResolvedValue(null);
      jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await (service as any).checkLowStock();

      expect(service.create).toHaveBeenCalledWith('تنبيه نقص مخزون', expect.stringContaining('Pipe 50'));
    });

    it('should skip when stock is above min_stock', async () => {
      (productRepo.find as jest.Mock).mockResolvedValue([{ id: 1, name: 'Pipe 50', min_stock: 10, unit: 'pieces' }]);
      (dataSource.query as jest.Mock).mockResolvedValue([{ total: 50 }]);
      jest.spyOn(service, 'create');

      await (service as any).checkLowStock();

      expect(service.create).not.toHaveBeenCalled();
    });

    it('should skip when notification already exists', async () => {
      (productRepo.find as jest.Mock).mockResolvedValue([{ id: 1, name: 'Pipe 50', min_stock: 10, unit: 'pieces' }]);
      (dataSource.query as jest.Mock).mockResolvedValue([{ total: 3 }]);
      (notificationRepo.findOne as jest.Mock).mockResolvedValue({ id: 99 });
      jest.spyOn(service, 'create');

      await (service as any).checkLowStock();

      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('checkUpcomingMaintenance', () => {
    it('should create notification for upcoming maintenance', async () => {
      const mockEntry = { id: 1, date: new Date(), machine: { name: 'Machine A' }, status: 'PENDING' };
      (maintenanceRepo.find as jest.Mock).mockResolvedValue([mockEntry]);
      (notificationRepo.findOne as jest.Mock).mockResolvedValue(null);
      jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await (service as any).checkUpcomingMaintenance();

      expect(maintenanceRepo.find).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledWith('تنبيه صيانة قريبة', expect.stringContaining('Machine A'));
    });
  });

  describe('checkOverdueSalesOrders', () => {
    it('should create notification for overdue orders', async () => {
      const mockOrder = { id: 5, customer: { name: 'Client X' }, status: 'PENDING' };
      (salesOrderRepo.find as jest.Mock).mockResolvedValue([mockOrder]);
      (notificationRepo.findOne as jest.Mock).mockResolvedValue(null);
      jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await (service as any).checkOverdueSalesOrders();

      expect(salesOrderRepo.find).toHaveBeenCalled();
      expect(service.create).toHaveBeenCalledWith('تنبيه مبيعات متأخرة', expect.stringContaining('#5'));
    });
  });
});
