import type { Request, Response } from 'express';
import { Router } from 'express';

import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/shared/:shareId - Get a public shared progression
router.get('/:shareId', async (req: Request, res: Response) => {
  try {
    const progression = await prisma.progression.findFirst({
      where: {
        shareId: req.params.shareId,
        isPublic: true,
      },
    });

    if (!progression) {
      res.status(404).json({ message: 'Shared progression not found' });
      return;
    }

    res.json(progression);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch shared progression', error });
  }
});

export default router;
