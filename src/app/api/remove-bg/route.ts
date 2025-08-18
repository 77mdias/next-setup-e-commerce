import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, apiKey } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória" },
        { status: 400 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key do Remove.bg é obrigatória" },
        { status: 400 },
      );
    }

    // Baixar a imagem original
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(imageResponse.data);

    // Criar FormData para enviar para o Remove.bg
    const formData = new FormData();
    formData.append("image_file", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });
    formData.append("size", "auto");

    // Fazer requisição para o Remove.bg
    const removeBgResponse = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: {
          "X-Api-Key": apiKey,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      },
    );

    // Converter a resposta para base64
    const processedImageBuffer = Buffer.from(removeBgResponse.data);
    const base64Image = processedImageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      processedImage: dataUrl,
      originalSize: imageBuffer.length,
      processedSize: processedImageBuffer.length,
    });
  } catch (error: any) {
    console.error("Erro ao processar imagem:", error);

    if (error.response?.status === 402) {
      return NextResponse.json(
        { error: "Créditos insuficientes na API do Remove.bg" },
        { status: 402 },
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: "API Key inválida do Remove.bg" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor ao processar imagem" },
      { status: 500 },
    );
  }
}

// Endpoint para processar múltiplas imagens
export async function PUT(request: NextRequest) {
  try {
    const { imageUrls, apiKey } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: "Array de URLs das imagens é obrigatório" },
        { status: 400 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key do Remove.bg é obrigatória" },
        { status: 400 },
      );
    }

    const processedImages = [];
    const errors = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];

        // Baixar a imagem original
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });

        const imageBuffer = Buffer.from(imageResponse.data);

        // Criar FormData para enviar para o Remove.bg
        const formData = new FormData();
        formData.append("image_file", imageBuffer, {
          filename: `image_${i}.jpg`,
          contentType: "image/jpeg",
        });
        formData.append("size", "auto");

        // Fazer requisição para o Remove.bg
        const removeBgResponse = await axios.post(
          "https://api.remove.bg/v1.0/removebg",
          formData,
          {
            headers: {
              "X-Api-Key": apiKey,
              ...formData.getHeaders(),
            },
            responseType: "arraybuffer",
          },
        );

        // Converter a resposta para base64
        const processedImageBuffer = Buffer.from(removeBgResponse.data);
        const base64Image = processedImageBuffer.toString("base64");
        const dataUrl = `data:image/png;base64,${base64Image}`;

        processedImages.push({
          index: i,
          originalUrl: imageUrl,
          processedImage: dataUrl,
          success: true,
        });

        // Delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Erro ao processar imagem ${i}:`, error);
        errors.push({
          index: i,
          originalUrl: imageUrls[i],
          error: error.message,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedImages,
      errors,
      totalProcessed: processedImages.length,
      totalErrors: errors.length,
    });
  } catch (error: any) {
    console.error("Erro ao processar múltiplas imagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar imagens" },
      { status: 500 },
    );
  }
}
