const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Admin secret strictly from private Google Cloud environment variable (never exposed on GitHub)
const ADMIN_SECRET = process.env.GIVEAWAY_ADMIN_SECRET;

/**
 * Helper to apply CORS headers
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://amoledwatchfaces.com",
    "https://amoledwatchfaces.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000"
  ];

  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "https://amoledwatchfaces.github.io");
  }

  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-secret");
}

/**
 * 1. Endpoint: subscribetoannouncements
 * Subscribes / unsubscribes a Web Push FCM token to/from 'announcements' topic.
 */
exports.subscribetoannouncements = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, topic = "announcements", action = "subscribe" } = req.body || {};

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Valid FCM token is required" });
  }

  try {
    let response;
    if (action === "unsubscribe") {
      response = await admin.messaging().unsubscribeFromTopic([token], topic);
      console.log(`Unsubscribed token from topic '${topic}':`, response);
    } else {
      response = await admin.messaging().subscribeToTopic([token], topic);
      console.log(`Subscribed token to topic '${topic}':`, response);
    }

    return res.status(200).json({
      success: true,
      action: action,
      topic: topic,
      results: response
    });
  } catch (error) {
    console.error(`Error performing ${action} on topic:`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Endpoint: giveawayapi
 * Unified endpoint for fetching giveaway metadata, claiming promo codes, and importing codes.
 */
exports.giveawayapi = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const action = req.query.action || req.body?.action || (req.method === "GET" ? "get" : "claim");

  // Client IP hashing for rate-limiting
  const rawIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "anonymous";
  const ipHash = crypto.createHash("sha256").update(String(rawIp).split(",")[0].trim()).digest("hex");

  try {
    // ACTION: GET ACTIVE GIVEAWAY
    if (action === "get") {
      const docRef = db.collection("giveaways").doc("active");
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(200).json({
          success: true,
          isActive: false,
          message: "No active giveaway at the moment."
        });
      }

      const data = docSnap.data();
      return res.status(200).json({
        success: true,
        isActive: Boolean(data.isActive && data.remainingCodes > 0),
        giveaway: {
          title: data.title || "Featured Watch Face",
          packageName: data.packageName || "",
          iconUrl: data.iconUrl || "/assets/logo_notification.webp",
          bannerUrl: data.bannerUrl || "",
          playStoreUrl: data.playStoreUrl || (data.packageName ? `https://play.google.com/store/apps/details?id=${data.packageName}` : "https://play.google.com/store/apps/dev?id=5591589606735981545"),
          totalCodes: Number(data.totalCodes) || 0,
          remainingCodes: Math.max(0, Number(data.remainingCodes) || 0)
        }
      });
    }

    // ACTION: CLAIM PROMO CODE
    if (action === "claim") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST method required for claim" });
      }

      const giveawayRef = db.collection("giveaways").doc("active");
      const claimRef = db.collection("giveaway_claims").doc(ipHash);

      // Check Rate-Limit: 1 claim per IP per active giveaway (within 12 hours)
      const existingClaim = await claimRef.get();
      if (existingClaim.exists) {
        const claimData = existingClaim.data();
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        if (claimData.timestamp && claimData.timestamp.toMillis() > twelveHoursAgo) {
          return res.status(429).json({
            error: "You have already claimed a promo code for this giveaway.",
            code: claimData.code,
            redeemUrl: `https://play.google.com/redeem?code=${encodeURIComponent(claimData.code)}`
          });
        }
      }

      // Execute atomic transaction to claim 1 unclaimed code
      const result = await db.runTransaction(async (transaction) => {
        const giveawaySnap = await transaction.get(giveawayRef);
        if (!giveawaySnap.exists) {
          throw new Error("No active giveaway found.");
        }

        const giveawayData = giveawaySnap.data();
        if (!giveawayData.isActive || giveawayData.remainingCodes <= 0) {
          throw new Error("OUT_OF_CODES");
        }

        // Query 1 unclaimed code
        const codesQuery = giveawayRef.collection("codes")
          .where("isClaimed", "==", false)
          .limit(1);

        const codesSnap = await transaction.get(codesQuery);
        if (codesSnap.empty) {
          transaction.update(giveawayRef, { remainingCodes: 0, isActive: false });
          throw new Error("OUT_OF_CODES");
        }

        const codeDoc = codesSnap.docs[0];
        const codeValue = codeDoc.data().code;

        // Mark code as claimed
        transaction.update(codeDoc.ref, {
          isClaimed: true,
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
          claimedIpHash: ipHash
        });

        // Decrement remainingCodes
        const newRemaining = Math.max(0, giveawayData.remainingCodes - 1);
        transaction.update(giveawayRef, {
          remainingCodes: newRemaining,
          isActive: newRemaining > 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Record user claim
        transaction.set(claimRef, {
          code: codeValue,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          packageName: giveawayData.packageName || ""
        });

        return {
          code: codeValue,
          remainingCodes: newRemaining,
          packageName: giveawayData.packageName
        };
      });

      return res.status(200).json({
        success: true,
        code: result.code,
        redeemUrl: `https://play.google.com/redeem?code=${encodeURIComponent(result.code)}`,
        remainingCodes: result.remainingCodes
      });
    }

    // ACTION: IMPORT PROMO CODES (Admin)
    if (action === "import") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST method required for import" });
      }

      const providedSecret = req.headers["x-admin-secret"] || req.body?.adminSecret;
      if (!ADMIN_SECRET || !providedSecret || providedSecret !== ADMIN_SECRET) {
        return res.status(401).json({ error: "Unauthorized. Invalid admin secret." });
      }

      const { title, packageName, iconUrl, bannerUrl, playStoreUrl, codesCsv, codesArray } = req.body || {};

      let parsedCodes = [];
      if (Array.isArray(codesArray)) {
        parsedCodes = codesArray.map(c => String(c).trim()).filter(Boolean);
      } else if (typeof codesCsv === "string") {
        // Parse CSV string (supports header "Promotion code" or plain list of codes)
        const lines = codesCsv.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.toLowerCase().includes("promotion code") || trimmed.toLowerCase().includes("promo code")) {
            continue; // Skip header
          }
          const code = trimmed.split(",")[0].trim().replace(/^["']|["']$/g, "");
          if (code) parsedCodes.push(code);
        }
      }

      // Deduplicate codes
      parsedCodes = Array.from(new Set(parsedCodes));

      if (parsedCodes.length === 0) {
        return res.status(400).json({ error: "No valid promo codes found in request." });
      }

      const giveawayRef = db.collection("giveaways").doc("active");

      // Save main giveaway metadata
      await giveawayRef.set({
        title: title || "Featured Watch Face Giveaway",
        packageName: packageName || "",
        iconUrl: iconUrl || "/assets/logo_notification.webp",
        bannerUrl: bannerUrl || "",
        playStoreUrl: playStoreUrl || (packageName ? `https://play.google.com/store/apps/details?id=${packageName}` : "https://play.google.com/store/apps/dev?id=5591589606735981545"),
        totalCodes: parsedCodes.length,
        remainingCodes: parsedCodes.length,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Batch write promo codes in chunks of 400 (Firestore max batch is 500)
      const codesCol = giveawayRef.collection("codes");
      const CHUNK_SIZE = 400;

      for (let i = 0; i < parsedCodes.length; i += CHUNK_SIZE) {
        const batch = db.batch();
        const chunk = parsedCodes.slice(i, i + CHUNK_SIZE);
        for (const code of chunk) {
          const codeDoc = codesCol.doc();
          batch.set(codeDoc, {
            code: code,
            isClaimed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        await batch.commit();
      }

      return res.status(200).json({
        success: true,
        message: `Successfully imported ${parsedCodes.length} promo codes for '${title || "Giveaway"}'!`,
        totalCodes: parsedCodes.length
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    if (error.message === "OUT_OF_CODES") {
      return res.status(410).json({
        error: "All promo codes for this giveaway have been claimed!",
        isOutOfCodes: true
      });
    }
    console.error("Error in giveawayapi:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
