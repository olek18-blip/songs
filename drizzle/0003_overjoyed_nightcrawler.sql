CREATE TABLE `songCommunications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`senderType` enum('customer','admin') NOT NULL,
	`message` text NOT NULL,
	`attachmentUrl` text,
	`status` enum('new','read','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `songCommunications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`createdBy` int NOT NULL,
	`testNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(50),
	`preferredLanguage` varchar(10) DEFAULT 'en',
	`communicationPreference` enum('email','sms','both') DEFAULT 'email',
	`bio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
