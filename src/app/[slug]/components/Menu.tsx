import Link from "next/link";
import { House, Star, ShoppingBasket, User } from "lucide-react";

export default function Menu() {
  return (
    <menu className="fixed right-0 bottom-0 left-0 z-50 bg-[var(--foreground)]">
      <ul className="flex content-center items-center justify-center gap-x-2 text-white">
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href="/">
            <House className="h-6 w-6" />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href="/">
            <Star className="h-6 w-6" />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href="/">
            <ShoppingBasket className="h-6 w-6" />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href="/">
            <User className="h-6 w-6" />
          </Link>
        </li>
      </ul>
    </menu>
  );
}
