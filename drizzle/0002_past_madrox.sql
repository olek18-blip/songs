ALTER TABLE `leads` ADD `tier` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `occasion` varchar(100) DEFAULT 'birthday';--> statement-breakpoint
ALTER TABLE `orders` ADD `personalityTraits` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `relationship` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `tonePreference` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `specificPhrases` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `dedications` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `tier` enum('basic','premium','ultra') DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `revisionsIncluded` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `revisionsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `revisionNotes` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `previewUrl` text;