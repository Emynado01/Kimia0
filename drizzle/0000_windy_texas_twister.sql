CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`phone` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_sessions_user_id_idx` ON `admin_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_at_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`before_json` text,
	`after_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_items_variant_unique` ON `cart_items` (`cart_id`,`variant_id`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_key` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `collection_products` (
	`collection_id` text NOT NULL,
	`product_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_products_unique` ON `collection_products` (`collection_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`hero_image_url` text,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`minimum_cents` integer,
	`starts_at` integer,
	`ends_at` integer,
	`max_uses` integer,
	`uses_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discounts_code_unique` ON `discounts` (`code`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`supplier` text,
	`receipt_url` text,
	`incurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`actor_id` text,
	`order_id` text,
	`reference` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_variant_id_idx` ON `inventory_movements` (`variant_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text,
	`title_snapshot` text NOT NULL,
	`sku_snapshot` text,
	`image_url_snapshot` text,
	`unit_price_cents` integer NOT NULL,
	`quantity` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`shipping_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`shipping_address_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_reference` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_unique` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`url` text NOT NULL,
	`alt_text` text,
	`position` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `product_images_product_id_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`title` text NOT NULL,
	`sku` text NOT NULL,
	`price_cents` integer NOT NULL,
	`compare_at_price_cents` integer,
	`cost_cents` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`attributes_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variants_product_id_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`low_stock_threshold` integer DEFAULT 8 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`store_name` text NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`logo_url` text,
	`legal_text` text,
	`tax_rate_basis_points` integer DEFAULT 0 NOT NULL,
	`default_low_stock_threshold` integer DEFAULT 8 NOT NULL,
	`socials_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'CUSTOMER' NOT NULL,
	`password_hash` text,
	`password_salt` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
INSERT INTO `users` (`id`, `email`, `name`, `role`, `password_hash`, `password_salt`, `is_active`, `created_at`, `updated_at`) VALUES
  ('usr_admin_kimia', 'test01@exemple.com', 'Administratrice KiMiA', 'ADMIN', 'PNFGwYltNKFMEyxZ3irnqHx8XaVv60xJOLiDz31RFqI=', 'jeNjugeXiSD10Dp7S1faow==', 1, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `sort_order`, `is_published`, `created_at`, `updated_at`) VALUES
  ('cat_teint', 'Teint', 'teint', 'Des produits pour un teint lumineux.', 1, 1, unixepoch() * 1000, unixepoch() * 1000),
  ('cat_joues', 'Joues', 'joues', 'Des couleurs qui réveillent le visage.', 2, 1, unixepoch() * 1000, unixepoch() * 1000),
  ('cat_soin', 'Soin', 'soin', 'Les essentiels de soin au quotidien.', 3, 1, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `status`, `featured`, `low_stock_threshold`, `created_at`, `updated_at`) VALUES
  ('prd_bronzy', 'cat_teint', 'Palette Bronzy', 'palette-bronzy', 'Six poudres modulables pour réchauffer, structurer et illuminer chaque carnation.', 'PUBLISHED', 1, 8, unixepoch() * 1000, unixepoch() * 1000),
  ('prd_cheeksy', 'cat_joues', 'Palette Cheeksy N°02', 'palette-cheeksy-02', 'Neuf fards vibrants, faciles à superposer, pour une couleur qui vous ressemble.', 'PUBLISHED', 1, 8, unixepoch() * 1000, unixepoch() * 1000),
  ('prd_spf', 'cat_soin', 'Daily Defense SPF 50+', 'daily-defense-spf-50', 'Une crème quotidienne hydratante, légère et résistante à l eau.', 'PUBLISHED', 0, 8, unixepoch() * 1000, unixepoch() * 1000),
  ('prd_moist', 'cat_soin', 'Moist Essence', 'moist-essence', 'Une hydratation fraîche et confortable, formulée pour révéler l éclat.', 'PUBLISHED', 0, 8, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `product_variants` (`id`, `product_id`, `title`, `sku`, `price_cents`, `cost_cents`, `stock`, `created_at`, `updated_at`) VALUES
  ('var_bronzy', 'prd_bronzy', 'Light à Deep Dark', 'KIM-BRONZY-001', 3600, 1200, 42, unixepoch() * 1000, unixepoch() * 1000),
  ('var_cheeksy', 'prd_cheeksy', 'Collection 02', 'KIM-CHEEKSY-002', 3200, 1100, 28, unixepoch() * 1000, unixepoch() * 1000),
  ('var_spf', 'prd_spf', 'Protection invisible', 'KIM-SPF-050', 2400, 800, 61, unixepoch() * 1000, unixepoch() * 1000),
  ('var_moist', 'prd_moist', 'Acide hyaluronique', 'KIM-MOIST-001', 2800, 900, 38, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `product_images` (`id`, `product_id`, `url`, `alt_text`, `position`, `is_primary`, `created_at`, `updated_at`) VALUES
  ('img_bronzy', 'prd_bronzy', '/img01.jpeg', 'Palette Bronzy KiMiA', 0, 1, unixepoch() * 1000, unixepoch() * 1000),
  ('img_cheeksy', 'prd_cheeksy', '/img02.jpeg', 'Palette Cheeksy KiMiA', 0, 1, unixepoch() * 1000, unixepoch() * 1000),
  ('img_spf', 'prd_spf', '/img03.jpeg', 'Daily Defense SPF 50+', 0, 1, unixepoch() * 1000, unixepoch() * 1000),
  ('img_moist', 'prd_moist', '/img04.jpeg', 'Moist Essence KiMiA', 0, 1, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `store_settings` (`id`, `store_name`, `currency`, `default_low_stock_threshold`, `created_at`, `updated_at`) VALUES
  ('store_kimia', 'KiMiA', 'EUR', 8, unixepoch() * 1000, unixepoch() * 1000);
