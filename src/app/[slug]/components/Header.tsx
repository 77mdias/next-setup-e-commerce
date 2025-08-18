"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "../scss/page.module.scss";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Store } from "@prisma/client";
import AuthButton from "@/components/auth/AuthButton";

interface HeaderProps {
  slug: string;
  store: Store;
}

export default function Header({ slug, store }: HeaderProps) {
  //QUERO QUE QUANDO O USUÁRIO USAR A SCROLL PARA BAIXO, O HEADER FICA TRANSPARENTE
  const [isTransparent, setIsTransparent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setIsTransparent(window.scrollY > 100);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <header
      className={`${styles.headerHome} bg-background container flex w-full flex-shrink-0 flex-row items-center justify-between bg-[var(--foreground)] px-4 py-2 ${
        isTransparent ? "bg-transparent" : "bg-[var(--foreground)]"
      }`}
    >
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
    </header>
  );
}
