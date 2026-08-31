import { z } from "zod";

const str = (max = 5000) => z.string().trim().max(max);
const optionalStr = (max = 5000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const tipSchema = z.object({
  anonymous: z.boolean().default(false),
  name: optionalStr(200),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  phone: optionalStr(50),
  subject: str(200).min(3, "L'objet est requis"),
  location: optionalStr(300),
  incidentDate: optionalStr(40),
  description: str(8000).min(10, "Merci de décrire les informations dont vous disposez"),
  mostWantedId: optionalStr(40),
  fileUrl: optionalStr(500),
});

export const applicationSchema = z.object({
  firstName: str(120).min(1),
  lastName: str(120).min(1),
  dob: optionalStr(40),
  phone: str(50).min(3),
  email: z.string().trim().email().max(200),
  address: optionalStr(300),
  city: optionalStr(120),
  state: optionalStr(120),
  zip: optionalStr(20),
  currentOccupation: optionalStr(200),
  priorLeExperience: optionalStr(4000),
  militaryExperience: optionalStr(4000),
  education: optionalStr(2000),
  certifications: optionalStr(2000),
  position: z.enum([
    "SPECIAL_AGENT",
    "INTELLIGENCE_ANALYST",
    "CRIME_ANALYST",
    "TACTICAL_AGENT",
    "CYBERCRIME_SPECIALIST",
    "FORENSIC_SPECIALIST",
    "ADMINISTRATIVE_STAFF",
  ]),
  whyJoin: optionalStr(4000),
  whyGoodCandidate: optionalStr(4000),
  difficultDecision: optionalStr(4000),
  pressureExperience: optionalStr(4000),
  resumeUrl: optionalStr(500),
  idUrl: optionalStr(500),
  certUrl: optionalStr(500),
  additionalUrl: optionalStr(500),
  certified: z.literal(true, {
    errorMap: () => ({ message: "Vous devez certifier l'exactitude des informations." }),
  }),
});

export const investigationCreateSchema = z.object({
  title: str(200).min(3),
  caseNumber: optionalStr(40),
  classification: z
    .enum(["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "SECRET"])
    .default("UNCLASSIFIED"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z
    .enum(["OPEN", "ACTIVE", "SUSPENDED", "CLOSED", "ARCHIVED"])
    .default("OPEN"),
  description: str(20000).min(10),
  leadAgentId: optionalStr(40),
  assignedAgentIds: z.array(z.string()).default([]),
  fieldOfficeId: optionalStr(40),
  division: optionalStr(200),
  unit: optionalStr(200),
  taskForce: optionalStr(200),
  incidentDate: optionalStr(40),
  incidentLocation: optionalStr(300),
  jurisdiction: optionalStr(200),
  charges: z.array(z.string()).default([]),
  suspects: z.array(z.string()).default([]),
  victims: z.array(z.string()).default([]),
  witnesses: z.array(z.string()).default([]),
  notes: optionalStr(20000),
});

export const investigationUpdateSchema = investigationCreateSchema.partial().extend({
  isPublic: z.boolean().optional(),
});

export const noteSchema = z.object({
  body: str(20000).min(1),
});

export const timelineEventSchema = z.object({
  message: str(2000).min(1),
  type: z.string().default("CUSTOM"),
  occurredAt: optionalStr(40),
});

export const personSchema = z.object({
  fullName: str(200).min(2),
  alias: optionalStr(200),
  dob: optionalStr(40),
  gender: optionalStr(40),
  photoUrl: optionalStr(500),
  description: optionalStr(8000),
  knownAddresses: optionalStr(2000),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]).default("LOW"),
  criminalHistory: optionalStr(8000),
  notes: optionalStr(8000),
});

const PERSON_ROLE_ENUM = z.enum([
  "SUSPECT",
  "VICTIM",
  "WITNESS",
  "ASSOCIATE",
  "PERSON_OF_INTEREST",
]);

export const investigationPersonSchema = z
  .object({
    personId: optionalStr(40),
    fullName: optionalStr(200),
    role: PERSON_ROLE_ENUM.default("SUSPECT"),
    notes: optionalStr(2000),
  })
  .refine((d) => d.personId || (d.fullName && d.fullName.length >= 2), {
    message: "Sélectionnez une personne existante ou saisissez un nom.",
  });

const WARRANT_TYPE_ENUM = z.enum(["ARREST", "SEARCH", "SURVEILLANCE", "SEIZURE"]);
const WARRANT_STATUS_ENUM = z.enum([
  "REQUESTED",
  "APPROVED",
  "ACTIVE",
  "EXECUTED",
  "EXPIRED",
  "DENIED",
]);

export const warrantCreateSchema = z.object({
  investigationId: str(40).min(1),
  type: WARRANT_TYPE_ENUM.default("ARREST"),
  status: WARRANT_STATUS_ENUM.default("REQUESTED"),
  personId: optionalStr(40),
  description: optionalStr(4000),
  issuingJudge: optionalStr(200),
  issuedDate: optionalStr(40),
  expiryDate: optionalStr(40),
});

export const warrantUpdateSchema = z.object({
  type: WARRANT_TYPE_ENUM.optional(),
  status: WARRANT_STATUS_ENUM.optional(),
  personId: optionalStr(40),
  description: optionalStr(4000),
  issuingJudge: optionalStr(200),
  issuedDate: optionalStr(40),
  expiryDate: optionalStr(40),
});

export const arrestCreateSchema = z.object({
  investigationId: str(40).min(1),
  personId: str(40).min(1),
  arrestDate: optionalStr(40),
  location: optionalStr(300),
  charges: optionalStr(2000),
  notes: optionalStr(4000),
  arrestingAgentId: optionalStr(40),
});

export const arrestUpdateSchema = z.object({
  personId: optionalStr(40),
  arrestDate: optionalStr(40),
  location: optionalStr(300),
  charges: optionalStr(2000),
  notes: optionalStr(4000),
  arrestingAgentId: optionalStr(40),
});

export const evidenceSchema = z.object({
  investigationId: str(40).min(1),
  title: str(200).min(1),
  type: z
    .enum([
      "PHYSICAL",
      "DIGITAL",
      "DOCUMENT",
      "PHOTO",
      "VIDEO",
      "AUDIO",
      "FIREARM",
      "NARCOTIC",
      "FINANCIAL",
      "BIOLOGICAL",
      "OTHER",
    ])
    .default("PHYSICAL"),
  description: optionalStr(8000),
  chainOfCustody: optionalStr(4000),
  personId: optionalStr(40),
  fileUrl: optionalStr(500),
});

export const mostWantedCreateSchema = z.object({
  investigationId: optionalStr(40),
  personId: optionalStr(40),
  fullName: str(200).min(2),
  aliases: optionalStr(300),
  age: z.coerce.number().int().min(0).max(130).optional(),
  photoUrl: optionalStr(500),
  description: str(20000).min(10),
  charges: z.array(z.string()).default([]),
  reward: z.coerce.number().int().min(0).max(100_000_000).default(0),
  category: z
    .enum([
      "MOST_WANTED",
      "FUGITIVE",
      "ORGANIZED_CRIME",
      "VIOLENT_CRIME",
      "TERRORISM",
      "CYBER_CRIME",
      "DRUG_TRAFFICKING",
      "WEAPONS",
      "FINANCIAL_CRIME",
      "MISSING_PERSON",
      "SEEKING_INFORMATION",
    ])
    .default("MOST_WANTED"),
  dangerLevel: z.enum(["LOW", "MODERATE", "HIGH", "EXTREME"]).default("MODERATE"),
  lastKnownLocation: optionalStr(300),
  vehicle: optionalStr(300),
  associates: optionalStr(2000),
  knownOrganizations: optionalStr(2000),
  dateLastSeen: optionalStr(40),
  caseNumber: optionalStr(40),
  leadAgent: optionalStr(200),
});

export const mostWantedUpdateSchema = mostWantedCreateSchema.partial().extend({
  status: z
    .enum(["DRAFT", "REVIEW", "PUBLISHED", "CAPTURED", "LOCATED", "ARCHIVED"])
    .optional(),
});

export const newsSchema = z.object({
  title: str(200).min(3),
  subtitle: optionalStr(300),
  imageUrl: optionalStr(500),
  category: z
    .enum([
      "PRESS_RELEASE",
      "CASE_UPDATE",
      "PUBLIC_NOTICE",
      "AGENCY_NEWS",
      "RECRUITMENT",
      "COMMUNITY",
    ])
    .default("PRESS_RELEASE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  content: str(50000).min(10),
  relatedInvestigationId: optionalStr(40),
  relatedMostWantedId: optionalStr(40),
});

export const applicationUpdateSchema = z.object({
  status: z
    .enum([
      "SUBMITTED",
      "UNDER_REVIEW",
      "INTERVIEW",
      "BACKGROUND_CHECK",
      "APPROVED",
      "REJECTED",
      "WITHDRAWN",
    ])
    .optional(),
  assignedRecruiterId: optionalStr(40),
  notes: optionalStr(8000),
  interviewNotes: optionalStr(8000),
  backgroundCheckNotes: optionalStr(8000),
  decision: optionalStr(2000),
});

export const tipUpdateSchema = z.object({
  status: z
    .enum(["NEW", "REVIEWING", "ASSIGNED", "ACTIONED", "CLOSED", "ARCHIVED"])
    .optional(),
  assignedToId: optionalStr(40),
  investigationId: optionalStr(40),
});

export const rankChangeSchema = z.object({
  newRank: z.enum([
    "NAT",
    "SA",
    "SSA_SENIOR",
    "SSA",
    "ASAC",
    "SAC",
    "AD",
    "AEAD",
    "EAD",
    "ADD",
    "DD",
    "DIRECTOR",
  ]),
  reason: optionalStr(2000),
});

export const agentUpdateSchema = z.object({
  title: optionalStr(200),
  division: optionalStr(200),
  unit: optionalStr(200),
  status: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "INACTIVE"]).optional(),
  fieldOfficeId: optionalStr(40),
  phone: optionalStr(50),
  permissionGrants: z.array(z.string()).optional(),
  permissionRevokes: z.array(z.string()).optional(),
});
