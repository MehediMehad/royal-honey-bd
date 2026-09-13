import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

const validateRequest =
  (schema: z.ZodTypeAny) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        let data = req.body?.data ?? req.body;

        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        await schema.parseAsync(data);
        req.body = data;
        next();
      } catch (err) {
        next(err);
      }
    };

export default validateRequest;

