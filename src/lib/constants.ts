// Libellés, couleurs et listes d'options pour l'interface (français).
// Les intitulés de grades et certains termes institutionnels restent en anglais.

export const AGENCY = {
  name: "Federal Bureau of Investigation",
  abbr: "FBI",
  baseline: "Justice. Intégrité. Service.",
  division: "Division de San Andreas",
  domain: "FBI.gov",
} as const;

export const INVESTIGATION_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: "Ouverte", tone: "blue" },
  ACTIVE: { label: "Active", tone: "green" },
  SUSPENDED: { label: "Suspendue", tone: "amber" },
  CLOSED: { label: "Clôturée", tone: "slate" },
  ARCHIVED: { label: "Archivée", tone: "slate" },
};

export const PRIORITY: Record<string, { label: string; tone: string }> = {
  LOW: { label: "Faible", tone: "slate" },
  MEDIUM: { label: "Moyenne", tone: "blue" },
  HIGH: { label: "Élevée", tone: "amber" },
  CRITICAL: { label: "Critique", tone: "red" },
};

export const CLASSIFICATION: Record<string, { label: string; tone: string }> = {
  UNCLASSIFIED: { label: "Non classifié", tone: "slate" },
  RESTRICTED: { label: "Restreint", tone: "blue" },
  CONFIDENTIAL: { label: "Confidentiel", tone: "amber" },
  SECRET: { label: "Secret", tone: "red" },
};

export const MOST_WANTED_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Brouillon", tone: "slate" },
  REVIEW: { label: "En révision", tone: "amber" },
  PUBLISHED: { label: "Publié", tone: "green" },
  CAPTURED: { label: "Captured", tone: "blue" },
  LOCATED: { label: "Localisé", tone: "blue" },
  ARCHIVED: { label: "Archivé", tone: "slate" },
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
  LOW: { label: "Faible", tone: "slate" },
  MODERATE: { label: "Modéré", tone: "amber" },
  HIGH: { label: "Élevé", tone: "red" },
  EXTREME: { label: "Extrême", tone: "red" },
};

export const MOST_WANTED_CATEGORY: Record<string, string> = {
  MOST_WANTED: "Most Wanted",
  FUGITIVE: "Fugitifs",
  ORGANIZED_CRIME: "Crime organisé",
  VIOLENT_CRIME: "Crime violent",
  TERRORISM: "Terrorisme",
  CYBER_CRIME: "Cybercriminalité",
  DRUG_TRAFFICKING: "Trafic de stupéfiants",
  WEAPONS: "Trafic d'armes",
  FINANCIAL_CRIME: "Criminalité financière",
  MISSING_PERSON: "Personnes disparues",
  SEEKING_INFORMATION: "Seeking Information",
};

export const MOST_WANTED_FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "Tous" },
  { key: "MOST_WANTED", label: "Most Wanted" },
  { key: "FUGITIVE", label: "Fugitifs" },
  { key: "ORGANIZED_CRIME", label: "Crime organisé" },
  { key: "VIOLENT_CRIME", label: "Crime violent" },
  { key: "TERRORISM", label: "Terrorisme" },
  { key: "CYBER_CRIME", label: "Cybercriminalité" },
  { key: "DRUG_TRAFFICKING", label: "Trafic de stupéfiants" },
  { key: "WEAPONS", label: "Trafic d'armes" },
  { key: "FINANCIAL_CRIME", label: "Criminalité financière" },
  { key: "MISSING_PERSON", label: "Personnes disparues" },
  { key: "SEEKING_INFORMATION", label: "Seeking Information" },
];

export const APPLICATION_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: "Soumise", tone: "blue" },
  UNDER_REVIEW: { label: "En cours d'examen", tone: "amber" },
  INTERVIEW: { label: "Entretien", tone: "amber" },
  BACKGROUND_CHECK: { label: "Enquête de moralité", tone: "amber" },
  APPROVED: { label: "Approuvée", tone: "green" },
  REJECTED: { label: "Refusée", tone: "red" },
  WITHDRAWN: { label: "Retirée", tone: "slate" },
};

export const APPLICATION_POSITION: Record<string, string> = {
  SPECIAL_AGENT: "Special Agent",
  INTELLIGENCE_ANALYST: "Analyste du renseignement",
  CRIME_ANALYST: "Analyste criminel",
  TACTICAL_AGENT: "Agent tactique",
  CYBERCRIME_SPECIALIST: "Spécialiste cybercriminalité",
  FORENSIC_SPECIALIST: "Spécialiste médico-légal",
  ADMINISTRATIVE_STAFF: "Personnel administratif",
};

export const TIP_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: "Nouveau", tone: "red" },
  REVIEWING: { label: "En cours d'examen", tone: "amber" },
  ASSIGNED: { label: "Assigné", tone: "blue" },
  ACTIONED: { label: "Traité", tone: "green" },
  CLOSED: { label: "Clôturé", tone: "slate" },
  ARCHIVED: { label: "Archivé", tone: "slate" },
};

export const NEWS_CATEGORY: Record<string, string> = {
  PRESS_RELEASE: "Communiqués de presse",
  CASE_UPDATE: "Mises à jour d'enquête",
  PUBLIC_NOTICE: "Avis au public",
  AGENCY_NEWS: "Actualités de l'agence",
  RECRUITMENT: "Recrutement",
  COMMUNITY: "Communauté",
};

export const EVIDENCE_TYPE: Record<string, string> = {
  PHYSICAL: "Physique",
  DIGITAL: "Numérique",
  DOCUMENT: "Document",
  PHOTO: "Photographie",
  VIDEO: "Vidéo",
  AUDIO: "Audio",
  FIREARM: "Arme à feu",
  NARCOTIC: "Stupéfiant",
  FINANCIAL: "Financier",
  BIOLOGICAL: "Biologique",
  OTHER: "Autre",
};

export const WARRANT_STATUS: Record<string, { label: string; tone: string }> = {
  REQUESTED: { label: "Demandé", tone: "amber" },
  APPROVED: { label: "Approuvé", tone: "blue" },
  ACTIVE: { label: "Actif", tone: "green" },
  EXECUTED: { label: "Exécuté", tone: "slate" },
  EXPIRED: { label: "Expiré", tone: "slate" },
  DENIED: { label: "Refusé", tone: "red" },
};

export const RISK_LEVEL: Record<string, { label: string; tone: string }> = {
  LOW: { label: "Faible", tone: "slate" },
  MEDIUM: { label: "Moyen", tone: "blue" },
  HIGH: { label: "Élevé", tone: "amber" },
  EXTREME: { label: "Extrême", tone: "red" },
};

export const AGENT_STATUS: Record<string, string> = {
  ACTIVE: "Actif",
  ON_LEAVE: "En congé",
  SUSPENDED: "Suspendu",
  INACTIVE: "Inactif",
};

export const PERSON_ROLE: Record<string, string> = {
  SUSPECT: "Suspect",
  VICTIM: "Victime",
  WITNESS: "Témoin",
  ASSOCIATE: "Associé",
  PERSON_OF_INTEREST: "Personne d'intérêt",
};

export const FEDERAL_CRIMES = [
  "Crime organisé",
  "Meurtre au premier degré",
  "Meurtre au second degré",
  "Enlèvement",
  "Vol à main armée",
  "Trafic de stupéfiants",
  "Trafic d'armes",
  "Corruption publique",
  "Blanchiment d'argent",
  "Cybercriminalité",
  "Terrorisme",
  "Fraude financière",
  "Racket",
  "Extorsion",
  "Association de malfaiteurs",
  "Entrave à la justice",
  "Traite d'êtres humains",
  "Braquage de banque",
  "Fraude électronique",
  "Corruption",
];
