import { CancelRentalPayload, CreateRentalPayload, ProviderRentalQuery, RentalQuery, UpdateRentalStatusPayload } from "./rental.interface";
import { Prisma } from "../../../../generated/prisma/client";

import { ItemRentalStatus, OrderStatus, PaymentMethod, PaymentStatus } from "../../../../generated/prisma/enums";

import { prisma } from "../../../lib/prisma";

import AppError from "../../errors/appError";

import { StatusCodes } from "http-status-codes";

import { calculateRentalDays, generateOrderNumber, generateTransactionId } from "./rental.utils";

import { activeRentalStatuses } from "./rental.constant";
import { stripe } from "../payment/payment.stripe";
import config from "../../config";

const createRentalIntoDB = async (customerId: string, payload: CreateRentalPayload) => {
  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new AppError(StatusCodes.NOT_FOUND, "Customer not found.");
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  const rentalDays = calculateRentalDays(startDate, endDate);

  let totalAmount = 0;

  const orderItems: Prisma.RentalOrderItemCreateWithoutRentalOrderInput[] = [];

  for (const item of payload.items) {
    const gear = await prisma.gearItem.findFirst({
      where: {
        id: item.gearItemId,
        deletedAt: null,
        isListed: true,
      },
    });

    if (!gear) {
      throw new AppError(StatusCodes.NOT_FOUND, "Gear not found.");
    }

    const booked = await prisma.rentalOrderItem.aggregate({
      where: {
        gearItemId: item.gearItemId,

        status: {
          in: activeRentalStatuses,
        },

        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },

      _sum: {
        quantity: true,
      },
    });

    const bookedQuantity = booked._sum.quantity ?? 0;

    const available = gear.totalQuantity - bookedQuantity;

    if (available < item.quantity) {
      throw new AppError(StatusCodes.BAD_REQUEST, `${gear.name} has only ${available} available.`);
    }

    const subtotal = Number(gear.pricePerDay) * rentalDays * item.quantity;

    totalAmount += subtotal;

    orderItems.push({
      quantity: item.quantity,

      pricePerDay: gear.pricePerDay,

      subtotal: new Prisma.Decimal(subtotal),

      securityDeposit: new Prisma.Decimal(0),

      startDate,

      endDate,

      status: ItemRentalStatus.CONFIRMED,

      gearItem: {
        connect: {
          id: gear.id,
        },
      },
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.rentalOrder.create({
      data: {
        orderNumber: generateOrderNumber(),

        customerId,

        status: OrderStatus.PENDING_PAYMENT,

        paymentStatus: PaymentStatus.PENDING,

        totalAmount: new Prisma.Decimal(totalAmount),

        items: {
          create: orderItems,
        },
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        items: {
          include: {
            gearItem: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
      },
    });

    await tx.payment.create({
      data: {
        transactionId: generateTransactionId(),

        rentalOrderId: createdOrder.id,

        amount: new Prisma.Decimal(totalAmount),

        method: PaymentMethod.STRIPE,

        status: PaymentStatus.PENDING,
      },
    });

    return createdOrder;
  });

  return order;
};

const getMyRentalsFromDB = async (customerId: string, query: RentalQuery) => {
  const { page = "1", limit = "10", status, sortBy = "createdAt", sortOrder = "desc" } = query;

  const whereConditions: Prisma.RentalOrderWhereInput = {
    customerId,
  };

  if (status) {
    whereConditions.status = status as OrderStatus;
  }

  const rentals = await prisma.rentalOrder.findMany({
    where: whereConditions,

    include: {
      payments: true,

      items: {
        include: {
          gearItem: {
            include: {
              images: true,
              category: true,
            },
          },
        },
      },
    },

    skip: (Number(page) - 1) * Number(limit),

    take: Number(limit),

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.rentalOrder.count({
    where: whereConditions,
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },

    data: rentals,
  };
};

const getSingleRentalFromDB = async (customerId: string, rentalId: string) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      payments: true,

      items: {
        include: {
          gearItem: {
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
          },
        },
      },
    },
  });

  if (!rental) {
    throw new AppError(StatusCodes.NOT_FOUND, "Rental order not found.");
  }

  return rental;
};

const cancelRentalIntoDB = async (customerId: string, rentalId: string, payload: CancelRentalPayload) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },
    include: {
      items: true,
    },
  });

  if (!rental) {
    throw new AppError(StatusCodes.NOT_FOUND, "Rental order not found.");
  }

  if (rental.status === OrderStatus.CANCELLED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Rental is already cancelled.");
  }

  if (rental.status === OrderStatus.COMPLETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Completed rental cannot be cancelled.");
  }

  const hasPickedUp = rental.items.some((item) => item.status === ItemRentalStatus.PICKED_UP || item.status === ItemRentalStatus.RETURNED);

  if (hasPickedUp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Rental cannot be cancelled after pickup.");
  }

  const updatedRental = await prisma.$transaction(async (tx) => {
    await tx.rentalOrderItem.updateMany({
      where: {
        rentalOrderId: rental.id,
      },
      data: {
        status: ItemRentalStatus.CANCELLED,
      },
    });

    return tx.rentalOrder.update({
      where: {
        id: rental.id,
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: payload.cancellationReason,
      },
      include: {
        items: true,
        payments: true,
      },
    });
  });

  return updatedRental;
};

const getProviderRentalsFromDB = async (
  providerId: string,
  query: ProviderRentalQuery
) => {
  const {
    page = "1",
    limit = "10",
    status,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const whereConditions: Prisma.RentalOrderItemWhereInput = {
    gearItem: {
      providerId,
    },
  };

  if (status) {
    whereConditions.status = status as ItemRentalStatus;
  }

  if (startDate && endDate) {
    whereConditions.startDate = {
      gte: new Date(startDate),
    };

    whereConditions.endDate = {
      lte: new Date(endDate),
    };
  }

  const data = await prisma.rentalOrderItem.findMany({
    where: whereConditions,

    include: {
      rentalOrder: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          payments: true,
        },
      },

      gearItem: {
        include: {
          images: true,
          category: true,
        },
      },
    },

    skip: (Number(page) - 1) * Number(limit),

    take: Number(limit),

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.rentalOrderItem.count({
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

const getProviderSingleRentalFromDB = async (
  providerId: string,
  rentalOrderId: string
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalOrderId,

      items: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      payments: true,

      items: {
        include: {
          gearItem: {
            include: {
              images: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!rental) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Rental not found."
    );
  }

  return rental;
};

const updateRentalStatusIntoDB = async (
  providerId: string,
  rentalOrderId: string,
  payload: UpdateRentalStatusPayload
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalOrderId,
      items: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },

    include: {
      items: true,
    },
  });

  if (!rental) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Rental not found."
    );
  }

  if (rental.status === OrderStatus.CANCELLED) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cancelled rental cannot be updated."
    );
  }

  const rentalItem = rental.items[0];

  if (!rentalItem) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Rental item not found."
    );
  }

  const currentStatus = rentalItem.status;
  const nextStatus = payload.status;

  const validTransitions: Record<
    ItemRentalStatus,
    ItemRentalStatus[]
  > = {
    [ItemRentalStatus.CONFIRMED]: [
      ItemRentalStatus.READY_FOR_PICKUP,
      ItemRentalStatus.CANCELLED,
    ],

    [ItemRentalStatus.READY_FOR_PICKUP]: [
      ItemRentalStatus.PICKED_UP,
      ItemRentalStatus.CANCELLED,
    ],

    [ItemRentalStatus.PICKED_UP]: [
      ItemRentalStatus.RETURNED,
      ItemRentalStatus.OVERDUE,
      ItemRentalStatus.DAMAGED,
    ],

    [ItemRentalStatus.RETURNED]: [],

    [ItemRentalStatus.OVERDUE]: [
      ItemRentalStatus.RETURNED,
      ItemRentalStatus.DAMAGED,
    ],

    [ItemRentalStatus.DAMAGED]: [],

    [ItemRentalStatus.CANCELLED]: [],
  };

  if (
    !validTransitions[currentStatus].includes(nextStatus)
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot change status from ${currentStatus} to ${nextStatus}.`
    );
  }

  const updateData: Prisma.RentalOrderItemUpdateInput = {
    status: nextStatus,
  };

  if (nextStatus === ItemRentalStatus.PICKED_UP) {
    updateData.pickedUpAt = new Date();
  }

  if (nextStatus === ItemRentalStatus.RETURNED) {
    updateData.returnedAt = new Date();
  }

  await prisma.rentalOrderItem.update({
    where: {
      id: rentalItem.id,
    },
    data: updateData,
  });

  const updatedRental = await prisma.rentalOrder.findUnique({
    where: {
      id: rentalOrderId,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              slug: true,
              brand: true,
              pricePerDay: true,
              images: true,
            },
          },
        },
      },

      payments: true,
    },
  });

  if (!updatedRental) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Rental not found."
    );
  }

  return {
    ...updatedRental,

    totalAmount: Number(updatedRental.totalAmount),

    payments: updatedRental.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      refundAmount: payment.refundAmount
        ? Number(payment.refundAmount)
        : null,
    })),

    items: updatedRental.items.map((item) => ({
      ...item,
      pricePerDay: Number(item.pricePerDay),
      subtotal: Number(item.subtotal),
      securityDeposit: Number(item.securityDeposit),
      lateFee: Number(item.lateFee),

      gearItem: {
        ...item.gearItem,
        pricePerDay: Number(item.gearItem.pricePerDay),
      },
    })),
  };
};

export const rentalService = {
  createRentalIntoDB,
  getMyRentalsFromDB,
  getSingleRentalFromDB,
  cancelRentalIntoDB,
  updateRentalStatusIntoDB,
  getProviderRentalsFromDB,
  getProviderSingleRentalFromDB

};
