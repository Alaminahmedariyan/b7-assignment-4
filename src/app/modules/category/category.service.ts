import { StatusCodes } from "http-status-codes";

import { prisma } from "../../../lib/prisma";
import AppError from "../../errors/appError";

import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
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

const getAllCategoriesFromDB = async () => {
  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

const getSingleCategoryFromDB = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },

    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Category not found."
    );
  }

  return category;
};

const updateCategoryIntoDB = async (
  categoryId: string,
  payload: UpdateCategoryPayload
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Category not found."
    );
  }

  const { name, slug, parentId } = payload;

  // Duplicate name check
  if (name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        NOT: {
          id: categoryId,
        },
      },
    });

    if (existingCategory) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Category name already exists."
      );
    }
  }

  // Duplicate slug check
  if (slug) {
    const existingSlug = await prisma.category.findFirst({
      where: {
        slug,
        NOT: {
          id: categoryId,
        },
      },
    });

    if (existingSlug) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Category slug already exists."
      );
    }
  }

  // Cannot set itself as parent
  if (parentId === categoryId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A category cannot be its own parent."
    );
  }

  // Parent category exists
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

  const updatedCategory = await prisma.category.update({
    where: {
      id: categoryId,
    },
    data: payload,
  });

  return updatedCategory;
};

const deleteCategoryFromDB = async (categoryId: string) => {
  // Check category exists
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Category not found."
    );
  }

  // Check child categories
  const childCategory = await prisma.category.findFirst({
    where: {
      parentId: categoryId,
    },
  });

  if (childCategory) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete category because it has child categories."
    );
  }

  // Check gear items
  const gearItem = await prisma.gearItem.findFirst({
    where: {
      categoryId,
    },
  });

  if (gearItem) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete category because it contains gear items."
    );
  }

  await prisma.category.delete({
    where: {
      id: categoryId,
    },
  });

  return null;
};
export const categoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};