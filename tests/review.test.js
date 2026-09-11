const { api, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma } = require("./helpers");

describe("Review Module", () => {
  let customerToken, providerToken, customerEmail, providerEmail;
  let customerId, providerId, orderId;
  let reviewId;

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

    const custUser = await prisma.user.findUnique({ where: { email: customerEmail } });
    customerId = custUser.id;

    const provUser = await prisma.user.findUnique({ where: { email: providerEmail } });
    const provDb = await prisma.provider.findUnique({ where: { userId: provUser.id } });
    providerId = provDb.id;

    await prisma.provider.update({ where: { id: providerId }, data: { status: "ACCEPTED" } });
    await prisma.user.update({ where: { email: providerEmail }, data: { role: "PROVIDER" } });

    await prisma.providerCoverage.create({ data: { providerId, districtId: "3578010" } });

    const address = await prisma.customerAddress.create({
      data: { userId: customerId, villageId: "3578010001", addressDetail: "Jl. Review Test", isPrimary: true },
    });

    const bundle = await prisma.providerBundle.create({
      data: { providerId, name: "Review Bundle " + Date.now(), price: 500000 },
    });

    const order = await prisma.order.create({
      data: {
        userId: customerId,
        providerId,
        addressId: address.id,
        eventDateTime: new Date(Date.now() - 86400000 * 7),
        status: "COMPLETED",
        totalPrice: 500000,
        orderItems: { create: [{ bundleId: bundle.id, price: 500000 }] },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test("POST /review/review — create review for COMPLETED order", async () => {
    const res = await api()
      .post("/api/review/review")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, rating: 5, comment: "Fotografer terbaik!" });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.rating).toBe(5);
    reviewId = res.body.data.id;
  });

  test("POST /review/review — reject duplicate review for same order", async () => {
    const res = await api()
      .post("/api/review/review")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, rating: 3, comment: "Duplikat" });

    expect(res.status).toBe(400);
  });

  test("GET /review/my-reviews — customer list own reviews", async () => {
    const res = await api()
      .get("/api/review/my-reviews")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.data).toBeInstanceOf(Array);
  });

  test("GET /review/provider-reviews — provider list received reviews", async () => {
    const res = await api()
      .get("/api/review/provider-reviews")
      .set("Authorization", `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.averageRating).toBe(5);
  });

  test("GET /review/provider/:providerId — get reviews by provider ID", async () => {
    const res = await api()
      .get(`/api/review/provider/${providerId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.providerId).toBe(providerId);
    expect(res.body.data.totalReviews).toBeGreaterThanOrEqual(1);
  });

  test("GET /review/:id — get review by ID", async () => {
    const res = await api()
      .get(`/api/review/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.id).toBe(reviewId);
    expect(res.body.data.data.rating).toBe(5);
  });

  test("PUT /review/:id — update own review", async () => {
    const res = await api()
      .put(`/api/review/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4, comment: "Review diupdate" });

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.comment).toBe("Review diupdate");
  });

  test("DELETE /review/:id — soft delete own review", async () => {
    const res = await api()
      .delete(`/api/review/${reviewId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(deleted.deletedAt).not.toBeNull();
  });
});
