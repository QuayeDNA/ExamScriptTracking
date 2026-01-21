import { PrismaClient, IncidentType } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedTemplate {
  type: IncidentType;
  title: string;
  description: string;
}

/**
 * Default incident templates to seed the database
 */
const DEFAULT_INCIDENT_TEMPLATES: SeedTemplate[] = [
  // MALPRACTICE
  {
    type: "MALPRACTICE",
    title: "Student caught cheating during examination",
    description: "A student was observed attempting to cheat during the examination by looking at another student's paper or using unauthorized materials.",
  },
  {
    type: "MALPRACTICE",
    title: "Unauthorized communication between students",
    description: "Students were observed communicating with each other during the examination, potentially sharing answers or information.",
  },
  {
    type: "MALPRACTICE",
    title: "Student using mobile phone during examination",
    description: "A student was found using a mobile phone during the examination, which is strictly prohibited.",
  },
  {
    type: "MALPRACTICE",
    title: "Student impersonation suspected",
    description: "There are suspicions that a student may be impersonating another student to take the examination.",
  },
  {
    type: "MALPRACTICE",
    title: "Suspicious early submission with identical answers",
    description: "Multiple students submitted their papers unusually early with identical or very similar answers, raising concerns about collusion.",
  },

  // HEALTH_ISSUE
  {
    type: "HEALTH_ISSUE",
    title: "Student taken ill during examination",
    description: "A student became unwell during the examination and required medical attention or had to leave the venue.",
  },
  {
    type: "HEALTH_ISSUE",
    title: "Student reports illness before examination",
    description: "A student reported being ill before the start of the examination and requested special accommodations or deferral.",
  },

  // EXAM_DAMAGE
  {
    type: "EXAM_DAMAGE",
    title: "Examination script damaged by student",
    description: "A student's examination script was damaged, either intentionally or accidentally, affecting its readability.",
  },
  {
    type: "EXAM_DAMAGE",
    title: "Script damaged during transport",
    description: "The examination script was damaged during transportation between examination venues or storage locations.",
  },
  {
    type: "EXAM_DAMAGE",
    title: "Script affected by environmental conditions",
    description: "The examination script was damaged due to environmental factors such as water, fire, or extreme temperatures.",
  },

  // EQUIPMENT_FAILURE
  {
    type: "EQUIPMENT_FAILURE",
    title: "Computer malfunction during examination",
    description: "A computer or electronic device malfunctioned during the examination, affecting the student's ability to complete the exam.",
  },
  {
    type: "EQUIPMENT_FAILURE",
    title: "Projector or display equipment failure",
    description: "Audio/visual equipment failed during the examination, affecting the presentation of exam questions or instructions.",
  },

  // DISRUPTION
  {
    type: "DISRUPTION",
    title: "External noise disrupting examination",
    description: "External noise from construction, traffic, or other sources disrupted the examination environment.",
  },
  {
    type: "DISRUPTION",
    title: "Power outage during examination",
    description: "A power outage occurred during the examination, temporarily halting the exam process.",
  },

  // SECURITY_BREACH
  {
    type: "SECURITY_BREACH",
    title: "Unauthorized access to examination materials",
    description: "Unauthorized personnel gained access to examination materials or the examination venue.",
  },
  {
    type: "SECURITY_BREACH",
    title: "Examination paper leak suspected",
    description: "There are suspicions that examination questions or papers were leaked before the scheduled examination time.",
  },

  // PROCEDURAL_VIOLATION
  {
    type: "PROCEDURAL_VIOLATION",
    title: "Incorrect examination procedures followed",
    description: "Examination procedures were not followed correctly, potentially affecting the validity of the examination.",
  },
  {
    type: "PROCEDURAL_VIOLATION",
    title: "Timing irregularities in examination",
    description: "There were irregularities in the timing of the examination, such as starting late or finishing early without authorization.",
  },

  // OTHER
  {
    type: "OTHER",
    title: "Technical issue during examination",
    description: "A technical issue occurred during the examination that affected the smooth conduct of the exam.",
  },
  {
    type: "OTHER",
    title: "Issue with examination supervisor/invigilator",
    description: "There was an issue with the examination supervisor or invigilator that affected the examination process.",
  },
];

export async function seedIncidentTemplates() {
  console.log("🌱 Seeding incident templates...");

  const createdTemplates = [];

  for (const templateData of DEFAULT_INCIDENT_TEMPLATES) {
    const template = await prisma.incidentTemplate.upsert({
      where: {
        type_title: {
          type: templateData.type,
          title: templateData.title,
        },
      },
      update: {
        description: templateData.description,
      },
      create: {
        type: templateData.type,
        title: templateData.title,
        description: templateData.description,
        isDefault: true,
      },
    });

    createdTemplates.push(template);
  }

  console.log(`✅ Created ${createdTemplates.length} default incident templates`);
  return createdTemplates;
}