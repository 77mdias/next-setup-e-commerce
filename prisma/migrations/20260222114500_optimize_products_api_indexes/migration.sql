CREATE INDEX IF NOT EXISTS "stores_isActive_createdAt_idx"
  ON "stores"("isActive", "createdAt");

CREATE INDEX IF NOT EXISTS "categories_isActive_sortOrder_name_idx"
  ON "categories"("isActive", "sortOrder", "name");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_createdAt_idx"
  ON "products"("storeId", "isActive", "createdAt");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_categoryId_idx"
  ON "products"("storeId", "isActive", "categoryId");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_price_idx"
  ON "products"("storeId", "isActive", "price");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_name_idx"
  ON "products"("storeId", "isActive", "name");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_soldCount_idx"
  ON "products"("storeId", "isActive", "soldCount");

CREATE INDEX IF NOT EXISTS "products_storeId_isActive_rating_reviewCount_idx"
  ON "products"("storeId", "isActive", "rating", "reviewCount");
