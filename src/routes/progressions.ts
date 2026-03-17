import type { Request, Response } from 'express';
import { Router } from 'express';

import { prisma } from '../lib/prisma';
import type { CreateProgressionRequest, UpdateProgressionRequest } from '../types/progression';

const router = Router();

// temp placeholder until auth is added
const DEMO_USER_ID = 'demo-user-id';

// POST /api/progressions - Create a new progression
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      chords,
      feel,
      scale,
      notes,
      tags = [],
      isPublic = false,
    } = req.body as CreateProgressionRequest;

    if (!title || !chords) {
      res.status(400).json({ message: 'Title and chords are required' });
      return;
    }

    const progression = await prisma.progression.create({
      data: {
        title,
        chords,
        feel,
        scale,
        notes,
        tags,
        isPublic,
        userId: DEMO_USER_ID,
      },
    });

    res.status(201).json(progression);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save progression', error });
  }
});

// GET /api/progressions - List user's progressions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const progressions = await prisma.progression.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(progressions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch progressions', error });
  }
});

// GET /api/progressions/:id - Get a specific progression
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const progression = await prisma.progression.findFirst({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
    });

    if (!progression) {
      res.status(404).json({ message: 'Progression not found' });
      return;
    }

    res.json(progression);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch progression', error });
  }
});

// PUT /api/progressions/:id - Update a progression
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, chords, feel, scale, notes, tags, isPublic } = req.body as UpdateProgressionRequest;

    const progression = await prisma.progression.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(chords !== undefined && { chords }),
        ...(feel !== undefined && { feel }),
        ...(scale !== undefined && { scale }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json(progression);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update progression', error });
  }
});

// DELETE /api/progressions/:id - Delete a progression
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.progression.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete progression', error });
  }
});

export default router;
