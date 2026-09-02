import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import rawData from "../data/campistas-demo.json";
import { parse } from "csv-parse/sync";

type DemoCampista = {
  id: string;
  fullName: string;
  idNumber: string;
  age: string;
  phone: string;
  emergencyContacts: string[];
  homeNetworkAttends: string;
  homeNetworkName: string;
  hasDisease: string;
  diseaseDetail: string;
  takesMedication: string;
  medicationDetail: string;
  hasAllergy: string;
  allergyDetail: string;
  treatmentDiet: string;
  paymentStatus: "pagado" | "abonado" | "no_pagado";
  paidPercentage: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: string;
  paymentDetail: string;
  sourceRow: number;
  paymentSourceRow: number | null;
};

type LivePayment = {
  name: string;
  status: "pagado" | "abonado" | "no_pagado";
  paidPercentage: number;
  paidAmount: number;
  pendingAmount: number;
  method: string;
  contact: string;
  detail: string;
  sourceRow: number;
};

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeText(value).split(" ").filter(Boolean));
}

function parseMoney(value: string) {
  const text = String(value || "").replace(/[$,]/g, "").trim();
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

function paymentStatus(paidAmount: number, pendingAmount: number): "pagado" | "abonado" | "no_pagado" {
  if (pendingAmount <= 0) return "pagado";
  if (paidAmount > 0) return "abonado";
  return "no_pagado";
}

function bestPaymentMatch(fullName: string, payments: LivePayment[]) {
  const campTokens = tokenSet(fullName);
  const manualAliases: Record<string, string> = {
    "valeria tatiana hidalgo quimi": "Tati Hidalgo",
    "diego diereck": "Diego Tobar",
    "santiago xavier": "Santiago Cañarte",
    "andriu jesus": "Andriu Izaguirre",
    "gabriel leonardo pareja pazmino": "Leonardo Pareja",
    "jeremy alexander calero pamplona": "Jeremy Pamplona",
    "david andres rincon moran": "David Rincón",
    "victor eduardo escobar leon": "Victor Escobar",
    "damaris yuliana moran aranda": "Damaris Moran",
    "luisana villamar paredes": "Luisana Paredes",
    "taymi obeth sanchez herrera": "Taymi Sanchez",
    "gissell garcia perez ahilyss": "Gissell Garcia",
    "melany yamileth villota manrique": "Melany Villota",
    "viviana salome haro lopez": "Vivian Haro",
    "denisse stephanie garcia yance": "Denisse Garcia",
    "kenny andersson crespin vaca": "Kenny Crespin",
    "mia paola espinoza anchundia": "Mia Espinoza",
    "paulo jose espinoza anchundia": "Paulo Espinoza",
    "marli gabriela penafiel sanchez": "Marli Peñafiel",
    "emily carolain penafiel sanchez": "Emily Peñafiel",
    "romina caisa vinces": "Romina Caisa",
    "domenica sarai bustos zalamea": "Doménica Bustos",
    "keyko paola armas balladares": "Keyko Armas",
    "andres david leon vargas": "Andres Leon",
    "andres fernando torres mera": "Andrés Torres",
  };
  const alias = manualAliases[normalizeText(fullName)];
  if (alias) {
    const aliasMatch = payments.find((payment) => normalizeText(payment.name) === normalizeText(alias));
    if (aliasMatch) return aliasMatch;
  }
  let best: LivePayment | null = null;
  let bestScore = 0;
  for (const payment of payments) {
    const paymentTokens = tokenSet(payment.name);
    let score = 0;
    for (const token of paymentTokens) {
      if (campTokens.has(token)) score += 1;
    }
    if (score > bestScore) {
      best = payment;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

async function fetchCsvRows(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo leer ${url}`);
  const text = await response.text();
  return parse(text, { columns: false, skip_empty_lines: true }) as string[][];
}

async function syncLiveSheets() {
  const formsUrl = "https://docs.google.com/spreadsheets/d/12fN7DQB3VwUO_ydeuFuoAvF570rVVVvTyn29g-utl-M/gviz/tq?tqx=out:csv&sheet=Respuestas%20de%20formulario%201";
  const paymentsUrl = "https://docs.google.com/spreadsheets/d/1N1gUvlJhudApEbYrnPePk9k43Ujo5IVl1fqLExjxeNI/gviz/tq?tqx=out:csv&sheet=Registro%20UP%20%F0%9F%86%99";
  const [formsRows, paymentsRows] = await Promise.all([fetchCsvRows(formsUrl), fetchCsvRows(paymentsUrl)]);

  const payments: LivePayment[] = [];
  for (let i = 1; i < paymentsRows.length; i++) {
    const row = paymentsRows[i];
    const name = String(row[1] || "").trim();
    if (!name) continue;
    const paidAmount = parseMoney(row[2] || "0");
    const pendingAmount = parseMoney(row[3] || "100");
    payments.push({
      name,
      status: paymentStatus(paidAmount, pendingAmount),
      paidPercentage: Math.max(0, Math.min(100, 100 - pendingAmount)),
      paidAmount,
      pendingAmount,
      method: String(row[4] || "").trim(),
      contact: String(row[5] || "").trim(),
      detail: String(row[6] || "").trim(),
      sourceRow: i + 1,
    });
  }

  let created = 0;
  let updated = 0;
  for (let i = 1; i < formsRows.length; i++) {
    const row = formsRows[i];
    const idNumber = String(row[2] || "").trim();
    const fullName = String(row[1] || "").trim();
    if (!idNumber || !fullName) continue;
    const payment = bestPaymentMatch(fullName, payments);
    const result = await db.upsertCampista({
      campistaKey: campistaKey(fullName, idNumber),
      fullName,
      idNumber,
      age: String(row[4] || "").trim(),
      phone: String(row[6] || "").trim(),
      emergencyContact1: String(row[8] || "").trim(),
      emergencyContact2: "",
      homeNetworkAttends: String(row[11] || "").trim(),
      homeNetworkName: String(row[12] || "").trim(),
      hasDisease: String(row[14] || "").trim(),
      diseaseDetail: String(row[15] || "").trim(),
      takesMedication: String(row[16] || "").trim(),
      medicationDetail: String(row[17] || "").trim(),
      hasAllergy: String(row[18] || "").trim(),
      allergyDetail: String(row[19] || "").trim(),
      treatmentDiet: String(row[20] || "").trim(),
      sourceRow: i + 1,
    });

    if (result.created) {
      created += 1;
      await db.createCampistaAlert({ campistaId: result.id, alertType: "nuevo_campista" });
    } else {
      updated += 1;
    }

    await db.createPaymentSnapshot({
      campistaId: result.id,
      sourceRow: payment?.sourceRow,
      status: payment?.status ?? "no_pagado",
      paidPercentage: String(payment?.paidPercentage ?? 0),
      paidAmount: String(payment?.paidAmount ?? 0),
      pendingAmount: String(payment?.pendingAmount ?? 100),
      method: payment?.method ?? "",
      contact: payment?.contact ?? "",
      detail: payment?.detail ?? "",
    });
  }

  return { created, updated, total: formsRows.length - 1, payments: payments.length };
}

function campistaKey(fullName: string, idNumber: string) {
  return `${idNumber}-${fullName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  camp: router({
    syncLive: publicProcedure.mutation(async () => {
      return syncLiveSheets();
    }),

    syncFromSheets: publicProcedure.mutation(async () => {
      const campistas = rawData.campistas as DemoCampista[];
      let created = 0;
      let updated = 0;

      for (const item of campistas) {
        const result = await db.upsertCampista({
          campistaKey: campistaKey(item.fullName, item.idNumber),
          fullName: item.fullName,
          idNumber: item.idNumber,
          age: item.age,
          phone: item.phone,
          emergencyContact1: item.emergencyContacts[0] ?? "",
          emergencyContact2: item.emergencyContacts[1] ?? "",
          homeNetworkAttends: item.homeNetworkAttends,
          homeNetworkName: item.homeNetworkName,
          hasDisease: item.hasDisease,
          diseaseDetail: item.diseaseDetail,
          takesMedication: item.takesMedication,
          medicationDetail: item.medicationDetail,
          hasAllergy: item.hasAllergy,
          allergyDetail: item.allergyDetail,
          treatmentDiet: item.treatmentDiet,
          sourceRow: item.sourceRow,
        });

        if (result.created) {
          created += 1;
          await db.createCampistaAlert({ campistaId: result.id, alertType: "nuevo_campista" });
        } else {
          updated += 1;
        }

        await db.createPaymentSnapshot({
          campistaId: result.id,
          sourceRow: item.paymentSourceRow ?? undefined,
          status: item.paymentStatus,
          paidPercentage: String(item.paidPercentage),
          paidAmount: String(item.paidAmount),
          pendingAmount: String(item.pendingAmount),
          method: item.paymentMethod,
          detail: item.paymentDetail,
        });
      }

      return { created, updated, total: campistas.length };
    }),

    list: publicProcedure.query(async () => {
      const [campistas, snapshots] = await Promise.all([db.listCampistas(), db.listLatestPaymentSnapshots()]);
      const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.campistaId, snapshot]));
      return campistas.map((campista) => ({
        ...campista,
        payment: snapshotMap.get(campista.id) ?? null,
      }));
    }),

    detail: publicProcedure.input(z.object({ idNumber: z.string() })).query(async ({ input }) => {
      const campista = await db.getCampistaByIdNumber(input.idNumber);
      if (!campista) return null;
      const [payment, meals, entries] = await Promise.all([
        db.getLatestPaymentSnapshot(campista.id),
        db.listMealMarks(campista.id),
        db.listPaymentEntries(campista.id),
      ]);
      return { campista, payment, meals, entries };
    }),

    markMeal: publicProcedure.input(z.object({
      idNumber: z.string(),
      mealType: z.enum(["desayuno", "almuerzo", "cena"]),
      mealDay: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const campista = await db.getCampistaByIdNumber(input.idNumber);
      if (!campista) throw new Error("Campista no encontrado");
      await db.markMeal({
        campistaId: campista.id,
        mealType: input.mealType,
        mealDay: input.mealDay,
        marked: true,
        markedAt: new Date(),
        markedBy: ctx.user?.email ?? ctx.user?.openId ?? "staff",
      });
      return { success: true };
    }),

    addPaymentEntry: protectedProcedure.input(z.object({
      idNumber: z.string(),
      entryType: z.enum(["abono", "pago_completo"]),
      method: z.enum(["efectivo", "transferencia", "deposito", "datafacil"]),
      detail: z.string().optional(),
      receiptUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const campista = await db.getCampistaByIdNumber(input.idNumber);
      if (!campista) throw new Error("Campista no encontrado");
      const entryId = await db.createPaymentEntry({
        campistaId: campista.id,
        entryType: input.entryType,
        method: input.method,
        detail: input.detail,
        receiptUrl: input.receiptUrl,
        createdBy: ctx.user?.email ?? ctx.user?.openId ?? "staff",
      });
      if (input.receiptUrl) {
        await db.createReceiptUpload({
          campistaId: campista.id,
          paymentEntryId: entryId,
          fileUrl: input.receiptUrl,
          fileName: input.receiptUrl.split("/").pop() ?? "comprobante",
          uploadedBy: ctx.user?.email ?? ctx.user?.openId ?? "staff",
        });
      }
      return { success: true, entryId };
    }),

    alerts: publicProcedure.query(async () => {
      const alerts = await db.listPendingCampistaAlerts();
      const campistas = await db.listCampistas();
      const campistaMap = new Map(campistas.map((campista) => [campista.id, campista]));
      return alerts.map((alert) => ({
        ...alert,
        campista: campistaMap.get(alert.campistaId) ?? null,
      }));
    }),

    markAlertsSeen: protectedProcedure.input(z.object({ ids: z.array(z.number()) })).mutation(async ({ input }) => {
      await db.markCampistaAlertsSeen(input.ids);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
