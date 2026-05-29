import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { saveLead, getLeads, getLeadStats, getDb } from "./db";
import { createOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats } from "./db";
import { saveB2bContact, getB2bContacts, updateB2bStatus } from "./db";
import { validateCoupon, requestRevision, getOrderByEmailAndId, saveUserProfile, getSongCommunications, saveSongCommunication, createTestOrder, isTestOrder } from "./db";
import { createCheckoutSession } from "./stripe";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// Tier pricing
// Tier pricing (reduced base to 5€ for traffic optimization)
const TIER_PRICES = {
  basic: 5.00,
  premium: 14.99,
  ultra: 24.99,
};

// Revision pricing
const REVISION_PRICES = {
  0: 0,
  1: 4.99,
  2: 7.99,
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Lead capture for abandoned cart recovery
  leads: router({
    save: publicProcedure
      .input(z.object({
        email: z.string().email(),
        celebrantName: z.string().optional(),
        anecdotes: z.string().optional(),
        genre: z.string().optional(),
        tier: z.string().optional(),
        lastStep: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await saveLead(input);
        return { success: true };
      }),
    list: adminProcedure.query(async () => {
      return getLeads();
    }),
    stats: adminProcedure.query(async () => {
      return getLeadStats();
    }),
  }),

  // Orders
  orders: router({
    create: publicProcedure
      .input(z.object({
        customerEmail: z.string().email(),
        celebrantName: z.string(),
        occasion: z.string().optional(),
        anecdotes: z.string(),
        genre: z.string(),
        // Premium/Ultra fields
        personalityTraits: z.string().optional(),
        relationship: z.string().optional(),
        tonePreference: z.string().optional(),
        specificPhrases: z.string().optional(),
        dedications: z.string().optional(),
        // Tier
        tier: z.enum(["basic", "premium", "ultra"]).default("basic"),
        // Upsells
        expressDelivery: z.boolean().default(false),
        lyricVideo: z.boolean().default(false),
        wavFile: z.boolean().default(false),
        revisionsIncluded: z.number().min(0).max(2).default(0),
        couponCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const basePrice = TIER_PRICES[input.tier];
        let totalPrice = basePrice;
        if (input.expressDelivery) totalPrice += 9;
        if (input.lyricVideo) totalPrice += 15;
        if (input.wavFile) totalPrice += 5;
        // Add revision cost
        const revisionCost = REVISION_PRICES[input.revisionsIncluded as keyof typeof REVISION_PRICES] || 0;
        totalPrice += revisionCost;

        let discountApplied = 0;
        if (input.couponCode) {
          const coupon = await validateCoupon(input.couponCode);
          if (coupon) {
            discountApplied = totalPrice * (coupon.discountPercent / 100);
            totalPrice -= discountApplied;
          }
        }

        const order = await createOrder({
          ...input,
          basePrice: basePrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          discountApplied: discountApplied > 0 ? discountApplied.toFixed(2) : undefined,
        });

        // Create Stripe checkout session
        const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || "http://localhost:3000";
        const session = await createCheckoutSession({
          customerEmail: input.customerEmail,
          orderId: order.id,
          expressDelivery: input.expressDelivery,
          lyricVideo: input.lyricVideo,
          wavFile: input.wavFile,
          revisionsIncluded: input.revisionsIncluded,
          tier: input.tier,
          totalPrice,
          couponCode: input.couponCode,
          origin,
        });

        return { id: order.id, checkoutUrl: session.url, totalPrice: order.totalPrice };
      }),

    // Public: get order status by email + id (for customer to check their order)
    status: publicProcedure
      .input(z.object({
        email: z.string().email(),
        orderId: z.number(),
      }))
      .query(async ({ input }) => {
        const order = await getOrderByEmailAndId(input.email, input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        return {
          id: order.id,
          celebrantName: order.celebrantName,
          genre: order.genre,
          tier: order.tier,
          paymentStatus: order.paymentStatus,
          generationStatus: order.generationStatus,
          previewUrl: order.previewUrl,
          mp3Url: order.mp3Url,
          wavUrl: order.wavUrl,
          videoUrl: order.videoUrl,
          revisionsIncluded: order.revisionsIncluded,
          revisionsUsed: order.revisionsUsed,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt,
        };
      }),

    // Public: request a revision
    requestRevision: publicProcedure
      .input(z.object({
        email: z.string().email(),
        orderId: z.number(),
        notes: z.string().min(10, "Please provide at least 10 characters of revision notes"),
      }))
      .mutation(async ({ input }) => {
        const order = await getOrderByEmailAndId(input.email, input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        if (order.generationStatus !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Song must be completed before requesting revision" });
        }
        try {
          const result = await requestRevision(input.orderId, input.notes);
          // Trigger re-generation
          const { processSongGeneration } = await import("./suno");
          processSongGeneration(input.orderId).catch(err => {
            console.error(`[Revision] Failed to start re-generation for order #${input.orderId}:`, err);
          });
          return { success: true, revisionsRemaining: result.revisionsRemaining };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),

    // Admin: list orders
    list: adminProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["all", "pending", "paid", "failed", "refunded"]).default("all"),
      }).optional())
      .query(async ({ input }) => {
        return getOrders(input?.limit ?? 50, input?.offset ?? 0, input?.status ?? "all");
      }),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrderById(input.id);
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        generationStatus: z.enum(["queued", "generating", "completed", "failed"]).optional(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input);
        return { success: true };
      }),
    stats: adminProcedure.query(async () => {
      return getOrderStats();
    }),
    getUserOrders: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { orders } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db.select().from(orders).where(eq(orders.customerEmail, input.email)).orderBy(desc(orders.createdAt));
      }),
  }),

  // B2B contacts
  b2b: router({
    submit: publicProcedure
      .input(z.object({
        companyName: z.string(),
        contactName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        employeeCount: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await saveB2bContact(input);
        notifyOwner({
          title: `New B2B Inquiry: ${input.companyName}`,
          content: `${input.contactName} (${input.email}) from ${input.companyName} submitted a B2B inquiry.${input.employeeCount ? ` Employees: ${input.employeeCount}.` : ""}${input.message ? ` Message: ${input.message}` : ""}`,
        }).catch(() => {});
        return { success: true };
      }),
    list: adminProcedure.query(async () => {
      return getB2bContacts();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "negotiating", "closed", "lost"]),
      }))
      .mutation(async ({ input }) => {
        await updateB2bStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // User profiles and communications
  userProfile: router({
    save: protectedProcedure
      .input(z.object({
        phone: z.string().optional(),
        preferredLanguage: z.string().optional(),
        communicationPreference: z.enum(["email", "sms", "both"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Song communications
  songComm: router({
    list: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return getSongCommunications(input.orderId);
      }),
    send: publicProcedure
      .input(z.object({
        orderId: z.number(),
        customerEmail: z.string().email(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        await saveSongCommunication({
          orderId: input.orderId,
          customerEmail: input.customerEmail,
          senderType: "customer",
          message: input.message,
          status: "new",
        });
        await notifyOwner({
          title: `New Message on Order #${input.orderId}`,
          content: `Customer ${input.customerEmail} sent: ${input.message.substring(0, 100)}...`,
        }).catch(() => {});
        return { success: true };
      }),
  }),

  // Test orders (admin only)
  testOrders: router({
    create: adminProcedure
      .input(z.object({
        orderId: z.number(),
        testNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createTestOrder(input.orderId, ctx.user.id, input.testNotes);
        return { success: true };
      }),
    isTest: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return isTestOrder(input.orderId);
      }),
  }),

  // Coupon validation (public)
  coupons: router({
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const coupon = await validateCoupon(input.code);
        if (!coupon) return { valid: false, discountPercent: 0 };
        return { valid: true, discountPercent: coupon.discountPercent };
      }),
  }),

  // Heartbeat cron management (admin only)
  heartbeat: router({
    setupRetargeting: adminProcedure.mutation(async () => {
      const { createHeartbeatJob } = await import("./_core/heartbeat");
      const result = await createHeartbeatJob(
        {
          name: "abandoned-cart-retargeting",
          cron: "0 0 * * * *", // Every hour
          path: "/api/scheduled/retargeting",
          method: "POST",
          description: "Process abandoned carts and send 20% discount retargeting emails every hour",
        },
        "" // empty string = owner identity
      );
      return { success: true, taskUid: result.taskUid, nextExecution: result.nextExecutionAt };
    }),
    list: adminProcedure.query(async () => {
      const { listHeartbeatJobs } = await import("./_core/heartbeat");
      const result = await listHeartbeatJobs("");
      return result.jobs;
    }),
  }),
});

export type AppRouter = typeof appRouter;
