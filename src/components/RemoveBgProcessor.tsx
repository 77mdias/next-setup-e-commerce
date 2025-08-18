"use client";

import { useState, useEffect } from "react";
import { useRemoveBg } from "@/hooks/useRemoveBg";
import Image from "next/image";

interface RemoveBgProcessorProps {
  productId: string;
  images: string[];
  onImagesProcessed?: (processedImages: string[]) => void;
}

export default function RemoveBgProcessor({
  productId,
  images,
  onImagesProcessed,
}: RemoveBgProcessorProps) {
  const { isProcessing, processMultipleImages, progress } = useRemoveBg();
  const [apiKey, setApiKey] = useState("");
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Carregar API key do localStorage se existir
  useEffect(() => {
    const savedApiKey = localStorage.getItem("removebg-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleProcessImages = async () => {
    if (!apiKey.trim()) {
      alert("Por favor, insira sua API Key do Remove.bg");
      setShowApiKeyInput(true);
      return;
    }

    if (images.length === 0) {
      alert("Nenhuma imagem encontrada para processar");
      return;
    }

    // Salvar API key no localStorage
    localStorage.setItem("removebg-api-key", apiKey);

    try {
      const result = await processMultipleImages(images, apiKey);

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
      }, index * 500); // Delay entre downloads
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Remover Fundo das Imagens
      </h2>

      {/* Input da API Key */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            {showApiKeyInput ? "Ocultar" : "Configurar"} API Key
          </button>

          {apiKey && !showApiKeyInput && (
            <span className="font-medium text-green-600">
              ✓ API Key configurada
            </span>
          )}
        </div>

        {showApiKeyInput && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              API Key do Remove.bg:
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Insira sua API Key do Remove.bg"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Obtenha sua API Key gratuita em:
              <a
                href="https://www.remove.bg/api"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-500 hover:underline"
              >
                remove.bg/api
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Imagens Originais */}
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

      {/* Botão de Processar */}
      <div className="mb-6">
        <button
          onClick={handleProcessImages}
          disabled={isProcessing || !apiKey.trim()}
          className={`rounded-md px-6 py-3 font-medium transition-colors ${
            isProcessing || !apiKey.trim()
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

      {/* Erros */}
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

      {/* Imagens Processadas */}
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
