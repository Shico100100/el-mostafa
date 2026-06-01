import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    // Ensure admin@admin.com exists
    const existingAdmin = await this.repository.findOne({
      where: { email: 'admin@admin.com' },
    });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('admin123', salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@admin.com',
          password,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }

    // Add a second admin user if not present
    const existingNewAdmin = await this.repository.findOne({
      where: { email: 'newadmin@example.com' },
    });
    if (!existingNewAdmin) {
      const salt2 = await bcrypt.genSalt();
      const password2 = await bcrypt.hash('newadmin123', salt2);
      await this.repository.save(
        this.repository.create({
          firstName: 'New',
          lastName: 'Admin',
          email: 'newadmin@example.com',
          password: password2,
          role: { id: RoleEnum.admin, name: 'Admin' },
          status: { id: StatusEnum.active, name: 'Active' },
        }),
      );
    }

    // Add a regular user if not present
    const userCount = await this.repository.count({
      where: { email: 'john.doe@example.com' },
    });
    if (userCount === 0) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password,
          role: {
            id: RoleEnum.user,
            name: 'User',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }
  }
}
