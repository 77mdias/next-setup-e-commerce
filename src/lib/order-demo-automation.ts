import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import { validateOrderStateTransition } from "@/lib/order-state-machine";
import { db } from "@/lib/prisma";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MAX_TRANSITIONS_PER_ORDER = 8;

const DEFAULT_PAYMENT_CONFIRMED_AFTER_MINUTES = 2;
const DEFAULT_PROCESSING_AFTER_MINUTES = 4;
const DEFAULT_SHIPPED_AFTER_MINUTES = 6;
const DEFAULT_DELIVERED_AFTER_MINUTES = 8;

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
];

const ACTIVE_PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID"];

type AutomationStep =
  | "payment_confirmed"
  | "processing_started"
  | "shipped"
  | "delivered";

type OrderAutomationConfig = {
  enabled: boolean;
  paymentConfirmedAfterMinutes: number;
  processingAfterMinutes: number;
  shippedAfterMinutes: number;
  deliveredAfterMinutes: number;
};

type OrderAutomationPlanState = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
};

type PlannedTransition = {
  step: AutomationStep;
  toOrderStatus: OrderStatus;
  toPaymentStatus: PaymentStatus;
  elapsedMinutes: number;
};

type OrderAutomationSnapshot = {
  id: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  paymentMethod: string | null;
  stripePaymentId: string | null;
  stripePaymentIntentId: string | null;
  trackingCode: string | null;
  createdAt: Date;
  estimatedDelivery: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
};

const orderAutomationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  total: true,
  paymentMethod: true,
  stripePaymentId: true,
  stripePaymentIntentId: true,
  trackingCode: true,
  createdAt: true,
  estimatedDelivery: true,
  shippedAt: true,
  deliveredAt: true,
} satisfies Prisma.OrderSelect;

function parseBooleanFlag(rawValue: string | undefined) {
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseMinutesFromEnv(
  envKey: string,
  fallbackValue: number,
  environment = process.env,
) {
  const rawValue = environment[envKey];

  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    console.warn(
      `[demo-order-automation] ${envKey} invalido: "${rawValue}". Usando ${fallbackValue}.`,
    );
    return fallbackValue;
  }

  return parsedValue;
}

function resolveOrderAutomationConfig(
  environment = process.env,
): OrderAutomationConfig {
  const paymentConfirmedAfterMinutes = parseMinutesFromEnv(
    "DEMO_ORDER_PAYMENT_CONFIRMED_AFTER_MINUTES",
    DEFAULT_PAYMENT_CONFIRMED_AFTER_MINUTES,
    environment,
  );
  const processingAfterMinutes = Math.max(
    paymentConfirmedAfterMinutes,
    parseMinutesFromEnv(
      "DEMO_ORDER_PROCESSING_AFTER_MINUTES",
      DEFAULT_PROCESSING_AFTER_MINUTES,
      environment,
    ),
  );
  const shippedAfterMinutes = Math.max(
    processingAfterMinutes,
    parseMinutesFromEnv(
      "DEMO_ORDER_SHIPPED_AFTER_MINUTES",
      DEFAULT_SHIPPED_AFTER_MINUTES,
      environment,
    ),
  );
  const deliveredAfterMinutes = Math.max(
    shippedAfterMinutes,
    parseMinutesFromEnv(
      "DEMO_ORDER_DELIVERED_AFTER_MINUTES",
      DEFAULT_DELIVERED_AFTER_MINUTES,
      environment,
    ),
  );

  return {
    enabled: parseBooleanFlag(environment.DEMO_ORDER_AUTOMATION_ENABLED),
    paymentConfirmedAfterMinutes,
    processingAfterMinutes,
    shippedAfterMinutes,
    deliveredAfterMinutes,
  };
}

function isTerminalState(state: {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  if (state.orderStatus === "CANCELLED" || state.orderStatus === "REFUNDED") {
    return true;
  }

  if (
    state.paymentStatus === "FAILED" ||
    state.paymentStatus === "CANCELLED" ||
    state.paymentStatus === "REFUNDED"
  ) {
    return true;
  }

  return false;
}

function resolveNextTransition({
  state,
  elapsedMinutes,
  config,
}: {
  state: OrderAutomationPlanState;
  elapsedMinutes: number;
  config: OrderAutomationConfig;
}): PlannedTransition | null {
  if (isTerminalState(state) || state.orderStatus === "DELIVERED") {
    return null;
  }

  if (
    state.orderStatus === "SHIPPED" &&
    elapsedMinutes >= config.deliveredAfterMinutes
  ) {
    return {
      step: "delivered",
      toOrderStatus: "DELIVERED",
      toPaymentStatus: "PAID",
      elapsedMinutes,
    };
  }

  if (
    state.orderStatus === "PROCESSING" &&
    elapsedMinutes >= config.shippedAfterMinutes
  ) {
    return {
      step: "shipped",
      toOrderStatus: "SHIPPED",
      toPaymentStatus: "PAID",
      elapsedMinutes,
    };
  }

  if (
    state.orderStatus === "PAID" &&
    elapsedMinutes >= config.processingAfterMinutes
  ) {
    return {
      step: "processing_started",
      toOrderStatus: "PROCESSING",
      toPaymentStatus: "PAID",
      elapsedMinutes,
    };
  }

  if (
    (state.orderStatus === "PENDING" ||
      state.orderStatus === "PAYMENT_PENDING") &&
    elapsedMinutes >= config.paymentConfirmedAfterMinutes
  ) {
    return {
      step: "payment_confirmed",
      toOrderStatus: "PAID",
      toPaymentStatus: "PAID",
      elapsedMinutes,
    };
  }

  return null;
}

function buildDemoTrackingCode(orderId: number, now: Date) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `DEMO-${year}${month}${day}-${String(orderId).padStart(6, "0")}`;
}

function buildStatusHistoryNote(params: {
  step: AutomationStep;
  fromOrderStatus: OrderStatus;
  toOrderStatus: OrderStatus;
  fromPaymentStatus: PaymentStatus;
  toPaymentStatus: PaymentStatus;
  elapsedMinutes: number;
}) {
  return [
    "source:demo_automation",
    `step:${params.step}`,
    `orderStatusTransition:${params.fromOrderStatus}->${params.toOrderStatus}`,
    `paymentStatusTransition:${params.fromPaymentStatus}->${params.toPaymentStatus}`,
    `elapsedMinutes:${params.elapsedMinutes}`,
  ].join("; ");
}

async function upsertPaidPayment({
  order,
  now,
  transactionClient,
}: {
  order: OrderAutomationSnapshot;
  now: Date;
  transactionClient: Prisma.TransactionClient;
}) {
  const paidPayment = await transactionClient.payment.findFirst({
    where: {
      orderId: order.id,
      status: "PAID",
    },
    select: { id: true },
  });

  if (paidPayment) {
    return;
  }

  const pendingPayment = await transactionClient.payment.findFirst({
    where: {
      orderId: order.id,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: { id: true },
  });

  if (pendingPayment) {
    await transactionClient.payment.updateMany({
      where: {
        id: pendingPayment.id,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paidAt: now,
        failedAt: null,
        failureReason: null,
      },
    });
    return;
  }

  await transactionClient.payment.create({
    data: {
      orderId: order.id,
      method: order.paymentMethod ?? "stripe",
      amount: order.total,
      status: "PAID",
      stripePaymentId: order.stripePaymentIntentId ?? order.stripePaymentId,
      paidAt: now,
    },
  });
}

function planOrderTransitions({
  order,
  now,
  config,
}: {
  order: Pick<
    OrderAutomationSnapshot,
    "status" | "paymentStatus" | "createdAt"
  >;
  now: Date;
  config: OrderAutomationConfig;
}) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - order.createdAt.getTime()) / MINUTE_MS),
  );
  const plan: PlannedTransition[] = [];
  const state: OrderAutomationPlanState = {
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  };

  for (let attempt = 0; attempt < MAX_TRANSITIONS_PER_ORDER; attempt += 1) {
    const nextTransition = resolveNextTransition({
      state,
      elapsedMinutes,
      config,
    });

    if (!nextTransition) {
      break;
    }

    plan.push(nextTransition);
    state.orderStatus = nextTransition.toOrderStatus;
    state.paymentStatus = nextTransition.toPaymentStatus;
  }

  return plan;
}

async function runAutomationForOrder({
  orderId,
  config,
  now,
}: {
  orderId: number;
  config: OrderAutomationConfig;
  now: Date;
}) {
  return db.$transaction(async (transactionClient) => {
    const order = await transactionClient.order.findUnique({
      where: { id: orderId },
      select: orderAutomationSelect,
    });

    if (!order) {
      return {
        updated: false,
        transitionsApplied: 0,
      };
    }

    const plan = planOrderTransitions({
      order,
      now,
      config,
    });

    if (plan.length === 0) {
      return {
        updated: false,
        transitionsApplied: 0,
      };
    }

    let currentOrder = order;
    let transitionsApplied = 0;

    for (const transition of plan) {
      const validation = validateOrderStateTransition({
        from: {
          orderStatus: currentOrder.status,
          paymentStatus: currentOrder.paymentStatus,
        },
        to: {
          orderStatus: transition.toOrderStatus,
          paymentStatus: transition.toPaymentStatus,
        },
      });

      if (!validation.valid) {
        break;
      }

      if (validation.isNoop) {
        continue;
      }

      const updateData: Prisma.OrderUpdateManyMutationInput = {
        status: transition.toOrderStatus,
        paymentStatus: transition.toPaymentStatus,
      };

      if (transition.step === "processing_started") {
        if (!currentOrder.estimatedDelivery) {
          updateData.estimatedDelivery = new Date(now.getTime() + 2 * DAY_MS);
        }
      }

      if (transition.step === "shipped") {
        if (!currentOrder.shippedAt) {
          updateData.shippedAt = now;
        }

        if (!currentOrder.trackingCode) {
          updateData.trackingCode = buildDemoTrackingCode(currentOrder.id, now);
        }

        if (!currentOrder.estimatedDelivery) {
          updateData.estimatedDelivery = new Date(now.getTime() + 2 * DAY_MS);
        }
      }

      if (transition.step === "delivered") {
        if (!currentOrder.deliveredAt) {
          updateData.deliveredAt = now;
        }

        if (!currentOrder.estimatedDelivery) {
          updateData.estimatedDelivery = now;
        }
      }

      const updateResult = await transactionClient.order.updateMany({
        where: {
          id: currentOrder.id,
          status: currentOrder.status,
          paymentStatus: currentOrder.paymentStatus,
        },
        data: updateData,
      });

      if (updateResult.count !== 1) {
        break;
      }

      await transactionClient.orderStatusHistory.create({
        data: {
          orderId: currentOrder.id,
          status: transition.toOrderStatus,
          notes: buildStatusHistoryNote({
            step: transition.step,
            fromOrderStatus: currentOrder.status,
            toOrderStatus: transition.toOrderStatus,
            fromPaymentStatus: currentOrder.paymentStatus,
            toPaymentStatus: transition.toPaymentStatus,
            elapsedMinutes: transition.elapsedMinutes,
          }),
        },
      });

      if (
        transition.toPaymentStatus === "PAID" &&
        currentOrder.paymentStatus !== "PAID"
      ) {
        await upsertPaidPayment({
          order: currentOrder,
          now,
          transactionClient,
        });
      }

      currentOrder = {
        ...currentOrder,
        status: transition.toOrderStatus,
        paymentStatus: transition.toPaymentStatus,
        shippedAt:
          transition.step === "shipped" && !currentOrder.shippedAt
            ? now
            : currentOrder.shippedAt,
        deliveredAt:
          transition.step === "delivered" && !currentOrder.deliveredAt
            ? now
            : currentOrder.deliveredAt,
        estimatedDelivery:
          transition.step === "delivered" && !currentOrder.estimatedDelivery
            ? now
            : transition.step === "processing_started" ||
                transition.step === "shipped"
              ? (currentOrder.estimatedDelivery ??
                new Date(now.getTime() + 2 * DAY_MS))
              : currentOrder.estimatedDelivery,
        trackingCode:
          transition.step === "shipped"
            ? (currentOrder.trackingCode ??
              buildDemoTrackingCode(currentOrder.id, now))
            : currentOrder.trackingCode,
      };

      transitionsApplied += 1;
    }

    return {
      updated: transitionsApplied > 0,
      transitionsApplied,
    };
  });
}

export function isDemoOrderAutomationEnabled() {
  return resolveOrderAutomationConfig().enabled;
}

export async function runDemoOrderAutomationForOrder(orderId: number) {
  const config = resolveOrderAutomationConfig();

  if (!config.enabled) {
    return {
      updated: false,
      transitionsApplied: 0,
    };
  }

  return runAutomationForOrder({
    orderId,
    config,
    now: new Date(),
  });
}

export async function runDemoOrderAutomationForUser(userId: string) {
  const config = resolveOrderAutomationConfig();

  if (!config.enabled) {
    return {
      updatedOrders: 0,
      transitionsApplied: 0,
    };
  }

  const candidateOrders = await db.order.findMany({
    where: {
      userId,
      status: {
        in: ACTIVE_ORDER_STATUSES,
      },
      paymentStatus: {
        in: ACTIVE_PAYMENT_STATUSES,
      },
    },
    select: {
      id: true,
    },
  });

  let updatedOrders = 0;
  let transitionsApplied = 0;
  const now = new Date();

  for (const candidateOrder of candidateOrders) {
    const result = await runAutomationForOrder({
      orderId: candidateOrder.id,
      config,
      now,
    });

    if (result.updated) {
      updatedOrders += 1;
      transitionsApplied += result.transitionsApplied;
    }
  }

  return {
    updatedOrders,
    transitionsApplied,
  };
}
