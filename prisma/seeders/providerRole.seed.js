const prisma = require("../../src/services/prisma.service");

async function main() {
  await prisma.role.createMany({
    data: [{ name: "Photographer" }, { name: "Videographer" }, { name: "MUA" }],
    skipDuplicates: true,
  });
}

main()
  .then(() => console.log("Provider Role Seed berhasil ditambah"))
  .catch((e) => console.error(e))
  .finally(async () => prisma.$disconnect());
