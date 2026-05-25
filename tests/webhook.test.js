const { api, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma } = require("./helpers");
const crypto = require("crypto");

function computeSignature(orderId, statusCode, grossAmount) {
  return crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + process.env.MIDTRANS_SERVER_KEY)
    .digest("hex");
}

describe("Payment Webhook", () => {
  let customerToken, customerEmail;
  let providerId;
  let transactionId, grossAmount, orderId;

  beforeAll(async () => {
    await cleanup();

    const customer = await createTestUserAndToken();
    customerToken = customer.token;
    customerEmail = customer.email;

    const provider = await createTestUserAndToken();
    const providerToken = provider.token;
    const providerEmail = provider.email;

    const photoRole = await prisma.role.findUnique({ where: { name: "Photographer" } });
    await registerAndAcceptProvider(providerToken, [photoRole.id]);
    const provUser = await prisma.user.findUnique({ where: { email: providerEmail } });
    const provDb = await prisma.provider.findUnique({ where: { userId: provUser.id } });
    providerId = provDb.id;

    await prisma.provider.update({ where: { id: providerId }, data: { status: "ACCEPTED" } });
    await prisma.user.update({ where: { email: providerEmail }, data: { role: "PROVIDER" } });
    await prisma.wallet.upsert({ where: { providerId }, create: { providerId, currentBalance: 0, pendingBalance: 0 }, update: {} });
    await prisma.providerCoverage.create({ data: { providerId, districtId: "3578010" } });

    const custUser = await prisma.user.findUnique({ where: { email: customerEmail } });
    const address = await prisma.customerAddress.create({
      data: { userId: custUser.id, villageId: "3578010001", addressDetail: "Jl. Webhook Test", isPrimary: true },
    });
    const bundle = await prisma.providerBundle.create({
      data: { providerId, name: "WH Bundle " + Date.now(), price: 500000 },
    });

    const order = await prisma.order.create({
      data: {
        userId: custUser.id, providerId, addressId: address.id,
        eventDateTime: new Date(Date.now() + 86400000 * 60),
        status: "PENDING", totalPrice: 500000,
        orderItems: { create: [{ bundleId: bundle.id, price: 500000 }] },
      },
    });
    orderId = order.id;

    transactionId = "PAY-" + crypto.randomUUID();
    grossAmount = "500000";

    await prisma.payment.create({
      data: {
        orderId,
        amount: 500000,
        transactionId,
        status: "PENDING",
        rawResponse: {},
      },
    });
  });

  afterAll(async () => { await cleanup(); await prisma.$disconnect(); });

  test("1. Valid webhook (settlement) → payment SUCCESS, order PAID", async () => {
    const signature = computeSignature(transactionId, "200", grossAmount);

    const res = await api()
      .post("/api/payment/webhook")
      .set("x-callback-signature", signature)
      .send({
        transaction_status: "settlement",
        order_id: transactionId,
        status_code: "200",
        gross_amount: grossAmount,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("SUCCESS");

    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    expect(payment.status).toBe("SUCCESS");
    expect(payment.paidAt).not.toBeNull();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order.status).toBe("PAID");
  });

  test("2. Invalid signature → reject with 403", async () => {
    const res = await api()
      .post("/api/payment/webhook")
      .set("x-callback-signature", "invalid-signature")
      .send({
        transaction_status: "settlement",
        order_id: transactionId,
        status_code: "200",
        gross_amount: grossAmount,
      });

    expect(res.status).toBe(403);
  });

  test("3. Non-existent transaction → 404", async () => {
    const fakeId = "PAY-00000000-0000-0000-0000-000000000000";
    const signature = computeSignature(fakeId, "200", "500000");

    const res = await api()
      .post("/api/payment/webhook")
      .set("x-callback-signature", signature)
      .send({
        transaction_status: "settlement",
        order_id: fakeId,
        status_code: "200",
        gross_amount: "500000",
      });

    expect(res.status).toBe(404);
  });

  test("4. Cancel webhook → payment FAILED", async () => {
    const txId2 = "PAY-" + crypto.randomUUID();
    const signature = computeSignature(txId2, "202", "300000");

    await prisma.payment.create({
      data: { orderId, amount: 300000, transactionId: txId2, status: "PENDING", rawResponse: {} },
    });

    const res = await api()
      .post("/api/payment/webhook")
      .set("x-callback-signature", signature)
      .send({
        transaction_status: "cancel",
        order_id: txId2,
        status_code: "202",
        gross_amount: "300000",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("FAILED");

    const payment = await prisma.payment.findUnique({ where: { transactionId: txId2 } });
    expect(payment.status).toBe("FAILED");
  });

  test("5. Deny webhook → payment FAILED", async () => {
    const txId3 = "PAY-" + crypto.randomUUID();
    const signature = computeSignature(txId3, "202", "400000");

    await prisma.payment.create({
      data: { orderId, amount: 400000, transactionId: txId3, status: "PENDING", rawResponse: {} },
    });

    const res = await api()
      .post("/api/payment/webhook")
      .set("x-callback-signature", signature)
      .send({
        transaction_status: "deny",
        order_id: txId3,
        status_code: "202",
        gross_amount: "400000",
      });

    expect(res.status).toBe(200);
    const payment = await prisma.payment.findUnique({ where: { transactionId: txId3 } });
    expect(payment.status).toBe("FAILED");
  });
});
