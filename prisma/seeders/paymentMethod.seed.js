const prisma = require("../../src/services/prisma.service");

async function main() {
  const categories = await prisma.paymentCategory.findMany();

  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.name] = cat.id;
  });

  const methods = [
    // Virtual Account
    {
      name: "BCA VA",
      provider: "BCA",
      categoryId: categoryMap["Virtual Account"],
    },
    {
      name: "BNI VA",
      provider: "BNI",
      categoryId: categoryMap["Virtual Account"],
    },
    {
      name: "BRI VA",
      provider: "BRI",
      categoryId: categoryMap["Virtual Account"],
    },

    // E-Wallet
    {
      name: "GoPay",
      provider: "GoPay",
      categoryId: categoryMap["E-Wallet"],
    },
    {
      name: "OVO",
      provider: "OVO",
      categoryId: categoryMap["E-Wallet"],
    },
    {
      name: "DANA",
      provider: "DANA",
      categoryId: categoryMap["E-Wallet"],
    },

    // QRIS
    {
      name: "QRIS Nasional",
      provider: "QRIS",
      categoryId: categoryMap["QRIS"],
    },

    // Credit Card
    {
      name: "Visa",
      provider: "Visa",
      categoryId: categoryMap["Credit Card"],
    },
    {
      name: "MasterCard",
      provider: "MasterCard",
      categoryId: categoryMap["Credit Card"],
    },
  ];

  for (const method of methods) {
    await prisma.paymentMethod.upsert({
      where: {
        name_categoryId: {
          name: method.name,
          categoryId: method.categoryId,
        },
      },
      update: {},
      create: method,
    });
  }

  console.log("Payment methods seeded!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
