import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: env.databaseUrl,
    ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: true } : false,
    synchronize: false,
    logging: env.nodeEnv === 'development',
    entities: [__dirname + '/entities/*{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
