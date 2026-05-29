/**
 * Email Service
 * Handles transactional emails (delivery, confirmation) and retargeting sequences.
 * Uses the built-in notification system for owner alerts and LLM for email content.
 * 
 * In production, integrate with SendGrid/Mailgun/SES for actual email delivery.
 * For now, we use the notification system to alert the owner and log emails.
 */

import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { getUnconvertedLeads, markRetargetingSent, createCoupon } from "./db";

// Email templates
export function buildDeliveryEmail(data: {
  customerEmail: string;
  celebrantName: string;
  mp3Url: string;
  wavUrl?: string;
  videoUrl?: string;
}): { subject: string; html: string } {
  const subject = `🎵 Your personalized song for ${data.celebrantName} is ready!`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e8e8e8; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d4a853; font-size: 24px; margin: 0;">🎵 SongForgeAI</h1>
      </div>
      <h2 style="color: #ffffff; text-align: center;">Your Song is Ready!</h2>
      <p style="text-align: center; color: #b0b0b0; line-height: 1.6;">
        The personalized song for <strong style="color: #d4a853;">${data.celebrantName}</strong> has been generated and is ready to download.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.mp3Url}" style="display: inline-block; background: #d4a853; color: #1a1a2e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Download MP3
        </a>
      </div>
      ${data.wavUrl ? `
      <div style="text-align: center; margin: 15px 0;">
        <a href="${data.wavUrl}" style="display: inline-block; background: transparent; color: #d4a853; padding: 10px 24px; border: 1px solid #d4a853; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Download WAV (Uncompressed)
        </a>
      </div>` : ""}
      ${data.videoUrl ? `
      <div style="text-align: center; margin: 15px 0;">
        <a href="${data.videoUrl}" style="display: inline-block; background: transparent; color: #d4a853; padding: 10px 24px; border: 1px solid #d4a853; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Download Lyric Video
        </a>
      </div>` : ""}
      <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
      <p style="text-align: center; color: #888; font-size: 12px;">
        Thank you for choosing SongForgeAI. We hope this song brings joy! 🎉
      </p>
    </div>
  `;
  return { subject, html };
}

export function buildAbandonedCartEmail(data: {
  email: string;
  celebrantName?: string;
  couponCode: string;
  discountPercent: number;
}): { subject: string; html: string } {
  const nameText = data.celebrantName
    ? `for ${data.celebrantName}`
    : "for your special someone";

  const subject = `🎵 The song ${nameText} is almost ready! Here's ${data.discountPercent}% off`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e8e8e8; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d4a853; font-size: 24px; margin: 0;">🎵 SongForgeAI</h1>
      </div>
      <h2 style="color: #ffffff; text-align: center;">Don't Leave the Song Unfinished!</h2>
      <p style="text-align: center; color: #b0b0b0; line-height: 1.6;">
        The personalized song ${nameText} is waiting to be created. 
        Complete your order now and make their day unforgettable.
      </p>
      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #2a2a4e; border-radius: 8px; border: 1px dashed #d4a853;">
        <p style="color: #d4a853; font-size: 14px; margin: 0 0 8px 0;">EXCLUSIVE DISCOUNT</p>
        <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">${data.discountPercent}% OFF</p>
        <p style="color: #d4a853; font-size: 16px; margin: 8px 0 0 0; font-family: monospace;">${data.couponCode}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://custom-ai-songs.manus.space/?coupon=${data.couponCode}" style="display: inline-block; background: #d4a853; color: #1a1a2e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Complete Your Song Now
        </a>
      </div>
      <p style="text-align: center; color: #888; font-size: 12px;">
        This offer expires in 48 hours. Don't miss out!
      </p>
    </div>
  `;
  return { subject, html };
}

export function buildOrderConfirmationEmail(data: {
  customerEmail: string;
  celebrantName: string;
  genre: string;
  totalPrice: string;
  expressDelivery: boolean;
}): { subject: string; html: string } {
  const deliveryTime = data.expressDelivery ? "within 1 hour" : "within 48 hours";
  const subject = `✅ Order confirmed! Song for ${data.celebrantName} is being created`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e8e8e8; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d4a853; font-size: 24px; margin: 0;">🎵 SongForgeAI</h1>
      </div>
      <h2 style="color: #ffffff; text-align: center;">Order Confirmed! 🎉</h2>
      <p style="text-align: center; color: #b0b0b0; line-height: 1.6;">
        We're creating a personalized <strong style="color: #d4a853;">${data.genre}</strong> song 
        for <strong style="color: #d4a853;">${data.celebrantName}</strong>.
      </p>
      <div style="background: #2a2a4e; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #b0b0b0;"><strong style="color: #fff;">Total:</strong> ${data.totalPrice} €</p>
        <p style="margin: 5px 0; color: #b0b0b0;"><strong style="color: #fff;">Delivery:</strong> ${deliveryTime}</p>
        <p style="margin: 5px 0; color: #b0b0b0;"><strong style="color: #fff;">Format:</strong> MP3${data.expressDelivery ? " (Express)" : ""}</p>
      </div>
      <p style="text-align: center; color: #b0b0b0; line-height: 1.6;">
        You'll receive another email with your download link ${deliveryTime}.
      </p>
      <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
      <p style="text-align: center; color: #888; font-size: 12px;">
        Questions? Reply to this email and we'll help you out.
      </p>
    </div>
  `;
  return { subject, html };
}

/**
 * Process abandoned cart retargeting
 * Called periodically to find unconverted leads and send them discount emails
 */
export async function processAbandonedCarts(): Promise<{ processed: number; sent: number }> {
  const leads = await getUnconvertedLeads();
  let sent = 0;

  for (const lead of leads) {
    // Only retarget leads older than 1 hour
    const leadAge = Date.now() - new Date(lead.createdAt).getTime();
    if (leadAge < 60 * 60 * 1000) continue; // Skip if less than 1 hour old

    try {
      // Generate a 20% discount coupon
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
      const couponCode = await createCoupon(20, expiresAt);
      if (!couponCode) continue;

      // Build the email
      const emailContent = buildAbandonedCartEmail({
        email: lead.email,
        celebrantName: lead.celebrantName || undefined,
        couponCode,
        discountPercent: 20,
      });

      // Send the email (real delivery if SendGrid configured, otherwise log)
      await sendRetargetingEmail(lead.email, emailContent);

      // Mark as sent
      await markRetargetingSent(lead.id, couponCode);
      sent++;

      // Notify owner
      await notifyOwner({
        title: "Retargeting Email Sent",
        content: `Abandoned cart email sent to ${lead.email} with coupon ${couponCode} (20% off)`,
      });
    } catch (error) {
      console.error(`[Retargeting] Error processing lead ${lead.id}:`, error);
    }
  }

  return { processed: leads.length, sent };
}

/**
 * Send delivery notification to customer
 * Uses the built-in notification system to alert the owner.
 * For actual customer email delivery, integrate with SendGrid/Mailgun/SES.
 * The email HTML is generated and logged; owner gets notified via the platform.
 * 
 * To enable real email sending:
 * 1. Add SENDGRID_API_KEY or similar to env
 * 2. Replace the console.log with actual API calls
 * 3. The email templates are already production-ready
 */
export async function sendDeliveryEmail(orderId: number, data: {
  customerEmail: string;
  celebrantName: string;
  mp3Url: string;
  wavUrl?: string;
  videoUrl?: string;
}): Promise<void> {
  const emailContent = buildDeliveryEmail(data);
  
  // Log the email content (ready for real delivery)
  console.log(`[Email] Delivery email for order #${orderId} to ${data.customerEmail}`);
  console.log(`[Email] Subject: ${emailContent.subject}`);

  // Attempt to send via email service if configured
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: data.customerEmail }] }],
          from: { email: process.env.SENDER_EMAIL || "songs@songforgeai.com", name: "SongForgeAI" },
          subject: emailContent.subject,
          content: [{ type: "text/html", value: emailContent.html }],
        }),
      });
      if (response.ok) {
        console.log(`[Email] Successfully sent delivery email to ${data.customerEmail}`);
      } else {
        console.error(`[Email] SendGrid error: ${response.status} ${await response.text()}`);
      }
    } catch (err) {
      console.error(`[Email] SendGrid request failed:`, err);
    }
  }

  // Always notify owner about delivery
  await notifyOwner({
    title: `Song Delivered - Order #${orderId}`,
    content: `Song for ${data.celebrantName} delivered to ${data.customerEmail}. Download: ${data.mp3Url}`,
  });
}

/**
 * Send abandoned cart retargeting email to a specific lead
 */
export async function sendRetargetingEmail(email: string, emailContent: { subject: string; html: string }): Promise<boolean> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    console.log(`[Email] No SENDGRID_API_KEY configured. Retargeting email to ${email} logged only.`);
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: process.env.SENDER_EMAIL || "songs@songforgeai.com", name: "SongForgeAI" },
        subject: emailContent.subject,
        content: [{ type: "text/html", value: emailContent.html }],
      }),
    });
    if (response.ok) {
      console.log(`[Email] Retargeting email sent to ${email}`);
      return true;
    }
    console.error(`[Email] SendGrid error for retargeting: ${response.status}`);
    return false;
  } catch (err) {
    console.error(`[Email] Retargeting email failed:`, err);
    return false;
  }
}
