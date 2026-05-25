require("dotenv").config({ path: ".env.test" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async () => {
  const province = await prisma.province.upsert({
    where: { id: "35" },
    create: { id: "35", name: "Jawa Timur" },
    update: {},
  });

  const regency = await prisma.regency.upsert({
    where: { id: "3578" },
    create: { id: "3578", provinceId: "35", name: "Kota Kediri" },
    update: {},
  });

  const district = await prisma.district.upsert({
    where: { id: "3578010" },
    create: { id: "3578010", regencyId: "3578", name: "Mojoroto" },
    update: {},
  });

  await prisma.village.upsert({
    where: { id: "3578010001" },
    create: { id: "3578010001", districtId: "3578010", name: "Mojoroto" },
    update: {},
  });

  const roles = ["Photographer", "Videographer", "MUA"];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const photoRole = await prisma.role.findUnique({ where: { name: "Photographer" } });

  await prisma.$disconnect();

  return { photoRoleId: photoRole?.id };
};
