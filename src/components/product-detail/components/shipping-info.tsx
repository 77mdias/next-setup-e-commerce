"use client";

import { Truck, Shield, RotateCcw } from "lucide-react";

export function ShippingInfo() {
  return (
    <div className="border-t border-[#d8cfbf] pt-6 dark:border-white/10">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#d8cfbf] bg-white p-4 dark:border-white/10 dark:bg-[#17140f]">
          <Truck className="h-5 w-5 text-[#655a4e] dark:text-[#b8ad9f]" />
          <span className="text-sm text-[#4f463c] dark:text-[#c7ced9]">
            Free Shipping
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#d8cfbf] bg-white p-4 dark:border-white/10 dark:bg-[#17140f]">
          <Shield className="h-5 w-5 text-[#655a4e] dark:text-[#b8ad9f]" />
          <span className="text-sm text-[#4f463c] dark:text-[#c7ced9]">
            2 Year Warranty
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#d8cfbf] bg-white p-4 dark:border-white/10 dark:bg-[#17140f]">
          <RotateCcw className="h-5 w-5 text-[#655a4e] dark:text-[#b8ad9f]" />
          <span className="text-sm text-[#4f463c] dark:text-[#c7ced9]">
            30 Day Returns
          </span>
        </div>
      </div>
    </div>
  );
}
