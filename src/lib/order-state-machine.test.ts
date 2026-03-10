import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  assertOrderStateTransition,
  INITIAL_ORDER_STATE,
  InvalidOrderStateTransitionError,
  isOrderStatusTransitionAllowed,
  isPaymentStatusTransitionAllowed,
  ORDER_STATUS_TRANSITION_MATRIX,
  PAYMENT_STATUS_TRANSITION_MATRIX,
  validateOrderStateTransition,
} from "./order-state-machine";

const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

const EXPECTED_ORDER_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  PENDING: ["PAYMENT_PENDING", "PAID", "CANCELLED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

const EXPECTED_PAYMENT_TRANSITIONS: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = {
  PENDING: ["PAID", "FAILED", "CANCELLED"],
  PAID: ["REFUNDED"],
  FAILED: ["CANCELLED"],
  REFUNDED: [],
  CANCELLED: [],
};

describe("order-state-machine", () => {
  describe("INITIAL_ORDER_STATE", () => {
    it("keeps the canonical initial order and payment statuses", () => {
      expect(INITIAL_ORDER_STATE).toEqual({
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      });
      expect(Object.isFrozen(INITIAL_ORDER_STATE)).toBe(true);
    });
  });

  describe("order transitions", () => {
    it("keeps transition matrix aligned with the domain workflow", () => {
      expect(ORDER_STATUS_TRANSITION_MATRIX).toEqual(
        EXPECTED_ORDER_TRANSITIONS,
      );
    });

    it("allows no-op transitions for every order status", () => {
      for (const orderStatus of ORDER_STATUSES) {
        expect(isOrderStatusTransitionAllowed(orderStatus, orderStatus)).toBe(
          true,
        );
      }
    });

    it("allows only transitions present in the order matrix", () => {
      for (const from of ORDER_STATUSES) {
        for (const to of ORDER_STATUSES) {
          const expectedAllowed =
            from === to || EXPECTED_ORDER_TRANSITIONS[from].includes(to);

          expect(isOrderStatusTransitionAllowed(from, to)).toBe(
            expectedAllowed,
          );
        }
      }
    });
  });

  describe("payment transitions", () => {
    it("keeps transition matrix aligned with the payment workflow", () => {
      expect(PAYMENT_STATUS_TRANSITION_MATRIX).toEqual(
        EXPECTED_PAYMENT_TRANSITIONS,
      );
    });

    it("allows no-op transitions for every payment status", () => {
      for (const paymentStatus of PAYMENT_STATUSES) {
        expect(
          isPaymentStatusTransitionAllowed(paymentStatus, paymentStatus),
        ).toBe(true);
      }
    });

    it("allows only transitions present in the payment matrix", () => {
      for (const from of PAYMENT_STATUSES) {
        for (const to of PAYMENT_STATUSES) {
          const expectedAllowed =
            from === to || EXPECTED_PAYMENT_TRANSITIONS[from].includes(to);

          expect(isPaymentStatusTransitionAllowed(from, to)).toBe(
            expectedAllowed,
          );
        }
      }
    });
  });

  describe("validateOrderStateTransition", () => {
    it("returns noop validation for unchanged states", () => {
      expect(
        validateOrderStateTransition({
          from: { orderStatus: "PENDING", paymentStatus: "PENDING" },
          to: { orderStatus: "PENDING", paymentStatus: "PENDING" },
        }),
      ).toEqual({
        valid: true,
        isNoop: true,
      });
    });

    it("returns valid transition when order and payment changes are allowed", () => {
      expect(
        validateOrderStateTransition({
          from: { orderStatus: "PENDING", paymentStatus: "PENDING" },
          to: { orderStatus: "PAYMENT_PENDING", paymentStatus: "PAID" },
        }),
      ).toEqual({
        valid: true,
        isNoop: false,
      });
    });

    it("rejects invalid order status transitions with explicit reason", () => {
      expect(
        validateOrderStateTransition({
          from: { orderStatus: "CANCELLED", paymentStatus: "FAILED" },
          to: { orderStatus: "PAID", paymentStatus: "CANCELLED" },
        }),
      ).toEqual({
        valid: false,
        reason: "Invalid OrderStatus transition: CANCELLED -> PAID",
      });
    });

    it("rejects invalid payment status transitions with explicit reason", () => {
      expect(
        validateOrderStateTransition({
          from: { orderStatus: "PAID", paymentStatus: "PAID" },
          to: { orderStatus: "PROCESSING", paymentStatus: "CANCELLED" },
        }),
      ).toEqual({
        valid: false,
        reason: "Invalid PaymentStatus transition: PAID -> CANCELLED",
      });
    });
  });

  describe("assertOrderStateTransition", () => {
    it("returns validation payload when transition is valid", () => {
      expect(
        assertOrderStateTransition({
          from: { orderStatus: "PROCESSING", paymentStatus: "PAID" },
          to: { orderStatus: "SHIPPED", paymentStatus: "PAID" },
        }),
      ).toEqual({
        valid: true,
        isNoop: false,
      });
    });

    it("throws InvalidOrderStateTransitionError with context for invalid transitions", () => {
      expect(() =>
        assertOrderStateTransition({
          from: { orderStatus: "PAID", paymentStatus: "PENDING" },
          to: { orderStatus: "PENDING", paymentStatus: "PAID" },
        }),
      ).toThrow(InvalidOrderStateTransitionError);

      try {
        assertOrderStateTransition({
          from: { orderStatus: "PAID", paymentStatus: "PENDING" },
          to: { orderStatus: "PENDING", paymentStatus: "PAID" },
        });
      } catch (error) {
        const transitionError = error as InvalidOrderStateTransitionError;
        expect(transitionError.name).toBe("InvalidOrderStateTransitionError");
        expect(transitionError.message).toBe(
          "Invalid OrderStatus transition: PAID -> PENDING",
        );
        expect(transitionError.from).toEqual({
          orderStatus: "PAID",
          paymentStatus: "PENDING",
        });
        expect(transitionError.to).toEqual({
          orderStatus: "PENDING",
          paymentStatus: "PAID",
        });
      }
    });
  });
});
