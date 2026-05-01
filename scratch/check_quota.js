
import { getDb } from "./services/quota.service"; // Wait, I should use the one from db.js

async function checkQuota(userId) {
    const db = await getDb();
    const quota = await db.getFirstAsync('SELECT * FROM quota_usage WHERE user_id = ?', [userId]);
    console.log('Current Quota:', quota);
}
