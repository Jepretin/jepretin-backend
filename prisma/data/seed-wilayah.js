const path = require("path");
const csv = require("csvtojson");
const prisma = require("../../src/services/prisma.service");

const DATA_DIR = __dirname;

async function main() {
  console.log("🌏 Seeding wilayah Indonesia...");

  // =========================
  // PROVINCES
  // =========================
  const provinces = await csv({
    noheader: true,
    headers: ["id", "name"],
  }).fromFile(path.join(DATA_DIR, "provinces.csv"));

  await prisma.province.createMany({
    data: provinces.map((p) => ({
      id: p.id,
      name: p.name,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Provinces: ${provinces.length}`);

  // =========================
  // REGENCIES
  // =========================
  const regencies = await csv({
    noheader: true,
    headers: ["id", "province_id", "name"],
  }).fromFile(path.join(DATA_DIR, "regencies.csv"));

  await prisma.regency.createMany({
    data: regencies.map((r) => ({
      id: r.id,
      name: r.name,
      provinceId: r.province_id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Regencies: ${regencies.length}`);

  // =========================
  // DISTRICTS
  // =========================
  const districts = await csv({
    noheader: true,
    headers: ["id", "regency_id", "name"],
  }).fromFile(path.join(DATA_DIR, "districts.csv"));

  await prisma.district.createMany({
    data: districts.map((d) => ({
      id: d.id,
      name: d.name,
      regencyId: d.regency_id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Districts: ${districts.length}`);

  // =========================
  // VILLAGES
  // =========================
  const villages = await csv({
    noheader: true,
    headers: ["id", "district_id", "name"],
  }).fromFile(path.join(DATA_DIR, "villages.csv"));

  await prisma.village.createMany({
    data: villages.map((v) => ({
      id: v.id,
      name: v.name,
      districtId: v.district_id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Villages: ${villages.length}`);

  console.log("🎉 Wilayah Indonesia berhasil di-seed!");
}

main()
  .catch((err) => {
    console.error("❌ Error seeding wilayah:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
