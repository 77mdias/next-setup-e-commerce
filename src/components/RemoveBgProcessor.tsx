"use client";

import { useState } from "react";
import Image from "next/image";

import { useRemoveBg } from "@/hooks/useRemoveBg";

interface RemoveBgProcessorProps {
  productId: string;
  images: string[];
  onImagesProcessed?: (processedImages: string[]) => void;
  apiEndpoint?: string;
}

export default function RemoveBgProcessor({
  productId,
  images,
  onImagesProcessed,
  apiEndpoint = "/api/remove-bg",
}: RemoveBgProcessorProps) {
  const { isProcessing, processMultipleImages, progress } = useRemoveBg({
    endpoint: apiEndpoint,
  });
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleProcessImages = async () => {
    if (images.length === 0) {
      alert("Nenhuma imagem encontrada para processar");
      return;
    }

    setErrors([]);

    try {
      const result = await processMultipleImages(images);

      if (result.success) {
        const processed = result.processedImages.map(
          (img) => img.processedImage,
        );
        setProcessedImages(processed);

        if (onImagesProcessed) {
          onImagesProcessed(processed);
        }

        if (result.errors.length > 0) {
          const errorMessages = result.errors.map(
            (err) => `Erro na imagem ${err.index + 1}: ${err.error}`,
          );
          setErrors(errorMessages);
        }
      } else {
        setErrors(["Falha ao processar as imagens"]);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrors(["Erro interno ao processar imagens"]);
    }
  };

  const downloadImage = (imageData: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `produto-${productId}-sem-fundo-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    processedImages.forEach((imageData, index) => {
      setTimeout(() => {
        downloadImage(imageData, index);
      }, index * 500);
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Remover Fundo das Imagens
      </h2>

      <div className="mb-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        A autenticação com o provedor é feita apenas no servidor. Nenhuma chave
        sensível é enviada pelo navegador.
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-700">
          Imagens Originais ({images.length})
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <Image
                src={image}
                alt={`Produto ${index + 1}`}
                width={200}
                height={200}
                className="h-40 w-full rounded-lg border border-gray-200 object-cover"
              />
              <span className="bg-opacity-50 absolute top-2 left-2 rounded bg-black px-2 py-1 text-xs text-white">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleProcessImages}
          disabled={isProcessing || images.length === 0}
          className={`rounded-md px-6 py-3 font-medium transition-colors ${
            isProcessing || images.length === 0
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isProcessing ? "Processando..." : "Remover Fundo das Imagens"}
        </button>

        {isProcessing && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Processando imagens... {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <h4 className="mb-2 font-medium text-red-800">Erros encontrados:</h4>
          <ul className="space-y-1 text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {processedImages.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              Imagens Processadas ({processedImages.length})
            </h3>
            <button
              onClick={downloadAllImages}
              className="rounded-md bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
            >
              Baixar Todas
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {processedImages.map((image, index) => (
              <div key={index} className="group relative">
                <Image
                  src={image}
                  alt={`Produto sem fundo ${index + 1}`}
                  width={200}
                  height={200}
                  className="h-40 w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                />
                <span className="absolute top-2 left-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
                  {index + 1}
                </span>
                <button
                  onClick={() => downloadImage(image, index)}
                  className="absolute top-2 right-2 rounded bg-blue-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  title="Baixar imagem"
                >
                  ⬇
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
