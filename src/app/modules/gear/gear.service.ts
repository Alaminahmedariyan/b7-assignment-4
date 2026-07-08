import { StatusCodes } from "http-status-codes";

import { prisma } from "../../../lib/prisma";

import AppError from "../../errors/appError";

import { CreateGearPayload, GearQuery, UpdateGearPayload } from "./gear.interface";
import { Prisma } from "../../../../generated/prisma/client";
import { gearSearchableFields } from "./gear.constant";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../config/cloudinary";

const createGearIntoDB = async (providerId: string, payload: CreateGearPayload, files: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please upload at least one image.");
  }

  const uploadedImages: {
    url: string;
    publicId: string;
  }[] = await Promise.all(
    files.map(async (file) => {
      const result = await uploadFileToCloudinary(file.buffer, file.originalname);

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }),
  );
  const { name, slug, description, brand, pricePerDay, totalQuantity, specifications, categoryId } = payload;

  // Check duplicate name

  const existingName = await prisma.gearItem.findFirst({
    where: {
      name,
    },
  });

  if (existingName) {
    throw new AppError(StatusCodes.CONFLICT, "Gear name already exists.");
  }

  // Check duplicate slug

  const existingSlug = await prisma.gearItem.findUnique({
    where: {
      slug,
    },
  });

  if (existingSlug) {
    throw new AppError(StatusCodes.CONFLICT, "Gear slug already exists.");
  }

  // category exists

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");
  }

  // provider exists

  const provider = await prisma.user.findUnique({
    where: {
      id: providerId,
    },
  });

  if (!provider) {
    throw new AppError(StatusCodes.NOT_FOUND, "Provider not found.");
  }

  if (provider.role !== "PROVIDER") {
    throw new AppError(StatusCodes.FORBIDDEN, "Only providers can create gear.");
  }

  if (provider.status !== "ACTIVE") {
    throw new AppError(StatusCodes.FORBIDDEN, "Provider account is not active.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create Gear
      const gear = await tx.gearItem.create({
        data: {
          name,
          slug,
          description,
          brand,
          pricePerDay,
          totalQuantity,
          specifications,
          providerId,
          categoryId,
        },
      });

      // Save Images
      await tx.gearImage.createMany({
        data: uploadedImages.map((image, index) => ({
          imageUrl: image.url,
          gearItemId: gear.id,
          isPrimary: index === 0, // First image will be primary
        })),
      });

      // Return gear with images
      const gearWithImages = await tx.gearItem.findUnique({
        where: {
          id: gear.id,
        },
        include: {
          images: true,
          category: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return gearWithImages;
    });

    return result;
  } catch (error) {
    await Promise.all(uploadedImages.map((image) => deleteFileFromCloudinary(image.publicId)));

    throw error;
  }
};

const getAllGearsFromDB = async (query: GearQuery) => {
  const { page = "1", limit = "10", search, category, brand, minPrice, maxPrice, sortBy = "createdAt", sortOrder = "desc" } = query;

  const andConditions: Prisma.GearItemWhereInput[] = [];

  // Search

  if (search) {
    andConditions.push({
      OR: gearSearchableFields.map((field) => ({
        [field]: {
          contains: search,
          mode: "insensitive",
        },
      })),
    });
  }

  // Category

  if (category) {
    andConditions.push({
      categoryId: category,
    });
  }

  // Brand

  if (brand) {
    andConditions.push({
      brand: {
        equals: brand,
        mode: "insensitive",
      },
    });
  }

  // Min Price

  if (minPrice) {
    andConditions.push({
      pricePerDay: {
        gte: Number(minPrice),
      },
    });
  }

  // Max Price

  if (maxPrice) {
    andConditions.push({
      pricePerDay: {
        lte: Number(maxPrice),
      },
    });
  }

  // Listed Only

  andConditions.push({
    isListed: true,
    deletedAt: null,
  });

  const whereConditions: Prisma.GearItemWhereInput = {
    AND: andConditions,
  };

  const data = await prisma.gearItem.findMany({
    where: whereConditions,

    include: {
      category: true,

      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      images: true,

      _count: {
        select: {
          reviews: true,
        },
      },
    },

    skip: (Number(page) - 1) * Number(limit),

    take: Number(limit),

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.gearItem.count({
    where: whereConditions,
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
    data,
  };
};

const getSingleGearFromDB = async (gearId: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
      deletedAt: null,
    },
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      images: true,
      reviews: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  if (!gear) {
    throw new AppError(StatusCodes.NOT_FOUND, "Gear not found.");
  }

  return gear;
};

const updateGearIntoDB = async (providerId: string, gearId: string, payload: UpdateGearPayload) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
    },
  });

  if (!gear) {
    throw new AppError(StatusCodes.NOT_FOUND, "Gear not found.");
  }

  if (gear.providerId !== providerId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can update only your own gear.");
  }

  if (payload.slug) {
    const existingSlug = await prisma.gearItem.findFirst({
      where: {
        slug: payload.slug,
        NOT: {
          id: gearId,
        },
      },
    });

    if (existingSlug) {
      throw new AppError(StatusCodes.CONFLICT, "Gear slug already exists.");
    }
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: payload.categoryId,
      },
    });

    if (!category) {
      throw new AppError(StatusCodes.NOT_FOUND, "Category not found.");
    }
  }

  const updatedGear = await prisma.gearItem.update({
    where: {
      id: gearId,
    },
    data: payload,
  });

  return updatedGear;
};

const deleteGearFromDB = async (providerId: string, gearId: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
    },
  });

  if (!gear) {
    throw new AppError(StatusCodes.NOT_FOUND, "Gear not found.");
  }

  if (gear.providerId !== providerId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can delete only your own gear.");
  }

  await prisma.gearItem.update({
    where: {
      id: gearId,
    },
    data: {
      deletedAt: new Date(),
      isListed: false,
    },
  });

  return null;
};

const checkGearAvailabilityFromDB = async (gearId: string, startDate: string, endDate: string) => {
    
};

export const gearService = {
  createGearIntoDB,
  getAllGearsFromDB,
  getSingleGearFromDB,
  updateGearIntoDB,
  deleteGearFromDB,
  checkGearAvailabilityFromDB,
};
