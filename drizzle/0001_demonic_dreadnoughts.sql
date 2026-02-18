CREATE TABLE `cardio_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`date` timestamp NOT NULL,
	`durationMinutes` int,
	`distanceKm` decimal(10,2),
	`caloriesBurned` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cardio_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diet_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`items` json NOT NULL,
	`totalCalories` int NOT NULL,
	`totalProtein` decimal(5,2) NOT NULL,
	`totalFat` decimal(5,2) NOT NULL,
	`totalCarbs` decimal(5,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diet_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`part` enum('chest','back','legs','shoulders','arms','abs','cardio') NOT NULL,
	`equipmentType` enum('barbell','dumbbell','machine','bodyweight') NOT NULL,
	`isPreset` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `food_dictionary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(100) NOT NULL,
	`calories` int NOT NULL,
	`protein` decimal(5,2) NOT NULL,
	`fat` decimal(5,2) NOT NULL,
	`carbs` decimal(5,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `food_dictionary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_check_in_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gymLocationId` int NOT NULL,
	`checkInTime` timestamp NOT NULL,
	`checkOutTime` timestamp,
	`durationMinutes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_check_in_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`radiusMeters` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`best1RM` decimal(10,2) NOT NULL,
	`achievedDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`height` decimal(5,2),
	`weight` decimal(5,2),
	`age` int,
	`gender` enum('male','female','other'),
	`targetWeight` decimal(5,2),
	`targetBenchPress` decimal(5,2),
	`targetCalories` int,
	`targetProtein` decimal(5,2),
	`targetFat` decimal(5,2),
	`targetCarbs` decimal(5,2),
	`defaultIntervalSeconds` int NOT NULL DEFAULT 90,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`date` timestamp NOT NULL,
	`sets` json NOT NULL,
	`totalVolume` decimal(10,2),
	`estimated1RM` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_logs_id` PRIMARY KEY(`id`)
);
