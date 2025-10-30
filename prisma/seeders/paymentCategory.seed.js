const prisma = require("../../src/services/prisma.service");

async function main() {
  const categories = [
    { name: "Virtual Account", description: "Pembayaran melalui VA Bank" },
    { name: "E-Wallet", description: "Pembayaran via GoPay, OVO, DANA" },
    { name: "QRIS", description: "Pembayaran menggunakan QRIS" },
    { name: "Credit Card", description: "Pembayaran menggunakan kartu kredit" },
  ];

  for (const category of categories) {
    const existing = await prisma.paymentCategory.findFirst({
      where: { name: category.name, deletedAt: null },
    });

    if (!existing) {
      await prisma.paymentCategory.create({ data: category });
      console.log(`Created: ${category.name}`);
    } else {
      console.log(`Skipped: ${category.name} (already exists)`);
    }
  }

  console.log("Payment categories seeded!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
