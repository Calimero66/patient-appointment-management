import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Standard Specialties
  const standardSpecialties = [
    { name: "General Practitioner", description: "Primary medical evaluation and care" },
    { name: "Dentist", description: "Dental health, cleaning, surgery and oral care" },
    { name: "Cardiologist", description: "Heart and cardiovascular system care" },
    { name: "Pediatrician", description: "Medical care for infants, children, and adolescents" },
    { name: "Dermatologist", description: "Skin, hair, and nail health specialist" },
    { name: "Ophthalmologist", description: "Eye and vision care specialist" },
    { name: "Gynecologist", description: "Women's reproductive health and obstetrics" },
    { name: "Neurologist", description: "Brain, nerves, and spinal cord care" },
    { name: "Orthopedist", description: "Bones, joints, ligaments, and tendons care" },
    { name: "ENT Specialist", description: "Ear, nose, and throat disorders" },
  ];

  for (const s of standardSpecialties) {
    await prisma.specialty.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: { name: s.name, description: s.description, isActive: true },
    });
  }
  console.log("Specialties seeded successfully!");

  // 2. Create Super Admin
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

  // Helper to get specialty id by name
  const getSpecialtyId = async (name: string): Promise<number | undefined> => {
    const s = await prisma.specialty.findUnique({ where: { name } });
    return s?.id;
  };

  // 3. Create Doctors with Specialized Roles
  const doc1 = await prisma.user.upsert({
    where: { email: "doctor1@clinic.com" },
    update: { role: "DOCTOR", bio: "Cardiologist", specialtyId: await getSpecialtyId("Cardiologist") },
    create: {
      email: "doctor1@clinic.com",
      passwordHash,
      firstName: "Sophie",
      lastName: "Martin",
      role: "DOCTOR",
      licenseNumber: "MED-7701",
      bio: "Cardiologist",
      specialtyId: await getSpecialtyId("Cardiologist"),
      isActive: true,
    },
  });

  const doc2 = await prisma.user.upsert({
    where: { email: "doctor2@clinic.com" },
    update: { role: "DOCTOR", bio: "Dentist", specialtyId: await getSpecialtyId("Dentist") },
    create: {
      email: "doctor2@clinic.com",
      passwordHash,
      firstName: "Marc",
      lastName: "Bernard",
      role: "DOCTOR",
      licenseNumber: "MED-8802",
      bio: "Dentist",
      specialtyId: await getSpecialtyId("Dentist"),
      isActive: true,
    },
  });

  const doc3 = await prisma.user.upsert({
    where: { email: "doctor.general@clinic.com" },
    update: { role: "DOCTOR", bio: "General Practitioner", specialtyId: await getSpecialtyId("General Practitioner") },
    create: {
      email: "doctor.general@clinic.com",
      passwordHash,
      firstName: "Yassine",
      lastName: "Alami",
      role: "DOCTOR",
      licenseNumber: "MED-9011",
      bio: "General Practitioner",
      specialtyId: await getSpecialtyId("General Practitioner"),
      isActive: true,
    },
  });

  const doc4 = await prisma.user.upsert({
    where: { email: "doctor.pediatre@clinic.com" },
    update: { role: "DOCTOR", bio: "Pediatrician", specialtyId: await getSpecialtyId("Pediatrician") },
    create: {
      email: "doctor.pediatre@clinic.com",
      passwordHash,
      firstName: "Amina",
      lastName: "Mansouri",
      role: "DOCTOR",
      licenseNumber: "MED-9022",
      bio: "Pediatrician",
      specialtyId: await getSpecialtyId("Pediatrician"),
      isActive: true,
    },
  });

  const doc5 = await prisma.user.upsert({
    where: { email: "doctor.derma@clinic.com" },
    update: { role: "DOCTOR", bio: "Dermatologist", specialtyId: await getSpecialtyId("Dermatologist") },
    create: {
      email: "doctor.derma@clinic.com",
      passwordHash,
      firstName: "Karim",
      lastName: "Benjelloun",
      role: "DOCTOR",
      licenseNumber: "MED-9033",
      bio: "Dermatologist",
      specialtyId: await getSpecialtyId("Dermatologist"),
      isActive: true,
    },
  });
  console.log("Doctors seeded with specialties:", doc1.email, doc2.email, doc3.email, doc4.email, doc5.email);

  // 4. Create Establishment Admin
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
        establishmentId: est1.id,
        userId: doc2.id,
      },
    },
    update: {},
    create: {
      establishmentId: est1.id,
      userId: doc2.id,
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

  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est1.id,
        userId: doc3.id,
      },
    },
    update: {},
    create: {
      establishmentId: est1.id,
      userId: doc3.id,
      role: "DOCTOR",
    },
  });

  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est2.id,
        userId: doc4.id,
      },
    },
    update: {},
    create: {
      establishmentId: est2.id,
      userId: doc4.id,
      role: "DOCTOR",
    },
  });

  await prisma.establishmentUser.upsert({
    where: {
      establishmentId_userId: {
        establishmentId: est1.id,
        userId: doc5.id,
      },
    },
    update: {},
    create: {
      establishmentId: est1.id,
      userId: doc5.id,
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
