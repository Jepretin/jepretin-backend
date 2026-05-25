const { api, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma } = require("./helpers");

describe("Integration: Withdrawal, Review, Notification, Like, Availability, Template", () => {
  let customerToken, providerToken, customerEmail, providerEmail;
  let providerId, orderId;
  let withdrawalId;

  beforeAll(async () => {
    await cleanup();

    const customer = await createTestUserAndToken();
    customerToken = customer.token;
    customerEmail = customer.email;

    const provider = await createTestUserAndToken();
    providerToken = provider.token;
    providerEmail = provider.email;

    const photoRole = await prisma.role.findUnique({ where: { name: "Photographer" } });
    await registerAndAcceptProvider(providerToken, [photoRole.id]);

    const provUser = await prisma.user.findUnique({ where: { email: providerEmail } });
    const provDb = await prisma.provider.findUnique({ where: { userId: provUser.id } });
    providerId = provDb.id;

    await prisma.provider.update({ where: { id: providerId }, data: { status: "ACCEPTED" } });
    await prisma.user.update({ where: { email: providerEmail }, data: { role: "PROVIDER" } });
    await prisma.wallet.upsert({
      where: { providerId },
      create: { providerId, currentBalance: 500000, pendingBalance: 0 },
      update: {},
    });
    await prisma.providerCoverage.create({ data: { providerId, districtId: "3578010" } });

    const custUser = await prisma.user.findUnique({ where: { email: customerEmail } });
    const address = await prisma.customerAddress.create({
      data: { userId: custUser.id, villageId: "3578010001", addressDetail: "Jl. Int Test", isPrimary: true },
    });
    const bundle = await prisma.providerBundle.create({
      data: { providerId, name: "IT Bundle " + Date.now(), price: 1000000 },
    });

    const order = await prisma.order.create({
      data: {
        userId: custUser.id, providerId, addressId: address.id,
        eventDateTime: new Date(Date.now() - 86400000 * 30),
        status: "COMPLETED", totalPrice: 1000000,
        orderItems: { create: [{ bundleId: bundle.id, price: 1000000 }] },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

  // ================================================================
  // WITHDRAWAL
  // ================================================================
  describe("Withdrawal", () => {
    test("POST /withdrawal/request — request withdrawal", async () => {
      const res = await api()
        .post("/api/withdrawal/request")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ amount: 100000, bankName: "BCA", bankAccountNumber: "1234567890", bankAccountName: "Test Provider" });

      expect(res.status).toBe(201);
      withdrawalId = res.body.data.id;

      const wallet = await prisma.wallet.findUnique({ where: { providerId } });
      expect(Number(wallet.currentBalance)).toBe(400000);
      expect(Number(wallet.pendingBalance)).toBe(100000);
    });

    test("GET /withdrawal/my-requests — list requests", async () => {
      const res = await api().get("/api/withdrawal/my-requests").set("Authorization", `Bearer ${providerToken}`);
      expect(res.status).toBe(200);
    });

    test("GET /withdrawal/{id} — get detail", async () => {
      const res = await api().get(`/api/withdrawal/${withdrawalId}`).set("Authorization", `Bearer ${providerToken}`);
      expect(res.status).toBe(200);
    });

    test("PUT /withdrawal/{id}/approve — admin approve", async () => {
      const admin = await createTestUserAndToken();
      const adminUser = await prisma.user.findUnique({ where: { email: admin.email } });
      await prisma.user.update({ where: { id: adminUser.id }, data: { role: "ADMIN" } });

      const loginRes = await api().post("/api/auth/login").send({ email: admin.email, password: "123456" });
      const adminTokenW = loginRes.body.data.token;

      const res = await api()
        .put(`/api/withdrawal/${withdrawalId}/approve`)
        .set("Authorization", `Bearer ${adminTokenW}`)
        .send({ title: "Test Promo", type: "PROMO", message: "Diskon 50%!" });
      expect(res.status).toBe(201);
      templateId = res.body.data.id;
    });

    test("GET /notification/template — list templates", async () => {
      const res = await api().get("/api/notification/template").set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
    });

    test("GET /notification/template/{id} — get by ID", async () => {
      const res = await api().get(`/api/notification/template/${templateId}`).set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
    });

    test("PUT /notification/template/{id} — admin update", async () => {
      const res = await api()
        .put(`/api/notification/template/${templateId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ message: "Flash sale!" });
      expect(res.status).toBe(200);
    });

    test("DELETE /notification/template/{id} — admin delete", async () => {
      const res = await api().delete(`/api/notification/template/${templateId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ================================================================
  // LIKE
  // ================================================================
  describe("Like", () => {
    let portfolioId;

    beforeAll(async () => {
      const pf = await prisma.providerPortfolio.create({
        data: { providerId, mediaUrl: "https://ik.imagekit.io/test.jpg", mediaType: "image", description: "Test" },
      });
      portfolioId = pf.id;
    });

    test("POST /like/toggle — like portfolio", async () => {
      const res = await api()
        .post("/api/like/toggle")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ portfolioId });
      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBe(true);
      expect(res.body.data.likeCount).toBe(1);
    });

    test("POST /like/toggle — unlike (toggle again)", async () => {
      const res = await api()
        .post("/api/like/toggle")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ portfolioId });
      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBe(false);
      expect(res.body.data.likeCount).toBe(0);
    });

    test("GET /like/count/{portfolioId} — get count", async () => {
      const res = await api().get(`/api/like/count/${portfolioId}`).set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.likeCount).toBe(0);
    });

    test("GET /like/my-likes — list likes", async () => {
      const res = await api().get("/api/like/my-likes").set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ================================================================
  // PROVIDER AVAILABILITY
  // ================================================================
  describe("Provider Availability", () => {
    let availId;

    test("POST /provider/availability — create", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const end = new Date(future);
      end.setDate(end.getDate() + 3);

      const res = await api()
        .post("/api/provider/availability")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ startDate: future.toISOString(), endDate: end.toISOString(), isAvailable: false });

      expect(res.status).toBe(201);
      availId = res.body.data.id;
    });

    test("GET /provider/availability — list", async () => {
      const res = await api().get("/api/provider/availability").set("Authorization", `Bearer ${providerToken}`);
      expect(res.status).toBe(200);
    });

    test("PUT /provider/availability/{id} — update", async () => {
      const res = await api()
        .put(`/api/provider/availability/${availId}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ isAvailable: true });
      expect(res.status).toBe(200);
    });

    test("DELETE /provider/availability/{id} — delete", async () => {
      const res = await api().delete(`/api/provider/availability/${availId}`).set("Authorization", `Bearer ${providerToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ================================================================
  // PROVIDER ROLE CRUD
  // ================================================================
  describe("Provider Role CRUD", () => {
    let roleId;
    let adminToken;

    beforeAll(async () => {
      const admin = await createTestUserAndToken();
      const adminUser = await prisma.user.findUnique({ where: { email: admin.email } });
      await prisma.user.update({ where: { id: adminUser.id }, data: { role: "ADMIN" } });
      const loginRes = await api().post("/api/auth/login").send({ email: admin.email, password: "123456" });
      adminToken = loginRes.body.data.token;
    });

    test("POST /provider/role — admin creates role", async () => {
      const res = await api()
        .post("/api/provider/role")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Drone Pilot" });
      expect(res.status).toBe(201);
      roleId = res.body.data.id || res.body.data.data?.id;
    });

    test("PUT /provider/role/{id} — admin updates role", async () => {
      const res = await api()
        .put(`/api/provider/role/${roleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Aerial Specialist" });
      expect(res.status).toBe(200);
    });
  });
});
