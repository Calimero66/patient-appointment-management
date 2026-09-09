import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@calimero.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "admin@calimero.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("Super Admin seeded:", admin.email);

  // 2. Create Doctors
  const doc1 = await prisma.user.upsert({
    where: { email: "doctor1@clinic.com" },
    update: { role: "DOCTOR" },
    create: {
      email: "doctor1@clinic.com",
      passwordHash,
      firstName: "Sophie",
      lastName: "Martin",
      role: "DOCTOR",
      licenseNumber: "MED-7701",
      bio: "Cardiology and Internal Medicine Specialist",
      isActive: true,
    },
  });

  const doc2 = await prisma.user.upsert({
    where: { email: "doctor2@clinic.com" },
    update: { role: "DOCTOR" },
    create: {
      email: "doctor2@clinic.com",
      passwordHash,
      firstName: "Marc",
      lastName: "Bernard",
      role: "DOCTOR",
      licenseNumber: "MED-8802",
      bio: "General Practice and Pediatrics Specialist",
      isActive: true,
    },
  });
  console.log("Doctors seeded:", doc1.email, doc2.email);

  // 3. Create Establishment Admin
  const estAdmin = await prisma.user.upsert({
    where: { email: "establishment.admin@clinic.com" },
    update: { role: "ESTABLISHMENT_ADMIN" },
    create: {
      email: "establishment.admin@clinic.com",
      passwordHash,
      firstName: "Claire",
      lastName: "Directrice",
      role: "ESTABLISHMENT_ADMIN",
      phone: "+33140009988",
      isActive: true,
    },
  });
  console.log("Establishment Admin seeded:", estAdmin.email);

  // 4. Create Patient
  const patient = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      email: "patient@example.com",
      passwordHash,
      firstName: "Alice",
      lastName: "Dubois",
      role: "PATIENT",
      phone: "+33611223344",
      isActive: true,
    },
  });
  console.log("Patient seeded:", patient.email);

  // 4. Create Initial Establishments
  const est1 = await prisma.establishment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Hopital Central Paris",
      type: "Hospital",
      address: "15 Boulevard Saint-Germain",
      city: "Paris",
      phone: "+33140001122",
      email: "paris@hopital-central.fr",
      isActive: true,
    },
  });

  const est2 = await prisma.establishment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Clinique Bellecour",
      type: "Clinic",
      address: "42 Place Bellecour",
      city: "Lyon",
      phone: "+33478003344",
      email: "contact@clinique-bellecour.fr",
      isActive: true,
    },
  });
  console.log("Establishments seeded:", est1.name, est2.name);

  // 6. Link Establishment Admin & Doctors to Establishments
  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est1.id,
        userId: estAdmin.id,
      },
    },
    update: {},
    create: {
      establishmentId: est1.id,
      userId: estAdmin.id,
      role: "ADMIN",
    },
  });

  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est1.id,
        userId: doc1.id,
      },
    },
    update: {},
    create: {
      establishmentId: est1.id,
      userId: doc1.id,
      role: "DOCTOR",
    },
  });

  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est2.id,
        userId: doc2.id,
      },
    },
    update: {},
    create: {
      establishmentId: est2.id,
      userId: doc2.id,
      role: "DOCTOR",
    },
  });

  // 6. Create Appointment Type
  const defaultType = await prisma.appointmentType.findFirst();
  if (!defaultType) {
    await prisma.appointmentType.create({
      data: {
        name: "General Consultation",
        description: "Standard medical consultation and evaluation",
        durationMinutes: 30,
        price: 50.0,
        isActive: true,
      },
    });
  }
  console.log("Appointment types verified.");

  console.log("Database seeding completed successfully! ✨");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
