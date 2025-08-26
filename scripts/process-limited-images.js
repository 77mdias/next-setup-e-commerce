const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');

const prisma = new PrismaClient();

// CONFIGURE SUA API KEY AQUI
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || 'SUA_API_KEY_AQUI';

// CONFIGURAÇÕES
const MAX_IMAGES_TO_PROCESS = 10; // Máximo de imagens para processar
const MAX_PRODUCTS_TO_PROCESS = 5; // Máximo de produtos para processar

async function processImageWithRemoveBg(imageUrl) {
  try {
    // Baixar a imagem original
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(imageResponse.data);

    // Criar FormData para enviar para o Remove.bg
    const formData = new FormData();
    formData.append('image_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('size', 'auto');

    // Fazer requisição para o Remove.bg
    const removeBgResponse = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      formData,
      {
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      }
    );

    // Converter a resposta para base64
    const processedImageBuffer = Buffer.from(removeBgResponse.data);
    const base64Image = processedImageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return dataUrl;
  } catch (error) {
    // Melhor tratamento de erros específicos
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 402) {
        console.error('❌ CRÉDITOS ESGOTADOS! Erro 402 - Payment Required');
        return 'CREDITS_EXHAUSTED';
      } else if (status === 401) {
        console.error('❌ API KEY INVÁLIDA! Erro 401 - Unauthorized');
        return 'INVALID_API_KEY';
      } else if (status === 429) {
        console.error('⚠️  RATE LIMIT EXCEDIDO! Erro 429 - Too Many Requests');
        return 'RATE_LIMITED';
      } else {
        console.error(`❌ Erro HTTP ${status}:`, data);
      }
    } else if (error.request) {
      console.error('❌ Erro de rede:', error.message);
    } else {
      console.error('❌ Erro ao processar imagem:', error.message);
    }

    return null;
  }
}

async function processLimitedImages() {
  if (REMOVE_BG_API_KEY === 'SUA_API_KEY_AQUI') {
    console.error('❌ Por favor, configure sua API Key do Remove.bg!');
    return;
  }

  console.log('🔄 Processando imagens limitadas para economizar créditos...');
  console.log(`📊 Configuração: Máximo ${MAX_IMAGES_TO_PROCESS} imagens / ${MAX_PRODUCTS_TO_PROCESS} produtos`);

  let processedCount = 0;
  let creditsExhausted = false;

  try {
    // Buscar produtos com imagens originais
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    const productsWithOriginalImages = products.filter(product =>
      product.images.some(image => image.startsWith('http'))
    );

    console.log(`📊 Encontrados ${productsWithOriginalImages.length} produtos com imagens originais`);

    for (let i = 0; i < Math.min(productsWithOriginalImages.length, MAX_PRODUCTS_TO_PROCESS); i++) {
      const product = productsWithOriginalImages[i];
      console.log(`\n🔄 [${i + 1}/${Math.min(productsWithOriginalImages.length, MAX_PRODUCTS_TO_PROCESS)}] Processando: ${product.name}`);

      const processedImages = [];

      for (let j = 0; j < product.images.length; j++) {
        const imageUrl = product.images[j];

        if (imageUrl.startsWith('http') && processedCount < MAX_IMAGES_TO_PROCESS) {
          console.log(`  📸 Processando imagem ${j + 1}/${product.images.length} (${processedCount + 1}/${MAX_IMAGES_TO_PROCESS})...`);

          const processedImage = await processImageWithRemoveBg(imageUrl);

          if (processedImage === 'CREDITS_EXHAUSTED') {
            creditsExhausted = true;
            console.log(`  ⏸️  Parando processamento - créditos esgotados`);
            break;
          } else if (processedImage === 'INVALID_API_KEY') {
            console.log(`  ⏸️  Parando processamento - API key inválida`);
            break;
          } else if (processedImage === 'RATE_LIMITED') {
            console.log(`  ⏸️  Aguardando 5 segundos devido ao rate limit...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            j--; // Tentar novamente a mesma imagem
            continue;
          } else if (processedImage) {
            processedImages.push(processedImage);
            processedCount++;
            console.log(`  ✅ Imagem ${j + 1} processada com sucesso (${processedCount}/${MAX_IMAGES_TO_PROCESS})`);
          } else {
            console.log(`  ❌ Falha ao processar imagem ${j + 1}, mantendo original`);
            processedImages.push(imageUrl);
          }

          // Delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Já é uma imagem processada ou limite atingido
          processedImages.push(imageUrl);
        }
      }

      // Atualizar produto no banco
      if (processedImages.length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: processedImages,
            updatedAt: new Date()
          },
        });
        console.log(`  💾 Produto ${product.name} atualizado no banco`);
      }

      // Parar se os créditos acabaram ou limite atingido
      if (creditsExhausted || processedCount >= MAX_IMAGES_TO_PROCESS) {
        console.log(`\n⏸️  Processamento interrompido no produto ${i + 1}`);
        break;
      }
    }

    // Resumo final
    console.log('\n📋 RESUMO DO PROCESSAMENTO:');
    console.log(`   Imagens processadas: ${processedCount}/${MAX_IMAGES_TO_PROCESS}`);
    console.log(`   Produtos processados: ${Math.min(processedCount > 0 ? i + 1 : i, MAX_PRODUCTS_TO_PROCESS)}/${MAX_PRODUCTS_TO_PROCESS}`);

    if (creditsExhausted) {
      console.log('❌ PROCESSAMENTO INTERROMPIDO - Créditos esgotados');
    } else if (processedCount >= MAX_IMAGES_TO_PROCESS) {
      console.log('✅ LIMITE ATINGIDO - Processamento concluído conforme configurado');
    } else {
      console.log('🎉 PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  processLimitedImages();
}

module.exports = processLimitedImages;
