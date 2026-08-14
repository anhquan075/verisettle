ALTER TABLE `deals` ADD `policyVersion` enum('v1_live','v2_draft') DEFAULT 'v1_live' NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `policyHash` varchar(66);--> statement-breakpoint
ALTER TABLE `deals` ADD `termsCommitmentHash` varchar(66);--> statement-breakpoint
ALTER TABLE `deals` ADD `termsSchemaVersion` int;--> statement-breakpoint
ALTER TABLE `deals` ADD `policySourceContract` varchar(42);--> statement-breakpoint
ALTER TABLE `deals` ADD `acceptanceExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `minimumSourceConfirmations` int;--> statement-breakpoint
ALTER TABLE `deals` ADD `refundWindowSeconds` int;