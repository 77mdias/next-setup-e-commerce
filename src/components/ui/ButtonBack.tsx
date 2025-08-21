import { Button } from "./button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const ButtonBack = () => {
  const router = useRouter();

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center gap-2 p-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </Button>
    </div>
  );
};

export default ButtonBack;
