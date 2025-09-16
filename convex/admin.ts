import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return !!adminUser;
  },
});

// Get all users for admin management
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db.query("users").collect();
    
    // Get additional info for each user
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        const credits = await ctx.db
          .query("userCredits")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        const isAdmin = await ctx.db
          .query("adminUsers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();

        const activeSession = await ctx.db
          .query("tableSessions")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();

        return {
          ...user,
          credits: credits?.balance || 0,
          isAdmin: !!isAdmin,
          hasActiveSession: !!activeSession,
        };
      })
    );

    return usersWithInfo;
  },
});

// Get pending credit transactions for admin approval
export const getPendingTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    // Get user info for each transaction
    const transactionsWithUsers = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await ctx.db.get(transaction.userId);
        return { ...transaction, user };
      })
    );

    return transactionsWithUsers;
  },
});

// Approve credit transaction
export const approveTransaction = mutation({
  args: {
    transactionId: v.id("creditTransactions"),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction is not pending");
    }

    // Update transaction status
    await ctx.db.patch(args.transactionId, {
      status: "approved",
      approvedBy: adminUserId,
      approvedAt: Date.now(),
    });

    // Add credits to user's balance
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", transaction.userId))
      .unique();

    if (!userCredits) {
      // Create initial credit record
      await ctx.db.insert("userCredits", {
        userId: transaction.userId,
        balance: transaction.amount,
        totalPurchased: transaction.amount,
        totalSpent: 0,
      });
    } else {
      await ctx.db.patch(userCredits._id, {
        balance: userCredits.balance + transaction.amount,
        totalPurchased: userCredits.totalPurchased + transaction.amount,
      });
    }

    return true;
  },
});

// Reject credit transaction
export const rejectTransaction = mutation({
  args: {
    transactionId: v.id("creditTransactions"),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction is not pending");
    }

    // Update transaction status
    await ctx.db.patch(args.transactionId, {
      status: "rejected",
      approvedBy: adminUserId,
      approvedAt: Date.now(),
    });

    return true;
  },
});

// Create study table with QR code generation
export const createStudyTable = mutation({
  args: {
    tableNumber: v.string(),
    hourlyRate: v.number(),
    location: v.string(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    // Generate QR code data (table ID + random string)
    const qrCode = `TABLE_${args.tableNumber}_${Math.random().toString(36).substring(7)}`;

    const tableId = await ctx.db.insert("studyTables", {
      tableNumber: args.tableNumber,
      qrCode,
      isOccupied: false,
      hourlyRate: args.hourlyRate,
      location: args.location,
      capacity: args.capacity,
    });

    return { tableId, qrCode };
  },
});

// Make user admin (for initial setup)
export const makeUserAdmin = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already admin
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingAdmin) {
      throw new Error("User is already an admin");
    }

    await ctx.db.insert("adminUsers", {
      userId: user._id,
      role: "admin",
      permissions: ["approve_transactions", "manage_tables", "manage_users"],
    });

    return true;
  },
});

// Toggle user admin status
export const toggleUserAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingAdmin) {
      // Remove admin status
      await ctx.db.delete(existingAdmin._id);
      return { isAdmin: false };
    } else {
      // Add admin status
      await ctx.db.insert("adminUsers", {
        userId: args.userId,
        role: "admin",
        permissions: ["approve_transactions", "manage_tables", "manage_users"],
      });
      return { isAdmin: true };
    }
  },
});

// Setup sample data
export const setupData = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = await ctx.db.query("studyTables").collect();
    if (tables.length > 0) return "exists";

    const sampleTables = [
      { tableNumber: "A1", location: "Ground Floor", hourlyRate: 5, capacity: 1 },
      { tableNumber: "B1", location: "First Floor", hourlyRate: 8, capacity: 4 },
      { tableNumber: "C1", location: "Second Floor", hourlyRate: 6, capacity: 2 },
    ];

    for (const table of sampleTables) {
      const qrCode = `TABLE_${table.tableNumber}_${Math.random().toString(36).substring(7)}`;
      await ctx.db.insert("studyTables", { ...table, qrCode, isOccupied: false });
    }

    // Setup premise activation codes
    const premiseCodes = [
      { code: "PREMISE_MAIN_ENTRANCE", location: "Main Entrance", validityHours: 8 },
      { code: "PREMISE_LIBRARY_DESK", location: "Library Reception", validityHours: 12 },
    ];

    for (const premise of premiseCodes) {
      await ctx.db.insert("premiseQRCodes", { ...premise, isActive: true });
    }

    return "created";
  },
});

// Generate QR code image for table
export const generateTableQR = mutation({
  args: {
    tableId: v.id("studyTables"),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Must be logged in");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", adminUserId))
      .unique();

    if (!adminUser) {
      throw new Error("Unauthorized");
    }

    const table = await ctx.db.get(args.tableId);
    if (!table) {
      throw new Error("Table not found");
    }

    return { qrCode: table.qrCode, tableNumber: table.tableNumber };
  },
});
