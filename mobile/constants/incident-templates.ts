/**
 * Incident Templates Data
 * Pre-defined incident templates organized by incident type
 * Used for smart suggestions in incident reporting
 */

export interface IncidentTemplate {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  keywords: string[]; // For search matching
}

export interface IncidentTypeTemplates {
  [key: string]: IncidentTemplate[];
}

/**
 * Common incident templates organized by incident type
 */
export const INCIDENT_TEMPLATES: IncidentTypeTemplates = {
  MALPRACTICE: [
    {
      id: "malpractice-cheating",
      title: "Student caught cheating during examination",
      description:
        "A student was observed attempting to cheat during the examination by looking at another student's paper or using unauthorized materials.",
      severity: "HIGH",
      keywords: [
        "cheating",
        "copying",
        "unauthorized",
        "materials",
        "looking",
        "notes",
      ],
    },
    {
      id: "malpractice-communication",
      title: "Unauthorized communication between students",
      description:
        "Students were observed communicating with each other during the examination, potentially sharing answers or information.",
      severity: "HIGH",
      keywords: [
        "communication",
        "talking",
        "signaling",
        "passing",
        "notes",
        "whispering",
      ],
    },
    {
      id: "malpractice-phone",
      title: "Student using mobile phone during examination",
      description:
        "A student was found using a mobile phone during the examination, which is strictly prohibited.",
      severity: "CRITICAL",
      keywords: ["phone", "mobile", "cell", "device", "calling", "texting"],
    },
    {
      id: "malpractice-impersonation",
      title: "Student impersonation suspected",
      description:
        "There are suspicions that a student may be impersonating another student to take the examination.",
      severity: "CRITICAL",
      keywords: ["impersonation", "identity", "wrong", "student", "substitute"],
    },
    {
      id: "malpractice-early-submission",
      title: "Suspicious early submission with identical answers",
      description:
        "Multiple students submitted their papers unusually early with identical or very similar answers, raising concerns about collusion.",
      severity: "HIGH",
      keywords: [
        "early",
        "submission",
        "identical",
        "answers",
        "collusion",
        "similar",
      ],
    },
  ],

  MISSING_SCRIPT: [
    {
      id: "missing-script-lost",
      title: "Examination script reported missing",
      description:
        "A student's examination script cannot be located and appears to be missing from the examination venue.",
      severity: "HIGH",
      keywords: ["missing", "lost", "cannot", "find", "locate", "disappeared"],
    },
    {
      id: "missing-script-not-received",
      title: "Script not received from previous custodian",
      description:
        "The examination script was not received from the previous custodian during the transfer process.",
      severity: "MEDIUM",
      keywords: [
        "not",
        "received",
        "transfer",
        "custodian",
        "handover",
        "missing",
      ],
    },
    {
      id: "missing-script-wrong-bundle",
      title: "Script missing from examination bundle",
      description:
        "During verification, it was discovered that a script is missing from the allocated bundle of examination papers.",
      severity: "MEDIUM",
      keywords: [
        "bundle",
        "wrong",
        "count",
        "missing",
        "verification",
        "allocated",
      ],
    },
  ],

  DAMAGED_SCRIPT: [
    {
      id: "damaged-script-torn",
      title: "Examination script torn or ripped",
      description:
        "The examination script has been torn or ripped, making it difficult to read or compromising its integrity.",
      severity: "MEDIUM",
      keywords: ["torn", "ripped", "damaged", "torn", "ripped", "integrity"],
    },
    {
      id: "damaged-script-water",
      title: "Script damaged by water or liquid",
      description:
        "The examination script has been damaged by water or other liquids, making parts of it illegible.",
      severity: "MEDIUM",
      keywords: ["water", "liquid", "wet", "spilled", "illegible", "stained"],
    },
    {
      id: "damaged-script-marked",
      title: "Script marked or written on inappropriately",
      description:
        "The examination script has unauthorized markings or writing that may compromise its validity.",
      severity: "LOW",
      keywords: [
        "marked",
        "written",
        "unauthorized",
        "markings",
        "compromised",
      ],
    },
  ],

  VENUE_ISSUE: [
    {
      id: "venue-issue-capacity",
      title: "Venue capacity issue - too many/few students",
      description:
        "There is a discrepancy between the expected number of students and the venue capacity or actual attendance.",
      severity: "MEDIUM",
      keywords: [
        "capacity",
        "crowded",
        "space",
        "seats",
        "room",
        "too",
        "many",
        "few",
      ],
    },
    {
      id: "venue-issue-facilities",
      title: "Venue facilities not adequate for examination",
      description:
        "The examination venue lacks adequate facilities such as proper lighting, ventilation, or seating arrangements.",
      severity: "MEDIUM",
      keywords: [
        "facilities",
        "lighting",
        "ventilation",
        "seats",
        "desks",
        "inadequate",
      ],
    },
    {
      id: "venue-issue-disturbance",
      title: "External disturbance affecting examination",
      description:
        "External noise or disturbances from outside the venue are affecting the examination environment.",
      severity: "LOW",
      keywords: [
        "noise",
        "disturbance",
        "external",
        "loud",
        "construction",
        "traffic",
      ],
    },
    {
      id: "venue-issue-security",
      title: "Security concerns at examination venue",
      description:
        "There are security concerns at the examination venue that may compromise the integrity of the examination.",
      severity: "HIGH",
      keywords: [
        "security",
        "breach",
        "unauthorized",
        "access",
        "intruder",
        "threat",
      ],
    },
  ],

  STUDENT_ILLNESS: [
    {
      id: "student-illness-emergency",
      title: "Student taken ill during examination - medical emergency",
      description:
        "A student has fallen ill during the examination and required immediate medical attention.",
      severity: "HIGH",
      keywords: [
        "ill",
        "sick",
        "medical",
        "emergency",
        "hospital",
        "unwell",
        "fainted",
      ],
    },
    {
      id: "student-illness-mild",
      title: "Student feeling unwell but continuing examination",
      description:
        "A student reported feeling unwell but has chosen to continue with the examination.",
      severity: "LOW",
      keywords: ["unwell", "sick", "headache", "nausea", "fever", "continuing"],
    },
  ],

  COUNT_DISCREPANCY: [
    {
      id: "count-discrepancy-scripts",
      title: "Script count discrepancy",
      description:
        "There is a discrepancy between the expected number of scripts and the actual count during verification.",
      severity: "MEDIUM",
      keywords: [
        "count",
        "discrepancy",
        "missing",
        "extra",
        "verification",
        "numbers",
      ],
    },
    {
      id: "count-discrepancy-attendance",
      title: "Attendance count discrepancy",
      description:
        "There is a discrepancy between the expected student attendance and the actual number present.",
      severity: "LOW",
      keywords: [
        "attendance",
        "count",
        "present",
        "expected",
        "missing",
        "students",
      ],
    },
  ],

  LATE_SUBMISSION: [
    {
      id: "late-submission-student",
      title: "Student submitted examination late",
      description:
        "A student submitted their examination script after the allocated time had expired.",
      severity: "LOW",
      keywords: [
        "late",
        "submission",
        "overtime",
        "delayed",
        "extension",
        "time",
      ],
    },
    {
      id: "late-submission-venue",
      title: "Late submission due to venue constraints",
      description:
        "Scripts could not be submitted on time due to venue-related constraints or issues.",
      severity: "MEDIUM",
      keywords: [
        "late",
        "venue",
        "constraints",
        "logistics",
        "transport",
        "collection",
      ],
    },
  ],

  OTHER: [
    {
      id: "other-technical-issue",
      title: "Technical issue during examination",
      description:
        "A technical issue occurred during the examination that affected the smooth conduct of the exam.",
      severity: "MEDIUM",
      keywords: [
        "technical",
        "system",
        "computer",
        "software",
        "hardware",
        "glitch",
      ],
    },
    {
      id: "other-supervisor-issue",
      title: "Issue with examination supervisor/invigilator",
      description:
        "There was an issue with the examination supervisor or invigilator that affected the examination process.",
      severity: "HIGH",
      keywords: [
        "supervisor",
        "invigilator",
        "staff",
        "conduct",
        "procedure",
        "oversight",
      ],
    },
  ],
};

/**
 * Search incident templates by keywords and incident type
 */
export const searchIncidentTemplates = (
  query: string,
  incidentType?: string
): IncidentTemplate[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  let templates: IncidentTemplate[] = [];

  // If incident type is specified, search only within that type
  if (incidentType && INCIDENT_TEMPLATES[incidentType]) {
    templates = INCIDENT_TEMPLATES[incidentType];
  } else {
    // Search across all incident types
    templates = Object.values(INCIDENT_TEMPLATES).flat();
  }

  return templates.filter((template) => {
    // Search in title
    if (template.title.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in keywords
    return template.keywords.some((keyword) =>
      keyword.toLowerCase().includes(searchTerm)
    );
  });
};

/**
 * Get incident template by ID
 */
export const getIncidentTemplate = (id: string): IncidentTemplate | null => {
  for (const typeTemplates of Object.values(INCIDENT_TEMPLATES)) {
    const template = typeTemplates.find((t) => t.id === id);
    if (template) return template;
  }
  return null;
};

/**
 * Get all templates for a specific incident type
 */
export const getTemplatesForType = (
  incidentType: string
): IncidentTemplate[] => {
  return INCIDENT_TEMPLATES[incidentType] || [];
};
