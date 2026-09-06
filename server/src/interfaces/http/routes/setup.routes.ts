import { Router } from 'express';
import { SetupController } from '../controllers/SetupController';

export function createSetupRouter(setupController: SetupController): Router {
    const router = Router();
    router.get('/status', setupController.getStatus);
    router.post('/admin', setupController.createAdmin);
    return router;
}
