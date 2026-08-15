CREATE TABLE `testnet_funding_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`status` enum('pending','complete','partial','failed') NOT NULL DEFAULT 'pending',
	`cc3TxHash` varchar(66),
	`sepoliaTxHash` varchar(66),
	`failureReason` varchar(280),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testnet_funding_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `testnet_funding_requests_walletAddress_unique` UNIQUE(`walletAddress`)
);
--> statement-breakpoint
CREATE INDEX `testnet_funding_requests_user_open_id_idx` ON `testnet_funding_requests` (`userOpenId`);