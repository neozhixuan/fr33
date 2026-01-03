/*
  Warnings:

  - Added the required column `encryptedSignerKey` to the `wallets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signerKeyIv` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "encryptedSignerKey" TEXT NOT NULL,
ADD COLUMN     "signerKeyIv" TEXT NOT NULL;
