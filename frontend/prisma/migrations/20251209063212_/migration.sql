-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "full_name" TEXT,
    "id_type" TEXT,
    "id_hash" TEXT,
    "dob" DATE,
    "kyc_timestamp" TIMESTAMPTZ(6),
    "wallet_address" TEXT,
    "encrypted_priv_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "registration_step" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");
