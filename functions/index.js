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
 * Multi-giveaway endpoint for fetching active giveaways, claiming promo codes, and importing codes.
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
    // ACTION: GET ALL ACTIVE GIVEAWAYS
    if (action === "get") {
      const targetId = req.query.giveawayId || req.query.id;

      if (targetId) {
        // Fetch specific giveaway
        const docSnap = await db.collection("giveaways").doc(targetId).get();
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, error: "Giveaway not found" });
        }
        const data = docSnap.data();
        return res.status(200).json({
          success: true,
          giveaway: {
            id: docSnap.id,
            title: data.title || "Featured Watch Face",
            packageName: data.packageName || "",
            iconUrl: data.iconUrl || "assets/logo_notification.webp",
            bannerUrl: data.bannerUrl || "",
            playStoreUrl: data.playStoreUrl || (data.packageName ? `https://play.google.com/store/apps/details?id=${data.packageName}` : "https://play.google.com/store/apps/dev?id=5591589606735981545"),
            totalCodes: Number(data.totalCodes) || 0,
            remainingCodes: Math.max(0, Number(data.remainingCodes) || 0),
            isActive: Boolean(data.isActive && data.remainingCodes > 0)
          }
        });
      }

      // Fetch all active giveaways
      const snapshot = await db.collection("giveaways").get();

      if (snapshot.empty) {
        return res.status(200).json({
          success: true,
          giveaways: [],
          message: "No active giveaways at the moment."
        });
      }

      const giveaways = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Include if marked active
        if (data.isActive !== false) {
          giveaways.push({
            id: doc.id,
            title: data.title || "Featured Watch Face",
            packageName: data.packageName || "",
            iconUrl: data.iconUrl || "assets/logo_notification.webp",
            bannerUrl: data.bannerUrl || "",
            playStoreUrl: data.playStoreUrl || (data.packageName ? `https://play.google.com/store/apps/details?id=${data.packageName}` : "https://play.google.com/store/apps/dev?id=5591589606735981545"),
            totalCodes: Number(data.totalCodes) || 0,
            remainingCodes: Math.max(0, Number(data.remainingCodes) || 0),
            isActive: Boolean(data.isActive && data.remainingCodes > 0),
            createdAt: data.createdAt ? data.createdAt.toMillis() : 0
          });
        }
      });

      // Sort newest first
      giveaways.sort((a, b) => b.createdAt - a.createdAt);

      return res.status(200).json({
        success: true,
        giveaways: giveaways
      });
    }

    // ACTION: CLAIM PROMO CODE FOR SPECIFIC GIVEAWAY
    if (action === "claim") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST method required for claim" });
      }

      const targetGiveawayId = req.body?.giveawayId || req.query.giveawayId || "active";
      const giveawayRef = db.collection("giveaways").doc(targetGiveawayId);

      const giveawaySnap = await giveawayRef.get();
      if (!giveawaySnap.exists) {
        return res.status(404).json({ error: "Giveaway not found." });
      }

      const giveawayData = giveawaySnap.data();
      const currentGiveawayId = targetGiveawayId;
      const claimRef = db.collection("giveaway_claims").doc(`${ipHash}_${currentGiveawayId}`);

      // Check Rate-Limit: 1 claim per IP per giveaway
      const existingClaim = await claimRef.get();
      if (existingClaim.exists) {
        const claimData = existingClaim.data();
        return res.status(429).json({
          error: "You have already claimed a promo code for this giveaway.",
          code: claimData.code,
          redeemUrl: `https://play.google.com/redeem?code=${encodeURIComponent(claimData.code)}`
        });
      }

      // Execute atomic transaction to claim 1 unclaimed code
      const result = await db.runTransaction(async (transaction) => {
        const freshGiveawaySnap = await transaction.get(giveawayRef);
        if (!freshGiveawaySnap.exists) {
          throw new Error("Giveaway not found.");
        }

        const freshData = freshGiveawaySnap.data();
        if (!freshData.isActive || freshData.remainingCodes <= 0) {
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
        const newRemaining = Math.max(0, freshData.remainingCodes - 1);
        transaction.update(giveawayRef, {
          remainingCodes: newRemaining,
          isActive: newRemaining > 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Record user claim for this specific giveaway with 30-day expiration
        const thirtyDaysFromNow = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
        transaction.set(claimRef, {
          giveawayId: currentGiveawayId,
          code: codeValue,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          expireAt: thirtyDaysFromNow,
          packageName: freshData.packageName || ""
        });

        return {
          code: codeValue,
          remainingCodes: newRemaining,
          packageName: freshData.packageName
        };
      });

      return res.status(200).json({
        success: true,
        giveawayId: currentGiveawayId,
        code: result.code,
        redeemUrl: `https://play.google.com/redeem?code=${encodeURIComponent(result.code)}`,
        remainingCodes: result.remainingCodes
      });
    }

    // ACTION: IMPORT / CREATE PROMO CODES (Admin)
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
        const lines = codesCsv.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.toLowerCase().includes("promotion code") || trimmed.toLowerCase().includes("promo code")) {
            continue;
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

      // Generate a unique document ID per watch face package/name
      const giveawayId = (packageName || title || `giveaway_${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^_+|_+$/g, "");

      const giveawayRef = db.collection("giveaways").doc(giveawayId);
      const codesCol = giveawayRef.collection("codes");

      // Purge any existing codes in this specific giveaway
      const existingCodesSnap = await codesCol.limit(500).get();
      if (!existingCodesSnap.empty) {
        const deleteBatch = db.batch();
        existingCodesSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
      }

      // Save main giveaway metadata
      await giveawayRef.set({
        id: giveawayId,
        title: title || "Featured Watch Face Giveaway",
        packageName: packageName || "",
        iconUrl: iconUrl || "assets/logo_notification.webp",
        bannerUrl: bannerUrl || "",
        playStoreUrl: playStoreUrl || (packageName ? `https://play.google.com/store/apps/details?id=${packageName}` : "https://play.google.com/store/apps/dev?id=5591589606735981545"),
        totalCodes: parsedCodes.length,
        remainingCodes: parsedCodes.length,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Batch write new promo codes in chunks of 400 (Firestore max batch is 500)
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
        totalCodes: parsedCodes.length,
        giveawayId: giveawayId
      });
    }

    // ACTION: DELETE / DEACTIVATE GIVEAWAY (Admin)
    if (action === "delete" || action === "deactivate") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST method required" });
      }

      const providedSecret = req.headers["x-admin-secret"] || req.body?.adminSecret;
      if (!ADMIN_SECRET || !providedSecret || providedSecret !== ADMIN_SECRET) {
        return res.status(401).json({ error: "Unauthorized. Invalid admin secret." });
      }

      const targetId = req.body?.giveawayId || req.query.giveawayId;
      if (!targetId) {
        return res.status(400).json({ error: "giveawayId is required" });
      }

      const giveawayRef = db.collection("giveaways").doc(targetId);
      const codesCol = giveawayRef.collection("codes");

      if (action === "delete") {
        // 1. Purge all codes in subcollection
        const codesSnap = await codesCol.limit(500).get();
        if (!codesSnap.empty) {
          const batch = db.batch();
          codesSnap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // 2. Purge all associated claims for this giveaway from giveaway_claims
        const claimsSnap = await db.collection("giveaway_claims")
          .where("giveawayId", "==", targetId)
          .limit(500)
          .get();

        if (!claimsSnap.empty) {
          const batch = db.batch();
          claimsSnap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // 3. Delete the main giveaway document
        await giveawayRef.delete();
      } else {
        await giveawayRef.update({ isActive: false, remainingCodes: 0 });
      }

      return res.status(200).json({
        success: true,
        message: `Giveaway '${targetId}' and its claim records successfully ${action === "delete" ? "deleted" : "deactivated"}.`
      });
    }

    // ACTION: CONTACT FORM SUBMISSION
    if (action === "contact") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST method required" });
      }
      return handleContactSubmission(req, res);
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

/**
 * Shared Contact Form Processing Logic
 */
async function handleContactSubmission(req, res) {
  const { name, email, topic, watchFace, message, website_hp } = req.body || {};

  // Honeypot spam trap
  if (website_hp) {
    console.log("Honeypot triggered, silently ignoring bot submission.");
    return res.status(200).json({ success: true, message: "Thank you! Your message has been received." });
  }

  // Basic Validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Please provide your name." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return res.status(400).json({ error: "Please provide a message (minimum 5 characters)." });
  }

  // IP Hash for rate-limiting (max 5 messages per IP per hour)
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "anonymous";
  const ipHash = crypto.createHash("sha256").update(clientIp).digest("hex").substring(0, 16);

  const rateLimitRef = db.collection("contact_rate_limits").doc(ipHash);
  const rateLimitDoc = await rateLimitRef.get();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    if (data.resetAt && data.resetAt > now) {
      if (data.count >= 5) {
        return res.status(429).json({ error: "Too many messages sent. Please wait an hour before sending another message." });
      }
      await rateLimitRef.update({
        count: admin.firestore.FieldValue.increment(1)
      });
    } else {
      await rateLimitRef.set({
        count: 1,
        resetAt: now + ONE_HOUR
      });
    }
  } else {
    await rateLimitRef.set({
      count: 1,
      resetAt: now + ONE_HOUR
    });
  }

  const sanitizedName = String(name).trim().slice(0, 100);
  const sanitizedEmail = String(email).trim().slice(0, 150);
  const sanitizedTopic = String(topic || "General").trim().slice(0, 80);
  const sanitizedWatchFace = String(watchFace || "").trim().slice(0, 100);
  const sanitizedMessage = String(message).trim().slice(0, 5000);

  // 1. Backup save to Firestore
  await db.collection("contact_messages").add({
    name: sanitizedName,
    email: sanitizedEmail,
    topic: sanitizedTopic,
    watchFace: sanitizedWatchFace,
    message: sanitizedMessage,
    ipHash: ipHash,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "unread"
  });

  // 2. Email Delivery via Resend (if RESEND_API_KEY environment variable is configured)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CONTACT_RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || "support@amoledwatchfaces.com";

  if (RESEND_API_KEY) {
    try {
      const emailPayload = {
        from: "amoledwatchfaces <onboarding@resend.dev>",
        to: [CONTACT_RECEIVER_EMAIL],
        reply_to: sanitizedEmail,
        subject: `[Contact Form] ${sanitizedTopic}: ${sanitizedName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
            <div style="border-bottom: 2px solid #00E5FF; padding-bottom: 12px; margin-bottom: 18px;">
              <h2 style="margin: 0; font-size: 20px; color: #0f172a;">New Contact Inquiry</h2>
              <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Submitted via amoledwatchfaces.com/contact</p>
            </div>
            
            <p style="margin: 8px 0; font-size: 15px;"><strong>From:</strong> ${sanitizedName} &lt;<a href="mailto:${sanitizedEmail}" style="color: #0284c7;">${sanitizedEmail}</a>&gt;</p>
            <p style="margin: 8px 0; font-size: 15px;"><strong>Topic:</strong> ${sanitizedTopic}</p>
            ${sanitizedWatchFace ? `<p style="margin: 8px 0; font-size: 15px;"><strong>Related Watch Face:</strong> ${sanitizedWatchFace}</p>` : ""}
            
            <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #00E5FF; border-radius: 6px;">
              <p style="margin: 0 0 8px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Message Content:</p>
              <div style="white-space: pre-wrap; line-height: 1.6; font-size: 15px; color: #334155;">${sanitizedMessage}</div>
            </div>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              Tip: Simply click <strong>Reply</strong> in your email client to respond directly to ${sanitizedName} (${sanitizedEmail}).
            </p>
          </div>
        `
      };

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailPayload)
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.warn("Resend email delivery failed:", errText);
      }
    } catch (err) {
      console.warn("Error sending email via Resend API:", err);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Thank you! Your message has been sent successfully. We will get back to you as soon as possible."
  });
}

/**
 * 3. Dedicated Endpoint: contactapi
 */
exports.contactapi = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST method required" });
  }

  try {
    return await handleContactSubmission(req, res);
  } catch (err) {
    console.error("Error in contactapi:", err);
    return res.status(500).json({ error: "Internal server error while processing your inquiry." });
  }
});

