const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// When admin creates a notification in Firestore, send FCM push to all registered tokens
exports.sendPushNotification = onDocumentCreated("notifications/{notifId}", async (event) => {
  const data = event.data.data();
  const db = getFirestore();

  // Get all registered FCM tokens
  const tokensSnap = await db.collection("fcmTokens").get();
  const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

  if (tokens.length === 0) {
    console.log("No FCM tokens registered, skipping push.");
    return;
  }

  const message = {
    notification: {
      title: data.title || "Hot 101.5",
      body: data.message || "",
    },
    data: {
      type: "notification",
      target: data.target || "",
      notificationId: event.params.notifId,
    },
  };

  // Send to all tokens in batches of 500
  const batches = [];
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    batches.push(
      getMessaging().sendEachForMulticast({ ...message, tokens: batch })
    );
  }

  const results = await Promise.all(batches);
  const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
  const totalFailure = results.reduce((sum, r) => sum + r.failureCount, 0);

  console.log(`Push sent: ${totalSuccess} success, ${totalFailure} failed out of ${tokens.length} tokens`);

  // Update notification doc with delivery stats
  await event.data.ref.update({
    pushSent: true,
    pushSuccessCount: totalSuccess,
    pushFailureCount: totalFailure,
    pushSentAt: new Date().toISOString(),
  });
});

// When admin creates an ad, notify nearby users (simplified - sends to all)
exports.sendAdNotification = onDocumentCreated("ads/{adId}", async (event) => {
  const data = event.data.data();
  if (data.status !== "Active") return;

  const db = getFirestore();
  const tokensSnap = await db.collection("fcmTokens").get();
  const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

  if (tokens.length === 0) return;

  const message = {
    notification: {
      title: `New Deal: ${data.title || "Check it out!"}`,
      body: data.description || "A new deal is available near you!",
    },
    data: {
      type: "ad",
      adId: event.params.adId,
      latitude: String(data.latitude || 0),
      longitude: String(data.longitude || 0),
    },
  };

  await getMessaging().sendEachForMulticast({ ...message, tokens });
  console.log(`Ad notification sent to ${tokens.length} devices`);
});

// When admin starts a live broadcast, notify users
exports.sendBroadcastNotification = onDocumentCreated("broadcasts/{bcId}", async (event) => {
  const data = event.data.data();
  if (data.status !== "Live") return;

  const db = getFirestore();
  const tokensSnap = await db.collection("fcmTokens").get();
  const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

  if (tokens.length === 0) return;

  const message = {
    notification: {
      title: "Live Now on Hot 101.5!",
      body: data.title || "A new broadcast is live!",
    },
    data: {
      type: "broadcast",
      broadcastId: event.params.bcId,
    },
  };

  await getMessaging().sendEachForMulticast({ ...message, tokens });
  console.log(`Broadcast notification sent to ${tokens.length} devices`);
});
