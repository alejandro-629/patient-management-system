import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const BCRYPT_ROUNDS = 10;
const PATIENT_COUNT = 40;

const FIRST_NAMES = [
  'Olivia',
  'Liam',
  'Emma',
  'Noah',
  'Ava',
  'Mateo',
  'Sofia',
  'Lucas',
  'Mia',
  'Ethan',
  'Isabella',
  'Amir',
  'Chloe',
  'Kenji',
  'Zara',
  'Diego',
  'Hannah',
  'Omar',
  'Priya',
  'Jonas',
];
const LAST_NAMES = [
  'Anderson',
  'Brooks',
  'Castillo',
  'Dubois',
  'Evans',
  'Fischer',
  'Garcia',
  'Hughes',
  'Ito',
  'Johansson',
  'Khan',
  'Lopez',
  'Moreau',
  'Nakamura',
  'Okafor',
  'Patel',
  'Quinn',
  'Rossi',
  'Silva',
  'Tanaka',
];

function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) throw new Error('pick() called on an empty list');
  return item;
}

function buildPatients(createdById: string) {
  return Array.from({ length: PATIENT_COUNT }, (_, i) => {
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(
      LAST_NAMES,
      i * 7 + 3 + Math.floor(i / FIRST_NAMES.length),
    );
    return {
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${i + 1}@example.com`.toLowerCase(),
      phoneNumber: `+1 555 01${String(i).padStart(2, '0')}`,
      dob: new Date(
        Date.UTC(1945 + ((i * 37) % 62), i % 12, ((i * 11) % 28) + 1),
      ),
      createdById,
    };
  });
}

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const users = [
      {
        email: 'admin@demo.com',
        role: Role.ADMIN,
        password: process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin123!',
      },
      {
        email: 'user@demo.com',
        role: Role.USER,
        password: process.env['SEED_USER_PASSWORD'] ?? 'User123!',
      },
    ];

    const [admin] = await Promise.all(
      users.map(async ({ email, role, password }) => {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        return prisma.user.upsert({
          where: { email },
          update: { role, passwordHash },
          create: { email, role, passwordHash },
        });
      }),
    );
    if (!admin) throw new Error('Admin user was not created');

    const { count } = await prisma.patient.createMany({
      data: buildPatients(admin.id),
      skipDuplicates: true,
    });

    console.log(`Seeded ${users.length} users and ${count} new patients.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
