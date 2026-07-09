import { PaymentStatus, Role } from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

const getAdminDashboardIntoDB = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalProviders,
    totalAdmins,
    totalCategories,
    totalGear,
    totalRentals,
    completedRentals,
    cancelledRentals,
    pendingPayments,
    completedPayments,
    revenue,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        role: Role.CUSTOMER,
      },
    }),

    prisma.user.count({
      where: {
        role: Role.PROVIDER,
      },
    }),

    prisma.user.count({
      where: {
        role: Role.ADMIN,
      },
    }),

    prisma.category.count(),

    prisma.gearItem.count(),

    prisma.rentalOrder.count(),

    prisma.rentalOrder.count({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
      },
    }),

    prisma.rentalOrder.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.payment.count({
      where: {
        status: PaymentStatus.PENDING,
      },
    }),

    prisma.payment.count({
      where: {
        status: PaymentStatus.COMPLETED,
      },
    }),

    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },

      where: {
        status: PaymentStatus.COMPLETED,
      },
    }),
  ]);

  return {
    totalUsers,
    totalCustomers,
    totalProviders,
    totalAdmins,

    totalCategories,
    totalGear,

    totalRentals,
    completedRentals,
    cancelledRentals,

    pendingPayments,
    completedPayments,

    totalRevenue: revenue._sum.amount ?? 0,
  };
};

const getProviderDashboardIntoDB = async (
  providerId: string
) => {
  const [
    totalGear,
    listedGear,
    totalRentalItems,
    completedRentals,
    revenue,
  ] = await Promise.all([
    prisma.gearItem.count({
      where: {
        providerId,
      },
    }),

    prisma.gearItem.count({
      where: {
        providerId,
        isListed: true,
      },
    }),

    prisma.rentalOrderItem.count({
      where: {
        gearItem: {
          providerId,
        },
      },
    }),

    prisma.rentalOrderItem.count({
      where: {
        gearItem: {
          providerId,
        },

        rentalOrder: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      },
    }),

    prisma.rentalOrderItem.aggregate({
      _sum: {
        subtotal: true,
      },

      where: {
        gearItem: {
          providerId,
        },

        rentalOrder: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      },
    }),
  ]);

  return {
    totalGear,

    listedGear,

    unlistedGear:
      totalGear - listedGear,

    totalRentalItems,

    completedRentals,

    totalRevenue:
      revenue._sum.subtotal ?? 0,
  };
};

const getCustomerDashboardIntoDB = async (
  customerId: string
) => {
  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingOrders,
    spent,
  ] = await Promise.all([
    prisma.rentalOrder.count({
      where: {
        customerId,
      },
    }),

    prisma.rentalOrder.count({
      where: {
        customerId,
        paymentStatus: PaymentStatus.COMPLETED,
      },
    }),

    prisma.rentalOrder.count({
      where: {
        customerId,
        status: "CANCELLED",
      },
    }),

    prisma.rentalOrder.count({
      where: {
        customerId,
        paymentStatus: PaymentStatus.PENDING,
      },
    }),

    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },

      where: {
        rentalOrder: {
          customerId,
        },

        status: PaymentStatus.COMPLETED,
      },
    }),
  ]);

  return {
    totalOrders,

    completedOrders,

    cancelledOrders,

    pendingOrders,

    totalSpent:
      spent._sum.amount ?? 0,
  };
};

export const dashboardService = {
  getAdminDashboardIntoDB,
  getProviderDashboardIntoDB,
  getCustomerDashboardIntoDB,
};