import { Router, type RequestHandler } from 'express';
import { UserController } from '../controllers/UserController';
import { requireRole } from '../middlewares/requireRole';

export function createUserRouter(
    userController: UserController,
    requireAuth: RequestHandler,
): Router {
    const router = Router();

    // Every route on this router is admin-only.
    router.use(requireAuth, requireRole('admin'));

    router.get('/', userController.list);
    router.get('/stats', userController.stats);
    router.get('/emergency-requests', userController.listEmergencyRequests);
    router.post('/emergency-requests/:id/decision', userController.decideEmergencyRequest);
    router.get('/access-requests', userController.listAccessRequests);
    router.post('/access-requests/:id/decision', userController.decideAccessRequest);
    router.post('/invite', userController.invite);
    router.patch('/:id', userController.update);
    router.post('/:id/status', userController.setStatus);
    router.post('/:id/resend-invite', userController.resendInvite);

    return router;
}
