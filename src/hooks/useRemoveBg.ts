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

interface UseRemoveBgOptions {
  endpoint?: string;
}

interface UseRemoveBgReturn {
  isProcessing: boolean;
  processImage: (imageUrl: string) => Promise<ProcessImageResponse>;
  processMultipleImages: (
    imageUrls: string[],
  ) => Promise<ProcessMultipleImagesResponse>;
  progress: number;
}

export const useRemoveBg = (
  options: UseRemoveBgOptions = {},
): UseRemoveBgReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const endpoint = options.endpoint ?? "/api/admin/remove-bg";

  const processImage = useCallback(
    async (imageUrl: string): Promise<ProcessImageResponse> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const response = await axios.post(endpoint, {
          imageUrl,
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
    [endpoint],
  );

  const processMultipleImages = useCallback(
    async (imageUrls: string[]): Promise<ProcessMultipleImagesResponse> => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const response = await axios.put(endpoint, {
          imageUrls,
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
    [endpoint],
  );

  return {
    isProcessing,
    processImage,
    processMultipleImages,
    progress,
  };
};
