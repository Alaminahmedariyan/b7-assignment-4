import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";

import { ItemRentalStatus } from "../../../../generated/prisma/enums";

const createReviewIntoDB = async (
  customerId: string,
  payload: {
    rating: number;
    comment?: string;
    rentalOrderItemId: string;
  }
) => {
  const rentalItem =
    await prisma.rentalOrderItem.findUnique({
      where: {
        id: payload.rentalOrderItemId,
      },

      include: {
        rentalOrder: true,
      },
    });

  if (!rentalItem) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Rental item not found."
    );
  }

  if (
    rentalItem.rentalOrder.customerId !== customerId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You cannot review this rental."
    );
  }

  if (
    rentalItem.status !==
    ItemRentalStatus.RETURNED
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Review is allowed only after returning the gear."
    );
  }

  const alreadyReviewed =
    await prisma.review.findUnique({
      where: {
        rentalOrderItemId:
          payload.rentalOrderItemId,
      },
    });

  if (alreadyReviewed) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Review already submitted."
    );
  }

  return prisma.review.create({
    data: {
      rating: payload.rating,
      comment: payload.comment,

      customerId,

      gearItemId: rentalItem.gearItemId,

      rentalOrderItemId:
        payload.rentalOrderItemId,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },

      gearItem: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const getGearReviewsFromDB = async (
  gearItemId: string
) => {
  const reviews =
    await prisma.review.findMany({
      where: {
        gearItemId,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const aggregate =
    await prisma.review.aggregate({
      where: {
        gearItemId,
      },

      _avg: {
        rating: true,
      },

      _count: {
        rating: true,
      },
    });

  return {
    averageRating:
      aggregate._avg.rating ?? 0,

    totalReviews:
      aggregate._count.rating,

    reviews,
  };
};

export const reviewService = {
  createReviewIntoDB,
  getGearReviewsFromDB,
};