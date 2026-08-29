-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "vudyRequestId" TEXT NOT NULL,
    "vudyUrl" TEXT NOT NULL,
    "vudyEmbedUrl" TEXT NOT NULL,
    "targetAddress" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "currencyToken" TEXT NOT NULL,
    "requestedChain" TEXT NOT NULL,
    "requestedToken" TEXT NOT NULL,
    "customId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRequest_vudyRequestId_key" ON "PaymentRequest"("vudyRequestId");
