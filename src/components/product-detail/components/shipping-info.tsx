"use client";

import { Truck, Shield, RotateCcw } from "lucide-react";

export function ShippingInfo() {
  return (
    <div className="border-t border-[#dbe4ff] pt-6 dark:border-white/10">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ff] bg-white p-4 dark:border-white/10 dark:bg-[#12151a]">
          <Truck className="h-5 w-5 text-[#64748b] dark:text-[#99a1af]" />
          <span className="text-sm text-[#475569] dark:text-[#c7ced9]">
            Free Shipping
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ff] bg-white p-4 dark:border-white/10 dark:bg-[#12151a]">
          <Shield className="h-5 w-5 text-[#64748b] dark:text-[#99a1af]" />
          <span className="text-sm text-[#475569] dark:text-[#c7ced9]">
            2 Year Warranty
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#dbe4ff] bg-white p-4 dark:border-white/10 dark:bg-[#12151a]">
          <RotateCcw className="h-5 w-5 text-[#64748b] dark:text-[#99a1af]" />
          <span className="text-sm text-[#475569] dark:text-[#c7ced9]">
            30 Day Returns
          </span>
        </div>
      </div>
    </div>
  );
}
