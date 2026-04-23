import { describe, expect, it } from "vitest";

import {
  assertOrderStateTransition,
  INITIAL_ORDER_STATE,
  isOrderStatusTransitionAllowed,
  isPaymentStatusTransitionAllowed,
  ORDER_STATUS_TRANSITION_MATRIX,
  PAYMENT_STATUS_TRANSITION_MATRIX,
  validateOrderStateTransition,
  type OrderState,
  type OrderStateTransitionInput,
} from "@/lib/order-state-machine";
import { OrderStatus, PaymentStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeOrderState(
  orderStatus: OrderStatus = "PENDING",
  paymentStatus: PaymentStatus = "PENDING",
): OrderState {
  return { orderStatus, paymentStatus };
}

// ---------------------------------------------------------------------------
// isOrderStatusTransitionAllowed
// ---------------------------------------------------------------------------

describe("isOrderStatusTransitionAllowed", () => {
  it("allows PENDING -> PAYMENT_PENDING", () => {
    expect(isOrderStatusTransitionAllowed("PENDING", "PAYMENT_PENDING")).toBe(true);
  });

  it("allows PENDING -> PAID", () => {
    expect(isOrderStatusTransitionAllowed("PENDING", "PAID")).toBe(true);
  });

  it("allows PENDING -> CANCELLED", () => {
    expect(isOrderStatusTransitionAllowed("PENDING", "CANCELLED")).toBe(true);
  });

  it("allows PAYMENT_PENDING -> PAID", () => {
    expect(isOrderStatusTransitionAllowed("PAYMENT_PENDING", "PAID")).toBe(true);
  });

  it("allows PAYMENT_PENDING -> CANCELLED", () => {
    expect(isOrderStatusTransitionAllowed("PAYMENT_PENDING", "CANCELLED")).toBe(true);
  });

  it("allows PAID -> PROCESSING", () => {
    expect(isOrderStatusTransitionAllowed("PAID", "PROCESSING")).toBe(true);
  });

  it("allows PAID -> REFUNDED", () => {
    expect(isOrderStatusTransitionAllowed("PAID", "REFUNDED")).toBe(true);
  });

  it("allows PROCESSING -> SHIPPED", () => {
    expect(isOrderStatusTransitionAllowed("PROCESSING", "SHIPPED")).toBe(true);
  });

  it("allows PROCESSING -> REFUNDED", () => {
    expect(isOrderStatusTransitionAllowed("PROCESSING", "REFUNDED")).toBe(true);
  });

  it("allows SHIPPED -> DELIVERED", () => {
    expect(isOrderStatusTransitionAllowed("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("allows SHIPPED -> REFUNDED", () => {
    expect(isOrderStatusTransitionAllowed("SHIPPED", "REFUNDED")).toBe(true);
  });

  it("allows DELIVERED -> REFUNDED", () => {
    expect(isOrderStatusTransitionAllowed("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("allows CANCELLED -> REFUNDED", () => {
    expect(isOrderStatusTransitionAllowed("CANCELLED", "REFUNDED")).toBe(true);
  });

  it("REFUNDED has no valid next states (excluding self-transition)", () => {
    const allStatuses: OrderStatus[] = [
      "PENDING",
      "PAYMENT_PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];
    for (const status of allStatuses) {
      expect(isOrderStatusTransitionAllowed("REFUNDED", status)).toBe(false);
    }
  });

  it("denies invalid transitions like PENDING -> DELIVERED", () => {
    expect(isOrderStatusTransitionAllowed("PENDING", "DELIVERED")).toBe(false);
  });

  it("denies PENDING -> PROCESSING (must go through PAID first)", () => {
    expect(isOrderStatusTransitionAllowed("PENDING", "PROCESSING")).toBe(false);
  });

  it("denies DELIVERED -> CANCELLED", () => {
    expect(isOrderStatusTransitionAllowed("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("denies SHIPPED -> PROCESSING (backward)", () => {
    expect(isOrderStatusTransitionAllowed("SHIPPED", "PROCESSING")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPaymentStatusTransitionAllowed
// ---------------------------------------------------------------------------

describe("isPaymentStatusTransitionAllowed", () => {
  it("allows PENDING -> PAID", () => {
    expect(isPaymentStatusTransitionAllowed("PENDING", "PAID")).toBe(true);
  });

  it("allows PENDING -> FAILED", () => {
    expect(isPaymentStatusTransitionAllowed("PENDING", "FAILED")).toBe(true);
  });

  it("allows PENDING -> CANCELLED", () => {
    expect(isPaymentStatusTransitionAllowed("PENDING", "CANCELLED")).toBe(true);
  });

  it("allows PAID -> REFUNDED", () => {
    expect(isPaymentStatusTransitionAllowed("PAID", "REFUNDED")).toBe(true);
  });

  it("allows FAILED -> CANCELLED", () => {
    expect(isPaymentStatusTransitionAllowed("FAILED", "CANCELLED")).toBe(true);
  });

  it("REFUNDED has no valid next states (excluding self-transition)", () => {
    const allStatuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "CANCELLED"];
    for (const status of allStatuses) {
      expect(isPaymentStatusTransitionAllowed("REFUNDED", status)).toBe(false);
    }
  });

  it("CANCELLED has no valid next states (excluding self-transition)", () => {
    const allStatuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];
    for (const status of allStatuses) {
      expect(isPaymentStatusTransitionAllowed("CANCELLED", status)).toBe(false);
    }
  });

  it("denies PAID -> PENDING (backward)", () => {
    expect(isPaymentStatusTransitionAllowed("PAID", "PENDING")).toBe(false);
  });

  it("denies PENDING -> REFUNDED directly", () => {
    expect(isPaymentStatusTransitionAllowed("PENDING", "REFUNDED")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateOrderStateTransition
// ---------------------------------------------------------------------------

describe("validateOrderStateTransition", () => {
  describe("valid transitions", () => {
    it("returns valid for pending -> paid", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PENDING", "PENDING"),
        to: makeOrderState("PAID", "PAID"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
    });

    it("returns valid for paid -> processing", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PAID", "PAID"),
        to: makeOrderState("PROCESSING", "PAID"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
    });

    it("returns valid for processing -> shipped", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PROCESSING", "PAID"),
        to: makeOrderState("SHIPPED", "PAID"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
    });

    it("returns valid for shipped -> delivered", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("SHIPPED", "PAID"),
        to: makeOrderState("DELIVERED", "PAID"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
    });
  });

  describe("noop detection", () => {
    it("isNoop is true when both statuses are unchanged", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PENDING", "PENDING"),
        to: makeOrderState("PENDING", "PENDING"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.isNoop).toBe(true);
      }
    });

    it("isNoop is false when order status changes but payment stays", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PENDING", "PENDING"),
        to: makeOrderState("PAID", "PENDING"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.isNoop).toBe(false);
      }
    });
  });

  describe("invalid transitions", () => {
    it("returns invalid when order status transition is not allowed", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PENDING", "PENDING"),
        to: makeOrderState("DELIVERED", "PAID"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/Invalid OrderStatus transition/);
      }
    });

    it("returns invalid when payment status transition is not allowed", () => {
      const input: OrderStateTransitionInput = {
        from: makeOrderState("PAID", "PAID"),
        to: makeOrderState("PROCESSING", "PENDING"),
      };
      const result = validateOrderStateTransition(input);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/Invalid PaymentStatus transition/);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// assertOrderStateTransition
// ---------------------------------------------------------------------------

describe("assertOrderStateTransition", () => {
  it("returns validation result for valid transition", () => {
    const input: OrderStateTransitionInput = {
      from: makeOrderState("PENDING", "PENDING"),
      to: makeOrderState("PAID", "PAID"),
    };
    const result = assertOrderStateTransition(input);
    expect(result.valid).toBe(true);
  });

  it("throws InvalidOrderStateTransitionError for invalid transition", () => {
    const input: OrderStateTransitionInput = {
      from: makeOrderState("PENDING", "PENDING"),
      to: makeOrderState("DELIVERED", "PAID"),
    };
    expect(() => assertOrderStateTransition(input)).toThrow();
  });

  it("InvalidOrderStateTransitionError contains from and to states", () => {
    const input: OrderStateTransitionInput = {
      from: makeOrderState("PENDING", "PENDING"),
      to: makeOrderState("DELIVERED", "PAID"),
    };
    try {
      assertOrderStateTransition(input);
      expect.fail("should have thrown");
    } catch (err) {
      if (err && typeof err === "object" && "from" in err && "to" in err) {
        expect((err as { from: OrderState }).from).toEqual(input.from);
        expect((err as { to: OrderState }).to).toEqual(input.to);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// INITIAL_ORDER_STATE
// ---------------------------------------------------------------------------

describe("INITIAL_ORDER_STATE", () => {
  it("is frozen", () => {
    expect(Object.isFrozen(INITIAL_ORDER_STATE)).toBe(true);
  });

  it("starts with PENDING order and payment status", () => {
    expect(INITIAL_ORDER_STATE.orderStatus).toBe("PENDING");
    expect(INITIAL_ORDER_STATE.paymentStatus).toBe("PENDING");
  });
});

// ---------------------------------------------------------------------------
// Transition matrices have expected structure
// ---------------------------------------------------------------------------

describe("ORDER_STATUS_TRANSITION_MATRIX", () => {
  it("every status key maps to an array", () => {
    const statuses: OrderStatus[] = [
      "PENDING",
      "PAYMENT_PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    for (const status of statuses) {
      expect(ORDER_STATUS_TRANSITION_MATRIX[status]).toBeDefined();
      expect(Array.isArray(ORDER_STATUS_TRANSITION_MATRIX[status])).toBe(true);
    }
  });

  it("terminal states have empty transition arrays", () => {
    expect(ORDER_STATUS_TRANSITION_MATRIX["REFUNDED"]).toHaveLength(0);
  });
});

describe("PAYMENT_STATUS_TRANSITION_MATRIX", () => {
  it("every status key maps to an array", () => {
    const statuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];
    for (const status of statuses) {
      expect(PAYMENT_STATUS_TRANSITION_MATRIX[status]).toBeDefined();
      expect(Array.isArray(PAYMENT_STATUS_TRANSITION_MATRIX[status])).toBe(true);
    }
  });

  it("terminal states have empty transition arrays", () => {
    expect(PAYMENT_STATUS_TRANSITION_MATRIX["REFUNDED"]).toHaveLength(0);
    expect(PAYMENT_STATUS_TRANSITION_MATRIX["CANCELLED"]).toHaveLength(0);
  });
});