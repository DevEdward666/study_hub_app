import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all available study tables
export const getAllTables = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("studyTables").collect();
  },
});

// Get table by QR code
export const getTableByQR = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyTables")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .unique();
  },
});

// Start a table session
export const startTableSession = mutation({
  args: { 
    tableId: v.id("studyTables"),
    qrCode: v.string() 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Verify QR code matches table
    const table = await ctx.db.get(args.tableId);
    if (!table || table.qrCode !== args.qrCode) {
      throw new Error("Invalid QR code for this table");
    }

    if (table.isOccupied) {
      throw new Error("Table is already occupied");
    }

    // Check user has credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!userCredits || userCredits.balance < table.hourlyRate) {
      throw new Error("Insufficient credits");
    }

    // Mark table as occupied
    await ctx.db.patch(args.tableId, {
      isOccupied: true,
      currentUserId: userId,
    });

    // Create session
    const sessionId = await ctx.db.insert("tableSessions", {
      userId,
      tableId: args.tableId,
      startTime: Date.now(),
      creditsUsed: 0,
      status: "active",
    });

    return sessionId;
  },
});

// End table session
export const endTableSession = mutation({
  args: { sessionId: v.id("tableSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    const table = await ctx.db.get(session.tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    // Calculate credits used
    const duration = Date.now() - session.startTime;
    const hoursUsed = Math.ceil(duration / (1000 * 60 * 60)); // Round up to nearest hour
    const creditsUsed = hoursUsed * table.hourlyRate;

    // Update user credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userCredits) {
      await ctx.db.patch(userCredits._id, {
        balance: Math.max(0, userCredits.balance - creditsUsed),
        totalSpent: userCredits.totalSpent + creditsUsed,
      });
    }

    // Update session
    await ctx.db.patch(args.sessionId, {
      endTime: Date.now(),
      creditsUsed,
      status: "completed",
    });

    // Free up table
    await ctx.db.patch(session.tableId, {
      isOccupied: false,
      currentUserId: undefined,
    });

    return { creditsUsed, duration };
  },
});

// Get user's active session
export const getUserActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const session = await ctx.db
      .query("tableSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    if (!session) {
      return null;
    }

    const table = await ctx.db.get(session.tableId);
    return { ...session, table };
  },
});
