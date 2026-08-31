import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

export const campistas = mysqlTable("campistas", {
  id: int("id").autoincrement().primaryKey(),
  campistaKey: varchar("campistaKey", { length: 191 }).notNull().unique(),
  fullName: text("fullName").notNull(),
  idNumber: varchar("idNumber", { length: 32 }).notNull().unique(),
  age: varchar("age", { length: 32 }),
  phone: varchar("phone", { length: 191 }),
  emergencyContact1: text("emergencyContact1"),
  emergencyContact2: text("emergencyContact2"),
  homeNetworkAttends: varchar("homeNetworkAttends", { length: 32 }),
  homeNetworkName: text("homeNetworkName"),
  hasDisease: varchar("hasDisease", { length: 32 }),
  diseaseDetail: text("diseaseDetail"),
  takesMedication: varchar("takesMedication", { length: 32 }),
  medicationDetail: text("medicationDetail"),
  hasAllergy: varchar("hasAllergy", { length: 32 }),
  allergyDetail: text("allergyDetail"),
  treatmentDiet: text("treatmentDiet"),
  sourceRow: int("sourceRow"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentSnapshots = mysqlTable("payment_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  campistaId: int("campistaId").notNull(),
  sourceRow: int("sourceRow"),
  status: mysqlEnum("status", ["pagado", "abonado", "no_pagado"]).notNull(),
  paidPercentage: decimal("paidPercentage", { precision: 5, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).notNull(),
  pendingAmount: decimal("pendingAmount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 64 }),
  contact: varchar("contact", { length: 64 }),
  detail: text("detail"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export const mealMarks = mysqlTable("meal_marks", {
  id: int("id").autoincrement().primaryKey(),
  campistaId: int("campistaId").notNull(),
  mealType: mysqlEnum("mealType", ["desayuno", "almuerzo", "cena"]).notNull(),
  mealDay: varchar("mealDay", { length: 32 }).notNull(),
  marked: boolean("marked").default(false).notNull(),
  markedAt: timestamp("markedAt"),
  markedBy: varchar("markedBy", { length: 128 }),
});

export const paymentEntries = mysqlTable("payment_entries", {
  id: int("id").autoincrement().primaryKey(),
  campistaId: int("campistaId").notNull(),
  entryType: mysqlEnum("entryType", ["abono", "pago_completo"]).notNull(),
  method: mysqlEnum("method", ["efectivo", "transferencia", "deposito", "datafacil"]).notNull(),
  detail: text("detail"),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: varchar("createdBy", { length: 128 }),
});

export const receiptUploads = mysqlTable("receipt_uploads", {
  id: int("id").autoincrement().primaryKey(),
  campistaId: int("campistaId").notNull(),
  paymentEntryId: int("paymentEntryId"),
  fileUrl: text("fileUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  uploadedBy: varchar("uploadedBy", { length: 128 }),
});

export const campistaAlerts = mysqlTable("campista_alerts", {
  id: int("id").autoincrement().primaryKey(),
  campistaId: int("campistaId").notNull(),
  alertType: mysqlEnum("alertType", ["nuevo_campista", "pago_actualizado"]).notNull(),
  status: mysqlEnum("status", ["pendiente", "vista"]).default("pendiente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  seenAt: timestamp("seenAt"),
});

export type Campista = typeof campistas.$inferSelect;
export type InsertCampista = typeof campistas.$inferInsert;
export type PaymentSnapshot = typeof paymentSnapshots.$inferSelect;
export type InsertPaymentSnapshot = typeof paymentSnapshots.$inferInsert;
export type MealMark = typeof mealMarks.$inferSelect;
export type InsertMealMark = typeof mealMarks.$inferInsert;
export type PaymentEntry = typeof paymentEntries.$inferSelect;
export type InsertPaymentEntry = typeof paymentEntries.$inferInsert;
export type ReceiptUpload = typeof receiptUploads.$inferSelect;
export type InsertReceiptUpload = typeof receiptUploads.$inferInsert;
export type CampistaAlert = typeof campistaAlerts.$inferSelect;
export type InsertCampistaAlert = typeof campistaAlerts.$inferInsert;
