CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text,
	`updated_at` integer NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `deal` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`deal_date` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`remarks` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deal_customer_id_idx` ON `deal` (`customer_id`);