CREATE TABLE `items` (
	`name` text
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`systemPrompt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`creationDate` integer NOT NULL,
	`completionDate` integer,
	`dueDate` integer
);
