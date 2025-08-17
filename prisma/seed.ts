/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
const { PrismaClient } = require("@prisma/client");

const prismaClient = new PrismaClient();

const main = async () => {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  console.log("🧹 Limpando dados existentes...");
  await prismaClient.review.deleteMany();
  await prismaClient.orderItem.deleteMany();
  await prismaClient.order.deleteMany();
  await prismaClient.stockMovement.deleteMany();
  await prismaClient.inventory.deleteMany();
  await prismaClient.productVariant.deleteMany();
  await prismaClient.product.deleteMany();
  await prismaClient.category.deleteMany();
  await prismaClient.brand.deleteMany();
  await prismaClient.store.deleteMany();
  await prismaClient.userSession.deleteMany();
  await prismaClient.user.deleteMany();

  // ===================================
  // 👤 CRIAR USUÁRIOS
  // ===================================
  console.log("👤 Criando usuários...");

  const adminUser = await prismaClient.user.create({
    data: {
      email: "admin@techstore.com",
      password: "$2b$10$K7L/8Y75aIqMbHy8CzNGCO.B8VnXk5G4nX9XzJ2K5L8Y75aIqMbHy8", // password123
      name: "Admin TechStore",
      phone: "(11) 99999-9999",
      role: "ADMIN",
      isActive: true,
    },
  });

  const sellerUser = await prismaClient.user.create({
    data: {
      email: "vendedor@techstore.com",
      password: "$2b$10$K7L/8Y75aIqMbHy8CzNGCO.B8VnXk5G4nX9XzJ2K5L8Y75aIqMbHy8", // password123
      name: "João Silva",
      phone: "(11) 98888-8888",
      role: "SELLER",
      isActive: true,
    },
  });

  // ===================================
  // 🏪 CRIAR LOJA
  // ===================================
  console.log("🏪 Criando loja...");

  const store = await prismaClient.store.create({
    data: {
      ownerId: adminUser.id,
      name: "TechStore - Eletrônicos e Periféricos",
      slug: "techstore",
      description:
        "Sua loja de confiança para eletrônicos, periféricos e componentes de computador. Produtos originais com garantia e melhor preço.",
      logoUrl:
        "https://via.placeholder.com/200x100/1f2937/ffffff?text=TechStore",
      bannerUrl:
        "https://via.placeholder.com/1200x400/3b82f6/ffffff?text=TechStore+Banner",
      phone: "(11) 3000-0000",
      email: "contato@techstore.com",
      cnpj: "12.345.678/0001-90",
      website: "https://techstore.com.br",
      shippingFee: 15.0,
      freeShipping: 199.0,
      processingTime: 2,
      isActive: true,
      rating: 4.8,
      totalSales: 1250,
    },
  });

  // ===================================
  // 🏷️ CRIAR MARCAS
  // ===================================
  console.log("🏷️ Criando marcas...");

  const brands = await Promise.all([
    // Processadores e Componentes
    prismaClient.brand.create({
      data: {
        name: "Intel",
        slug: "intel",
        logoUrl: "https://via.placeholder.com/150x75/0071c5/ffffff?text=Intel",
        website: "https://intel.com.br",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "AMD",
        slug: "amd",
        logoUrl: "https://via.placeholder.com/150x75/ed1c24/ffffff?text=AMD",
        website: "https://amd.com",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "NVIDIA",
        slug: "nvidia",
        logoUrl: "https://via.placeholder.com/150x75/76b900/ffffff?text=NVIDIA",
        website: "https://nvidia.com.br",
      },
    }),
    // Periféricos
    prismaClient.brand.create({
      data: {
        name: "Logitech",
        slug: "logitech",
        logoUrl:
          "https://via.placeholder.com/150x75/00b8d4/ffffff?text=Logitech",
        website: "https://logitech.com.br",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "Razer",
        slug: "razer",
        logoUrl: "https://via.placeholder.com/150x75/00ff00/000000?text=Razer",
        website: "https://razer.com",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "Corsair",
        slug: "corsair",
        logoUrl:
          "https://via.placeholder.com/150x75/ffcc00/000000?text=Corsair",
        website: "https://corsair.com",
      },
    }),
    // Smartphones e Tablets
    prismaClient.brand.create({
      data: {
        name: "Apple",
        slug: "apple",
        logoUrl: "https://via.placeholder.com/150x75/000000/ffffff?text=Apple",
        website: "https://apple.com.br",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "Samsung",
        slug: "samsung",
        logoUrl:
          "https://via.placeholder.com/150x75/1428a0/ffffff?text=Samsung",
        website: "https://samsung.com.br",
      },
    }),
    // Notebooks
    prismaClient.brand.create({
      data: {
        name: "Dell",
        slug: "dell",
        logoUrl: "https://via.placeholder.com/150x75/007db8/ffffff?text=Dell",
        website: "https://dell.com.br",
      },
    }),
    prismaClient.brand.create({
      data: {
        name: "ASUS",
        slug: "asus",
        logoUrl: "https://via.placeholder.com/150x75/000000/ffffff?text=ASUS",
        website: "https://asus.com.br",
      },
    }),
  ]);

  const [
    intel,
    amd,
    nvidia,
    logitech,
    razer,
    corsair,
    apple,
    samsung,
    dell,
    asus,
  ] = brands;

  // ===================================
  // 📱 CRIAR CATEGORIAS
  // ===================================
  console.log("📱 Criando categorias...");

  // Categorias principais
  const computadores = await prismaClient.category.create({
    data: {
      name: "Computadores",
      slug: "computadores",
      description: "Notebooks, desktops e workstations",
      imageUrl:
        "https://via.placeholder.com/300x200/3b82f6/ffffff?text=Computadores",
      iconUrl: "💻",
      sortOrder: 1,
    },
  });

  const componentes = await prismaClient.category.create({
    data: {
      name: "Componentes",
      slug: "componentes",
      description: "Processadores, placas de vídeo, memórias e mais",
      imageUrl:
        "https://via.placeholder.com/300x200/10b981/ffffff?text=Componentes",
      iconUrl: "🔧",
      sortOrder: 2,
    },
  });

  const perifericos = await prismaClient.category.create({
    data: {
      name: "Periféricos",
      slug: "perifericos",
      description: "Mouse, teclado, headset, webcam",
      imageUrl:
        "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Periféricos",
      iconUrl: "🖱️",
      sortOrder: 3,
    },
  });

  const smartphones = await prismaClient.category.create({
    data: {
      name: "Smartphones",
      slug: "smartphones",
      description: "Celulares e acessórios",
      imageUrl:
        "https://via.placeholder.com/300x200/ef4444/ffffff?text=Smartphones",
      iconUrl: "📱",
      sortOrder: 4,
    },
  });

  // Subcategorias
  const notebooks = await prismaClient.category.create({
    data: {
      parentId: computadores.id,
      name: "Notebooks",
      slug: "notebooks",
      description: "Notebooks para trabalho, estudo e gaming",
      sortOrder: 1,
    },
  });

  const processadores = await prismaClient.category.create({
    data: {
      parentId: componentes.id,
      name: "Processadores",
      slug: "processadores",
      description: "CPUs Intel e AMD",
      sortOrder: 1,
    },
  });

  const placasVideo = await prismaClient.category.create({
    data: {
      parentId: componentes.id,
      name: "Placas de Vídeo",
      slug: "placas-de-video",
      description: "GPUs para gaming e trabalho profissional",
      sortOrder: 2,
    },
  });

  const mouses = await prismaClient.category.create({
    data: {
      parentId: perifericos.id,
      name: "Mouses",
      slug: "mouses",
      description: "Mouses para escritório e gaming",
      sortOrder: 1,
    },
  });

  const teclados = await prismaClient.category.create({
    data: {
      parentId: perifericos.id,
      name: "Teclados",
      slug: "teclados",
      description: "Teclados mecânicos e de membrana",
      sortOrder: 2,
    },
  });

  const headsets = await prismaClient.category.create({
    data: {
      parentId: perifericos.id,
      name: "Headsets",
      slug: "headsets",
      description: "Headsets para gaming e trabalho",
      sortOrder: 3,
    },
  });

  // ===================================
  // 💻 CRIAR PRODUTOS
  // ===================================
  console.log("💻 Criando produtos...");

  // PROCESSADORES
  const i713700k = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: intel.id,
      categoryId: processadores.id,
      sku: "INTEL-I7-13700K",
      name: "Processador Intel Core i7-13700K",
      description:
        "Processador Intel Core i7-13700K de 13ª geração com 16 núcleos (8P+8E) e 24 threads. Frequência base de 3.4GHz e boost de até 5.4GHz. Ideal para gaming e produtividade.",
      shortDesc: "Intel i7-13700K - 16 núcleos, até 5.4GHz",
      price: 2199.99,
      originalPrice: 2499.99,
      images: [
        "https://via.placeholder.com/600x600/0071c5/ffffff?text=Intel+i7-13700K",
        "https://via.placeholder.com/600x600/0071c5/ffffff?text=Intel+Box",
      ],
      specifications: {
        cores: 16,
        threads: 24,
        baseFrequency: "3.4GHz",
        boostFrequency: "5.4GHz",
        cache: "30MB",
        socket: "LGA1700",
        tdp: "125W",
        architecture: "Raptor Lake",
        lithography: "Intel 7",
        integratedGraphics: "Intel UHD Graphics 770",
        memorySupport: ["DDR4-3200", "DDR5-5600"],
        pcieLanes: 20,
      },
      warranty: "3 anos",
      weight: 0.5,
      dimensions: { length: 10, width: 10, height: 5 },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.8,
      reviewCount: 156,
      soldCount: 89,
      viewCount: 2340,
    },
  });

  const ryzen97900x = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: amd.id,
      categoryId: processadores.id,
      sku: "AMD-RYZEN-9-7900X",
      name: "Processador AMD Ryzen 9 7900X",
      description:
        "Processador AMD Ryzen 9 7900X com 12 núcleos e 24 threads. Arquitetura Zen 4 com frequência base de 4.7GHz e boost de até 5.6GHz. Perfeito para gaming e criação de conteúdo.",
      shortDesc: "AMD Ryzen 9 7900X - 12 núcleos, até 5.6GHz",
      price: 2899.99,
      images: [
        "https://via.placeholder.com/600x600/ed1c24/ffffff?text=AMD+Ryzen+9+7900X",
        "https://via.placeholder.com/600x600/ed1c24/ffffff?text=AMD+Box",
      ],
      specifications: {
        cores: 12,
        threads: 24,
        baseFrequency: "4.7GHz",
        boostFrequency: "5.6GHz",
        cache: "76MB",
        socket: "AM5",
        tdp: "170W",
        architecture: "Zen 4",
        lithography: "5nm",
        integratedGraphics: "AMD Radeon Graphics",
        memorySupport: ["DDR5-5200"],
        pcieLanes: 28,
      },
      warranty: "3 anos",
      weight: 0.3,
      dimensions: { length: 8, width: 8, height: 3 },
      isActive: true,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 203,
      soldCount: 134,
      viewCount: 3120,
    },
  });

  // PLACAS DE VÍDEO
  const rtx4080 = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: nvidia.id,
      categoryId: placasVideo.id,
      sku: "NVIDIA-RTX-4080",
      name: "Placa de Vídeo NVIDIA GeForce RTX 4080 16GB",
      description:
        "Placa de vídeo NVIDIA GeForce RTX 4080 com 16GB GDDR6X. Arquitetura Ada Lovelace com Ray Tracing de 3ª geração e DLSS 3. Ideal para gaming em 4K e trabalhos profissionais.",
      shortDesc: "RTX 4080 16GB - Ray Tracing e DLSS 3",
      price: 6999.99,
      originalPrice: 7499.99,
      images: [
        "https://via.placeholder.com/600x600/76b900/ffffff?text=RTX+4080",
        "https://via.placeholder.com/600x600/76b900/ffffff?text=RTX+Side+View",
      ],
      specifications: {
        gpu: "AD103",
        cudaCores: 9728,
        rtCores: "3rd Gen",
        tensorCores: "4th Gen",
        baseClockMHz: 2205,
        boostClockMHz: 2505,
        memorySize: "16GB",
        memoryType: "GDDR6X",
        memoryBus: "256-bit",
        memoryBandwidth: "716.8 GB/s",
        pciInterface: "PCIe 4.0 x16",
        powerConnectors: "3x 8-pin",
        recommendedPSU: "750W",
        maxDisplays: 4,
        ports: ["3x DisplayPort 1.4a", "1x HDMI 2.1"],
        directxSupport: "12 Ultimate",
        vulkanSupport: "1.3",
      },
      warranty: "3 anos",
      weight: 2.2,
      dimensions: { length: 304, width: 137, height: 61 },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.7,
      reviewCount: 89,
      soldCount: 45,
      viewCount: 1890,
    },
  });

  // NOTEBOOKS
  const dellXps13 = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: dell.id,
      categoryId: notebooks.id,
      sku: "DELL-XPS-13-9320",
      name: "Notebook Dell XPS 13 9320",
      description:
        'Notebook Dell XPS 13 com tela InfinityEdge de 13.4" FHD+, processador Intel Core i7-1260P, 16GB RAM, SSD 512GB. Design premium e ultraportátil.',
      shortDesc: "Dell XPS 13 - i7, 16GB, SSD 512GB",
      price: 8999.99,
      originalPrice: 9999.99,
      images: [
        "https://via.placeholder.com/600x600/007db8/ffffff?text=Dell+XPS+13",
        "https://via.placeholder.com/600x600/007db8/ffffff?text=XPS+13+Open",
        "https://via.placeholder.com/600x600/007db8/ffffff?text=XPS+13+Side",
      ],
      specifications: {
        processor: "Intel Core i7-1260P",
        cores: 12,
        threads: 16,
        baseFrequency: "2.1GHz",
        boostFrequency: "4.7GHz",
        memory: "16GB LPDDR5",
        storage: "512GB NVMe SSD",
        display: '13.4" FHD+ (1920x1200) InfinityEdge',
        graphics: "Intel Iris Xe Graphics",
        operatingSystem: "Windows 11 Home",
        connectivity: ["Wi-Fi 6E", "Bluetooth 5.2"],
        ports: ["2x Thunderbolt 4", "3.5mm audio"],
        battery: "52Wh",
        batteryLife: "até 12 horas",
        weight: "1.27kg",
        color: "Platinum Silver",
      },
      warranty: "1 ano",
      weight: 1.27,
      dimensions: { length: 296, width: 199, height: 15 },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.6,
      reviewCount: 124,
      soldCount: 67,
      viewCount: 2156,
    },
  });

  const asusRogStrix = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: asus.id,
      categoryId: notebooks.id,
      sku: "ASUS-ROG-STRIX-G15",
      name: "Notebook Gamer ASUS ROG Strix G15",
      description:
        'Notebook gamer ASUS ROG Strix G15 com AMD Ryzen 7 6800H, RTX 3070 Ti, 16GB RAM, SSD 1TB, tela 15.6" 300Hz. Perfeito para gaming competitivo.',
      shortDesc: "ASUS ROG Strix G15 - Ryzen 7, RTX 3070 Ti",
      price: 7499.99,
      images: [
        "https://via.placeholder.com/600x600/000000/ff0000?text=ASUS+ROG+Strix",
        "https://via.placeholder.com/600x600/000000/ff0000?text=ROG+Gaming",
      ],
      specifications: {
        processor: "AMD Ryzen 7 6800H",
        cores: 8,
        threads: 16,
        baseFrequency: "3.2GHz",
        boostFrequency: "4.7GHz",
        memory: "16GB DDR5-4800",
        storage: "1TB NVMe SSD",
        display: '15.6" FHD (1920x1080) 300Hz IPS',
        graphics: "NVIDIA RTX 3070 Ti 8GB",
        operatingSystem: "Windows 11 Home",
        connectivity: ["Wi-Fi 6E", "Bluetooth 5.2", "Ethernet"],
        ports: ["3x USB 3.2", "1x USB-C", "HDMI 2.1", "3.5mm audio"],
        keyboard: "RGB Backlit Gaming",
        cooling: "ROG Intelligent Cooling",
        battery: "90Wh",
        weight: "2.3kg",
        color: "Eclipse Gray",
      },
      warranty: "1 ano",
      weight: 2.3,
      dimensions: { length: 354, width: 259, height: 23 },
      isActive: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 198,
      soldCount: 89,
      viewCount: 3456,
    },
  });

  // PERIFÉRICOS - MOUSES
  const logitechMxMaster3s = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: logitech.id,
      categoryId: mouses.id,
      sku: "LOGITECH-MX-MASTER-3S",
      name: "Mouse Logitech MX Master 3S",
      description:
        "Mouse wireless Logitech MX Master 3S com sensor de 8000 DPI, conexão via Bluetooth ou receptor USB, bateria de até 70 dias. Ideal para produtividade.",
      shortDesc: "Logitech MX Master 3S - 8000 DPI, 70 dias bateria",
      price: 549.99,
      originalPrice: 649.99,
      images: [
        "https://via.placeholder.com/600x600/00b8d4/ffffff?text=MX+Master+3S",
        "https://via.placeholder.com/600x600/00b8d4/ffffff?text=MX+Side+View",
      ],
      specifications: {
        sensor: "Darkfield High Precision",
        dpi: "200-8000",
        buttons: 7,
        connectivity: ["Bluetooth LE", "Logitech Bolt", "USB-A receiver"],
        battery: "até 70 dias",
        charging: "USB-C",
        quickCharge: "3 min = 3 horas uso",
        compatibility: ["Windows", "macOS", "Linux", "ChromeOS"],
        software: "Logitech Options+",
        scrollWheel: "MagSpeed Electromagnetic",
        thumbWheel: "Side scroll wheel",
        weight: "141g",
        dimensions: "125.9 × 84.3 × 51mm",
      },
      warranty: "2 anos",
      weight: 0.141,
      dimensions: { length: 125.9, width: 84.3, height: 51 },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.9,
      reviewCount: 267,
      soldCount: 189,
      viewCount: 1876,
    },
  });

  const razerDeathAdderV3 = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: razer.id,
      categoryId: mouses.id,
      sku: "RAZER-DEATHADDER-V3",
      name: "Mouse Gamer Razer DeathAdder V3",
      description:
        "Mouse gamer Razer DeathAdder V3 com sensor Focus Pro 30K, switches ópticos Razer, design ergonômico. Perfeito para gaming competitivo.",
      shortDesc: "Razer DeathAdder V3 - 30000 DPI, switches ópticos",
      price: 399.99,
      images: [
        "https://via.placeholder.com/600x600/00ff00/000000?text=Razer+DeathAdder",
        "https://via.placeholder.com/600x600/00ff00/000000?text=Gaming+Mouse",
      ],
      specifications: {
        sensor: "Focus Pro 30K",
        dpi: "100-30000",
        ips: "750",
        acceleration: "50G",
        buttons: 8,
        switches: "Razer Optical Mouse Switches Gen-3",
        connectivity: "USB-A",
        cable: "SpeedFlex Cable",
        lighting: "Razer Chroma RGB",
        onboardMemory: "5 profiles",
        software: "Razer Synapse 3",
        weight: "59g",
        dimensions: "127.8 × 68 × 42.7mm",
        grip: "Palm/Claw",
      },
      warranty: "2 anos",
      weight: 0.059,
      dimensions: { length: 127.8, width: 68, height: 42.7 },
      isActive: true,
      isFeatured: true,
      rating: 4.7,
      reviewCount: 145,
      soldCount: 98,
      viewCount: 2234,
    },
  });

  // TECLADOS
  const corsairK95 = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: corsair.id,
      categoryId: teclados.id,
      sku: "CORSAIR-K95-RGB-PLATINUM-XT",
      name: "Teclado Mecânico Corsair K95 RGB Platinum XT",
      description:
        "Teclado mecânico gamer Corsair K95 RGB Platinum XT com switches Cherry MX Speed, RGB dinâmico, teclas macro dedicadas e apoio para punho.",
      shortDesc: "Corsair K95 RGB - Cherry MX Speed, RGB",
      price: 1299.99,
      originalPrice: 1499.99,
      images: [
        "https://via.placeholder.com/600x600/ffcc00/000000?text=Corsair+K95",
        "https://via.placeholder.com/600x600/ffcc00/000000?text=RGB+Keyboard",
      ],
      specifications: {
        layout: "ABNT2 (Português BR)",
        switches: "Cherry MX Speed Silver",
        actuation: "1.2mm",
        force: "45g",
        backlighting: "Per-key RGB LED",
        macroKeys: "6 dedicated G-keys",
        mediaControls: "Dedicated volume wheel",
        connectivity: "USB 2.0",
        polling: "1000Hz",
        nkro: "Full N-Key Rollover",
        software: "Corsair iCUE",
        construction: "Aircraft-grade aluminum frame",
        wristRest: "Detachable soft-touch",
        cable: "1.8m braided USB",
        dimensions: "465 × 170 × 38mm",
      },
      warranty: "2 anos",
      weight: 1.37,
      dimensions: { length: 465, width: 170, height: 38 },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.8,
      reviewCount: 89,
      soldCount: 56,
      viewCount: 1567,
    },
  });

  // HEADSETS
  const corsairHS80 = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: corsair.id,
      categoryId: headsets.id,
      sku: "CORSAIR-HS80-RGB-WIRELESS",
      name: "Headset Gamer Corsair HS80 RGB Wireless",
      description:
        "Headset gamer wireless Corsair HS80 RGB com drivers de 50mm, cancelamento de ruído, bateria de 20 horas e RGB customizável.",
      shortDesc: "Corsair HS80 RGB - Wireless, 20h bateria",
      price: 899.99,
      images: [
        "https://via.placeholder.com/600x600/ffcc00/000000?text=Corsair+HS80",
        "https://via.placeholder.com/600x600/ffcc00/000000?text=Gaming+Headset",
      ],
      specifications: {
        drivers: "Custom tuned 50mm neodymium",
        frequency: "20Hz - 40kHz",
        impedance: "32 Ohms",
        sensitivity: "111 dB",
        microphone: "Omnidirectional, detachable",
        micFrequency: "100Hz - 10kHz",
        connectivity: ["2.4GHz wireless", "3.5mm analog"],
        battery: "até 20 horas",
        charging: "USB-C",
        range: "até 18 metros",
        compatibility: ["PC", "PlayStation", "Nintendo Switch", "Mobile"],
        software: "Corsair iCUE",
        lighting: "RGB zones",
        weight: "370g",
        construction: "Memory foam ear pads, adjustable headband",
      },
      warranty: "2 anos",
      weight: 0.37,
      dimensions: { length: 192, width: 98, height: 210 },
      isActive: true,
      isFeatured: true,
      rating: 4.6,
      reviewCount: 112,
      soldCount: 78,
      viewCount: 1789,
    },
  });

  // SMARTPHONES
  const iphone15Pro = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: apple.id,
      categoryId: smartphones.id,
      sku: "APPLE-IPHONE-15-PRO-128GB",
      name: "iPhone 15 Pro 128GB",
      description:
        'iPhone 15 Pro com chip A17 Pro, câmera tripla de 48MP, tela Super Retina XDR de 6.1", USB-C e construção em titânio. O smartphone mais avançado da Apple.',
      shortDesc: "iPhone 15 Pro - A17 Pro, 48MP, USB-C",
      price: 8999.99,
      images: [
        "https://via.placeholder.com/600x600/000000/ffffff?text=iPhone+15+Pro",
        "https://via.placeholder.com/600x600/000000/ffffff?text=iPhone+Camera",
      ],
      specifications: {
        chip: "A17 Pro",
        process: "3nm",
        display: '6.1" Super Retina XDR OLED',
        resolution: "2556 × 1179 pixels",
        brightness: "1000 nits (typical), 2000 nits (peak)",
        storage: "128GB",
        mainCamera: "48MP Main, 12MP Ultra Wide, 12MP Telephoto",
        frontCamera: "12MP TrueDepth",
        video: "4K Dolby Vision até 60fps",
        connectivity: ["5G", "Wi-Fi 6E", "Bluetooth 5.3"],
        ports: "USB-C",
        battery: "até 23 horas de vídeo",
        charging: ["MagSafe wireless", "Qi wireless", "USB-C wired"],
        operatingSystem: "iOS 17",
        construction: "Grade 5 Titanium",
        waterResistance: "IP68",
        colors: [
          "Natural Titanium",
          "Blue Titanium",
          "White Titanium",
          "Black Titanium",
        ],
      },
      warranty: "1 ano",
      weight: 0.187,
      dimensions: { length: 146.6, width: 70.6, height: 8.25 },
      isActive: true,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 234,
      soldCount: 156,
      viewCount: 4567,
    },
  });

  const galaxyS24Ultra = await prismaClient.product.create({
    data: {
      storeId: store.id,
      brandId: samsung.id,
      categoryId: smartphones.id,
      sku: "SAMSUNG-GALAXY-S24-ULTRA-256GB",
      name: "Samsung Galaxy S24 Ultra 256GB",
      description:
        'Samsung Galaxy S24 Ultra com Snapdragon 8 Gen 3, câmera de 200MP, S Pen integrada, tela Dynamic AMOLED 2X de 6.8" e bateria de 5000mAh.',
      shortDesc: 'Galaxy S24 Ultra - 200MP, S Pen, 6.8"',
      price: 7499.99,
      images: [
        "https://via.placeholder.com/600x600/1428a0/ffffff?text=Galaxy+S24+Ultra",
        "https://via.placeholder.com/600x600/1428a0/ffffff?text=S+Pen",
      ],
      specifications: {
        processor: "Snapdragon 8 Gen 3 for Galaxy",
        display: '6.8" Dynamic AMOLED 2X',
        resolution: "3120 × 1440 pixels",
        refreshRate: "1-120Hz adaptive",
        brightness: "2600 nits peak",
        storage: "256GB",
        ram: "12GB",
        mainCamera:
          "200MP Main, 50MP Periscope Telephoto, 10MP Telephoto, 12MP Ultra Wide",
        frontCamera: "12MP",
        zoom: "100x Space Zoom",
        video: "8K at 30fps, 4K at 120fps",
        battery: "5000mAh",
        charging: [
          "45W Super Fast Charging",
          "15W Wireless",
          "4.5W Reverse Wireless",
        ],
        connectivity: ["5G", "Wi-Fi 7", "Bluetooth 5.3"],
        operatingSystem: "Android 14 with One UI 6.1",
        sPen: "Built-in S Pen",
        construction: "Armor Aluminum frame, Gorilla Glass Victus 2",
        waterResistance: "IP68",
        colors: [
          "Titanium Gray",
          "Titanium Black",
          "Titanium Violet",
          "Titanium Yellow",
        ],
      },
      warranty: "1 ano",
      weight: 0.232,
      dimensions: { length: 162.3, width: 79, height: 8.6 },
      isActive: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 189,
      soldCount: 123,
      viewCount: 3456,
    },
  });

  console.log("💻 Produtos criados com sucesso!");

  // ===================================
  // 🎨 CRIAR VARIAÇÕES DE PRODUTOS
  // ===================================
  console.log("🎨 Criando variações de produtos...");

  // Variações para iPhone 15 Pro
  await Promise.all([
    prismaClient.productVariant.create({
      data: {
        productId: iphone15Pro.id,
        name: "Cor",
        value: "Titânio Natural",
        sku: "IPHONE-15-PRO-128GB-NATURAL",
        stock: 25,
      },
    }),
    prismaClient.productVariant.create({
      data: {
        productId: iphone15Pro.id,
        name: "Cor",
        value: "Titânio Azul",
        sku: "IPHONE-15-PRO-128GB-BLUE",
        stock: 18,
      },
    }),
    prismaClient.productVariant.create({
      data: {
        productId: iphone15Pro.id,
        name: "Cor",
        value: "Titânio Branco",
        sku: "IPHONE-15-PRO-128GB-WHITE",
        stock: 22,
      },
    }),
    prismaClient.productVariant.create({
      data: {
        productId: iphone15Pro.id,
        name: "Cor",
        value: "Titânio Preto",
        sku: "IPHONE-15-PRO-128GB-BLACK",
        stock: 30,
      },
    }),
  ]);

  // Variações para Galaxy S24 Ultra
  await Promise.all([
    prismaClient.productVariant.create({
      data: {
        productId: galaxyS24Ultra.id,
        name: "Cor",
        value: "Titânio Cinza",
        sku: "GALAXY-S24-ULTRA-256GB-GRAY",
        stock: 20,
      },
    }),
    prismaClient.productVariant.create({
      data: {
        productId: galaxyS24Ultra.id,
        name: "Cor",
        value: "Titânio Preto",
        sku: "GALAXY-S24-ULTRA-256GB-BLACK",
        stock: 28,
      },
    }),
    prismaClient.productVariant.create({
      data: {
        productId: galaxyS24Ultra.id,
        name: "Cor",
        value: "Titânio Violeta",
        sku: "GALAXY-S24-ULTRA-256GB-VIOLET",
        stock: 15,
      },
    }),
  ]);

  // ===================================
  // 📦 CRIAR ESTOQUE
  // ===================================
  console.log("📦 Criando estoque...");

  const products = [
    i713700k,
    ryzen97900x,
    rtx4080,
    dellXps13,
    asusRogStrix,
    logitechMxMaster3s,
    razerDeathAdderV3,
    corsairK95,
    corsairHS80,
    iphone15Pro,
    galaxyS24Ultra,
  ];

  for (const product of products) {
    await prismaClient.inventory.create({
      data: {
        productId: product.id,
        storeId: store.id,
        quantity: Math.floor(Math.random() * 50) + 10, // 10-60 unidades
        minStock: 5,
        maxStock: 100,
        location: "Estoque Principal",
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log(`📊 Criados:`);
  console.log(`  👤 2 usuários`);
  console.log(`  🏪 1 loja`);
  console.log(`  🏷️ ${brands.length} marcas`);
  console.log(`  📱 10 categorias`);
  console.log(`  💻 ${products.length} produtos`);
  console.log(`  🎨 7 variações`);
  console.log(`  📦 ${products.length} registros de estoque`);
};

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
