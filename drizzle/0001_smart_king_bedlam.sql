CREATE TABLE `campista_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaId` int NOT NULL,
	`alertType` enum('nuevo_campista','pago_actualizado') NOT NULL,
	`status` enum('pendiente','vista') NOT NULL DEFAULT 'pendiente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`seenAt` timestamp,
	CONSTRAINT `campista_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campistas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaKey` varchar(64) NOT NULL,
	`fullName` text NOT NULL,
	`idNumber` varchar(32) NOT NULL,
	`age` varchar(8),
	`phone` varchar(32),
	`emergencyContact1` text,
	`emergencyContact2` text,
	`homeNetworkAttends` varchar(32),
	`homeNetworkName` text,
	`hasDisease` varchar(32),
	`diseaseDetail` text,
	`takesMedication` varchar(32),
	`medicationDetail` text,
	`hasAllergy` varchar(32),
	`allergyDetail` text,
	`treatmentDiet` text,
	`sourceRow` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campistas_id` PRIMARY KEY(`id`),
	CONSTRAINT `campistas_campistaKey_unique` UNIQUE(`campistaKey`),
	CONSTRAINT `campistas_idNumber_unique` UNIQUE(`idNumber`)
);
--> statement-breakpoint
CREATE TABLE `meal_marks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaId` int NOT NULL,
	`mealType` enum('desayuno','almuerzo','cena') NOT NULL,
	`mealDay` varchar(32) NOT NULL,
	`marked` boolean NOT NULL DEFAULT false,
	`markedAt` timestamp,
	`markedBy` varchar(128),
	CONSTRAINT `meal_marks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaId` int NOT NULL,
	`entryType` enum('abono','pago_completo') NOT NULL,
	`method` enum('efectivo','transferencia','deposito','datafacil') NOT NULL,
	`detail` text,
	`receiptUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` varchar(128),
	CONSTRAINT `payment_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaId` int NOT NULL,
	`sourceRow` int,
	`status` enum('pagado','abonado','no_pagado') NOT NULL,
	`paidPercentage` decimal(5,2) NOT NULL,
	`paidAmount` decimal(10,2) NOT NULL,
	`pendingAmount` decimal(10,2) NOT NULL,
	`method` varchar(64),
	`contact` varchar(64),
	`detail` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipt_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campistaId` int NOT NULL,
	`paymentEntryId` int,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`uploadedBy` varchar(128),
	CONSTRAINT `receipt_uploads_id` PRIMARY KEY(`id`)
);
