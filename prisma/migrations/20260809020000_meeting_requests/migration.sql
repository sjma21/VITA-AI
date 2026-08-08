-- CreateTable
CREATE TABLE "meeting_requests" (
    "id" TEXT NOT NULL,
    "hrName" TEXT NOT NULL,
    "hrEmail" TEXT NOT NULL,
    "company" TEXT,
    "preferredTime" TEXT NOT NULL,
    "timezone" TEXT,
    "agenda" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_requests_hrEmail_idx" ON "meeting_requests"("hrEmail");

-- CreateIndex
CREATE INDEX "meeting_requests_createdAt_idx" ON "meeting_requests"("createdAt");
