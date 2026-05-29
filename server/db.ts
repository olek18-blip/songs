import { eq, desc, and, sql, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, orders, leads, coupons, b2bContacts, userProfiles, songCommunications, testOrders } from "../drizzle/schema";
import type { InsertOrder, InsertLead, InsertB2bContact, InsertUserProfile, InsertSongCommunication, InsertTestOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ LEAD HELPERS ============

export async function saveLead(data: {
  email: string;
  celebrantName?: string;
  anecdotes?: string;
  genre?: string;
  lastStep?: number;
}) {
  const db = await getDb();
  if (!db) return;

  // Check if lead exists
  const existing = await db.select().from(leads).where(eq(leads.email, data.email)).limit(1);

  if (existing.length > 0) {
    // Update existing lead
    const updateData: Record<string, unknown> = {};
    if (data.celebrantName) updateData.celebrantName = data.celebrantName;
    if (data.anecdotes) updateData.anecdotes = data.anecdotes;
    if (data.genre) updateData.genre = data.genre;
    if (data.lastStep) updateData.lastStep = data.lastStep;
    if (Object.keys(updateData).length > 0) {
      await db.update(leads).set(updateData).where(eq(leads.email, data.email));
    }
  } else {
    await db.insert(leads).values({
      email: data.email,
      celebrantName: data.celebrantName ?? null,
      anecdotes: data.anecdotes ?? null,
      genre: data.genre ?? null,
      lastStep: data.lastStep ?? 1,
    });
  }
}

export async function getLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, converted: 0, unconverted: 0 };
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    converted: sql<number>`SUM(CASE WHEN converted = true THEN 1 ELSE 0 END)`,
    unconverted: sql<number>`SUM(CASE WHEN converted = false THEN 1 ELSE 0 END)`,
  }).from(leads);
  return result[0] ?? { total: 0, converted: 0, unconverted: 0 };
}

export async function markLeadConverted(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({ converted: true }).where(eq(leads.email, email));
}

export async function getUnconvertedLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads)
    .where(and(eq(leads.converted, false), eq(leads.retargetingSent, false)))
    .orderBy(desc(leads.createdAt));
}

export async function markRetargetingSent(leadId: number, couponCode: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({
    retargetingSent: true,
    retargetingSentAt: new Date(),
    couponCode,
  }).where(eq(leads.id, leadId));
}

// ============ ORDER HELPERS ============

export async function createOrder(data: {
  customerEmail: string;
  celebrantName: string;
  anecdotes: string;
  genre: string;
  occasion?: string;
  personalityTraits?: string;
  relationship?: string;
  tonePreference?: string;
  specificPhrases?: string;
  dedications?: string;
  tier?: string;
  expressDelivery: boolean;
  lyricVideo: boolean;
  wavFile: boolean;
  revisionsIncluded?: number;
  basePrice: string;
  totalPrice: string;
  couponCode?: string;
  discountApplied?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values({
    customerEmail: data.customerEmail,
    celebrantName: data.celebrantName,
    occasion: data.occasion ?? "birthday",
    anecdotes: data.anecdotes,
    genre: data.genre,
    personalityTraits: data.personalityTraits ?? null,
    relationship: data.relationship ?? null,
    tonePreference: data.tonePreference ?? null,
    specificPhrases: data.specificPhrases ?? null,
    dedications: data.dedications ?? null,
    tier: (data.tier as "basic" | "premium" | "ultra") ?? "basic",
    expressDelivery: data.expressDelivery,
    lyricVideo: data.lyricVideo,
    wavFile: data.wavFile,
    revisionsIncluded: data.revisionsIncluded ?? 0,
    revisionsUsed: 0,
    basePrice: data.basePrice,
    totalPrice: data.totalPrice,
    couponCode: data.couponCode ?? null,
    discountApplied: data.discountApplied ?? null,
    paymentStatus: "pending",
    generationStatus: "queued",
  });

  // Mark lead as converted
  await markLeadConverted(data.customerEmail);

  return { id: result[0].insertId, totalPrice: data.totalPrice };
}

export async function getOrders(limit = 50, offset = 0, status = "all") {
  const db = await getDb();
  if (!db) return [];

  if (status === "all") {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
  }
  return db.select().from(orders)
    .where(eq(orders.paymentStatus, status as any))
    .orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateOrderStatus(id: number, data: {
  generationStatus?: "queued" | "generating" | "completed" | "failed";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
}) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {};
  if (data.generationStatus) updateData.generationStatus = data.generationStatus;
  if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function updateOrderDelivery(id: number, data: {
  mp3Url?: string;
  wavUrl?: string;
  videoUrl?: string;
  previewUrl?: string;
  deliveredAt?: Date;
  sunoTaskId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {};
  if (data.mp3Url) updateData.mp3Url = data.mp3Url;
  if (data.wavUrl) updateData.wavUrl = data.wavUrl;
  if (data.videoUrl) updateData.videoUrl = data.videoUrl;
  if (data.previewUrl) updateData.previewUrl = data.previewUrl;
  if (data.deliveredAt) updateData.deliveredAt = data.deliveredAt;
  if (data.sunoTaskId) updateData.sunoTaskId = data.sunoTaskId;
  if (data.stripeSessionId) updateData.stripeSessionId = data.stripeSessionId;
  if (data.stripePaymentIntentId) updateData.stripePaymentIntentId = data.stripePaymentIntentId;
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function requestRevision(orderId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.revisionsUsed >= order.revisionsIncluded) {
    throw new Error("No revisions remaining");
  }
  await db.update(orders).set({
    revisionsUsed: order.revisionsUsed + 1,
    revisionNotes: notes,
    generationStatus: "queued",
  }).where(eq(orders.id, orderId));
  return { revisionsRemaining: order.revisionsIncluded - order.revisionsUsed - 1 };
}

export async function getOrderByEmailAndId(email: string, orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerEmail, email)))
    .limit(1);
  return result[0] ?? null;
}

export async function getOrderStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, paidOrders: 0, pendingOrders: 0 };
  const result = await db.select({
    totalOrders: sql<number>`COUNT(*)`,
    totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN paymentStatus = 'paid' THEN totalPrice ELSE 0 END), 0)`,
    paidOrders: sql<number>`SUM(CASE WHEN paymentStatus = 'paid' THEN 1 ELSE 0 END)`,
    pendingOrders: sql<number>`SUM(CASE WHEN paymentStatus = 'pending' THEN 1 ELSE 0 END)`,
  }).from(orders);
  return result[0] ?? { totalOrders: 0, totalRevenue: 0, paidOrders: 0, pendingOrders: 0 };
}

// ============ COUPON HELPERS ============

export async function validateCoupon(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(coupons)
    .where(and(eq(coupons.code, code), eq(coupons.used, false)))
    .limit(1);
  if (result.length === 0) return null;
  const coupon = result[0];
  // Check expiry
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null;
  return coupon;
}

export async function createCoupon(discountPercent: number, expiresAt?: Date) {
  const db = await getDb();
  if (!db) return null;
  const code = `SAVE${discountPercent}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await db.insert(coupons).values({
    code,
    discountPercent,
    expiresAt: expiresAt ?? null,
  });
  return code;
}

export async function markCouponUsed(code: string, email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set({ used: true, usedByEmail: email }).where(eq(coupons.code, code));
}

// ============ B2B HELPERS ============

export async function saveB2bContact(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employeeCount?: string;
  message?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(b2bContacts).values({
    companyName: data.companyName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone ?? null,
    employeeCount: data.employeeCount ?? null,
    message: data.message ?? null,
  });
}

export async function getB2bContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(b2bContacts).orderBy(desc(b2bContacts.createdAt));
}

export async function updateB2bStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(b2bContacts).set({ status: status as any }).where(eq(b2bContacts.id, id));
}


// ============ USER PROFILE HELPERS ============

export async function saveUserProfile(userId: number, data: Omit<InsertUserProfile, 'userId'>) {
  const db = await getDb();
  if (!db) return;
  const values: InsertUserProfile = { userId, ...data } as InsertUserProfile;
  await db.insert(userProfiles).values(values).onDuplicateKeyUpdate({
    set: data,
  });
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

// ============ SONG COMMUNICATION HELPERS ============

export async function saveSongCommunication(data: InsertSongCommunication) {
  const db = await getDb();
  if (!db) return;
  await db.insert(songCommunications).values(data);
}

export async function getSongCommunications(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(songCommunications)
    .where(eq(songCommunications.orderId, orderId))
    .orderBy(desc(songCommunications.createdAt));
}

export async function markCommunicationRead(communicationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(songCommunications).set({ status: "read" }).where(eq(songCommunications.id, communicationId));
}

// ============ TEST ORDER HELPERS ============

export async function createTestOrder(orderId: number, adminUserId: number, testNotes?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(testOrders).values({
    orderId,
    createdBy: adminUserId,
    testNotes: testNotes ?? null,
  });
}

export async function isTestOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(testOrders).where(eq(testOrders.orderId, orderId)).limit(1);
  return result.length > 0;
}

export async function getTestOrders(adminUserId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (adminUserId) {
    return db.select().from(testOrders)
      .where(eq(testOrders.createdBy, adminUserId))
      .orderBy(desc(testOrders.createdAt));
  }
  return db.select().from(testOrders).orderBy(desc(testOrders.createdAt));
}
