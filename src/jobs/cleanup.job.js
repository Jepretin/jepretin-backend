const cron = require("node-cron");
const prisma = require("../services/prisma.service");

function startCleanupJobs() {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await prisma.tokenBlacklist.deleteMany({
        where: { expiredAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        console.log(`[Cleanup] ${result.count} expired token(s) deleted from blacklist.`);
      }
    } catch (err) {
      console.error("[Cleanup] TokenBlacklist cleanup failed:", err.message);
    }
  });

  console.log("[Jobs] Cleanup cron jobs registered.");
}

module.exports = { startCleanupJobs };
