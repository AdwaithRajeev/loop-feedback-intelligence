import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const feedbackData = [
  "The dashboard loads quickly and gives me a clear overview.",
  "The mobile experience feels slow when switching between pages.",
  "I love how easy it is to find my previous orders.",
  "The search results are not always relevant to what I type.",
  "Customer support resolved my issue very quickly.",
  "It took too long to receive a response from support.",
  "The checkout process is simple and straightforward.",
  "The checkout page crashed when I tried to pay.",
  "The notifications are useful and arrive at the right time.",
  "I receive too many unnecessary notifications.",
  "The product quality is excellent and better than expected.",
  "The product I received did not match the description.",
  "The pricing is reasonable for the features provided.",
  "The subscription price is too high for what I get.",
  "The new update made the application much easier to use.",
  "The latest update introduced several annoying bugs.",
  "I would recommend this product to my colleagues.",
  "I am disappointed with the overall experience.",
  "The interface is clean and easy to understand.",
  "Some buttons are difficult to find.",
];

const channels = ["MANUAL", "CSV", "SIMULATED"] as const;

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing demo data
  await prisma.feedbackTheme.deleteMany();
  await prisma.embedding.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  // Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "LOOP Demo Workspace",
    },
  });

  // Password used only for demo accounts
  const passwordHash = await bcrypt.hash("LoopDemo@123", 10);

  // Users
  await prisma.user.createMany({
    data: [
      {
        name: "Demo Admin",
        email: "admin@loop.demo",
        passwordHash,
        role: "ADMIN",
        workspaceId: workspace.id,
      },
      {
        name: "Demo Analyst",
        email: "analyst@loop.demo",
        passwordHash,
        role: "ANALYST",
        workspaceId: workspace.id,
      },
      {
        name: "Demo Viewer",
        email: "viewer@loop.demo",
        passwordHash,
        role: "VIEWER",
        workspaceId: workspace.id,
      },
    ],
  });

  // Themes
  const themeNames = [
    "Performance",
    "User Experience",
    "Customer Support",
    "Checkout",
    "Notifications",
    "Product Quality",
    "Pricing",
  ];

  const themes = [];

  for (const name of themeNames) {
    const theme = await prisma.theme.create({
      data: {
        name,
        workspaceId: workspace.id,
      },
    });

    themes.push(theme);
  }

  // Create 120 feedback records
  for (let i = 0; i < 120; i++) {
    const content = feedbackData[i % feedbackData.length];

    const sentiment =
      i % 3 === 0
        ? "NEGATIVE"
        : i % 3 === 1
          ? "POSITIVE"
          : "NEUTRAL";

    const status =
      i % 3 === 0
        ? "NEW"
        : i % 3 === 1
          ? "REVIEWED"
          : "ACTIONED";

    const channel = channels[i % channels.length];

    const feedback = await prisma.feedback.create({
      data: {
        content,
        channel,
        customerLabel: `Customer ${i + 1}`,
        sentiment,
        sentimentScore:
          sentiment === "POSITIVE"
            ? 0.75 + (i % 20) / 100
            : sentiment === "NEGATIVE"
              ? -(0.55 + (i % 20) / 100)
              : 0,
        featureArea:
          i % 2 === 0
            ? "Product"
            : i % 3 === 0
              ? "Support"
              : "Platform",
        rationale: "Seeded demo feedback for LOOP analytics.",
        status,
        workspaceId: workspace.id,
        createdAt: new Date(
          Date.now() - (i % 30) * 24 * 60 * 60 * 1000,
        ),
      },
    });

    const theme = themes[i % themes.length];

    await prisma.feedbackTheme.create({
      data: {
        feedbackId: feedback.id,
        themeId: theme.id,
      },
    });
  }

  console.log("✅ LOOP seed completed!");
  console.log("Workspace:", workspace.name);
  console.log("Users: 3");
  console.log("Feedback: 120");
  console.log("Themes:", themes.length);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
