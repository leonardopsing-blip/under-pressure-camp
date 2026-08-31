import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campistaAlerts,
  campistas,
  InsertCampista,
  InsertCampistaAlert,
  InsertMealMark,
  InsertPaymentEntry,
  InsertPaymentSnapshot,
  InsertReceiptUpload,
  InsertUser,
  mealMarks,
  paymentEntries,
  paymentSnapshots,
  receiptUploads,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
    const values: InsertUser = {
      openId: user.openId,
    };
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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

export async function upsertCampista(data: InsertCampista) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(campistas).where(eq(campistas.idNumber, data.idNumber)).limit(1);
  if (existing.length > 0) {
    await db.update(campistas).set({
      campistaKey: data.campistaKey,
      fullName: data.fullName,
      age: data.age,
      phone: data.phone,
      emergencyContact1: data.emergencyContact1,
      emergencyContact2: data.emergencyContact2,
      homeNetworkAttends: data.homeNetworkAttends,
      homeNetworkName: data.homeNetworkName,
      hasDisease: data.hasDisease,
      diseaseDetail: data.diseaseDetail,
      takesMedication: data.takesMedication,
      medicationDetail: data.medicationDetail,
      hasAllergy: data.hasAllergy,
      allergyDetail: data.allergyDetail,
      treatmentDiet: data.treatmentDiet,
      sourceRow: data.sourceRow,
    }).where(eq(campistas.id, existing[0].id));
    return { id: existing[0].id, created: false };
  }

  await db.insert(campistas).values(data);
  const created = await db.select().from(campistas).where(eq(campistas.idNumber, data.idNumber)).limit(1);
  return { id: created[0].id, created: true };
}

export async function listCampistas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campistas).orderBy(campistas.fullName);
}

export async function getCampistaByIdNumber(idNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campistas).where(eq(campistas.idNumber, idNumber)).limit(1);
  return result[0];
}

export async function createPaymentSnapshot(data: InsertPaymentSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paymentSnapshots).values(data);
}

export async function getLatestPaymentSnapshot(campistaId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentSnapshots).where(eq(paymentSnapshots.campistaId, campistaId)).orderBy(desc(paymentSnapshots.syncedAt)).limit(1);
  return result[0];
}

export async function listLatestPaymentSnapshots() {
  const db = await getDb();
  if (!db) return [];
  const snapshots = await db.select().from(paymentSnapshots).orderBy(desc(paymentSnapshots.syncedAt));
  const seen = new Set<number>();
  return snapshots.filter((snapshot) => {
    if (seen.has(snapshot.campistaId)) return false;
    seen.add(snapshot.campistaId);
    return true;
  });
}

export async function markMeal(data: InsertMealMark) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(mealMarks).where(and(eq(mealMarks.campistaId, data.campistaId), eq(mealMarks.mealType, data.mealType), eq(mealMarks.mealDay, data.mealDay))).limit(1);
  if (existing.length > 0) {
    await db.update(mealMarks).set({ marked: true, markedAt: data.markedAt ?? new Date(), markedBy: data.markedBy }).where(eq(mealMarks.id, existing[0].id));
    return existing[0].id;
  }
  await db.insert(mealMarks).values({ ...data, marked: true, markedAt: data.markedAt ?? new Date() });
  const created = await db.select().from(mealMarks).where(and(eq(mealMarks.campistaId, data.campistaId), eq(mealMarks.mealType, data.mealType), eq(mealMarks.mealDay, data.mealDay))).limit(1);
  return created[0].id;
}

export async function listMealMarks(campistaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mealMarks).where(eq(mealMarks.campistaId, campistaId));
}

export async function createPaymentEntry(data: InsertPaymentEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paymentEntries).values(data);
  const created = await db.select().from(paymentEntries).where(eq(paymentEntries.campistaId, data.campistaId)).orderBy(desc(paymentEntries.createdAt)).limit(1);
  return created[0].id;
}

export async function listPaymentEntries(campistaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentEntries).where(eq(paymentEntries.campistaId, campistaId)).orderBy(desc(paymentEntries.createdAt));
}

export async function createReceiptUpload(data: InsertReceiptUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(receiptUploads).values(data);
  const created = await db.select().from(receiptUploads).where(eq(receiptUploads.campistaId, data.campistaId)).orderBy(desc(receiptUploads.uploadedAt)).limit(1);
  return created[0].id;
}

export async function createCampistaAlert(data: InsertCampistaAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(campistaAlerts).values(data);
  const created = await db.select().from(campistaAlerts).where(eq(campistaAlerts.campistaId, data.campistaId)).orderBy(desc(campistaAlerts.createdAt)).limit(1);
  return created[0].id;
}

export async function listPendingCampistaAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campistaAlerts).where(eq(campistaAlerts.status, "pendiente")).orderBy(desc(campistaAlerts.createdAt));
}

export async function markCampistaAlertsSeen(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await Promise.all(ids.map((id) => db.update(campistaAlerts).set({ status: "vista", seenAt: new Date() }).where(eq(campistaAlerts.id, id))));
}
