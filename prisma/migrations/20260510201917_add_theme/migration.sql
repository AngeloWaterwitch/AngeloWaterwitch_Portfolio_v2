-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT 'hsl(348, 100%, 40%)',
    "primaryLight" TEXT NOT NULL DEFAULT 'hsl(348, 100%, 55%)',
    "primaryDim" TEXT NOT NULL DEFAULT 'hsl(348, 60%, 25%)',
    "bgDark" TEXT NOT NULL DEFAULT '#0a0a0a',
    "bgDark2" TEXT NOT NULL DEFAULT '#111111',
    "bgDark3" TEXT NOT NULL DEFAULT '#1a1a1a',
    "bgDark4" TEXT NOT NULL DEFAULT '#222222',
    "textLight" TEXT NOT NULL DEFAULT '#f0ede8',
    "displayFont" TEXT NOT NULL DEFAULT 'Syne',
    "monoFont" TEXT NOT NULL DEFAULT 'Space Mono',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);
