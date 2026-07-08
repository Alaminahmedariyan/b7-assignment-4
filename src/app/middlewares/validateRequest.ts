import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.body?.data) {
        req.body = JSON.parse(req.body.data);
      }

      const parsedBody = await schema.parseAsync(req.body);

      (req as any).body = parsedBody;

      next();
    } catch (error) {
      next(error);
    }
  };
};