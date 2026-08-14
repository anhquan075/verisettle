CREATE TABLE `siwe_nonces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nonce` varchar(96) NOT NULL,
	`address` varchar(42) NOT NULL,
	`message` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siwe_nonces_id` PRIMARY KEY(`id`),
	CONSTRAINT `siwe_nonces_nonce_unique` UNIQUE(`nonce`)
);
--> statement-breakpoint
CREATE TABLE `wallet_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`address` varchar(42) NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastVerifiedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_identities_address_unique` UNIQUE(`address`)
);
--> statement-breakpoint
CREATE INDEX `siwe_nonces_address_idx` ON `siwe_nonces` (`address`);--> statement-breakpoint
CREATE INDEX `siwe_nonces_expires_at_idx` ON `siwe_nonces` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `wallet_identities_user_open_id_idx` ON `wallet_identities` (`userOpenId`);