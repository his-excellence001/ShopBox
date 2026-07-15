-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Suppliers Directory
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL, -- Scoped to specific ShopBox owner
    name TEXT NOT NULL,
    website TEXT,
    location_city TEXT,
    delivery_radius_km INTEGER,
    min_order_qty INTEGER,
    lead_time_days INTEGER DEFAULT 3,
    contact_phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Products (External Catalog)
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    external_sku TEXT,
    product_name TEXT NOT NULL,
    description TEXT,
    current_price NUMERIC(10,2) NOT NULL,
    stock_availability INTEGER, -- 1 = In stock, 0 = Out of stock
    unit_measure TEXT, -- e.g., 'kg', 'box', 'piece'
    url TEXT, -- Direct link to the supplier's product page
    embedding VECTOR(384) -- For semantic matching against internal products
);

-- Price History (Time-series data for trends)
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_product_id UUID REFERENCES supplier_products(id),
    price NUMERIC(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Market Trends (External news feed)
CREATE TABLE market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_type TEXT, -- 'PRICE_ALERT', 'TRENDING_PRODUCT', 'SUPPLY_CHAIN'
    headline TEXT,
    summary TEXT,
    category TEXT, -- 'groceries', 'fashion', 'hardware'
    source_url TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- Product Recommendations (Output to Owner)
CREATE TABLE product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    recommendation_type TEXT, -- 'new_product', 'bundle', 'price_change'
    title TEXT,
    description TEXT,
    estimated_profit NUMERIC(10,2),
    status TEXT DEFAULT 'pending' -- 'pending', 'accepted', 'dismissed'
);