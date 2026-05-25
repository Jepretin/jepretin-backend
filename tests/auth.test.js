const { api, registerUser, verifyOtp, loginUser, getToken, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma } = require("./helpers");

describe("Auth Flow", () => {
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  const testEmail = `auth-test-${Date.now()}@gmail.com`;

  test("POST /api/auth/register - should register new user", async () => {
    const res = await registerUser({ email: testEmail });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
  });

  test("POST /api/auth/register - should reject duplicate email", async () => {
    const res = await registerUser({ email: testEmail });
    expect(res.status).toBe(409);
  });

  test("POST /api/auth/login - should reject unverified user", async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: false } });
    const res = await loginUser(testEmail);
    expect(res.status).toBe(403);
  });

  test("POST /api/auth/login - should login verified user", async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    const res = await loginUser(testEmail);
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test("GET /api/user/get-user - should access protected route", async () => {
    const token = await getToken(testEmail);
    const res = await api().get("/api/user/get-user").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  test("GET /api/user/get-user - should reject without token", async () => {
    const res = await api().get("/api/user/get-user");
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/logout - should logout and blacklist token", async () => {
    const token = await getToken(testEmail);
    const logoutRes = await api().post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const res = await api().get("/api/user/get-user").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/forgot-password - should send reset email", async () => {
    const res = await api().post("/api/auth/forgot-password").send({ email: testEmail });
    expect(res.status).toBe(200);
  });

  test("POST /api/auth/reset-password - should reject invalid token", async () => {
    const res = await api().post("/api/auth/reset-password").send({
      token: "invalid-token",
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
