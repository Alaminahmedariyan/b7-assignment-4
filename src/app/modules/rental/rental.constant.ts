import { ItemRentalStatus } from "../../../../generated/prisma/enums";

export const activeRentalStatuses: ItemRentalStatus[] = [
  ItemRentalStatus.CONFIRMED,
  ItemRentalStatus.READY_FOR_PICKUP,
  ItemRentalStatus.PICKED_UP,
  ItemRentalStatus.OVERDUE,
];