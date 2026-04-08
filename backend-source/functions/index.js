const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

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

// ── Shoutout Approval Email ────────────────────────────────────────────────────
// Triggered when admin writes a document to the emailQueue collection.
// Sends an SMTP email via Nodemailer using credentials from functions/.env,
// then updates the queue doc status and marks the shoutout as emailed.
exports.sendApprovalEmail = onDocumentCreated("emailQueue/{emailId}", async (event) => {
  const data = event.data.data();
  const db   = getFirestore();
  const emailRef = event.data.ref;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error("SMTP_USER / SMTP_PASS not set in functions/.env");
    await emailRef.update({ status: "failed", error: "SMTP credentials not configured on server." });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });

  // Build a simple HTML version of the plain-text message
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #e11d48, #f97316); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">🎙️ Hot FM 101.5</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
        <pre style="font-family: Arial, sans-serif; white-space: pre-wrap; color: #374151; line-height: 1.6; margin: 0;">${data.message}</pre>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        © Hot FM 101.5 · This email was sent by the Hot FM Admin Panel
      </p>
    </div>`;

  try {
    await transporter.sendMail({
      from:    `"Hot FM 101.5" <${smtpUser}>`,
      to:      `"${data.toName}" <${data.to}>`,
      subject: data.subject,
      text:    data.message,
      html:    htmlBody,
    });

    // Mark queue document as sent
    await emailRef.update({
      status: "sent",
      sentAt: new Date().toISOString(),
    });

    // Mark the shoutout itself as emailed
    if (data.shoutoutId) {
      await db.collection("shoutouts").doc(data.shoutoutId).update({
        emailSent:   true,
        emailSentAt: new Date().toISOString(),
      });
    }

    console.log(`[sendApprovalEmail] Email sent to ${data.to} for shoutout ${data.shoutoutId}`);
  } catch (err) {
    console.error("[sendApprovalEmail] SMTP error:", err);
    await emailRef.update({
      status: "failed",
      error:  err.message || "Unknown SMTP error",
    });
  }
});
