import fs from 'fs';
import path from 'path';
import { Consultation, ConsultationStatus, CONSULTATIONS as SEED_CONSULTATIONS } from '../models/consultation';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONSULTATIONS_FILE = path.join(DATA_DIR, 'consultations.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONSULTATIONS_FILE)) {
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(SEED_CONSULTATIONS, null, 2), 'utf8');
  }
}

function readAll(): Consultation[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(CONSULTATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(consultations: Consultation[]) {
  ensureDataFile();
  fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2), 'utf8');
}

export function getConsultations(): Consultation[] {
  return readAll();
}

export function findConsultationById(id: string): Consultation | undefined {
  return readAll().find((c) => c.id === id);
}

export function findConsultationsByClientId(clientId: string): Consultation[] {
  return readAll().filter((c) => c.clientId === clientId);
}

export function findConsultationsByTherapistId(therapistId: string): Consultation[] {
  return readAll().filter((c) => c.therapistId === therapistId);
}

export function addConsultation(consultation: Consultation): Consultation {
  const consultations = readAll();
  consultations.push(consultation);
  writeAll(consultations);
  return consultation;
}

export function updateConsultation(id: string, updates: Partial<Consultation>): Consultation | undefined {
  const consultations = readAll();
  const idx = consultations.findIndex((c) => c.id === id);
  if (idx >= 0) {
    consultations[idx] = { ...consultations[idx], ...updates };
    writeAll(consultations);
    return consultations[idx];
  }
  return undefined;
}

export { Consultation, ConsultationStatus };
