// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function main() {
  // 1. Fetch provinces
  const provinces = await axios.get(
    "https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json"
  );

  for (const prov of provinces.data) {
    await prisma.province.upsert({
      where: { id: prov.id },
      update: {},
      create: {
        id: prov.id,
        name: prov.name,
      },
    });

    // 2. Fetch regencies per province
    const regencies = await axios.get(
      `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${prov.id}.json`
    );

    for (const reg of regencies.data) {
      await prisma.regency.upsert({
        where: { id: reg.id },
        update: {},
        create: {
          id: reg.id,
          name: reg.name,
          provinceId: reg.province_id,
        },
      });

      // 3. Fetch districts per regency
      const districts = await axios.get(
        `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${reg.id}.json`
      );

      for (const dis of districts.data) {
        await prisma.district.upsert({
          where: { id: dis.id },
          update: {},
          create: {
            id: dis.id,
            name: dis.name,
            regencyId: dis.regency_id,
          },
        });

        // 4. Fetch villages per district (pindahkan ke sini)
        const villages = await axios.get(
          `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${dis.id}.json`
        );

        for (const vil of villages.data) {
          await prisma.village.upsert({
            where: { id: vil.id },
            update: {},
            create: {
              id: vil.id,
              name: vil.name,
              districtId: vil.district_id,
            },
          });
        }
      }
    }
  }

  console.log("Seeding wilayah Indonesia selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
