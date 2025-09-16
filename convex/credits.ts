import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Initialize user credits (mutation)
export const initializeUserCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const existingCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingCredits) {
      return existingCredits;
    }

    const creditId = await ctx.db.insert("userCredits", {
      userId,
      balance: 0,
      totalPurchased: 0,
      totalSpent: 0,
    });

    return await ctx.db.get(creditId);
  },
});

// Get user's credit balance
export const getUserCredits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

// Purchase credits
export const purchaseCredits = mutation({
  args: {
    amount: v.number(),
    paymentMethod: v.string(),
    transactionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Calculate cost (example: $1 per 10 credits)
    const cost = args.amount * 0.1;

    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      amount: args.amount,
      cost,
      status: "pending",
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
    });

    return transactionId;
  },
});

// Get user's credit transactions
export const getUserTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get user's table sessions
export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const sessions = await ctx.db
      .query("tableSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Get table info for each session
    const sessionsWithTables = await Promise.all(
      sessions.map(async (session) => {
        const table = await ctx.db.get(session.tableId);
        return { ...session, table };
      })
    );

    return sessionsWithTables;
  },
});
