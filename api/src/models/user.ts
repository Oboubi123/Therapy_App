export enum UserRole {
  Therapist = 'therapist',
  Client = 'client',
}

export interface User {
  id: string;
  email: string;
  hashed_password: string;
  role: UserRole;
}

// Added only for testing purposes
export const USERS: User[] = [
  {
    email: 'client@galaxies.dev',
    id: '7z6ydcm',
    role: UserRole.Client,
    hashed_password: '$2b$10$.MftzcPPsR5TUTYRyWGyQu9H9Fd3Q6olBlccI1qIAY3qXH7OQ.bQO', // dummy "123456"
  },
  {
    email: 'emmanuel@uenr.dev',
    id: '3c51tvo',
    role: UserRole.Therapist,
    hashed_password: '$2b$10$U6aHdY7D9g9TxZ5bQU4X4eIrDEMao6j9G8hb1UBSs1QV95Pe/QWJe', // dummy "123456"
  },
];
