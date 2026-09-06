import type { DataSource } from 'typeorm';
import { TypeOrmUserRepository } from '../infrastructure/repositories/TypeOrmUserRepository';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { UserEntity } from '../infrastructure/database/entities/User';
import { GetSetupStatus } from '../application/use-cases/GetSetupStatus';
import { CreateInitialAdmin } from '../application/use-cases/CreateInitialAdmin';
import { SetupController } from '../interfaces/http/controllers/SetupController';

export function buildContainer(dataSource: DataSource) {
    const passwordHasher = new BcryptPasswordHasher();
    const userRepository = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));

    const getSetupStatus = new GetSetupStatus(userRepository);
    const createInitialAdmin = new CreateInitialAdmin(userRepository, passwordHasher);
    const setupController = new SetupController(getSetupStatus, createInitialAdmin);

    return { setupController };
}
