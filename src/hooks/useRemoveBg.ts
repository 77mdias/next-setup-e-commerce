import { useState, useCallback } from "react";
import axios from "axios";

interface ProcessImageResponse {
  success: boolean;
  processedImage?: string;
  originalSize?: number;
  processedSize?: number;
  error?: string;
}

interface ProcessMultipleImagesResponse {
  success: boolean;
  processedImages: Array<{
    index: number;
    originalUrl: string;
    processedImage: string;
    success: boolean;
  }>;
  errors: Array<{
    index: number;
    originalUrl: string;
    error: string;
    success: boolean;
  }>;
  totalProcessed: number;
  totalErrors: number;
}

interface UseRemoveBgReturn {
  isProcessing: boolean;
  processImage: (
    imageUrl: string,
    apiKey: string,
  ) => Promise<ProcessImageResponse>;
  processMultipleImages: (
    imageUrls: string[],
    apiKey: string,
  ) => Promise<ProcessMultipleImagesResponse>;
  progress: number;
}

export const useRemoveBg = (): UseRemoveBgReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = useCallback(
    async (imageUrl: string, apiKey: string): Promise<ProcessImageResponse> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const response = await axios.post("/api/remove-bg", {
          imageUrl,
          apiKey,
        });

        setProgress(100);
        return response.data;
      } catch (error: any) {
        console.error("Erro ao processar imagem:", error);
        return {
          success: false,
          error: error.response?.data?.error || "Erro ao processar imagem",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const processMultipleImages = useCallback(
    async (
      imageUrls: string[],
      apiKey: string,
    ): Promise<ProcessMultipleImagesResponse> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const response = await axios.put("/api/remove-bg", {
          imageUrls,
          apiKey,
        });

        setProgress(100);
        return response.data;
      } catch (error: any) {
        console.error("Erro ao processar múltiplas imagens:", error);
        return {
          success: false,
          processedImages: [],
          errors: imageUrls.map((url, index) => ({
            index,
            originalUrl: url,
            error: error.response?.data?.error || "Erro ao processar imagem",
            success: false,
          })),
          totalProcessed: 0,
          totalErrors: imageUrls.length,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return {
    isProcessing,
    processImage,
    processMultipleImages,
    progress,
  };
};
