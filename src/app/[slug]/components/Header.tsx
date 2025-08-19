import Image from "next/image";
import Link from "next/link";
import styles from "../scss/page.module.scss";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Store } from "@prisma/client";
import AuthButton from "@/components/auth/AuthButton";

interface HeaderProps {
  slug: string;
  store: Store;
}

export default function Header({ slug, store }: HeaderProps) {
  return (
    <header className={`bg-[var(--background)]`}>
      <div className="flex w-full flex-shrink-0 flex-row items-center justify-between px-4 py-2">
        {/* LOGO DA LOJA */}
        <div className="flex items-center gap-1">
          <Image
            src={"/Valorant-Academy.png"}
            alt={store.name}
            className="rounded-lg object-contain"
            width={30}
            height={30}
          />
          <p className="font-extrabold text-[var(--text-primary)] italic">
            Ne
            <span className="font-extrabold text-[var(--text-price)] italic">
              XT
            </span>
          </p>
        </div>
        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-2">
          <Button className="text-white">
            <Link href={`/${slug}/menu`}>
              <Search />
            </Link>
          </Button>
          <AuthButton slug={slug} />
        </div>
      </div>
    </header>
  );
}
