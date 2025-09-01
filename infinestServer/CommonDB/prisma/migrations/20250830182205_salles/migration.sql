/*
  Warnings:

  - The values [ENTERPRISE] on the enum `ProductAccess_product` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `branchLimit` on table `plan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `plan` MODIFY `branchLimit` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `productaccess` MODIFY `product` ENUM('BILLIT', 'SERVICE', 'SALES', 'FUTURE_PRODUCT') NOT NULL;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ownerId` VARCHAR(191) NOT NULL,
    `adminUserId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Branch_adminUserId_key`(`adminUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
