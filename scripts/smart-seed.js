const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function smartSeed() {
  console.log('🧠 Executando Smart Seed (preserva imagens processadas)...');

  try {
    // 1. Fazer backup das imagens processadas ANTES de limpar
    console.log('📦 Fazendo backup das imagens processadas...');
    const processedImages = new Map();

    const existingProducts = await prisma.product.findMany({
      select: {
        sku: true, // Usar SKU como chave única
        images: true,
      },
    });

    existingProducts.forEach(product => {
      const processed = product.images.filter(img => img.startsWith('data:image/'));
      if (processed.length > 0) {
        processedImages.set(product.sku, processed);
        console.log(`📸 Backup: ${product.sku} (${processed.length} imagens processadas)`);
      }
    });

    console.log(`✅ Backup concluído: ${processedImages.size} produtos com imagens processadas`);

    // 2. Executar o seed normal
    console.log('🌱 Executando seed padrão...');

    // Importar e executar o seed original
    delete require.cache[require.resolve('../prisma/seed.ts')];
    const originalSeed = require('../prisma/seed.ts');

    // Se o seed exportar uma função main, executá-la
    if (typeof originalSeed === 'function') {
      await originalSeed();
    }

    // 3. Restaurar imagens processadas
    if (processedImages.size > 0) {
      console.log('🔄 Restaurando imagens processadas...');

      for (const [sku, images] of processedImages) {
        try {
          const updatedProduct = await prisma.product.update({
            where: { sku: sku },
            data: {
              images: images,
              updatedAt: new Date()
            },
          });
          console.log(`✅ Restaurado: ${sku} (${images.length} imagens)`);
        } catch (error) {
          console.log(`⚠️  Produto não encontrado para restaurar: ${sku}`);
        }
      }

      console.log(`🎉 Restauração concluída! ${processedImages.size} produtos processados.`);
    }

    console.log('✅ Smart Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no Smart Seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  smartSeed();
}

module.exports = smartSeed;
