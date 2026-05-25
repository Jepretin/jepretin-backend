// prisma/seed.js
// Full demo seeder — roles, payment, users, providers, orders, templates, reviews
// Run: npx prisma db seed
// After first run, also run: node prisma/seed-wilayah.js (one-time, external API)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Jepretin seeder...\n");

  // ============================================================
  // STEP 1: Reference Data (always run, idempotent)
  // ============================================================
  console.log("── Step 1: Reference Data ──");

  const roles = [{ name: "Photographer" }, { name: "Videographer" }, { name: "MUA" }];
  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
  }
  const [photoRole, videoRole, muaRole] = await Promise.all(
    roles.map((r) => prisma.role.findUnique({ where: { name: r.name } }))
  );
  console.log("  ✓ Roles: Photographer, Videographer, MUA");

  const categories = [
    { name: "Virtual Account", description: "Pembayaran melalui VA Bank" },
    { name: "E-Wallet", description: "Pembayaran via GoPay, OVO, DANA" },
    { name: "QRIS", description: "Pembayaran menggunakan QRIS" },
    { name: "Credit Card", description: "Pembayaran menggunakan kartu kredit" },
  ];
  for (const cat of categories) {
    const existing = await prisma.paymentCategory.findFirst({ where: { name: cat.name, deletedAt: null } });
    if (!existing) await prisma.paymentCategory.create({ data: cat });
  }
  console.log("  ✓ Payment Categories: 4");

  const catMap = {};
  (await prisma.paymentCategory.findMany()).forEach((c) => (catMap[c.name] = c.id));

  const methods = [
    { name: "BCA VA", provider: "BCA", categoryId: catMap["Virtual Account"] },
    { name: "BNI VA", provider: "BNI", categoryId: catMap["Virtual Account"] },
    { name: "BRI VA", provider: "BRI", categoryId: catMap["Virtual Account"] },
    { name: "GoPay", provider: "GoPay", categoryId: catMap["E-Wallet"] },
    { name: "OVO", provider: "OVO", categoryId: catMap["E-Wallet"] },
    { name: "DANA", provider: "DANA", categoryId: catMap["E-Wallet"] },
    { name: "QRIS Nasional", provider: "QRIS", categoryId: catMap["QRIS"] },
    { name: "Visa", provider: "Visa", categoryId: catMap["Credit Card"] },
    { name: "MasterCard", provider: "MasterCard", categoryId: catMap["Credit Card"] },
  ];
  for (const m of methods) {
    const key = `${m.name}_${m.categoryId}`;
    const existing = await prisma.paymentMethod.findFirst({
      where: { name: m.name, categoryId: m.categoryId, deletedAt: null },
    });
    if (!existing) await prisma.paymentMethod.create({ data: m });
  }
  console.log("  ✓ Payment Methods: 9");

  // Minimal wilayah data (just Kota Kediri area for demo)
  const province = await prisma.province.upsert({ where: { id: "35" }, update: {}, create: { id: "35", name: "Jawa Timur" } });
  const regency = await prisma.regency.upsert({ where: { id: "3578" }, update: {}, create: { id: "3578", provinceId: "35", name: "Kota Kediri" } });
  const district = await prisma.district.upsert({ where: { id: "3578010" }, update: {}, create: { id: "3578010", regencyId: "3578", name: "Mojoroto" } });
  const village = await prisma.village.upsert({ where: { id: "3578010001" }, update: {}, create: { id: "3578010001", districtId: "3578010", name: "Mojoroto" } });
  console.log("  ✓ Wilayah: Jawa Timur → Kota Kediri → Mojoroto");

  // ============================================================
  // STEP 2: Notification Templates
  // ============================================================
  console.log("\n── Step 2: Notification Templates ──");

  const templates = [
    { title: "Order Created", type: "ORDER_STATUS", message: "Pesanan baru telah dibuat. Silakan lakukan pembayaran." },
    { title: "Payment Success", type: "PAYMENT", message: "Pembayaran berhasil! Provider akan segera memproses pesanan Anda." },
    { title: "Provider Accepted", type: "SYSTEM", message: "Selamat! Akun provider Anda telah disetujui." },
    { title: "Welcome", type: "GREETING", message: "Selamat datang di Jepretin! Temukan fotografer terbaik di sekitar Anda." },
    { title: "Order Completed", type: "ORDER_STATUS", message: "Pesanan telah selesai. Silakan beri review untuk provider." },
  ];
  for (const tpl of templates) {
    const existing = await prisma.notificationTemplate.findFirst({ where: { title: tpl.title } });
    if (!existing) await prisma.notificationTemplate.create({ data: tpl });
  }
  console.log("  ✓ Notification Templates: 5");

  // ============================================================
  // STEP 3: Demo Users
  // ============================================================
  console.log("\n── Step 3: Demo Users ──");

  const hash = await bcrypt.hash("password123", 10);

  const users = [
    { name: "Admin Jepretin", email: "admin@jepretin.com", role: "ADMIN" },
    { name: "Rina Customer", email: "rina@jepretin.com", role: "CUSTOMER" },
    { name: "Budi Customer", email: "budi@jepretin.com", role: "CUSTOMER" },
    { name: "Andi Photographer", email: "andi@jepretin.com", role: "PROVIDER" },
    { name: "Sari MUA", email: "sari@jepretin.com", role: "PROVIDER" },
  ];

  const createdUsers = {};
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { name: u.name, role: u.role, isActive: true, isVerified: true, deletedAt: null },
      });
      createdUsers[u.email] = existing;
    } else {
      const user = await prisma.user.create({
        data: { name: u.name, email: u.email, password: hash, role: u.role, phone: "081234567890", isVerified: true },
      });
      createdUsers[u.email] = user;
    }
  }
  console.log("  ✓ Users: admin, 2 customers, 2 providers (password: password123)");

  // ============================================================
  // STEP 4: Provider Profiles
  // ============================================================
  console.log("\n── Step 4: Provider Profiles ──");

  async function setupProvider(userEmail, roleIds, bundles, toppings, experienceUrl) {
    const user = createdUsers[userEmail];
    const existing = await prisma.provider.findUnique({ where: { userId: user.id } });

    let provider;
    if (existing) {
      provider = existing;
      await prisma.provider.update({ where: { id: provider.id }, data: { status: "ACCEPTED", experience: experienceUrl, deletedAt: null } });
    } else {
      provider = await prisma.provider.create({ data: { userId: user.id, status: "ACCEPTED", experience: experienceUrl } });
    }

    // Wallet
    const wallet = await prisma.wallet.upsert({
      where: { providerId: provider.id },
      update: {},
      create: { providerId: provider.id, currentBalance: 500000, pendingBalance: 0 },
    });

    // Roles
    for (const rid of roleIds) {
      const pr = await prisma.providerRole.findFirst({ where: { providerId: provider.id, roleId: rid } });
      if (!pr) await prisma.providerRole.create({ data: { providerId: provider.id, roleId: rid } });
      else if (pr.deletedAt) await prisma.providerRole.update({ where: { id: pr.id }, data: { deletedAt: null } });
    }

    // Coverage (Kota Kediri area)
    await prisma.providerCoverage.upsert({
      where: { providerId_districtId: { providerId: provider.id, districtId: "3578010" } },
      update: { deletedAt: null },
      create: { providerId: provider.id, districtId: "3578010" },
    });

    // Portfolio
    const imgBase = "https://ik.imagekit.io/jepretin/demo";
    const portfolios = [
      { mediaUrl: `${imgBase}/photo1.jpg`, mediaType: "image", description: "Wedding couple portrait outdoor" },
      { mediaUrl: `${imgBase}/photo2.jpg`, mediaType: "image", description: "Pre-wedding candid moment" },
      { mediaUrl: `${imgBase}/photo3.jpg`, mediaType: "image", description: "Golden hour engagement shoot" },
    ];
    const existingPf = await prisma.providerPortfolio.findFirst({ where: { providerId: provider.id } });
    if (!existingPf) {
      for (const pf of portfolios) {
        await prisma.providerPortfolio.create({ data: { providerId: provider.id, ...pf } });
      }
    }
    console.log(`    Portfolio: 3 images`);

    // Bundles
    for (const b of bundles) {
      const existingB = await prisma.providerBundle.findFirst({ where: { providerId: provider.id, name: b.name } });
      if (!existingB) {
        await prisma.providerBundle.create({ data: { providerId: provider.id, ...b } });
      }
    }
    console.log(`    Bundles: ${bundles.length}`);

    // Toppings
    for (const t of toppings) {
      const existingT = await prisma.providerTopping.findFirst({ where: { providerId: provider.id, name: t.name } });
      if (!existingT) {
        await prisma.providerTopping.create({ data: { providerId: provider.id, ...t } });
      }
    }
    console.log(`    Toppings: ${toppings.length}`);

    // Availability (available for most dates, blocked on some weekends)
    const existingAvail = await prisma.providerAvailability.findFirst({ where: { providerId: provider.id } });
    if (!existingAvail) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const blockStart = new Date(futureDate);
      blockStart.setDate(blockStart.getDate() + 14);
      const blockEnd = new Date(blockStart);
      blockEnd.setDate(blockEnd.getDate() + 2);
      await prisma.providerAvailability.create({
        data: { providerId: provider.id, startDate: blockStart, endDate: blockEnd, isAvailable: false },
      });
    }
    console.log(`    Availability: blocked 2-day weekend`);

    return provider;
  }

  // Andi — Photographer
  const andiProvider = await setupProvider(
    "andi@jepretin.com",
    [photoRole.id, videoRole.id],
    [
      { name: "Wedding Main Package", description: "Full day coverage, 2 photographers, 300 edited photos, 1 album", price: 7500000 },
      { name: "Pre-wedding Package", description: "4 hours session, 2 locations, 150 edited photos", price: 3500000 },
    ],
    [
      { name: "Drone Footage", description: "Aerial video & photo menggunakan drone DJI", price: 1500000, isStandalone: true },
      { name: "Extra Hour", description: "Tambahan 1 jam sesi foto", price: 500000, isStandalone: false },
      { name: "Printed Album", description: "Album cetak 20x30 cm, 40 halaman", price: 1200000, isStandalone: true },
    ],
    "https://drive.google.com/portfolio/andi"
  );
  console.log("  ✓ Andi Photographer (Photographer + Videographer)");

  // Sari — MUA
  const sariProvider = await setupProvider(
    "sari@jepretin.com",
    [muaRole.id],
    [
      { name: "Wedding Makeup Package", description: "Bridal makeup + 2 bridesmaids, pre-wedding trial", price: 5000000 },
      { name: "Graduation Makeup", description: "Makeup wisuda + hairstyling", price: 1500000 },
    ],
    [
      { name: "False Eyelashes", description: "Bulu mata palsu premium", price: 150000, isStandalone: false },
      { name: "Body Painting", description: "Henna/body art untuk pengantin", price: 750000, isStandalone: true },
      { name: "Touch-up Service", description: "Touch-up makeup selama acara (per jam)", price: 300000, isStandalone: true },
    ],
    "https://drive.google.com/portfolio/sari"
  );
  console.log("  ✓ Sari MUA (Makeup Artist)");

  // ============================================================
  // STEP 5: Customer Addresses
  // ============================================================
  console.log("\n── Step 5: Customer Addresses ──");

  const rinaUser = createdUsers["rina@jepretin.com"];
  const rinaAddr = await prisma.customerAddress.upsert({
    where: { id: rinaUser.id + "_primary" },
    update: { addressDetail: "Jl. Dhoho No. 45, Kediri", deletedAt: null },
    create: { id: rinaUser.id + "_primary", userId: rinaUser.id, villageId: "3578010001", addressDetail: "Jl. Dhoho No. 45, Kediri", isPrimary: true },
  });

  const budiUser = createdUsers["budi@jepretin.com"];
  const budiAddr = await prisma.customerAddress.upsert({
    where: { id: budiUser.id + "_primary" },
    update: { addressDetail: "Jl. Veteran No. 12, Kediri", deletedAt: null },
    create: { id: budiUser.id + "_primary", userId: budiUser.id, villageId: "3578010001", addressDetail: "Jl. Veteran No. 12, Kediri", isPrimary: true },
  });
  console.log("  ✓ Customer Addresses: Rina (Dhoho 45), Budi (Veteran 12)");

  // ============================================================
  // STEP 6: Demo Orders
  // ============================================================
  console.log("\n── Step 6: Demo Orders ──");

  const andiBundles = await prisma.providerBundle.findMany({ where: { providerId: andiProvider.id, deletedAt: null } });
  const weddingBundle = andiBundles.find((b) => b.name.includes("Wedding")) || andiBundles[0];
  const prewedBundle = andiBundles.find((b) => b.name.includes("Pre")) || andiBundles[0];

  // Order 1: Rina → Andi (COMPLETED — Rina udah selesai, bisa review)
  let order1 = await prisma.order.findFirst({ where: { userId: rinaUser.id, status: "COMPLETED" } });
  if (!order1) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 14);
    order1 = await prisma.order.create({
      data: {
        userId: rinaUser.id, providerId: andiProvider.id, addressId: rinaAddr.id,
        eventDateTime: pastDate, status: "COMPLETED", totalPrice: weddingBundle?.price || 7500000,
        orderItems: {
          create: [{
            bundleId: weddingBundle?.id,
            price: weddingBundle?.price || 7500000,
            orderItemToppings: {
              create: [{ toppingId: (await prisma.providerTopping.findFirst({ where: { providerId: andiProvider.id, name: "Drone Footage" } }))?.id || "", price: 1500000, quantity: 1 }],
            },
          }],
        },
      },
    });
  }
  console.log("  ✓ Order 1: Rina → Andi (COMPLETED — Wedding Package)");

  // Order 2: Budi → Andi (IN_PROGRESS — sedang dikerjakan)
  let order2 = await prisma.order.findFirst({ where: { userId: budiUser.id, status: "IN_PROGRESS" } });
  if (!order2) {
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() - 3);
    order2 = await prisma.order.create({
      data: {
        userId: budiUser.id, providerId: andiProvider.id, addressId: budiAddr.id,
        eventDateTime: nearDate, status: "IN_PROGRESS", totalPrice: prewedBundle?.price || 3500000,
        orderItems: {
          create: [{ bundleId: prewedBundle?.id, price: prewedBundle?.price || 3500000 }],
        },
      },
    });
  }
  console.log("  ✓ Order 2: Budi → Andi (IN_PROGRESS — Pre-wedding)");

  // Order 3: Rina → Sari (PENDING — baru dibuat, belum bayar)
  const sariBundles = await prisma.providerBundle.findMany({ where: { providerId: sariProvider.id, deletedAt: null } });
  const sariBundle = sariBundles[0];
  let order3 = await prisma.order.findFirst({ where: { userId: rinaUser.id, providerId: sariProvider.id, status: "PENDING" } });
  if (!order3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    order3 = await prisma.order.create({
      data: {
        userId: rinaUser.id, providerId: sariProvider.id, addressId: rinaAddr.id,
        eventDateTime: futureDate, status: "PENDING", totalPrice: sariBundle?.price || 5000000,
        orderItems: {
          create: [
            { bundleId: sariBundle?.id, price: sariBundle?.price || 5000000 },
            { price: 300000, orderItemToppings: { create: [{ toppingId: (await prisma.providerTopping.findFirst({ where: { providerId: sariProvider.id, name: "Touch-up Service" } }))?.id || "", price: 300000, quantity: 1 }] } },
          ],
        },
      },
    });
  }
  console.log("  ✓ Order 3: Rina → Sari (PENDING — Wedding Makeup)");

  // ============================================================
  // STEP 7: Demo Review
  // ============================================================
  console.log("\n── Step 7: Demo Review ──");

  const existingReview = await prisma.review.findUnique({ where: { orderId: order1.id } });
  if (!existingReview) {
    await prisma.review.create({
      data: { orderId: order1.id, userId: rinaUser.id, providerId: andiProvider.id, rating: 5, comment: "Hasil foto luar biasa! Andi sangat profesional dan hasilnya di atas ekspektasi. Recommended banget!" },
    });
    console.log("  ✓ Review: Rina → Andi (5★)");
  } else {
    console.log("  • Review already exists");
  }

  // ============================================================
  // DONE
  // ============================================================
  console.log("\n✅ Seeding complete!\n");
  console.log("──────────────────────────────────────────");
  console.log("  Demo Accounts (password: password123):");
  console.log("  admin@jepretin.com    — Admin");
  console.log("  rina@jepretin.com     — Customer");
  console.log("  budi@jepretin.com     — Customer");
  console.log("  andi@jepretin.com     — Provider (Photographer + Videographer)");
  console.log("  sari@jepretin.com     — Provider (MUA)");
  console.log("──────────────────────────────────────────");
  console.log("  Orders: COMPLETED, IN_PROGRESS, PENDING");
  console.log("  Review: 1 on completed order");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
