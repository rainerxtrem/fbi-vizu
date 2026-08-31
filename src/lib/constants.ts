// UI-facing labels, colors and option lists for enums.

export const AGENCY = {
  name: "Federal Investigative Agency",
  abbr: "FIA",
  baseline: "Justice. Integrity. Service.",
  division: "San Andreas Division",
  domain: "FIA.gov",
} as const;

export const INVESTIGATION_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: "Open", tone: "blue" },
  ACTIVE: { label: "Active", tone: "green" },
  SUSPENDED: { label: "Suspended", tone: "amber" },
  CLOSED: { label: "Closed", tone: "slate" },
  ARCHIVED: { label: "Archived", tone: "slate" },
};

export const PRIORITY: Record<string, { label: string; tone: string }> = {
  LOW: { label: "Low", tone: "slate" },
  MEDIUM: { label: "Medium", tone: "blue" },
  HIGH: { label: "High", tone: "amber" },
  CRITICAL: { label: "Critical", tone: "red" },
};

export const CLASSIFICATION: Record<string, { label: string; tone: string }> = {
  UNCLASSIFIED: { label: "Unclassified", tone: "slate" },
  RESTRICTED: { label: "Restricted", tone: "blue" },
  CONFIDENTIAL: { label: "Confidential", tone: "amber" },
  SECRET: { label: "Secret", tone: "red" },
};

export const MOST_WANTED_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "slate" },
  REVIEW: { label: "In Review", tone: "amber" },
  PUBLISHED: { label: "Published", tone: "green" },
  CAPTURED: { label: "Captured", tone: "blue" },
  LOCATED: { label: "Located", tone: "blue" },
  ARCHIVED: { label: "Archived", tone: "slate" },
};

export const MOST_WANTED_STATUS_FLOW = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "CAPTURED",
  "LOCATED",
  "ARCHIVED",
] as const;

export const DANGER_LEVEL: Record<string, { label: string; tone: string }> = {
  LOW: { label: "Low", tone: "slate" },
  MODERATE: { label: "Moderate", tone: "amber" },
  HIGH: { label: "High", tone: "red" },
  EXTREME: { label: "Extreme", tone: "red" },
};

export const MOST_WANTED_CATEGORY: Record<string, string> = {
  MOST_WANTED: "Most Wanted",
  FUGITIVE: "Fugitives",
  ORGANIZED_CRIME: "Organized Crime",
  VIOLENT_CRIME: "Violent Crime",
  TERRORISM: "Terrorism",
  CYBER_CRIME: "Cyber Crime",
  DRUG_TRAFFICKING: "Drug Trafficking",
  WEAPONS: "Weapons",
  FINANCIAL_CRIME: "Financial Crime",
  MISSING_PERSON: "Missing Persons",
  SEEKING_INFORMATION: "Seeking Information",
};

export const MOST_WANTED_FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "MOST_WANTED", label: "Most Wanted" },
  { key: "FUGITIVE", label: "Fugitives" },
  { key: "ORGANIZED_CRIME", label: "Organized Crime" },
  { key: "VIOLENT_CRIME", label: "Violent Crime" },
  { key: "TERRORISM", label: "Terrorism" },
  { key: "CYBER_CRIME", label: "Cyber Crime" },
  { key: "DRUG_TRAFFICKING", label: "Drug Trafficking" },
  { key: "WEAPONS", label: "Weapons" },
  { key: "FINANCIAL_CRIME", label: "Financial Crime" },
  { key: "MISSING_PERSON", label: "Missing Persons" },
  { key: "SEEKING_INFORMATION", label: "Seeking Information" },
];

export const APPLICATION_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: "Submitted", tone: "blue" },
  UNDER_REVIEW: { label: "Under Review", tone: "amber" },
  INTERVIEW: { label: "Interview", tone: "amber" },
  BACKGROUND_CHECK: { label: "Background Check", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
  WITHDRAWN: { label: "Withdrawn", tone: "slate" },
};

export const APPLICATION_POSITION: Record<string, string> = {
  SPECIAL_AGENT: "Special Agent",
  INTELLIGENCE_ANALYST: "Intelligence Analyst",
  CRIME_ANALYST: "Crime Analyst",
  TACTICAL_AGENT: "Tactical Agent",
  CYBERCRIME_SPECIALIST: "Cybercrime Specialist",
  FORENSIC_SPECIALIST: "Forensic Specialist",
  ADMINISTRATIVE_STAFF: "Administrative Staff",
};

export const TIP_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: "New", tone: "red" },
  REVIEWING: { label: "Reviewing", tone: "amber" },
  ASSIGNED: { label: "Assigned", tone: "blue" },
  ACTIONED: { label: "Actioned", tone: "green" },
  CLOSED: { label: "Closed", tone: "slate" },
  ARCHIVED: { label: "Archived", tone: "slate" },
};

export const NEWS_CATEGORY: Record<string, string> = {
  PRESS_RELEASE: "Press Releases",
  CASE_UPDATE: "Case Updates",
  PUBLIC_NOTICE: "Public Notices",
  AGENCY_NEWS: "Agency News",
  RECRUITMENT: "Recruitment",
  COMMUNITY: "Community",
};

export const EVIDENCE_TYPE: Record<string, string> = {
  PHYSICAL: "Physical",
  DIGITAL: "Digital",
  DOCUMENT: "Document",
  PHOTO: "Photograph",
  VIDEO: "Video",
  AUDIO: "Audio",
  FIREARM: "Firearm",
  NARCOTIC: "Narcotic",
  FINANCIAL: "Financial",
  BIOLOGICAL: "Biological",
  OTHER: "Other",
};

export const WARRANT_STATUS: Record<string, { label: string; tone: string }> = {
  REQUESTED: { label: "Requested", tone: "amber" },
  APPROVED: { label: "Approved", tone: "blue" },
  ACTIVE: { label: "Active", tone: "green" },
  EXECUTED: { label: "Executed", tone: "slate" },
  EXPIRED: { label: "Expired", tone: "slate" },
  DENIED: { label: "Denied", tone: "red" },
};

export const RISK_LEVEL: Record<string, { label: string; tone: string }> = {
  LOW: { label: "Low", tone: "slate" },
  MEDIUM: { label: "Medium", tone: "blue" },
  HIGH: { label: "High", tone: "amber" },
  EXTREME: { label: "Extreme", tone: "red" },
};

export const PERSON_ROLE: Record<string, string> = {
  SUSPECT: "Suspect",
  VICTIM: "Victim",
  WITNESS: "Witness",
  ASSOCIATE: "Associate",
  PERSON_OF_INTEREST: "Person of Interest",
};

export const FEDERAL_CRIMES = [
  "Organized Crime",
  "First Degree Murder",
  "Second Degree Murder",
  "Kidnapping",
  "Armed Robbery",
  "Drug Trafficking",
  "Weapons Trafficking",
  "Public Corruption",
  "Money Laundering",
  "Cybercrime",
  "Terrorism",
  "Financial Fraud",
  "Racketeering",
  "Extortion",
  "Conspiracy",
  "Obstruction of Justice",
  "Human Trafficking",
  "Bank Robbery",
  "Wire Fraud",
  "Bribery",
];
