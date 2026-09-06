import { createApp } from './app';
import { AppDataSource } from '../infrastructure/database/data-source';
import { env } from '../infrastructure/config/env';
import { buildContainer } from './composition';

AppDataSource.initialize()
    .then(() => {
        console.log('Database connection established');

        const { setupController } = buildContainer(AppDataSource);
        const app = createApp({ setupController });

        const server = app.listen(env.port, () => {
            console.log(`Server listening on port ${env.port}`);
        });

        const shutdown = () => {
            console.log('Shutting down...');
            server.close(() => {
                AppDataSource.destroy().finally(() => process.exit(0));
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
        console.error('Failed to initialize data source:', err);
        process.exit(1);
    });
