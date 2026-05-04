CREATE TABLE `diaryEntries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diaryEntryMessages` (
	`diaryEntryId` integer NOT NULL,
	`messageId` integer NOT NULL,
	FOREIGN KEY (`diaryEntryId`) REFERENCES `diaryEntries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueDiaryEntry` ON `diaryEntryMessages` (`diaryEntryId`);