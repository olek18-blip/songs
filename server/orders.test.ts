import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  saveLead: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadStats: vi.fn().mockResolvedValue({ total: 5, converted: 2, unconverted: 3 }),
  createOrder: vi.fn().mockResolvedValue({ id: 1, totalPrice: "9.99" }),
  getOrders: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue(null),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  getOrderStats: vi.fn().mockResolvedValue({ totalOrders: 10, totalRevenue: 150, paidOrders: 8, pendingOrders: 2 }),
  saveB2bContact: vi.fn().mockResolvedValue(undefined),
  getB2bContacts: vi.fn().mockResolvedValue([]),
  updateB2bStatus: vi.fn().mockResolvedValue(undefined),
  validateCoupon: vi.fn().mockResolvedValue(null),
  requestRevision: vi.fn().mockResolvedValue({ revisionsRemaining: 1 }),
  getOrderByEmailAndId: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  markLeadConverted: vi.fn(),
  updateOrderDelivery: vi.fn(),
}));

// Mock stripe
vi.mock("./stripe", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test", id: "cs_test_123" }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@test.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("leads.save", () => {
  it("saves a lead with email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.save({ email: "test@example.com" });
    expect(result).toEqual({ success: true });
  });

  it("saves a lead with tier info", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.save({
      email: "test@example.com",
      celebrantName: "John",
      anecdotes: "Loves pizza",
      genre: "Pop",
      tier: "premium",
      lastStep: 2,
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.leads.save({ email: "invalid" })).rejects.toThrow();
  });
});

describe("orders.create", () => {
  it("creates a basic tier order and returns checkout URL", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.orders.create({
      customerEmail: "buyer@test.com",
      celebrantName: "Maria",
      anecdotes: "She loves dancing",
      genre: "Pop",
      tier: "basic",
      expressDelivery: false,
      lyricVideo: false,
      wavFile: false,
      revisionsIncluded: 0,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("checkoutUrl");
    expect(result.checkoutUrl).toContain("stripe.com");
  });

  it("creates a premium tier order with upsells and revisions", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.orders.create({
      customerEmail: "buyer@test.com",
      celebrantName: "Carlos",
      anecdotes: "He plays guitar",
      genre: "Rock",
      tier: "premium",
      personalityTraits: "Funny, adventurous",
      relationship: "friend",
      expressDelivery: true,
      lyricVideo: true,
      wavFile: true,
      revisionsIncluded: 2,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("checkoutUrl");
  });

  it("creates an ultra tier order with all fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.orders.create({
      customerEmail: "buyer@test.com",
      celebrantName: "Ana",
      anecdotes: "She loves cats",
      genre: "Jazz",
      tier: "ultra",
      personalityTraits: "Creative, kind",
      relationship: "partner",
      tonePreference: "romantic",
      specificPhrases: "You are my sunshine",
      dedications: "To the love of my life",
      expressDelivery: false,
      lyricVideo: true,
      wavFile: false,
      revisionsIncluded: 1,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("checkoutUrl");
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.create({
        customerEmail: "not-an-email",
        celebrantName: "Test",
        anecdotes: "Some anecdotes",
        genre: "pop",
        tier: "basic",
        expressDelivery: false,
        lyricVideo: false,
        wavFile: false,
        revisionsIncluded: 0,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid tier", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.create({
        customerEmail: "test@example.com",
        celebrantName: "Test",
        anecdotes: "Some anecdotes",
        genre: "pop",
        tier: "invalid_tier" as any,
        expressDelivery: false,
        lyricVideo: false,
        wavFile: false,
        revisionsIncluded: 0,
      })
    ).rejects.toThrow();
  });

  it("rejects revisionsIncluded > 2", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.create({
        customerEmail: "test@example.com",
        celebrantName: "Test",
        anecdotes: "Some anecdotes",
        genre: "pop",
        tier: "basic",
        expressDelivery: false,
        lyricVideo: false,
        wavFile: false,
        revisionsIncluded: 5,
      })
    ).rejects.toThrow();
  });
});

describe("orders.status", () => {
  it("returns NOT_FOUND for non-existent order", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.status({ email: "test@example.com", orderId: 999 })
    ).rejects.toThrow("Order not found");
  });
});

describe("orders.requestRevision", () => {
  it("rejects revision notes shorter than 10 chars", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.requestRevision({
        email: "test@example.com",
        orderId: 999,
        notes: "short",
      })
    ).rejects.toThrow();
  });

  it("returns NOT_FOUND for non-existent order", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.requestRevision({
        email: "test@example.com",
        orderId: 999,
        notes: "Please make the song more upbeat and add more energy to the chorus",
      })
    ).rejects.toThrow("Order not found");
  });
});

describe("b2b.submit", () => {
  it("submits a B2B contact form", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.b2b.submit({
      companyName: "Acme Corp",
      contactName: "Jane Smith",
      email: "jane@acme.com",
      phone: "+34 600 000 000",
      employeeCount: "50-200",
      message: "Interested in annual plan",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects invalid email in B2B form", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.b2b.submit({
      companyName: "Acme",
      contactName: "Jane",
      email: "not-an-email",
    })).rejects.toThrow();
  });
});

describe("admin procedures", () => {
  it("admin can access order stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.orders.stats();
    expect(stats).toHaveProperty("totalOrders");
    expect(stats).toHaveProperty("totalRevenue");
  });

  it("admin can access lead stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.leads.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("converted");
  });

  it("admin can list orders", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const orders = await caller.orders.list({ limit: 10, offset: 0, status: "all" });
    expect(Array.isArray(orders)).toBe(true);
  });

  it("admin can list B2B contacts", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const contacts = await caller.b2b.list();
    expect(Array.isArray(contacts)).toBe(true);
  });

  it("regular user cannot access admin endpoints", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.orders.stats()).rejects.toThrow();
    await expect(caller.leads.stats()).rejects.toThrow();
    await expect(caller.b2b.list()).rejects.toThrow();
  });

  it("unauthenticated user cannot access admin endpoints", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.stats()).rejects.toThrow();
    await expect(caller.leads.list()).rejects.toThrow();
  });
});

describe("coupons.validate", () => {
  it("returns invalid for non-existent coupon", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.coupons.validate({ code: "INVALID" });
    expect(result).toEqual({ valid: false, discountPercent: 0 });
  });
});
