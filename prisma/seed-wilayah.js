// prisma/seed-wilayah.js
// One-time seeder: fetch full Indonesia wilayah data from EMSIFA API
// Run: node prisma/seed-wilayah.js
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function main() {
  console.log("🌏 Fetching Indonesia wilayah data...");
  console.log("   (this may take several minutes)\n");

  const provinces = await axios.get("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json");
  console.log(`Provinsi: ${provinces.data.length}`);

  for (const prov of provinces.data) {
    await prisma.province.upsert({ where: { id: prov.id }, update: {}, create: { id: prov.id, name: prov.name } });

    const regencies = await axios.get(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${prov.id}.json`);
    for (const reg of regencies.data) {
      await prisma.regency.upsert({ where: { id: reg.id }, update: {}, create: { id: reg.id, name: reg.name, provinceId: reg.province_id } });

      const districts = await axios.get(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${reg.id}.json`);
      for (const dis of districts.data) {
        await prisma.district.upsert({ where: { id: dis.id }, update: {}, create: { id: dis.id, name: dis.name, regencyId: dis.regency_id } });

        const villages = await axios.get(`https://emsifa.github.io/api-wilayah-indonesia/api/villages/${dis.id}.json`);
        for (const vil of villages.data) {
          await prisma.village.upsert({ where: { id: vil.id }, update: {}, create: { id: vil.id, name: vil.name, districtId: vil.district_id } });
        }
      }
    }
    console.log(`  ✓ ${prov.name} (${regencies.data.length} kab/kota)`);
  }

  console.log("\n✅ Wilayah Indonesia seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
