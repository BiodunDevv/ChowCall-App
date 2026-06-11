import { IconShoppingCart, IconArrowRight } from "@tabler/icons-react";
import { formatMoney } from "@/lib/public-ordering";

type OrderMobileBarProps = {
  cartCount: number;
  cartTotal: number;
  show: boolean;
  onClick: () => void;
};

export function OrderMobileBar({ cartCount, cartTotal, show, onClick }: OrderMobileBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-xl transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {cartCount}
          </span>
          <IconShoppingCart className="size-4" />
        </div>
        <span className="font-semibold">View order</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">{formatMoney(cartTotal)}</span>
          <IconArrowRight className="size-4" />
        </div>
      </button>
    </div>
  );
}
