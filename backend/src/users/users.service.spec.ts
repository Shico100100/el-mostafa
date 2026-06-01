import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { FilesService } from '../files/files.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: { id: RoleEnum.user },
        status: { id: StatusEnum.active },
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...createUserDto,
      });

      const result = await service.create(createUserDto as any);

      expect(result).toBeDefined();
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.create(createUserDto as any)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
