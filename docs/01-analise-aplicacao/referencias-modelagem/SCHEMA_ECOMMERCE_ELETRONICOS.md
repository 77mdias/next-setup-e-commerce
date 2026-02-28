# 💻 Schema Prisma - E-commerce de Eletrônicos

## 📊 Schema Completo para Loja de Eletrônicos e Periféricos

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ===================================
// 👤 MÓDULO DE USUÁRIOS
// ===================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String
  phone         String?
  cpf           String?   @unique
  avatar        String?
  role          UserRole  @default(CUSTOMER)
  emailVerified DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relacionamentos
  sessions      UserSession[]
  stores        Store[]
  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  stockMovements StockMovement[]

  @@map("users")
}

model UserSession {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

enum UserRole {
  CUSTOMER
  SELLER
  ADMIN
}

// ===================================
// 🏪 MÓDULO DE LOJAS/FORNECEDORES
// ===================================

model Store {
  id             String  @id @default(uuid())
  ownerId        String
  name           String
  slug           String  @unique
  description    String
  logoUrl        String
  bannerUrl      String
  phone          String
  email          String
  cnpj           String?
  website        String?
  shippingFee    Float   @default(0)
  freeShipping   Float   @default(0)
  processingTime Int     @default(1)
  isActive       Boolean @default(true)
  rating         Float   @default(0)
  totalSales     Int     @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relacionamentos
  owner     User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  products  Product[]
  orders    Order[]
  reviews   Review[]
  inventory Inventory[]

  @@map("stores")
}

model Brand {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  logoUrl   String?
  website   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  products Product[]

  @@map("brands")
}

// ===================================
// 📱 MÓDULO DE CATEGORIAS
// ===================================

model Category {
  id          String     @id @default(uuid())
  parentId    String?
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  iconUrl     String?
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relacionamentos
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@map("categories")
}

// ===================================
// 💻 MÓDULO DE PRODUTOS
// ===================================

model Product {
  id             String    @id @default(uuid())
  storeId        String
  brandId        String
  categoryId     String
  sku            String    @unique
  name           String
  description    String
  shortDesc      String?
  price          Float
  originalPrice  Float?
  costPrice      Float?
  images         String[]
  specifications Json
  warranty       String?
  weight         Float?
  dimensions     Json?
  isActive       Boolean   @default(true)
  isFeatured     Boolean   @default(false)
  isOnSale       Boolean   @default(false)
  saleStartsAt   DateTime?
  saleEndsAt     DateTime?
  rating         Float     @default(0)
  reviewCount    Int       @default(0)
  soldCount      Int       @default(0)
  viewCount      Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relacionamentos
  store      Store             @relation(fields: [storeId], references: [id], onDelete: Cascade)
  brand      Brand             @relation(fields: [brandId], references: [id], onDelete: Cascade)
  category   Category          @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  variants   ProductVariant[]
  orderItems OrderItem[]
  reviews    Review[]
  inventory  Inventory[]

  @@map("products")
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  name      String   // "Cor", "Tamanho", "Capacidade"
  value     String   // "Preto", "16GB", "256GB"
  price     Float?   // Preço adicional
  sku       String?  // SKU específico
  stock     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  product   Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  inventory Inventory[]

  @@map("product_variants")
}

// ===================================
// 📦 MÓDULO DE ESTOQUE
// ===================================

model Inventory {
  id            String     @id @default(uuid())
  productId     String
  variantId     String?
  storeId       String
  quantity      Int        @default(0)
  reserved      Int        @default(0)
  minStock      Int        @default(0)
  maxStock      Int        @default(1000)
  location      String?
  lastRestocked DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Relacionamentos
  product        Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant        ProductVariant?  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  store          Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)
  stockMovements StockMovement[]

  @@unique([productId, variantId, storeId])
  @@map("inventory")
}

model StockMovement {
  id          String         @id @default(uuid())
  inventoryId String
  type        StockMoveType
  quantity    Int
  reason      String
  reference   String?
  userId      String?
  createdAt   DateTime       @default(now())

  // Relacionamentos
  inventory Inventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  user      User?     @relation(fields: [userId], references: [id])

  @@map("stock_movements")
}

enum StockMoveType {
  IN          // Entrada
  OUT         // Saída
  ADJUSTMENT  // Ajuste
  RESERVED    // Reservado
  RELEASED    // Liberado
}

// ===================================
// 🛒 MÓDULO DE PEDIDOS
// ===================================

model Order {
  id                 Int            @id @default(autoincrement())
  userId             String?
  storeId            String
  addressId          String?
  customerName       String
  customerPhone      String
  customerEmail      String?
  customerCpf        String?
  status             OrderStatus
  shippingMethod     ShippingMethod
  subtotal           Float
  shippingFee        Float          @default(0)
  serviceFee         Float          @default(0)
  discount           Float          @default(0)
  total              Float
  paymentMethod      String?
  paymentStatus      PaymentStatus  @default(PENDING)
  stripePaymentId    String?
  trackingCode       String?
  notes              String?
  estimatedDelivery  DateTime?
  shippedAt          DateTime?
  deliveredAt        DateTime?
  cancelledAt        DateTime?
  cancelReason       String?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt

  // Relacionamentos
  user          User?               @relation(fields: [userId], references: [id])
  store         Store               @relation(fields: [storeId], references: [id], onDelete: Cascade)
  address       Address?            @relation(fields: [addressId], references: [id])
  items         OrderItem[]
  payments      Payment[]
  statusHistory OrderStatusHistory[]
  reviews       Review[]

  @@map("orders")
}

model OrderItem {
  id             String   @id @default(uuid())
  orderId        Int
  productId      String
  variantId      String?
  quantity       Int
  unitPrice      Float
  totalPrice     Float
  productName    String   // Snapshot do nome
  productImage   String   // Snapshot da imagem
  specifications Json?    // Snapshot das especificações
  createdAt      DateTime @default(now())

  // Relacionamentos
  order   Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant ProductVariant? @relation(fields: [variantId], references: [id])

  @@map("order_items")
}

model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   Int
  status    OrderStatus
  notes     String?
  changedBy String?
  createdAt DateTime    @default(now())

  // Relacionamentos
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user  User? @relation(fields: [changedBy], references: [id])

  @@map("order_status_history")
}

enum OrderStatus {
  PENDING           // Pendente
  PAYMENT_PENDING   // Aguardando pagamento
  PAID              // Pago
  PROCESSING        // Processando
  SHIPPED           // Enviado
  DELIVERED         // Entregue
  CANCELLED         // Cancelado
  REFUNDED          // Reembolsado
}

enum ShippingMethod {
  STANDARD  // Padrão
  EXPRESS   // Expresso
  PICKUP    // Retirada na loja
}

enum PaymentStatus {
  PENDING   // Pendente
  PAID      // Pago
  FAILED    // Falhou
  REFUNDED  // Reembolsado
  CANCELLED // Cancelado
}

// ===================================
// 💳 MÓDULO DE PAGAMENTOS
// ===================================

model Payment {
  id                 String        @id @default(uuid())
  orderId            Int
  method             String        // "stripe", "pix", "boleto"
  amount             Float
  status             PaymentStatus
  stripePaymentId    String?
  stripeClientSecret String?
  pixCode            String?
  pixExpiresAt       DateTime?
  boletoUrl          String?
  boletoBarcode      String?
  paidAt             DateTime?
  failedAt           DateTime?
  failureReason      String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  // Relacionamentos
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

// ===================================
// 📍 MÓDULO DE ENDEREÇOS
// ===================================

model Address {
  id           String   @id @default(uuid())
  userId       String?
  label        String   // "Casa", "Trabalho", "Outros"
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  zipCode      String
  country      String   @default("Brasil")
  latitude     Float?
  longitude    Float?
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relacionamentos
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@map("addresses")
}

// ===================================
// ⭐ MÓDULO DE AVALIAÇÕES
// ===================================

model Review {
  id            String    @id @default(uuid())
  userId        String
  productId     String
  orderId       Int
  storeId       String
  rating        Int       // 1-5
  title         String?
  comment       String?
  pros          String?   // Pontos positivos
  cons          String?   // Pontos negativos
  wouldRecommend Boolean? // Recomendaria?
  isVerifiedPurchase Boolean @default(false)
  isPublic      Boolean   @default(true)
  storeReply    String?
  repliedAt     DateTime?
  helpfulCount  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relacionamentos
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  store   Store   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([userId, productId, orderId])
  @@map("reviews")
}

// ===================================
// 🏷️ MÓDULO DE CUPONS E PROMOÇÕES
// ===================================

model Coupon {
  id            String      @id @default(uuid())
  code          String      @unique
  name          String
  description   String?
  type          CouponType
  value         Float       // Valor ou percentual
  minOrderValue Float?      // Pedido mínimo
  maxDiscount   Float?      // Desconto máximo
  usageLimit    Int?        // Limite de uso
  usedCount     Int         @default(0)
  startsAt      DateTime
  expiresAt     DateTime
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@map("coupons")
}

enum CouponType {
  PERCENTAGE  // Percentual
  FIXED       // Valor fixo
}
```

## 🎯 **Principais Diferenças para E-commerce de Eletrônicos:**

### **📱 Características Específicas:**

1. **🏷️ Marcas (Brands)**
   - Samsung, Apple, Dell, Logitech, etc.
   - Logo e website oficial

2. **📦 Controle de Estoque Rigoroso**
   - Quantidade exata por produto/variação
   - Movimentações rastreadas
   - Estoque mínimo/máximo

3. **🔧 Especificações Técnicas**
   - Armazenadas em JSON flexível
   - Processador, RAM, armazenamento, etc.
   - Compatibilidade, dimensões, peso

4. **📱 Variações de Produto**
   - Cor, capacidade, tamanho
   - SKUs específicos
   - Preços diferentes por variação

5. **⭐ Avaliações Detalhadas**
   - Prós e contras
   - Recomendação
   - Compra verificada

### **📊 Exemplos de Especificações (JSON):**

**Notebook:**

```json
{
  "processor": "Intel Core i7-12700H",
  "memory": "16GB DDR4",
  "storage": "512GB NVMe SSD",
  "graphics": "NVIDIA RTX 3060",
  "display": "15.6\" Full HD 144Hz",
  "os": "Windows 11",
  "connectivity": ["Wi-Fi 6", "Bluetooth 5.2", "USB-C", "HDMI"],
  "battery": "6 células 80Wh",
  "weight": "2.3kg"
}
```

**Mouse Gaming:**

```json
{
  "sensor": "PixArt PMW3360",
  "dpi": "100-12000",
  "buttons": 6,
  "connectivity": "Wireless 2.4GHz + Bluetooth",
  "battery": "70 horas",
  "weight": "85g",
  "lighting": "RGB 16.7M cores",
  "compatibility": ["Windows", "macOS", "Linux"]
}
```

---

## 🚀 **Próximos Passos:**

1. **Copie este schema** para seu `prisma/schema.prisma`
2. **Execute as migrations:**
   ```bash
   npx prisma migrate dev --name ecommerce_eletronicos
   ```
3. **Crie seeds** com produtos de exemplo
4. **Implemente as funcionalidades** específicas

Agora você tem uma estrutura completa para sua loja de eletrônicos! 🎉
