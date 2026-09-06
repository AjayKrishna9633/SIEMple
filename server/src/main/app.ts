import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { SetupController } from '../interfaces/http/controllers/SetupController';
import { createSetupRouter } from '../interfaces/http/routes/setup.routes';

export interface AppDependencies {
    setupController: SetupController;
}

export function createApp(deps: AppDependencies): Express {
    const app = express();
    app.use(cors());
    app.use(helmet());
    app.use(morgan('dev'));
    app.use(express.json());

    app.use('/api/setup', createSetupRouter(deps.setupController));

    return app;
}
