import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import { prisma } from "../../../lib/prisma";

import AppError from "../../errors/appError";

import { CreateGearPayload, GearQuery, UpdateGearPayload } from "./gear.interface";
import { OrderStatus, Prisma } from "../../../../generated/prisma/client";
import { gearSearchableFields } from "./gear.constant";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../config/cloudinary";

const createGearIntoDB = async (
  providerId: string,
  payload: CreateGearPayload,
  files: Express.Multer.File[] = []
) => {
  // Upload images (optional)
  const uploadedImages: {
    url: string;
    publicId: string;
  }[] =
    files.length > 0
      ? await Promise.all(
          files.map(async (file) => {
            const result = await uploadFileToCloudinary(
              file.buffer,
              file.originalname
            );

            return {
              url: result.secure_url,
              publicId: result.public_id,
            };
          })
        )
      : [];

  const {
    name,
    description,
    brand,
    pricePerDay,
    totalQuantity,
    specifications,
    categoryId,
  } = payload;

  // Auto Generate Slug
  const slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Duplicate Name Check
  const existingName =
    await prisma.gearItem.findFirst({
      where: {
        name,
      },
    });

  if (existingName) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Gear name already exists."
    );
  }

  // Duplicate Slug Check
  const existingSlug =
    await prisma.gearItem.findUnique({
      where: {
        slug,
      },
    });

  if (existingSlug) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Gear slug already exists."
    );
  }

  // Category Check
  const category =
    await prisma.category.findUnique({
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

  // Provider Check
  const provider =
    await prisma.user.findUnique({
      where: {
        id: providerId,
      },
    });

  if (!provider) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Provider not found."
    );
  }

  if (provider.role !== "PROVIDER") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only providers can create gear."
    );
  }

  if (provider.status !== "ACTIVE") {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Provider account is not active."
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Create Gear
        const gear =
          await tx.gearItem.create({
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

        // Save Images (Only if uploaded)
        if (uploadedImages.length > 0) {
          await tx.gearImage.createMany({
            data: uploadedImages.map(
              (image, index) => ({
                imageUrl: image.url,
                gearItemId: gear.id,
                isPrimary: index === 0,
              })
            ),
          });
        }

        return tx.gearItem.findUnique({
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
      }
    );

    return result;
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map((image) =>
          deleteFileFromCloudinary(
            image.publicId
          )
        )
      );
    }

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

const updateGearIntoDB = async (
  providerId: string,
  gearId: string,
  payload: UpdateGearPayload
) => {
  // Find Gear
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
      deletedAt: null,
    },
  });

  if (!gear) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Gear not found."
    );
  }

  // Ownership Check
  if (gear.providerId !== providerId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can update only your own gear."
    );
  }

  // Duplicate Name Check
  if (payload.name) {
    const existingName =
      await prisma.gearItem.findFirst({
        where: {
          name: payload.name,
          NOT: {
            id: gearId,
          },
        },
      });

    if (existingName) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Gear name already exists."
      );
    }
  }

  // Category Check
  if (payload.categoryId) {
    const category =
      await prisma.category.findUnique({
        where: {
          id: payload.categoryId,
        },
      });

    if (!category) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Category not found."
      );
    }
  }

  // Update Data
  const updateData: Prisma.GearItemUpdateInput = {
    ...payload,
  };

  // Auto Slug Generate
  if (payload.name) {
    const slug = slugify(payload.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const existingSlug =
      await prisma.gearItem.findFirst({
        where: {
          slug,
          NOT: {
            id: gearId,
          },
        },
      });

    if (existingSlug) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Gear slug already exists."
      );
    }

    updateData.slug = slug;
  }

  const updatedGear =
    await prisma.gearItem.update({
      where: {
        id: gearId,
      },

      data: updateData,

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

const checkGearAvailabilityFromDB = async (
  gearId: string,
  startDate: string,
  endDate: string
) => {
  if (!startDate || !endDate) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Start date and end date are required."
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Start date cannot be after end date."
    );
  }

  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
      deletedAt: null,
    },
  });

  if (!gear) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Gear not found."
    );
  }

const bookedResult =
  await prisma.rentalOrderItem.aggregate({
    where: {
      gearItemId: gearId,

      rentalOrder: {
        status: {
          in: [
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PLACED,
          ],
        },
      },

      startDate: {
        lte: end,
      },

      endDate: {
        gte: start,
      },
    },

    _sum: {
      quantity: true,
    },
  });

  const bookedQuantity =
    bookedResult._sum.quantity ?? 0;

  const availableQuantity = Math.max(
    0,
    gear.totalQuantity - bookedQuantity
  );

  return {
    gearId: gear.id,
    totalQuantity: gear.totalQuantity,
    bookedQuantity,
    availableQuantity,
    isAvailable: availableQuantity > 0,
  };
};

export const gearService = {
  createGearIntoDB,
  getAllGearsFromDB,
  getSingleGearFromDB,
  updateGearIntoDB,
  deleteGearFromDB,
  checkGearAvailabilityFromDB,
};
