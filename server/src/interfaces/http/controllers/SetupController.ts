import type { Request, Response } from 'express';
import { GetSetupStatus } from '../../../application/use-cases/GetSetupStatus';
import { CreateInitialAdmin } from '../../../application/use-cases/CreateInitialAdmin';

export class SetupController {
    constructor(
        private readonly getSetupStatus: GetSetupStatus,
        private readonly createInitialAdmin: CreateInitialAdmin,
    ) {}

    getStatus = async (_req: Request, res: Response): Promise<void> => {
        const status = await this.getSetupStatus.execute();
        res.status(200).json(status);
    };

    createAdmin = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, username, password } = req.body;
            const admin = await this.createInitialAdmin.execute({ email, username, password });
            res.status(201).json({
                id: admin.getId(),
                email: admin.getEmail(),
                username: admin.getUsername(),
                role: admin.getRole(),
            });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };
}
