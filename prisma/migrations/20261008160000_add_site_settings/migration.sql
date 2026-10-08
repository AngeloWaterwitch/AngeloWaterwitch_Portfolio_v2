-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "footerTagline" TEXT NOT NULL DEFAULT 'Software & Design Engineer based in Cape Town, South Africa.',
    "footerCopyright" TEXT NOT NULL DEFAULT 'Angelo Waterwitch',
    "footerCredit" TEXT NOT NULL DEFAULT 'Designed & Built by Angelo Waterwitch',
    "showFooterCredit" BOOLEAN NOT NULL DEFAULT true,
    "showAdminLink" BOOLEAN NOT NULL DEFAULT false,
    "navCtaLabel" TEXT,
    "navCtaUrl" TEXT,
    "legalLinks" JSONB NOT NULL DEFAULT '[]',
    "sectionHeadings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
