/* eslint-disable no-console */
const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL || "e2e.customer@nextstore.local";
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD || "E2eCheckout#123";
const E2E_STORE_SLUG = process.env.E2E_STORE_SLUG || "nextstore-e2e";
const E2E_BRAND_SLUG = process.env.E2E_BRAND_SLUG || "e2e-brand";
const E2E_CATEGORY_SLUG = process.env.E2E_CATEGORY_SLUG || "e2e-category";
const E2E_PRODUCT_SKU = process.env.E2E_PRODUCT_SKU || "E2E-CHECKOUT-001";

async function upsertUser() {
  const passwordHash = await bcrypt.hash(E2E_USER_PASSWORD, 12);

  return prisma.user.upsert({
    where: {
      email: E2E_USER_EMAIL,
    },
    update: {
      name: "E2E Checkout User",
      password: passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      email: E2E_USER_EMAIL,
      name: "E2E Checkout User",
      password: passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: new Date(),
    },
  });
}

async function upsertStore(ownerId) {
  return prisma.store.upsert({
    where: {
      slug: E2E_STORE_SLUG,
    },
    update: {
      ownerId,
      name: "NeXT Store E2E",
      description: "Store dedicated to deterministic E2E checkout scenarios.",
      phone: "(11) 90000-0000",
      email: "e2e-store@nextstore.local",
      shippingFee: 15,
      freeShipping: 199,
      processingTime: 1,
      isActive: true,
      rating: 5,
      totalSales: 0,
    },
    create: {
      ownerId,
      slug: E2E_STORE_SLUG,
      name: "NeXT Store E2E",
      description: "Store dedicated to deterministic E2E checkout scenarios.",
      phone: "(11) 90000-0000",
      email: "e2e-store@nextstore.local",
      shippingFee: 15,
      freeShipping: 199,
      processingTime: 1,
      isActive: true,
      rating: 5,
      totalSales: 0,
    },
  });
}

async function upsertBrand() {
  return prisma.brand.upsert({
    where: {
      slug: E2E_BRAND_SLUG,
    },
    update: {
      name: "E2E Brand",
      isActive: true,
    },
    create: {
      name: "E2E Brand",
      slug: E2E_BRAND_SLUG,
      isActive: true,
    },
  });
}

async function upsertCategory() {
  return prisma.category.upsert({
    where: {
      slug: E2E_CATEGORY_SLUG,
    },
    update: {
      name: "E2E Category",
      description: "Category used by deterministic E2E scenarios.",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      name: "E2E Category",
      slug: E2E_CATEGORY_SLUG,
      description: "Category used by deterministic E2E scenarios.",
      sortOrder: 1,
      isActive: true,
    },
  });
}

async function upsertProduct(params) {
  return prisma.product.upsert({
    where: {
      sku: E2E_PRODUCT_SKU,
    },
    update: {
      storeId: params.storeId,
      brandId: params.brandId,
      categoryId: params.categoryId,
      name: "E2E Checkout Headset",
      description:
        "Produto dedicado para validar o fluxo critico de checkout em E2E.",
      shortDesc: "Deterministic E2E product",
      price: 129.9,
      originalPrice: 159.9,
      images: ["/images/home/card-razer-node.png"],
      specifications: {
        category: "e2e",
        scenario: "checkout-critical-flow",
      },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.9,
      reviewCount: 10,
      soldCount: 0,
    },
    create: {
      storeId: params.storeId,
      brandId: params.brandId,
      categoryId: params.categoryId,
      sku: E2E_PRODUCT_SKU,
      name: "E2E Checkout Headset",
      description:
        "Produto dedicado para validar o fluxo critico de checkout em E2E.",
      shortDesc: "Deterministic E2E product",
      price: 129.9,
      originalPrice: 159.9,
      images: ["/images/home/card-razer-node.png"],
      specifications: {
        category: "e2e",
        scenario: "checkout-critical-flow",
      },
      isActive: true,
      isFeatured: true,
      isOnSale: true,
      rating: 4.9,
      reviewCount: 10,
      soldCount: 0,
    },
  });
}

async function upsertInventory(params) {
  const existingInventory = await prisma.inventory.findFirst({
    where: {
      productId: params.productId,
      storeId: params.storeId,
      variantId: null,
    },
    select: {
      id: true,
    },
  });

  if (existingInventory) {
    await prisma.inventory.update({
      where: {
        id: existingInventory.id,
      },
      data: {
        quantity: 40,
        reserved: 0,
        minStock: 1,
        maxStock: 200,
        location: "E2E-A1",
      },
    });
    return;
  }

  await prisma.inventory.create({
    data: {
      productId: params.productId,
      variantId: null,
      storeId: params.storeId,
      quantity: 40,
      reserved: 0,
      minStock: 1,
      maxStock: 200,
      location: "E2E-A1",
    },
  });
}

async function cleanupUserCheckoutState(userId) {
  await prisma.cart.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.order.deleteMany({
    where: {
      userId,
    },
  });
}

async function main() {
  const user = await upsertUser();
  await cleanupUserCheckoutState(user.id);

  const store = await upsertStore(user.id);
  const [brand, category] = await Promise.all([
    upsertBrand(),
    upsertCategory(),
  ]);
  const product = await upsertProduct({
    storeId: store.id,
    brandId: brand.id,
    categoryId: category.id,
  });

  await upsertInventory({
    productId: product.id,
    storeId: store.id,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: {
          email: E2E_USER_EMAIL,
          password: E2E_USER_PASSWORD,
        },
        store: {
          id: store.id,
          slug: store.slug,
        },
        product: {
          id: product.id,
          sku: product.sku,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Failed to prepare E2E data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
