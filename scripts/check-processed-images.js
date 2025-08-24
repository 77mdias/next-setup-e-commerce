const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProcessedImages() {
  console.log('🔍 Verificando status das imagens no banco...\n');

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    let totalImages = 0;
    let processedImages = 0;
    let originalImages = 0;
    let productsWithProcessedImages = 0;
    let productsWithOriginalImages = 0;

    products.forEach(product => {
      let hasProcessed = false;
      let hasOriginal = false;

      product.images.forEach(image => {
        totalImages++;

        if (image.startsWith('data:image')) {
          processedImages++;
          hasProcessed = true;
        } else if (image.startsWith('http')) {
          originalImages++;
          hasOriginal = true;
        }
      });

      if (hasProcessed) productsWithProcessedImages++;
      if (hasOriginal) productsWithOriginalImages++;
    });

    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Total de produtos: ${products.length}`);
    console.log(`   Produtos com imagens processadas: ${productsWithProcessedImages}`);
    console.log(`   Produtos com imagens originais: ${productsWithOriginalImages}`);
    console.log(`   Total de imagens: ${totalImages}`);
    console.log(`   Imagens processadas: ${processedImages}`);
    console.log(`   Imagens originais: ${originalImages}`);
    console.log(`   Porcentagem processada: ${((processedImages / totalImages) * 100).toFixed(1)}%`);

    if (originalImages > 0) {
      console.log('\n⚠️  ATENÇÃO:');
      console.log(`   Ainda existem ${originalImages} imagens originais que precisam ser processadas`);
      console.log(`   Isso vai consumir ${originalImages} créditos do Remove.bg`);

      if (originalImages > 50) {
        console.log('\n💡 SUGESTÃO:');
        console.log('   Considere processar apenas alguns produtos por vez para economizar créditos');
      }
    } else {
      console.log('\n✅ TODAS AS IMAGENS JÁ ESTÃO PROCESSADAS!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar imagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkProcessedImages();
}

module.exports = checkProcessedImages;
