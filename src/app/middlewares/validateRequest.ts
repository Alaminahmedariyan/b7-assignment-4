import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);

      next();
    } catch (error) {
      next(error);
    }
  };
};