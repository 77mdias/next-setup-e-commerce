const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');

const prisma = new PrismaClient();

// CONFIGURE SUA API KEY AQUI
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || 'SUA_API_KEY_AQUI';

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
        console.error('   Você precisa adicionar mais créditos na sua conta do Remove.bg');
        return 'CREDITS_EXHAUSTED';
      } else if (status === 401) {
        console.error('❌ API KEY INVÁLIDA! Erro 401 - Unauthorized');
        console.error('   Verifique se sua API key está correta');
        return 'INVALID_API_KEY';
      } else if (status === 429) {
        console.error('⚠️  RATE LIMIT EXCEDIDO! Erro 429 - Too Many Requests');
        console.error('   Aguarde um pouco antes de tentar novamente');
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

async function reprocessAllImages() {
  if (REMOVE_BG_API_KEY === 'SUA_API_KEY_AQUI') {
    console.error('❌ Por favor, configure sua API Key do Remove.bg!');
    console.log('Defina a variável de ambiente REMOVE_BG_API_KEY ou edite o script.');
    return;
  }

  console.log('🔄 Reprocessando todas as imagens automaticamente...');
  console.log(`🔑 Usando API Key: ${REMOVE_BG_API_KEY.substring(0, 10)}...`);

  let creditsExhausted = false;
  let invalidApiKey = false;
  let rateLimited = false;

  try {
    // Buscar todos os produtos com imagens originais (URLs)
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
      },
    });

    const productsWithOriginalImages = products.filter(product =>
      product.images.some(image => image.startsWith('http'))
    );

    console.log(`📊 Encontrados ${productsWithOriginalImages.length} produtos para reprocessar`);

    for (let i = 0; i < productsWithOriginalImages.length; i++) {
      const product = productsWithOriginalImages[i];
      console.log(`\n🔄 [${i + 1}/${productsWithOriginalImages.length}] Processando: ${product.name}`);

      const processedImages = [];

      for (let j = 0; j < product.images.length; j++) {
        const imageUrl = product.images[j];

        if (imageUrl.startsWith('http')) {
          console.log(`  📸 Processando imagem ${j + 1}/${product.images.length}...`);

          const processedImage = await processImageWithRemoveBg(imageUrl);

          if (processedImage === 'CREDITS_EXHAUSTED') {
            creditsExhausted = true;
            console.log(`  ⏸️  Parando processamento - créditos esgotados`);
            break;
          } else if (processedImage === 'INVALID_API_KEY') {
            invalidApiKey = true;
            console.log(`  ⏸️  Parando processamento - API key inválida`);
            break;
          } else if (processedImage === 'RATE_LIMITED') {
            rateLimited = true;
            console.log(`  ⏸️  Aguardando 5 segundos devido ao rate limit...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            j--; // Tentar novamente a mesma imagem
            continue;
          } else if (processedImage) {
            processedImages.push(processedImage);
            console.log(`  ✅ Imagem ${j + 1} processada com sucesso`);
          } else {
            console.log(`  ❌ Falha ao processar imagem ${j + 1}, mantendo original`);
            processedImages.push(imageUrl);
          }

          // Delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Já é uma imagem processada
          processedImages.push(imageUrl);
        }
      }

      // Atualizar produto no banco apenas se processou alguma imagem
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

      // Parar se os créditos acabaram
      if (creditsExhausted || invalidApiKey) {
        console.log(`\n⏸️  Processamento interrompido no produto ${i + 1}/${productsWithOriginalImages.length}`);
        break;
      }
    }

    // Resumo final
    console.log('\n📋 RESUMO DO PROCESSAMENTO:');
    if (creditsExhausted) {
      console.log('❌ PROCESSAMENTO INTERROMPIDO - Créditos esgotados');
      console.log('💡 Solução: Adicione mais créditos na sua conta do Remove.bg');
    } else if (invalidApiKey) {
      console.log('❌ PROCESSAMENTO INTERROMPIDO - API Key inválida');
      console.log('💡 Solução: Verifique sua API key do Remove.bg');
    } else if (rateLimited) {
      console.log('⚠️  PROCESSAMENTO COMPLETO - Algumas imagens foram rate limited');
    } else {
      console.log('🎉 REPROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro no reprocessamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  reprocessAllImages();
}

module.exports = reprocessAllImages;
