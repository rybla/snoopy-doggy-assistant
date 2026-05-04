CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`creationDate` integer NOT NULL,
	`completionDate` integer,
	`dueDate` integer
);
