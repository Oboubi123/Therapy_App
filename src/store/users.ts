import fs from 'fs';
import path from 'path';
import { User, UserRole, USERS as SEED_USERS } from '../models/user';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(SEED_USERS, null, 2), 'utf8');
  }
}

function readAll(): User[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(users: User[]) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function getUsers(): User[] {
  return readAll();
}

export function findUserByEmail(email: string): User | undefined {
  return readAll().find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return readAll().find((u) => u.id === id);
}

export function addUser(user: User): User {
  const users = readAll();
  users.push(user);
  writeAll(users);
  return user;
}

export function upsertUser(user: User): User {
  const users = readAll();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  writeAll(users);
  return user;
}

export { User, UserRole };



