CREATE TABLE `deal_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`sequence` int NOT NULL,
	`type` enum('created','funded','proof_submitted','proof_verified','proof_rejected','released','refunded','disputed','replay_rejected') NOT NULL,
	`title` varchar(160) NOT NULL,
	`detail` text NOT NULL,
	`txHash` varchar(66),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `deal_events_deal_sequence_unique` UNIQUE(`dealId`,`sequence`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(32) NOT NULL,
	`buyerOpenId` varchar(64) NOT NULL,
	`buyerAddress` varchar(42) NOT NULL,
	`sellerAddress` varchar(42) NOT NULL,
	`amount` decimal(36,18) NOT NULL,
	`currency` varchar(12) NOT NULL,
	`description` text NOT NULL,
	`status` enum('draft','funded','proof_pending','released','refunded','disputed') NOT NULL DEFAULT 'draft',
	`proofPolicyNonce` varchar(32) NOT NULL,
	`fundingTxHash` varchar(66),
	`sepoliaSourceTxHash` varchar(66),
	`proofVerifiedAt` timestamp,
	`settlementTxHash` varchar(66),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`),
	CONSTRAINT `deals_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE INDEX `deal_events_deal_id_idx` ON `deal_events` (`dealId`);--> statement-breakpoint
CREATE INDEX `deals_buyer_open_id_idx` ON `deals` (`buyerOpenId`);