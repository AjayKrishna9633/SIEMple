import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { SetupController } from '../interfaces/http/controllers/SetupController';
import { AuthController } from '../interfaces/http/controllers/AuthController';
import { createSetupRouter } from '../interfaces/http/routes/setup.routes';
import { createAuthRouter } from '../interfaces/http/routes/auth.routes';
import { env } from '../infrastructure/config/env';

export interface AppDependencies {
    setupController: SetupController;
    authController: AuthController;
}

export function createApp(deps: AppDependencies): Express {
    const app = express();
    app.use(cors({ origin: env.allowedOrigin, credentials: true }));
    app.use(helmet());
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(cookieParser());

    app.use('/api/setup', createSetupRouter(deps.setupController));
    app.use('/api/auth', createAuthRouter(deps.authController));

    return app;
}
