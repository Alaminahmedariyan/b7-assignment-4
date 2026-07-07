import { StatusCodes } from "http-status-codes";

import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/appError";

import {
  CreateCategoryPayload,
} from "./category.interface";

const createCategoryIntoDB = async (
  payload: CreateCategoryPayload
) => {
  const { name, slug, description, parentId } = payload;

  // Check duplicate category name
  const isCategoryNameExists = await prisma.category.findUnique({
    where: {
      name,
    },
  });

  if (isCategoryNameExists) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Category name already exists."
    );
  }

  // Check duplicate slug
  const isSlugExists = await prisma.category.findUnique({
    where: {
      slug,
    },
  });

  if (isSlugExists) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Category slug already exists."
    );
  }

  // Validate parent category
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!parentCategory) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Parent category not found."
      );
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      parentId,
    },
  });

  return category;
};

export const categoryService = {
  createCategoryIntoDB,
};