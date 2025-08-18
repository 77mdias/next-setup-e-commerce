const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupProcessedImages() {
  console.log('🔄 Fazendo backup das imagens processadas...');

  try {
    // Buscar todos os produtos com imagens
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
      },
    });

    // Filtrar produtos com imagens processadas (base64)
    const processedProducts = products.filter(product =>
      product.images.some(image => image.startsWith('data:image/'))
    );

    if (processedProducts.length === 0) {
      console.log('ℹ️  Nenhuma imagem processada encontrada.');
      return;
    }

    // Criar backup
    const backupData = {
      timestamp: new Date().toISOString(),
      totalProducts: processedProducts.length,
      products: processedProducts.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        processedImages: product.images.filter(image => image.startsWith('data:image/')),
        originalImages: product.images.filter(image => !image.startsWith('data:image/')),
      }))
    };

    // Salvar backup em arquivo
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `processed-images-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup salvo em: ${backupFile}`);
    console.log(`📊 Total de produtos com imagens processadas: ${processedProducts.length}`);

    return backupFile;
  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreProcessedImages(backupFile) {
  console.log('🔄 Restaurando imagens processadas...');

  try {
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Arquivo de backup não encontrado:', backupFile);
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    for (const productData of backupData.products) {
      if (productData.processedImages.length > 0) {
        await prisma.product.update({
          where: { id: productData.id },
          data: {
            images: productData.processedImages,
            updatedAt: new Date()
          },
        });

        console.log(`✅ Restaurado: ${productData.name} (${productData.processedImages.length} imagens)`);
      }
    }

    console.log(`🎉 Restauração concluída! ${backupData.products.length} produtos processados.`);
  } catch (error) {
    console.error('❌ Erro ao restaurar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar baseado no argumento
const command = process.argv[2];

if (command === 'backup') {
  backupProcessedImages();
} else if (command === 'restore') {
  const backupFile = process.argv[3];
  if (!backupFile) {
    console.error('❌ Por favor, forneça o caminho do arquivo de backup.');
    console.log('Uso: node backup-processed-images.js restore <caminho-do-backup>');
    process.exit(1);
  }
  restoreProcessedImages(backupFile);
} else {
  console.log('Uso:');
  console.log('  node backup-processed-images.js backup');
  console.log('  node backup-processed-images.js restore <caminho-do-backup>');
}
