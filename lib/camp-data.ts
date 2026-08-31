import rawData from '@/data/campistas-demo.json';

export type PaymentStatus = 'pagado' | 'abonado' | 'no_pagado';

export interface EmergencyContact {
  label: string;
}

export interface Campista {
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
  paymentStatus: PaymentStatus;
  paidPercentage: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatusLabel: string;
  paymentStatusColor: string;
  sourceRow: number;
  paymentSourceRow: number | null;
  paymentMethod: string;
  paymentDetail: string;
}

export interface CampData {
  summary: {
    campistasCount: number;
    pagosCount: number;
    comprobantesCells: number;
    paymentStatusCounts: Record<PaymentStatus, number>;
    campistasWithDisease: number;
    campistasWithAllergy: number;
    campistasWithMedication: number;
    campistasWithHomeNetwork: number;
  };
  generatedAt: string;
  operationalSpreadsheetId: string;
  operationalSpreadsheetUrl: string;
  campistas: Campista[];
}

export const campData = rawData as CampData;

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findCampistaByScan(value: string) {
  const query = normalizeSearch(value);
  if (!query) return undefined;
  return campData.campistas.find((campista) => {
    const id = normalizeSearch(campista.idNumber);
    const name = normalizeSearch(campista.fullName);
    return id === query || name === query || id.includes(query) || name.includes(query);
  });
}

export function searchCampistas(query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return campData.campistas;
  return campData.campistas.filter((campista) => {
    return (
      normalizeSearch(campista.fullName).includes(normalized) ||
      normalizeSearch(campista.idNumber).includes(normalized)
    );
  });
}

export function getPaymentBadgeClasses(status: PaymentStatus) {
  switch (status) {
    case 'pagado':
      return 'bg-emerald-100 border-emerald-300 text-emerald-700';
    case 'abonado':
      return 'bg-amber-100 border-amber-300 text-amber-700';
    default:
      return 'bg-red-100 border-red-300 text-red-700';
  }
}

export function getPaymentLabel(status: PaymentStatus) {
  switch (status) {
    case 'pagado':
      return 'Pagado';
    case 'abonado':
      return 'Abonado';
    default:
      return 'No pagado';
  }
}
