const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * HTTP Endpoint to subscribe a Web Push FCM token to the 'announcements' topic.
 */
exports.subscribetoannouncements = functions.https.onRequest(async (req, res) => {
  // CORS configuration for amoledwatchfaces domains
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://amoledwatchfaces.com",
    "https://amoledwatchfaces.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ];

  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "https://amoledwatchfaces.github.io");
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

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
