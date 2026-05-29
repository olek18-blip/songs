CREATE TABLE `b2bContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`employeeCount` varchar(50),
	`message` text,
	`status` enum('new','contacted','negotiating','closed','lost') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `b2bContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountPercent` int NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`usedByEmail` varchar(320),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`celebrantName` varchar(255),
	`anecdotes` text,
	`genre` varchar(100),
	`lastStep` int NOT NULL DEFAULT 1,
	`converted` boolean NOT NULL DEFAULT false,
	`retargetingSent` boolean NOT NULL DEFAULT false,
	`retargetingSentAt` timestamp,
	`couponCode` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`celebrantName` varchar(255) NOT NULL,
	`anecdotes` text NOT NULL,
	`genre` varchar(100) NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`expressDelivery` boolean NOT NULL DEFAULT false,
	`lyricVideo` boolean NOT NULL DEFAULT false,
	`wavFile` boolean NOT NULL DEFAULT false,
	`totalPrice` decimal(10,2) NOT NULL,
	`couponCode` varchar(50),
	`discountApplied` decimal(10,2),
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`generationStatus` enum('queued','generating','completed','failed') NOT NULL DEFAULT 'queued',
	`sunoTaskId` varchar(255),
	`mp3Url` text,
	`wavUrl` text,
	`videoUrl` text,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
