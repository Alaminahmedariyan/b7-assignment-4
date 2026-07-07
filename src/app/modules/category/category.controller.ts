import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { categoryService } from "./category.service";

const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await categoryService.createCategoryIntoDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Category created successfully.",
      data: result,
    });
  }
);

export const categoryController = {
  createCategory,
};