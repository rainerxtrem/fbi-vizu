/* eslint-disable no-console */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PW = "Password123!";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600 * 1000);
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function main() {
  console.log("Initialisation de la base de données du FBI…");

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.rankChange.deleteMany(),
    prisma.timelineEvent.deleteMany(),
    prisma.investigationNote.deleteMany(),
    prisma.investigationCharge.deleteMany(),
    prisma.investigationPerson.deleteMany(),
    prisma.investigationVehicle.deleteMany(),
    prisma.investigationOrganization.deleteMany(),
    prisma.investigationLocation.deleteMany(),
    prisma.investigationAgent.deleteMany(),
    prisma.relatedCase.deleteMany(),
    prisma.arrest.deleteMany(),
    prisma.warrant.deleteMany(),
    prisma.evidence.deleteMany(),
    prisma.document.deleteMany(),
    prisma.tip.deleteMany(),
    prisma.news.deleteMany(),
    prisma.mostWanted.deleteMany(),
    prisma.personVehicle.deleteMany(),
    prisma.personOrganization.deleteMany(),
    prisma.application.deleteMany(),
    prisma.investigation.deleteMany(),
    prisma.person.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.charge.deleteMany(),
    prisma.fileAsset.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.user.deleteMany(),
    prisma.fieldOffice.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(PW, 12);

  // ---- Field Offices ----
  const offices = await Promise.all(
    [
      { name: "Los Santos Field Office", code: "LSFO", city: "Los Santos", address: "1 Pershing Square, Los Santos, SA 90012", phone: "(310) 555-0100", email: "losantos@fbi.gov", isHq: true },
      { name: "Blaine County Resident Agency", code: "BCRA", city: "Sandy Shores", address: "440 Alhambra Dr, Sandy Shores, SA 92277", phone: "(760) 555-0141", email: "blaine@fbi.gov", isHq: false },
      { name: "Paleto Bay Resident Agency", code: "PBRA", city: "Paleto Bay", address: "12 Paleto Blvd, Paleto Bay, SA 92110", phone: "(805) 555-0170", email: "paleto@fbi.gov", isHq: false },
      { name: "Sandy Shores Field Office", code: "SSO", city: "Sandy Shores", address: "3 Route 68, Grand Senora Desert, SA 92310", phone: "(760) 555-0199", email: "senora@fbi.gov", isHq: false },
    ].map((o) => prisma.fieldOffice.create({ data: o })),
  );
  const lsfo = offices[0];

  // ---- Admin (plateforme) ----
  await prisma.user.create({
    data: {
      email: "admin@fbi.gov",
      name: "Administrateur de la plateforme",
      passwordHash,
      isAdmin: true,
    },
  });

  // ---- Agents (les intitulés de grades restent en anglais) ----
  const agentSpecs: {
    email: string;
    name: string;
    rank: Prisma.AgentCreateInput["rank"];
    title: string;
    division: string;
    unit?: string;
    office: string;
  }[] = [
    { email: "d.reyes@fbi.gov", name: "Daniela Reyes", rank: "DIRECTOR", title: "Director du FBI", division: "Cabinet du Director", office: "LSFO" },
    { email: "m.okafor@fbi.gov", name: "Marcus Okafor", rank: "DD", title: "Deputy Director", division: "Cabinet du Director", office: "LSFO" },
    { email: "s.lindqvist@fbi.gov", name: "Sofia Lindqvist", rank: "EAD", title: "Executive Assistant Director, branche criminelle", division: "Criminal Investigative Division", office: "LSFO" },
    { email: "r.castellano@fbi.gov", name: "Rocco Castellano", rank: "AD", title: "Assistant Director, Cyber Division", division: "Cyber Division", office: "LSFO" },
    { email: "j.mercer@fbi.gov", name: "Jordan Mercer", rank: "SAC", title: "Special Agent in Charge, Los Santos", division: "Criminal Investigative Division", unit: "C-1", office: "LSFO" },
    { email: "a.novak@fbi.gov", name: "Alena Novak", rank: "ASAC", title: "Assistant Special Agent in Charge", division: "Criminal Investigative Division", unit: "C-1", office: "LSFO" },
    { email: "t.boone@fbi.gov", name: "Travis Boone", rank: "SSA", title: "Supervisory Special Agent, brigade Crime organisé", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "p.osei@fbi.gov", name: "Priya Osei", rank: "SSA", title: "Supervisory Special Agent, brigade Cyber", division: "Cyber Division", unit: "CY-2", office: "LSFO" },
    { email: "h.tanaka@fbi.gov", name: "Hana Tanaka", rank: "SSA_SENIOR", title: "Senior Special Agent", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "c.duval@fbi.gov", name: "Christophe Duval", rank: "SA", title: "Special Agent", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "k.abara@fbi.gov", name: "Kelechi Abara", rank: "SA", title: "Special Agent", division: "Cyber Division", unit: "CY-2", office: "BCRA" },
    { email: "l.romero@fbi.gov", name: "Luz Romero", rank: "SA", title: "Special Agent", division: "Criminal Investigative Division", unit: "VC-3", office: "PBRA" },
    { email: "n.frost@fbi.gov", name: "Nate Frost", rank: "NAT", title: "New Agent Trainee", division: "Training Division", office: "LSFO" },
    { email: "b.iversen@fbi.gov", name: "Brit Iversen", rank: "NAT", title: "New Agent Trainee", division: "Training Division", office: "LSFO" },
  ];

  const officeByCode: Record<string, string> = { LSFO: lsfo.id, BCRA: offices[1].id, PBRA: offices[2].id, SSO: offices[3].id };

  const agents: { id: string; name: string; rank: string }[] = [];
  for (let i = 0; i < agentSpecs.length; i++) {
    const s = agentSpecs[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash,
        agent: {
          create: {
            badgeNumber: `FBI-${1000 + i}`,
            rank: s.rank,
            title: s.title,
            division: s.division,
            unit: s.unit ?? null,
            fieldOfficeId: officeByCode[s.office],
            hireDate: daysAgo(400 + i * 120),
            phone: `(310) 555-0${200 + i}`,
          },
        },
      },
      include: { agent: true },
    });
    agents.push({ id: user.agent!.id, name: s.name, rank: s.rank });
  }
  const byName = (n: string) => agents.find((a) => a.name === n)!;

  await prisma.rankChange.create({
    data: {
      agentId: byName("Hana Tanaka").id,
      oldRank: "SA",
      newRank: "SSA_SENIOR",
      changedById: byName("Jordan Mercer").id,
      reason: "Performances remarquables et soutenues dans le dossier de racket de Vinewood.",
      createdAt: daysAgo(60),
    },
  });

  // ---- Catalogue des chefs d'accusation ----
  const chargeNames = [
    ["FIRST_DEGREE_MURDER", "Meurtre au premier degré", "Crime violent"],
    ["ARMED_ROBBERY", "Vol à main armée", "Crime violent"],
    ["KIDNAPPING", "Enlèvement", "Crime violent"],
    ["MONEY_LAUNDERING", "Blanchiment d'argent", "Criminalité financière"],
    ["RACKETEERING", "Racket (RICO)", "Crime organisé"],
    ["DRUG_TRAFFICKING", "Trafic de stupéfiants", "Stupéfiants"],
    ["WEAPONS_TRAFFICKING", "Trafic d'armes", "Armes"],
    ["WIRE_FRAUD", "Fraude électronique", "Criminalité financière"],
    ["PUBLIC_CORRUPTION", "Corruption publique", "Corruption"],
    ["COMPUTER_INTRUSION", "Intrusion informatique", "Cyber"],
    ["EXTORTION", "Extorsion", "Crime organisé"],
    ["CONSPIRACY", "Association de malfaiteurs", "Général"],
    ["BANK_ROBBERY", "Braquage de banque", "Crime violent"],
    ["TERRORISM", "Terrorisme intérieur", "Contre-terrorisme"],
  ] as const;
  const charges = await Promise.all(
    chargeNames.map(([code, title, category]) =>
      prisma.charge.create({ data: { code, title, category, severity: "Crime" } }),
    ),
  );

  // ---- Organisations ----
  const orgs = await Promise.all(
    [
      { name: "Syndicat des Vagos", type: "Gang de rue / crime organisé", description: "Réseau de distribution de stupéfiants à l'échelle de l'État." },
      { name: "Duggan Holdings", type: "Société-écran", description: "Société soupçonnée de blanchir des fonds illicites." },
      { name: "Cellule du cartel de Sandy Shores", type: "Affilié de cartel", description: "Trafic transfrontalier d'armes et de stupéfiants." },
      { name: "Équipe Redline", type: "Équipe de braqueurs", description: "Attaques de fourgons blindés et de bijouteries dans le comté de Los Santos." },
    ].map((o) => prisma.organization.create({ data: o })),
  );

  // ---- Personnes ----
  const personSpecs = [
    ["Jonathan Morrison", "Jack, Morrie", "HIGH", "Chef présumé de l'équipe Redline. Connu pour fréquenter Vinewood Hills et le Vanilla Unicorn."],
    ["Elena Vasquez", "La Sombra", "EXTREME", "Financière et exécutrice présumée du syndicat des Vagos."],
    ["Dmitri Volkov", "Le Comptable", "MEDIUM", "Gérerait les opérations de blanchiment via Duggan Holdings."],
    ["Terrence Cole", "T-Bone", "HIGH", "Spécialiste des attaques de fourgons blindés. Ancien démineur militaire."],
    ["Marisol Reyes", null, "LOW", "Témoin de la fusillade de la jetée de Del Perro."],
    ["Aiden Walsh", "Ghost", "EXTREME", "Soupçonné de trois assassinats sur commande dans le comté de Blaine."],
    ["Priscilla Nguyen", "Prax", "MEDIUM", "Spécialiste des intrusions informatiques liée à la brèche de LifeInvader."],
    ["Bobby Faulkner", "Big Bob", "MEDIUM", "Distributeur de stupéfiants de niveau intermédiaire, Sandy Shores."],
    ["Carla Mendes", null, "LOW", "Témoin coopérant — ancienne comptable de Duggan Holdings."],
    ["Viktor Petrov", "Vik", "HIGH", "Trafiquant d'armes opérant depuis le désert de Grand Senora."],
    ["Desmond Pryce", "Dez", "MEDIUM", "Chauffeur pour plusieurs coups de l'équipe Redline."],
    ["Hannah Brooks", null, "LOW", "Sœur de la victime — contact permanent pour le dossier de Paleto Bay."],
    ["Omar Haddad", "Le Courtier", "HIGH", "Intermédiaire présumé pour des cargaisons de stupéfiants inter-juridictions."],
    ["Sasha Kperov", "Snow", "EXTREME", "Serait responsable de l'attaque du convoi blindé de la Route 68."],
    ["Leon Grady", "Lucky", "MEDIUM", "Homme de main de bas niveau, coopérant dans l'affaire de racket."],
  ] as const;

  const persons = [];
  for (let i = 0; i < personSpecs.length; i++) {
    const [fullName, alias, risk, description] = personSpecs[i];
    persons.push(
      await prisma.person.create({
        data: {
          fullName,
          alias: alias ?? null,
          riskLevel: risk as Prisma.PersonCreateInput["riskLevel"],
          description,
          dob: daysAgo(9000 + i * 300),
          gender: i % 3 === 0 ? "Femme" : "Homme",
          knownAddresses: pick(["Vinewood Hills", "Sandy Shores", "Del Perro", "Paleto Bay", "Mirror Park"], i),
          criminalHistory: i % 2 === 0 ? "Condamnations antérieures pour coups et blessures et détention." : "Aucune condamnation antérieure pour crime enregistrée.",
          createdById: byName("Christophe Duval").id,
          photoUrl: `https://picsum.photos/seed/fbi-person-${i}/480/600`,
        },
      }),
    );
  }

  // ---- Enquêtes ----
  const invSpecs: {
    title: string;
    description: string;
    status: Prisma.InvestigationCreateInput["status"];
    priority: Prisma.InvestigationCreateInput["priority"];
    classification: Prisma.InvestigationCreateInput["classification"];
    lead: string;
    assigned: string[];
    chargeIdx: number[];
    suspectIdx: number[];
    isPublic: boolean;
    daysOpen: number;
  }[] = [
    {
      title: "Opération Redline — série de braquages de fourgons blindés",
      description:
        "Série coordonnée de braquages de fourgons blindés et de bijouteries dans le comté de Los Santos attribuée à une équipe connue sous le nom d'équipe Redline. Le FBI enquête en coordination avec la brigade des vols et homicides de la police de Los Santos. Au moins quatre faits, un décès et un préjudice estimé à 2,1 M$.",
      status: "ACTIVE",
      priority: "CRITICAL",
      classification: "CONFIDENTIAL",
      lead: "Travis Boone",
      assigned: ["Hana Tanaka", "Christophe Duval", "Nate Frost"],
      chargeIdx: [1, 12, 11, 0],
      suspectIdx: [0, 3, 10],
      isPublic: true,
      daysOpen: 47,
    },
    {
      title: "Entreprise de racket de Vinewood",
      description:
        "Enquête RICO de longue durée visant une entreprise criminelle organisée pratiquant l'extorsion, les jeux d'argent illégaux et le blanchiment d'argent via des établissements de vie nocturne à Vinewood et Del Perro.",
      status: "ACTIVE",
      priority: "HIGH",
      classification: "SECRET",
      lead: "Alena Novak",
      assigned: ["Travis Boone", "Hana Tanaka"],
      chargeIdx: [4, 3, 10, 11],
      suspectIdx: [1, 2, 14],
      isPublic: false,
      daysOpen: 220,
    },
    {
      title: "Brèche de données LifeInvader",
      description:
        "Intrusion non autorisée dans le réseau d'entreprise de LifeInvader ayant entraîné l'exfiltration de données d'utilisateurs. L'analyse d'attribution pointe vers une petite équipe agissant à des fins lucratives.",
      status: "OPEN",
      priority: "HIGH",
      classification: "RESTRICTED",
      lead: "Priya Osei",
      assigned: ["Kelechi Abara"],
      chargeIdx: [9, 7, 11],
      suspectIdx: [6],
      isPublic: true,
      daysOpen: 12,
    },
    {
      title: "Filière d'armes de Grand Senora",
      description:
        "Enquête sur une filière de trafic d'armes acheminant des armes à feu de qualité militaire à travers le désert de Grand Senora vers des acheteurs de Los Santos.",
      status: "ACTIVE",
      priority: "HIGH",
      classification: "CONFIDENTIAL",
      lead: "Hana Tanaka",
      assigned: ["Christophe Duval", "Luz Romero"],
      chargeIdx: [6, 11, 5],
      suspectIdx: [9, 12],
      isPublic: false,
      daysOpen: 95,
    },
    {
      title: "Attaque du convoi blindé de la Route 68",
      description:
        "Attaque armée contre un convoi blindé privé sur la Route 68 ayant fait deux blessés et entraîné le vol de fonds en transit. Armes de gros calibre utilisées ; lien possible avec la filière de Grand Senora.",
      status: "OPEN",
      priority: "CRITICAL",
      classification: "CONFIDENTIAL",
      lead: "Luz Romero",
      assigned: ["Hana Tanaka", "Christophe Duval"],
      chargeIdx: [1, 12, 6],
      suspectIdx: [13],
      isPublic: true,
      daysOpen: 6,
    },
    {
      title: "Enquête financière — Duggan Holdings",
      description:
        "Enquête de comptabilité judiciaire sur le blanchiment présumé de produits illicites via un réseau de sociétés-écrans contrôlées par Duggan Holdings.",
      status: "SUSPENDED",
      priority: "MEDIUM",
      classification: "CONFIDENTIAL",
      lead: "Priya Osei",
      assigned: ["Kelechi Abara"],
      chargeIdx: [3, 7, 11],
      suspectIdx: [2, 8],
      isPublic: false,
      daysOpen: 160,
    },
    {
      title: "Fusillade de la jetée de Del Perro",
      description:
        "Fusillade en plein jour sur la jetée de Del Perro. Un décès, probablement un assassinat ciblé lié à une dette de stupéfiants.",
      status: "ACTIVE",
      priority: "HIGH",
      classification: "RESTRICTED",
      lead: "Christophe Duval",
      assigned: ["Nate Frost", "Brit Iversen"],
      chargeIdx: [0, 11],
      suspectIdx: [5, 4],
      isPublic: true,
      daysOpen: 30,
    },
    {
      title: "Distribution de stupéfiants à Sandy Shores",
      description:
        "Enquête sur une opération de production et de distribution de méthamphétamine centrée à Sandy Shores et à portée sur tout l'État.",
      status: "ACTIVE",
      priority: "MEDIUM",
      classification: "UNCLASSIFIED",
      lead: "Luz Romero",
      assigned: ["Christophe Duval"],
      chargeIdx: [5, 11],
      suspectIdx: [7, 12],
      isPublic: true,
      daysOpen: 75,
    },
    {
      title: "Corruption publique — service des permis du comté",
      description:
        "Allégations selon lesquelles un fonctionnaire du comté aurait accepté des paiements pour accélérer la délivrance de permis de construire à des entités liées au crime organisé.",
      status: "OPEN",
      priority: "MEDIUM",
      classification: "SECRET",
      lead: "Alena Novak",
      assigned: ["Travis Boone"],
      chargeIdx: [8, 3, 11],
      suspectIdx: [2],
      isPublic: false,
      daysOpen: 20,
    },
    {
      title: "Braquage de banque à Paleto Bay",
      description:
        "Braquage de type prise de contrôle de l'agence Fleeca de Paleto Bay. Trois individus armés, aucun blessé. Enquête sur les liens avec l'équipe Redline.",
      status: "CLOSED",
      priority: "MEDIUM",
      classification: "UNCLASSIFIED",
      lead: "Travis Boone",
      assigned: ["Hana Tanaka"],
      chargeIdx: [12, 1, 11],
      suspectIdx: [3, 10],
      isPublic: true,
      daysOpen: 300,
    },
  ];

  const investigations = [];
  for (let i = 0; i < invSpecs.length; i++) {
    const s = invSpecs[i];
    const leadAgent = byName(s.lead);
    const openedAt = daysAgo(s.daysOpen);
    const inv = await prisma.investigation.create({
      data: {
        caseNumber: `FBI-2026-${String(i + 1).padStart(5, "0")}`,
        title: s.title,
        description: s.description,
        status: s.status,
        priority: s.priority,
        classification: s.classification,
        leadAgentId: leadAgent.id,
        fieldOfficeId: lsfo.id,
        division: "Criminal Investigative Division",
        unit: pick(["OC-4", "VC-3", "CY-2", "C-1"], i),
        jurisdiction: pick(["Comté de Los Santos", "Comté de Blaine", "Ensemble de l'État"], i),
        incidentLocation: pick(["Vinewood", "Sandy Shores", "Del Perro", "Paleto Bay", "Route 68"], i),
        incidentDate: daysAgo(s.daysOpen + 2),
        isPublic: s.isPublic,
        openedAt,
        closedAt: s.status === "CLOSED" ? daysAgo(10) : null,
        createdAt: openedAt,
        assignedAgents: {
          create: s.assigned
            .map((n) => agents.find((a) => a.name === n))
            .filter((a): a is NonNullable<typeof a> => Boolean(a))
            .map((a) => ({ agentId: a.id, role: "Agent affecté" })),
        },
        charges: { create: s.chargeIdx.map((ci) => ({ chargeId: charges[ci].id })) },
        persons: {
          create: s.suspectIdx.map((pi, idx) => ({
            personId: persons[pi].id,
            role: idx === 0 ? "SUSPECT" : idx === 1 ? "SUSPECT" : "WITNESS",
          })),
        },
      },
    });
    investigations.push(inv);

    const tEvents: [number, string, Prisma.TimelineEventCreateInput["type"]][] = [
      [s.daysOpen, `Enquête ouverte par ${leadAgent.name}`, "INVESTIGATION_OPENED"],
      [s.daysOpen - 2, `Mandat de perquisition approuvé pour un local lié au dossier`, "WARRANT_APPROVED"],
      [Math.max(1, s.daysOpen - 5), `Déposition de témoin enregistrée et versée au dossier`, "NOTE_ADDED"],
      [Math.max(1, s.daysOpen - 8), `Preuve physique placée sous scellés`, "EVIDENCE_ADDED"],
    ];
    for (const [d, msg, type] of tEvents) {
      await prisma.timelineEvent.create({
        data: {
          investigationId: inv.id,
          message: msg,
          type,
          actorAgentId: leadAgent.id,
          occurredAt: daysAgo(d),
        },
      });
    }

    await prisma.investigationNote.create({
      data: {
        investigationId: inv.id,
        authorId: leadAgent.id,
        body: "Évaluation initiale terminée. Coordination avec les services partenaires. Prochaine étape : réquisition des relevés financiers et ratissage pour trouver d'autres témoins.",
        createdAt: daysAgo(Math.max(1, s.daysOpen - 3)),
      },
    });

    const evCount = 1 + (i % 3);
    for (let e = 0; e < evCount; e++) {
      await prisma.evidence.create({
        data: {
          investigationId: inv.id,
          evidenceNumber: `E-${1001 + investigations.length * 3 + e}`,
          type: pick(["PHYSICAL", "DIGITAL", "PHOTO", "FIREARM", "FINANCIAL", "VIDEO"], i + e) as Prisma.EvidenceCreateInput["type"],
          title: pick(
            ["Images de vidéosurveillance — lieu des faits", "Arme à feu récupérée", "Registre financier", "Extraction de téléphone mobile", "Empreintes latentes", "Données GPS de véhicule"],
            i + e,
          ),
          description: "Recueillie et versée aux scellés dans le respect de la chaîne de possession.",
          chainOfCustody: `Recueillie par ${leadAgent.name} ; conservée à ${pick(["la chambre des scellés du LSFO", "le laboratoire régional"], e)}.`,
          collectedById: leadAgent.id,
          collectedAt: daysAgo(Math.max(1, s.daysOpen - 6 - e)),
        },
      });
    }

    await prisma.warrant.create({
      data: {
        warrantNumber: `W-2026-${String(i + 1).padStart(4, "0")}`,
        investigationId: inv.id,
        personId: persons[s.suspectIdx[0]].id,
        type: i % 3 === 0 ? "SEARCH" : "ARREST",
        status: s.status === "CLOSED" ? "EXECUTED" : "ACTIVE",
        description: "Autorisé par le tribunal fédéral de l'État de San Andreas.",
        issuingJudge: pick(["Hon. P. Alvarez", "Hon. R. Kline", "Hon. S. Whitmore"], i),
        issuedDate: daysAgo(s.daysOpen - 1),
        requestedById: leadAgent.id,
        approvedById: byName("Jordan Mercer").id,
      },
    });
  }

  await prisma.relatedCase.create({
    data: { fromId: investigations[0].id, toId: investigations[9].id, note: "Même équipe soupçonnée." },
  });
  await prisma.relatedCase.create({
    data: { fromId: investigations[3].id, toId: investigations[4].id, note: "Concordance balistique des armes." },
  });

  await prisma.arrest.create({
    data: {
      investigationId: investigations[9].id,
      personId: persons[10].id,
      arrestDate: daysAgo(14),
      location: "Paleto Bay",
      charges: "Braquage de banque, association de malfaiteurs",
      arrestingAgentId: byName("Travis Boone").id,
      notes: "Arrestation effectuée sans incident.",
    },
  });

  // ---- Most Wanted ----
  const mwSpecs = [
    { pIdx: 0, invIdx: 0, status: "PUBLISHED", danger: "HIGH", category: "VIOLENT_CRIME", reward: 50000, charges: ["Vol à main armée", "Meurtre au premier degré", "Racket (RICO)"] },
    { pIdx: 1, invIdx: 1, status: "PUBLISHED", danger: "EXTREME", category: "ORGANIZED_CRIME", reward: 100000, charges: ["Racket (RICO)", "Blanchiment d'argent", "Extorsion"] },
    { pIdx: 5, invIdx: 6, status: "PUBLISHED", danger: "EXTREME", category: "FUGITIVE", reward: 75000, charges: ["Meurtre au premier degré", "Association de malfaiteurs"] },
    { pIdx: 9, invIdx: 3, status: "PUBLISHED", danger: "HIGH", category: "WEAPONS", reward: 40000, charges: ["Trafic d'armes", "Association de malfaiteurs"] },
    { pIdx: 13, invIdx: 4, status: "PUBLISHED", danger: "EXTREME", category: "VIOLENT_CRIME", reward: 85000, charges: ["Vol à main armée", "Association de malfaiteurs", "Trafic de stupéfiants"] },
    { pIdx: 6, invIdx: 2, status: "PUBLISHED", danger: "MODERATE", category: "CYBER_CRIME", reward: 25000, charges: ["Intrusion informatique", "Fraude électronique"] },
    { pIdx: 12, invIdx: 7, status: "REVIEW", danger: "HIGH", category: "DRUG_TRAFFICKING", reward: 30000, charges: ["Trafic de stupéfiants", "Association de malfaiteurs"] },
    { pIdx: 3, invIdx: 9, status: "CAPTURED", danger: "HIGH", category: "VIOLENT_CRIME", reward: 20000, charges: ["Braquage de banque", "Vol à main armée"] },
  ] as const;

  for (let i = 0; i < mwSpecs.length; i++) {
    const m = mwSpecs[i];
    const person = persons[m.pIdx];
    const inv = investigations[m.invIdx];
    const creator = byName("Christophe Duval");
    await prisma.mostWanted.create({
      data: {
        publicId: `MW-${String(i + 1).padStart(4, "0")}`,
        status: m.status as Prisma.MostWantedCreateInput["status"],
        category: m.category as Prisma.MostWantedCreateInput["category"],
        dangerLevel: m.danger as Prisma.MostWantedCreateInput["dangerLevel"],
        fullName: person.fullName,
        aliases: person.alias,
        age: 25 + i * 3,
        photoUrl: person.photoUrl,
        description: `${person.fullName} est recherché par le Federal Bureau of Investigation dans le cadre du dossier « ${inv.title} ». ${person.description} Le sujet doit être considéré comme armé et dangereux. N'essayez pas de l'appréhender. Toute personne détenant des informations est priée de contacter le FBI ou son service de police local.`,
        charges: [...m.charges],
        reward: m.reward,
        lastKnownLocation: pick(["Vinewood Hills, Los Santos", "Sandy Shores, comté de Blaine", "Del Perro, Los Santos", "Paleto Bay"], i),
        vehicle: pick(["Bravado Buffalo noire, plaque 46XYZ", "Declasse Sabre grise", "Fourgon blanc sans plaque", "Inconnu"], i),
        associates: "Connu pour fréquenter des membres de l'équipe faisant l'objet de l'enquête.",
        knownOrganizations: pick(["Équipe Redline", "Syndicat des Vagos", "Cellule du cartel de Sandy Shores"], i),
        dateLastSeen: daysAgo(10 + i * 4),
        caseNumber: inv.caseNumber,
        leadAgency: "Federal Bureau of Investigation",
        leadAgent: `Agent ${byName(invSpecs[m.invIdx].lead).name}`,
        openedDate: inv.openedAt,
        personId: person.id,
        investigationId: inv.id,
        createdById: creator.id,
        reviewedById: m.status === "PUBLISHED" || m.status === "CAPTURED" ? byName("Travis Boone").id : null,
        publishedAt: m.status === "PUBLISHED" || m.status === "CAPTURED" ? daysAgo(8 + i * 3) : null,
        capturedAt: m.status === "CAPTURED" ? daysAgo(3) : null,
      },
    });
  }

  // ---- Actualités ----
  const newsSpecs = [
    ["PRESS_RELEASE", "Le FBI annonce des poursuites dans l'affaire de racket de Vinewood", "Une enquête de plusieurs années vise l'extorsion et le blanchiment d'argent dans la vie nocturne de Los Santos."],
    ["CASE_UPDATE", "Point de situation : attaque du convoi blindé de la Route 68", "Les enquêteurs diffusent le signalement d'un véhicule et lancent un appel à témoins."],
    ["PUBLIC_NOTICE", "Le FBI recherche des informations sur la fusillade de la jetée de Del Perro", "L'aide du public est sollicitée pour identifier les responsables."],
    ["AGENCY_NEWS", "Le FBI ouvre une nouvelle Resident Agency à Paleto Bay", "Une présence renforcée améliore les délais d'intervention dans le nord de San Andreas."],
    ["RECRUITMENT", "Recrutement : Special Agents et analystes du renseignement", "Le FBI accepte les candidatures pour la prochaine promotion de l'académie."],
    ["COMMUNITY", "Le FBI organise un forum de sécurité à Sandy Shores", "Des Agents ont échangé avec les habitants sur les ressources de prévention de la délinquance."],
    ["PRESS_RELEASE", "Un suspect du braquage de Paleto Bay placé en garde à vue", "Un individu arrêté ; l'enquête sur les autres suspects se poursuit."],
    ["CASE_UPDATE", "Brèche de données LifeInvader : ce que les utilisateurs doivent savoir", "Le FBI détaille les mesures que les utilisateurs concernés peuvent prendre pour protéger leurs comptes."],
    ["PUBLIC_NOTICE", "Récompense augmentée pour toute information sur Aiden Walsh", "La récompense pour toute information menant à une arrestation est désormais de 75 000 $."],
    ["AGENCY_NEWS", "Le Director Reyes présente l'évaluation annuelle des menaces", "Le crime organisé et les intrusions informatiques demeurent les principales priorités fédérales de l'État."],
  ] as const;
  for (let i = 0; i < newsSpecs.length; i++) {
    const [category, title, subtitle] = newsSpecs[i];
    await prisma.news.create({
      data: {
        slug: slugify(title) || `article-${i + 1}`,
        title,
        subtitle,
        category: category as Prisma.NewsCreateInput["category"],
        status: "PUBLISHED",
        imageUrl: `https://picsum.photos/seed/fbi-news-${i}/1200/675`,
        content: `${subtitle}\n\nLOS SANTOS — Le Federal Bureau of Investigation a fait le point aujourd'hui sur une affaire d'intérêt public. « Notre engagement est la sécurité de chaque habitant de San Andreas », a déclaré un porte-parole. « Nous continuerons à traiter ces affaires avec intégrité et détermination. »\n\nLe FBI invite toute personne détenant des informations à soumettre un renseignement sur FBI.gov ou à contacter son Field Office le plus proche. Les renseignements peuvent être transmis de manière anonyme.\n\nCommuniqué de presse fictif pour un serveur GTA RP.`,
        authorId: byName("Jordan Mercer").id,
        publishedAt: daysAgo(2 + i * 3),
        relatedInvestigationId: i < investigations.length ? investigations[i % investigations.length].id : null,
      },
    });
  }

  // ---- Candidatures ----
  const appSpecs = [
    ["Grace", "Holloway", "SPECIAL_AGENT", "SUBMITTED"],
    ["Marcus", "Bell", "INTELLIGENCE_ANALYST", "UNDER_REVIEW"],
    ["Priya", "Raman", "CYBERCRIME_SPECIALIST", "INTERVIEW"],
    ["Tyler", "Novak", "TACTICAL_AGENT", "BACKGROUND_CHECK"],
    ["Dana", "Whitfield", "FORENSIC_SPECIALIST", "REJECTED"],
  ] as const;
  for (let i = 0; i < appSpecs.length; i++) {
    const [firstName, lastName, position, status] = appSpecs[i];
    await prisma.application.create({
      data: {
        publicId: `APP-${String(i + 1).padStart(4, "0")}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `(310) 555-1${String(i).padStart(3, "0")}`,
        city: pick(["Los Santos", "Sandy Shores", "Paleto Bay"], i),
        state: "San Andreas",
        zip: "90001",
        position: position as Prisma.ApplicationCreateInput["position"],
        status: status as Prisma.ApplicationCreateInput["status"],
        currentOccupation: pick(["Officier de police", "Analyste de données", "Ingénieure logiciel", "Ambulancier", "Technicien de laboratoire"], i),
        priorLeExperience: i % 2 === 0 ? "4 ans au sein de la police de Los Santos." : "Aucune.",
        militaryExperience: i % 3 === 0 ? "6 ans, Garde nationale de San Andreas." : "Aucune.",
        education: "Licence en criminologie, Université de San Andreas.",
        whyJoin: "Je veux travailler sur les affaires qui comptent le plus et protéger ma communauté au niveau fédéral.",
        whyGoodCandidate: "Rigueur, esprit d'analyse et sang-froid sous pression.",
        difficultDecision: "J'ai dû un jour signaler un collègue pour faute malgré des liens personnels. C'était la bonne décision.",
        pressureExperience: "J'ai régulièrement géré des incidents à rythme soutenu exigeant un jugement rapide et sûr.",
        certified: true,
        assignedRecruiterId: status !== "SUBMITTED" ? byName("Alena Novak").id : null,
        createdAt: daysAgo(3 + i * 4),
      },
    });
  }

  // ---- Renseignements ----
  const tipSpecs = [
    ["Possible observation de Jonathan Morrison", "Je crois avoir vu l'homme de la page Most Wanted dans une station-service sur la Route 68 hier vers 18h.", true, 0],
    ["Informations sur l'équipe Redline", "L'un des membres de l'équipe conduit une Buffalo noire et la gare derrière le centre commercial de Vespucci Blvd.", false, 0],
    ["Fusillade de la jetée de Del Perro", "Une berline grise est restée à l'arrêt près de la jetée pendant 20 minutes avant les faits.", true, null],
    ["Armes à Sandy Shores", "Mon voisin reçoit de grandes caisses lourdes la nuit. Quelque chose ne va pas.", true, 3],
    ["Brèche LifeInvader", "Un type dans un espace de coworking à Vinewood se vantait d'avoir piraté un réseau social.", false, 5],
    ["Elena Vasquez", "Elle a été vue lors d'un événement privé à Vinewood Hills le week-end dernier.", true, 1],
    ["Observation d'Aiden Walsh", "Une personne correspondant à son signalement séjourne dans un motel à Harmony.", true, 2],
    ["Corruption au service des permis", "Les permis d'une même société sont toujours approuvés le jour même. Tous les autres attendent des mois.", true, null],
    ["Attaque du convoi de la Route 68", "J'ai des images de dashcam de ce matin-là. Je peux les partager avec un Agent.", false, 4],
    ["Activité liée aux stupéfiants", "Va-et-vient important à un mobil-home près d'Alhambra Drive à toute heure.", true, null],
  ] as const;
  const publishedMw = await prisma.mostWanted.findMany({ where: { status: "PUBLISHED" } });
  for (let i = 0; i < tipSpecs.length; i++) {
    const [subject, description, anon, mwIdx] = tipSpecs[i];
    await prisma.tip.create({
      data: {
        publicId: `TIP-2026-${String(i + 1).padStart(6, "0")}`,
        subject,
        description,
        anonymous: anon,
        name: anon ? null : pick(["Un citoyen", "Résident inquiet", "J. Dupont"], i),
        email: anon ? null : "temoin@example.com",
        location: pick(["Route 68", "Vespucci", "Del Perro", "Sandy Shores", "Vinewood"], i),
        status: pick(["NEW", "NEW", "REVIEWING", "ASSIGNED", "ACTIONED"], i) as Prisma.TipCreateInput["status"],
        mostWantedId: mwIdx !== null && publishedMw[mwIdx as number] ? publishedMw[mwIdx as number].id : null,
        assignedToId: i % 3 === 0 ? byName("Christophe Duval").id : null,
        createdAt: daysAgo(1 + i * 2),
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      { actorLabel: "Director Daniela Reyes (FBI-1000)", action: "system.seed", summary: "Données de démonstration initialisées" },
      { actorLabel: "SSA Travis Boone (FBI-1006)", action: "investigation.create", entityType: "investigation", summary: "Travis Boone a créé l'enquête FBI-2026-00001" },
      { actorLabel: "SSA Travis Boone (FBI-1006)", action: "mostwanted.transition", entityType: "most_wanted", summary: "Travis Boone a fait passer MW-0001 au statut PUBLISHED" },
    ],
  });

  console.log("Initialisation terminée.");
  console.log("\nIdentifiants de connexion (tous les comptes partagent le même mot de passe) :");
  console.log(`  Mot de passe : ${PW}`);
  console.log("  Director :  d.reyes@fbi.gov");
  console.log("  SAC :       j.mercer@fbi.gov");
  console.log("  SSA :       t.boone@fbi.gov");
  console.log("  Special Agent : c.duval@fbi.gov");
  console.log("  New Agent Trainee : n.frost@fbi.gov");
  console.log("  Admin plateforme : admin@fbi.gov");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
