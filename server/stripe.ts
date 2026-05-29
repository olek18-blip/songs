import Stripe from "stripe";
import { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { updateOrderDelivery, updateOrderStatus } from "./db";
import express from "express";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as any,
});

export { stripe };

// Tier pricing in cents
// Tier pricing in cents (5€, 14.99€, 24.99€)
const TIER_PRICES_CENTS = {
  basic: 500,
  premium: 1499,
  ultra: 2499,
};

const TIER_NAMES = {
  basic: "AI Song — Basic (MP3) — 5€",
  premium: "AI Song — Premium (Detailed & Personal) — 14.99€",
  ultra: "AI Song — Ultra (Maximum Personalization) — 24.99€",
};

export async function createCheckoutSession(data: {
  customerEmail: string;
  orderId: number;
  expressDelivery: boolean;
  lyricVideo: boolean;
  wavFile: boolean;
  revisionsIncluded?: number;
  tier?: string;
  totalPrice: number;
  couponCode?: string;
  origin: string;
}) {
  const tier = (data.tier || "basic") as keyof typeof TIER_PRICES_CENTS;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "eur",
        product_data: { name: TIER_NAMES[tier] || TIER_NAMES.basic },
        unit_amount: TIER_PRICES_CENTS[tier] || TIER_PRICES_CENTS.basic,
      },
      quantity: 1,
    },
  ];

  if (data.expressDelivery) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Express 1-Hour Delivery" },
        unit_amount: 900,
      },
      quantity: 1,
    });
  }

  if (data.lyricVideo) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Lyric Video (Cinematic AI Visuals)" },
        unit_amount: 1500,
      },
      quantity: 1,
    });
  }

  if (data.wavFile) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Uncompressed WAV File" },
        unit_amount: 500,
      },
      quantity: 1,
    });
  }

  if (data.revisionsIncluded && data.revisionsIncluded > 0) {
    const revisionPriceCents = data.revisionsIncluded === 1 ? 499 : 799;
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `${data.revisionsIncluded} Revision${data.revisionsIncluded > 1 ? "s" : ""} Included` },
        unit_amount: revisionPriceCents,
      },
      quantity: 1,
    });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: data.customerEmail,
    line_items: lineItems,
    client_reference_id: data.orderId.toString(),
    metadata: {
      order_id: data.orderId.toString(),
      customer_email: data.customerEmail,
      tier: tier,
    },
    success_url: `${data.origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${data.orderId}`,
    cancel_url: `${data.origin}/?cancelled=true`,
    allow_promotion_codes: true,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

// Register webhook route BEFORE express.json() middleware
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).json({ error: "Missing signature or webhook secret" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      // Process events
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = parseInt(session.metadata?.order_id || "0");
            if (orderId) {
              await updateOrderDelivery(orderId, {
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent as string,
              });
              await updateOrderStatus(orderId, { paymentStatus: "paid" });
              console.log(`[Stripe] Order #${orderId} payment completed`);

              // Trigger song generation pipeline
              // Express orders are processed with higher priority (shorter poll interval)
              const { processSongGeneration } = await import("./suno");
              const { getOrderById } = await import("./db");
              const order = await getOrderById(orderId);
              const isExpress = order?.expressDelivery;
              if (isExpress) {
                console.log(`[Stripe] Express delivery for order #${orderId} - high priority`);
              }
              processSongGeneration(orderId, { express: !!isExpress }).catch(err => {
                console.error(`[Stripe] Failed to start generation for order #${orderId}:`, err);
              });
            }
            break;
          }
          case "payment_intent.payment_failed": {
            const intent = event.data.object as Stripe.PaymentIntent;
            const orderId = parseInt(intent.metadata?.order_id || "0");
            if (orderId) {
              await updateOrderStatus(orderId, { paymentStatus: "failed" });
              console.log(`[Stripe] Order #${orderId} payment failed`);
            }
            break;
          }
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
      }

      res.json({ received: true });
    }
  );
}
