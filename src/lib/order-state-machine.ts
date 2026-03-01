import type { OrderStatus, PaymentStatus } from "@prisma/client";

type TransitionMatrix<TStatus extends string> = Readonly<
  Record<TStatus, readonly TStatus[]>
>;

export type OrderState = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
};

export type OrderStateTransitionInput = {
  from: OrderState;
  to: OrderState;
};

export type OrderStateTransitionValidationResult =
  | { valid: true; isNoop: boolean }
  | { valid: false; reason: string };

export const INITIAL_ORDER_STATE: Readonly<OrderState> = Object.freeze({
  orderStatus: "PENDING",
  paymentStatus: "PENDING",
});

export const ORDER_STATUS_TRANSITION_MATRIX: TransitionMatrix<OrderStatus> = {
  PENDING: ["PAYMENT_PENDING", "PAID", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export const PAYMENT_STATUS_TRANSITION_MATRIX: TransitionMatrix<PaymentStatus> =
  {
    PENDING: ["PAID", "FAILED", "CANCELLED"],
    PAID: ["REFUNDED"],
    FAILED: ["CANCELLED"],
    REFUNDED: [],
    CANCELLED: [],
  };

export class InvalidOrderStateTransitionError extends Error {
  readonly from: OrderState;
  readonly to: OrderState;

  constructor({
    from,
    to,
    reason,
  }: {
    from: OrderState;
    to: OrderState;
    reason: string;
  }) {
    super(reason);
    this.name = "InvalidOrderStateTransitionError";
    this.from = from;
    this.to = to;
  }
}

function isTransitionAllowed<TStatus extends string>(
  matrix: TransitionMatrix<TStatus>,
  from: TStatus,
  to: TStatus,
) {
  if (from === to) {
    return true;
  }

  return matrix[from].includes(to);
}

export function isOrderStatusTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
) {
  return isTransitionAllowed(ORDER_STATUS_TRANSITION_MATRIX, from, to);
}

export function isPaymentStatusTransitionAllowed(
  from: PaymentStatus,
  to: PaymentStatus,
) {
  return isTransitionAllowed(PAYMENT_STATUS_TRANSITION_MATRIX, from, to);
}

export function validateOrderStateTransition({
  from,
  to,
}: OrderStateTransitionInput): OrderStateTransitionValidationResult {
  if (!isOrderStatusTransitionAllowed(from.orderStatus, to.orderStatus)) {
    return {
      valid: false,
      reason: `Invalid OrderStatus transition: ${from.orderStatus} -> ${to.orderStatus}`,
    };
  }

  if (!isPaymentStatusTransitionAllowed(from.paymentStatus, to.paymentStatus)) {
    return {
      valid: false,
      reason: `Invalid PaymentStatus transition: ${from.paymentStatus} -> ${to.paymentStatus}`,
    };
  }

  return {
    valid: true,
    isNoop:
      from.orderStatus === to.orderStatus &&
      from.paymentStatus === to.paymentStatus,
  };
}

export function assertOrderStateTransition(input: OrderStateTransitionInput) {
  const validation = validateOrderStateTransition(input);

  if (!validation.valid) {
    throw new InvalidOrderStateTransitionError({
      from: input.from,
      to: input.to,
      reason: validation.reason,
    });
  }

  return validation;
}
