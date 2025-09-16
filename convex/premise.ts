import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get premise QR codes (for admin)
export const getPremiseQRCodes = query({
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

    return await ctx.db.query("premiseQRCodes").collect();
  },
});

// Activate premise access by scanning QR code
export const activatePremiseAccess = mutation({
  args: {
    activationCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    // Check if activation code is valid
    const premiseCode = await ctx.db
      .query("premiseQRCodes")
      .withIndex("by_code", (q) => q.eq("code", args.activationCode))
      .unique();

    if (!premiseCode || !premiseCode.isActive) {
      throw new Error("Invalid or inactive premise code");
    }

    // Check if user already has active access
    const existingActivation = await ctx.db
      .query("premiseActivation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    const now = Date.now();
    const expiresAt = now + (premiseCode.validityHours * 60 * 60 * 1000);

    if (existingActivation) {
      // Update existing activation
      await ctx.db.patch(existingActivation._id, {
        activatedAt: now,
        expiresAt,
        activationCode: args.activationCode,
      });
    } else {
      // Create new activation
      await ctx.db.insert("premiseActivation", {
        userId,
        activatedAt: now,
        expiresAt,
        isActive: true,
        activationCode: args.activationCode,
      });
    }

    return {
      success: true,
      expiresAt,
      location: premiseCode.location,
      validityHours: premiseCode.validityHours,
    };
  },
});

// Check if user has active premise access
export const checkPremiseAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const activation = await ctx.db
      .query("premiseActivation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!activation) {
      return null;
    }

    const now = Date.now();
    if (activation.expiresAt < now) {
      // Return null for expired access - cleanup will happen in a mutation
      return null;
    }

    const premiseCode = await ctx.db
      .query("premiseQRCodes")
      .withIndex("by_code", (q) => q.eq("code", activation.activationCode))
      .unique();

    return {
      ...activation,
      location: premiseCode?.location,
      timeRemaining: activation.expiresAt - now,
    };
  },
});

// Create premise QR code (admin only)
export const createPremiseQRCode = mutation({
  args: {
    location: v.string(),
    validityHours: v.number(),
  },
  handler: async (ctx, args) => {
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

    const code = `PREMISE_${args.location.toUpperCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(7)}`;

    const premiseId = await ctx.db.insert("premiseQRCodes", {
      code,
      location: args.location,
      isActive: true,
      validityHours: args.validityHours,
    });

    return { premiseId, code };
  },
});

// Clean up expired premise access (mutation)
export const cleanupExpiredAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

    const now = Date.now();
    const expiredActivations = await ctx.db
      .query("premiseActivation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const activation of expiredActivations) {
      if (activation.expiresAt < now) {
        await ctx.db.patch(activation._id, { isActive: false });
      }
    }
  },
});
