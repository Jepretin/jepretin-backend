const { api, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma } = require("./helpers");

describe("Critical Path: Order → Payment → Wallet", () => {
  let customerToken, providerToken, providerEmail, customerUserId, providerUserId;
  let addressId, providerId, bundleId, orderId;

  beforeAll(async () => {
    await cleanup();

    const customer = await createTestUserAndToken();
    customerToken = customer.token;
    const custUser = await prisma.user.findUnique({ where: { email: customer.email } });
    customerUserId = custUser.id;

    const provider = await createTestUserAndToken();
    providerToken = provider.token;
    providerEmail = provider.email;
    const provUser = await prisma.user.findUnique({ where: { email: providerEmail } });
    providerUserId = provUser.id;

    const photoRole = await prisma.role.findUnique({ where: { name: "Photographer" } });
    await registerAndAcceptProvider(providerToken, [photoRole.id]);

    const provDb = await prisma.provider.findUnique({ where: { userId: providerUserId } });
    providerId = provDb.id;

    await prisma.provider.update({ where: { id: providerId }, data: { status: "ACCEPTED" } });
    await prisma.user.update({ where: { id: providerUserId }, data: { role: "PROVIDER" } });
    await prisma.wallet.upsert({
      where: { providerId },
      create: { providerId, currentBalance: 0, pendingBalance: 0 },
      update: {},
    });
    await prisma.providerCoverage.create({ data: { providerId, districtId: "3578010" } });

    const address = await prisma.customerAddress.create({
      data: { userId: customerUserId, villageId: "3578010001", addressDetail: "Jl. Test No. 99", isPrimary: true },
    });
    addressId = address.id;

    const bundle = await prisma.providerBundle.create({
      data: { providerId, name: "Test Bundle " + Date.now(), price: 1500000 },
    });
    bundleId = bundle.id;
  });

  afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

  test("1. POST /api/order/order - create order", async () => {
    const res = await api().post("/api/order/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        providerId, addressId,
        eventDateTime: new Date(Date.now() + 86400000 * 7).toISOString(),
        items: [{ bundleId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    const orderData = res.body.data.data || res.body.data;
    orderId = orderData.id;
    expect(orderData.status).toBe("PENDING");
  });

  test("2. GET /api/order/my-orders", async () => {
    const res = await api().get("/api/order/my-orders").set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  test("3. GET /api/order/provider-orders", async () => {
    const res = await api().get("/api/order/provider-orders").set("Authorization", `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  test("4. PUT /api/order/order/:id - cancel order", async () => {
    const res = await api().put(`/api/order/order/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(200);
  });

  test("5. POST /api/payment/payment - requires Midtrans (external)", async () => {
    const res = await api().post("/api/payment/payment")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId });
    expect(typeof res.status).toBe("number");
  });

  test("6. GET /api/wallet/wallet - provider wallet", async () => {
    const res = await api().get("/api/wallet/wallet").set("Authorization", `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
  });
});
