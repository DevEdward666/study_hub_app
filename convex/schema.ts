import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Study tables in the hub
  studyTables: defineTable({
    tableNumber: v.string(),
    qrCode: v.string(), // QR code data for this table
    qrCodeImage: v.optional(v.string()), // Base64 QR code image
    isOccupied: v.boolean(),
    currentUserId: v.optional(v.id("users")),
    hourlyRate: v.number(), // Credits per hour
    location: v.string(),
    capacity: v.number(),
  }).index("by_table_number", ["tableNumber"])
    .index("by_qr_code", ["qrCode"]),

  // User credits
  userCredits: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    totalPurchased: v.number(),
    totalSpent: v.number(),
  }).index("by_user", ["userId"]),

  // Credit purchase transactions
  creditTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // Credits to purchase
    cost: v.number(), // Real money cost
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    paymentMethod: v.string(),
    transactionId: v.string(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Table usage sessions
  tableSessions: defineTable({
    userId: v.id("users"),
    tableId: v.id("studyTables"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    creditsUsed: v.number(),
    status: v.union(v.literal("active"), v.literal("completed")),
  }).index("by_user", ["userId"])
    .index("by_table", ["tableId"])
    .index("by_status", ["status"]),

  // Admin users
  adminUsers: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    permissions: v.array(v.string()),
  }).index("by_user", ["userId"]),

  // Premise activation system
  premiseActivation: defineTable({
    userId: v.id("users"),
    activatedAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
    activationCode: v.string(), // QR code scanned at premise
  }).index("by_user", ["userId"])
    .index("by_activation_code", ["activationCode"]),

  // Premise QR codes (for activation)
  premiseQRCodes: defineTable({
    code: v.string(),
    location: v.string(),
    isActive: v.boolean(),
    validityHours: v.number(), // How long activation lasts
  }).index("by_code", ["code"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
