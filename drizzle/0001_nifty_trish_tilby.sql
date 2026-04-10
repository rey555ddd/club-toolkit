CREATE TABLE `suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nickname` varchar(100) NOT NULL,
	`category` enum('feature','bug','design','content','other') NOT NULL DEFAULT 'other',
	`content` text NOT NULL,
	`status` enum('pending','read','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suggestions_id` PRIMARY KEY(`id`)
);
