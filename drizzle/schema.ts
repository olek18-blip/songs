import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Orders table - tracks each song purchase
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  // Customer info (no account required)
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  // Song details
  celebrantName: varchar("celebrantName", { length: 255 }).notNull(),
  occasion: varchar("occasion", { length: 100 }).default("birthday"),
  anecdotes: text("anecdotes").notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  // Premium fields (for premium/ultra tiers)
  personalityTraits: text("personalityTraits"),
  relationship: varchar("relationship", { length: 100 }),
  tonePreference: varchar("tonePreference", { length: 100 }),
  specificPhrases: text("specificPhrases"),
  dedications: text("dedications"),
  // Tier selection
  tier: mysqlEnum("tier", ["basic", "premium", "ultra"]).default("basic").notNull(),
  // Pricing
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  expressDelivery: boolean("expressDelivery").default(false).notNull(),
  lyricVideo: boolean("lyricVideo").default(false).notNull(),
  wavFile: boolean("wavFile").default(false).notNull(),
  // Revisions
  revisionsIncluded: int("revisionsIncluded").default(0).notNull(),
  revisionsUsed: int("revisionsUsed").default(0).notNull(),
  revisionNotes: text("revisionNotes"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  // Coupon
  couponCode: varchar("couponCode", { length: 50 }),
  discountApplied: decimal("discountApplied", { precision: 10, scale: 2 }),
  // Payment
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  // Generation
  generationStatus: mysqlEnum("generationStatus", ["queued", "generating", "completed", "failed"]).default("queued").notNull(),
  sunoTaskId: varchar("sunoTaskId", { length: 255 }),
  // Delivery
  previewUrl: text("previewUrl"),
  mp3Url: text("mp3Url"),
  wavUrl: text("wavUrl"),
  videoUrl: text("videoUrl"),
  deliveredAt: timestamp("deliveredAt"),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Leads table - captures emails from step 1 for abandonment recovery
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  celebrantName: varchar("celebrantName", { length: 255 }),
  anecdotes: text("anecdotes"),
  genre: varchar("genre", { length: 100 }),
  tier: varchar("tier", { length: 20 }),
  // Funnel tracking
  lastStep: int("lastStep").default(1).notNull(),
  converted: boolean("converted").default(false).notNull(),
  // Retargeting
  retargetingSent: boolean("retargetingSent").default(false).notNull(),
  retargetingSentAt: timestamp("retargetingSentAt"),
  couponCode: varchar("couponCode", { length: 50 }),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Coupons table - discount codes for retargeting
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountPercent: int("discountPercent").notNull(),
  used: boolean("used").default(false).notNull(),
  usedByEmail: varchar("usedByEmail", { length: 320 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * B2B Contacts - companies interested in the annual subscription
 */
export const b2bContacts = mysqlTable("b2bContacts", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  employeeCount: varchar("employeeCount", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "negotiating", "closed", "lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type B2bContact = typeof b2bContacts.$inferSelect;
export type InsertB2bContact = typeof b2bContacts.$inferInsert;

/**
 * User Profiles - extended user info for communication and preferences
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phone: varchar("phone", { length: 50 }),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  communicationPreference: mysqlEnum("communicationPreference", ["email", "sms", "both"]).default("email"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Song Communications - messages between customer and admin about song revisions/changes
 */
export const songCommunications = mysqlTable("songCommunications", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  senderType: mysqlEnum("senderType", ["customer", "admin"]).notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachmentUrl"), // URL to audio file if admin sends a revision
  status: mysqlEnum("status", ["new", "read", "resolved"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SongCommunication = typeof songCommunications.$inferSelect;
export type InsertSongCommunication = typeof songCommunications.$inferInsert;

/**
 * Test Orders - orders created by admin for testing without payment
 */
export const testOrders = mysqlTable("testOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  createdBy: int("createdBy").notNull(), // admin user ID
  testNotes: text("testNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestOrder = typeof testOrders.$inferSelect;
export type InsertTestOrder = typeof testOrders.$inferInsert;
