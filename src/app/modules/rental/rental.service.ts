import { CreateRentalPayload } from "./rental.interface";
import { Prisma } from "../../../../generated/prisma/client";

import {
  ItemRentalStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../../../generated/prisma/enums";

import { prisma } from "../../../lib/prisma";

import AppError from "../../errors/appError";

import { StatusCodes } from "http-status-codes";

import {
  calculateRentalDays,
  generateOrderNumber,
  generateTransactionId,
} from "./rental.utils";

import { activeRentalStatuses } from "./rental.constant";

const createRentalIntoDB = async (
  customerId: string,
  payload: CreateRentalPayload
) => {

  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
      deletedAt: null,
    },
  });

  if (!customer) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Customer not found."
    );
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  const rentalDays = calculateRentalDays(
    startDate,
    endDate
  );

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
  throw new AppError(
    StatusCodes.NOT_FOUND,
    "Gear not found."
  );
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

const bookedQuantity =
  booked._sum.quantity ?? 0;

const available =
  gear.totalQuantity - bookedQuantity;

if (available < item.quantity) {
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    `${gear.name} has only ${available} available.`
  );
}

const subtotal =
  Number(gear.pricePerDay) *
  rentalDays *
  item.quantity;

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

export const rentalService = {
  createRentalIntoDB,
};