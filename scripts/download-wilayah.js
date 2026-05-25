const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BASE_URL = "https://emsifa.github.io/api-wilayah-indonesia/api";

const DATA_DIR = path.join(__dirname, "../prisma/data");

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log("🌏 Download provinces...");
  const provinces = await axios.get(`${BASE_URL}/provinces.json`);
  fs.writeFileSync(
    path.join(DATA_DIR, "provinces.json"),
    JSON.stringify(provinces.data, null, 2),
  );

  const allRegencies = [];
  const allDistricts = [];
  const allVillages = [];

  for (const province of provinces.data) {
    console.log(`📍 Province: ${province.name}`);

    const regencies = await axios.get(
      `${BASE_URL}/regencies/${province.id}.json`,
    );

    allRegencies.push(...regencies.data);

    for (const regency of regencies.data) {
      console.log(`   └─ Regency: ${regency.name}`);

      const districts = await axios.get(
        `${BASE_URL}/districts/${regency.id}.json`,
      );

      allDistricts.push(...districts.data);

      for (const district of districts.data) {
        const villages = await axios.get(
          `${BASE_URL}/villages/${district.id}.json`,
        );

        allVillages.push(...villages.data);
      }
    }
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "regencies.json"),
    JSON.stringify(allRegencies, null, 2),
  );

  fs.writeFileSync(
    path.join(DATA_DIR, "districts.json"),
    JSON.stringify(allDistricts, null, 2),
  );

  fs.writeFileSync(
    path.join(DATA_DIR, "villages.json"),
    JSON.stringify(allVillages, null, 2),
  );

  console.log("✅ Semua wilayah berhasil disimpan ke prisma/data");
}

main().catch(console.error);
