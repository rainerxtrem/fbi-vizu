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

async function main() {
  console.log("Seeding FIA database…");

  // Wipe (order matters due to FKs) — safe because this is demo data.
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

  // ---- Field offices ----
  const offices = await Promise.all(
    [
      { name: "Los Santos Field Office", code: "LSFO", city: "Los Santos", address: "1 Pershing Square, Los Santos, SA 90012", phone: "(310) 555-0100", email: "losantos@fia.gov", isHq: true },
      { name: "Blaine County Resident Agency", code: "BCRA", city: "Sandy Shores", address: "440 Alhambra Dr, Sandy Shores, SA 92277", phone: "(760) 555-0141", email: "blaine@fia.gov", isHq: false },
      { name: "Paleto Bay Resident Agency", code: "PBRA", city: "Paleto Bay", address: "12 Paleto Blvd, Paleto Bay, SA 92110", phone: "(805) 555-0170", email: "paleto@fia.gov", isHq: false },
      { name: "Sandy Shores Outpost", code: "SSO", city: "Sandy Shores", address: "3 Route 68, Grand Senora Desert, SA 92310", phone: "(760) 555-0199", email: "senora@fia.gov", isHq: false },
    ].map((o) => prisma.fieldOffice.create({ data: o })),
  );
  const lsfo = offices[0];

  // ---- Admin (platform) ----
  await prisma.user.create({
    data: {
      email: "admin@fia.gov",
      name: "Platform Administrator",
      passwordHash,
      isAdmin: true,
    },
  });

  // ---- Agents across the hierarchy ----
  const agentSpecs: {
    email: string;
    name: string;
    rank: Prisma.AgentCreateInput["rank"];
    title: string;
    division: string;
    unit?: string;
    office: string;
  }[] = [
    { email: "d.reyes@fia.gov", name: "Daniela Reyes", rank: "DIRECTOR", title: "Director of the FIA", division: "Office of the Director", office: "LSFO" },
    { email: "m.okafor@fia.gov", name: "Marcus Okafor", rank: "DD", title: "Deputy Director", division: "Office of the Director", office: "LSFO" },
    { email: "s.lindqvist@fia.gov", name: "Sofia Lindqvist", rank: "EAD", title: "Executive Assistant Director, Criminal Branch", division: "Criminal Investigative Division", office: "LSFO" },
    { email: "r.castellano@fia.gov", name: "Rocco Castellano", rank: "AD", title: "Assistant Director, Cyber Division", division: "Cyber Division", office: "LSFO" },
    { email: "j.mercer@fia.gov", name: "Jordan Mercer", rank: "SAC", title: "Special Agent in Charge, Los Santos", division: "Criminal Investigative Division", unit: "C-1", office: "LSFO" },
    { email: "a.novak@fia.gov", name: "Alena Novak", rank: "ASAC", title: "Assistant Special Agent in Charge", division: "Criminal Investigative Division", unit: "C-1", office: "LSFO" },
    { email: "t.boone@fia.gov", name: "Travis Boone", rank: "SSA", title: "Supervisory Special Agent, Organized Crime Squad", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "p.osei@fia.gov", name: "Priya Osei", rank: "SSA", title: "Supervisory Special Agent, Cyber Squad", division: "Cyber Division", unit: "CY-2", office: "LSFO" },
    { email: "h.tanaka@fia.gov", name: "Hana Tanaka", rank: "SSA_SENIOR", title: "Senior Special Agent", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "c.duval@fia.gov", name: "Christophe Duval", rank: "SA", title: "Special Agent", division: "Criminal Investigative Division", unit: "OC-4", office: "LSFO" },
    { email: "k.abara@fia.gov", name: "Kelechi Abara", rank: "SA", title: "Special Agent", division: "Cyber Division", unit: "CY-2", office: "BCRA" },
    { email: "l.romero@fia.gov", name: "Luz Romero", rank: "SA", title: "Special Agent", division: "Criminal Investigative Division", unit: "VC-3", office: "PBRA" },
    { email: "n.frost@fia.gov", name: "Nate Frost", rank: "NAT", title: "New Agent Trainee", division: "Training Division", office: "LSFO" },
    { email: "b.iversen@fia.gov", name: "Brit Iversen", rank: "NAT", title: "New Agent Trainee", division: "Training Division", office: "LSFO" },
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
            badgeNumber: `FIA-${1000 + i}`,
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

  // A couple of recorded rank changes
  await prisma.rankChange.create({
    data: {
      agentId: byName("Hana Tanaka").id,
      oldRank: "SA",
      newRank: "SSA_SENIOR",
      changedById: byName("Jordan Mercer").id,
      reason: "Sustained superior performance leading the Vinewood racketeering case.",
      createdAt: daysAgo(60),
    },
  });

  // ---- Charge catalog ----
  const chargeNames = [
    ["FIRST_DEGREE_MURDER", "First Degree Murder", "Violent Crime"],
    ["ARMED_ROBBERY", "Armed Robbery", "Violent Crime"],
    ["KIDNAPPING", "Kidnapping", "Violent Crime"],
    ["MONEY_LAUNDERING", "Money Laundering", "Financial Crime"],
    ["RACKETEERING", "Racketeering (RICO)", "Organized Crime"],
    ["DRUG_TRAFFICKING", "Drug Trafficking", "Narcotics"],
    ["WEAPONS_TRAFFICKING", "Weapons Trafficking", "Weapons"],
    ["WIRE_FRAUD", "Wire Fraud", "Financial Crime"],
    ["PUBLIC_CORRUPTION", "Public Corruption", "Corruption"],
    ["COMPUTER_INTRUSION", "Computer Intrusion", "Cyber"],
    ["EXTORTION", "Extortion", "Organized Crime"],
    ["CONSPIRACY", "Conspiracy", "General"],
    ["BANK_ROBBERY", "Bank Robbery", "Violent Crime"],
    ["TERRORISM", "Domestic Terrorism", "Counterterrorism"],
  ] as const;
  const charges = await Promise.all(
    chargeNames.map(([code, title, category]) =>
      prisma.charge.create({ data: { code, title, category, severity: "Felony" } }),
    ),
  );

  // ---- Organizations ----
  const orgs = await Promise.all(
    [
      { name: "The Vagos Syndicate", type: "Street gang / OC", description: "Statewide narcotics distribution network." },
      { name: "Duggan Holdings", type: "Corporate front", description: "Shell company suspected of laundering proceeds." },
      { name: "Sandy Shores Cartel Cell", type: "Cartel affiliate", description: "Cross-border weapons and narcotics." },
      { name: "Redline Crew", type: "Robbery crew", description: "Armored-car and jewelry heists across Los Santos County." },
    ].map((o) => prisma.organization.create({ data: o })),
  );

  // ---- Persons ----
  const personSpecs = [
    ["Jonathan Morrison", "Jack, Morrie", "HIGH", "Suspected leader of the Redline Crew. Known to frequent the Vinewood Hills and the Vanilla Unicorn."],
    ["Elena Vasquez", "La Sombra", "EXTREME", "Alleged financier and enforcer for the Vagos Syndicate."],
    ["Dmitri Volkov", "The Accountant", "MEDIUM", "Believed to manage laundering operations through Duggan Holdings."],
    ["Terrence Cole", "T-Bone", "HIGH", "Armored-car robbery specialist. Ex-military demolitions."],
    ["Marisol Reyes", null, "LOW", "Witness to the Del Perro pier shooting."],
    ["Aiden Walsh", "Ghost", "EXTREME", "Suspected in three contract killings across Blaine County."],
    ["Priscilla Nguyen", "Prax", "MEDIUM", "Cyber intrusion specialist tied to the LifeInvader breach."],
    ["Bobby Faulkner", "Big Bob", "MEDIUM", "Mid-level narcotics distributor, Sandy Shores."],
    ["Carla Mendes", null, "LOW", "Cooperating witness — former bookkeeper for Duggan Holdings."],
    ["Viktor Petrov", "Vik", "HIGH", "Weapons trafficker operating out of the Grand Senora Desert."],
    ["Desmond Pryce", "Dez", "MEDIUM", "Getaway driver for multiple Redline Crew jobs."],
    ["Hannah Brooks", null, "LOW", "Victim's sister — ongoing contact for the Paleto Bay case."],
    ["Omar Haddad", "The Broker", "HIGH", "Suspected middleman for cross-jurisdictional narcotics shipments."],
    ["Sasha Kperov", "Snow", "EXTREME", "Believed responsible for the Route 68 armored convoy attack."],
    ["Leon Grady", "Lucky", "MEDIUM", "Low-level enforcer, cooperating on the racketeering matter."],
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
          gender: i % 3 === 0 ? "Female" : "Male",
          knownAddresses: pick(["Vinewood Hills", "Sandy Shores", "Del Perro", "Paleto Bay", "Mirror Park"], i),
          criminalHistory: i % 2 === 0 ? "Prior convictions for assault and possession." : "No prior felony convictions on record.",
          createdById: byName("Christophe Duval").id,
          photoUrl: `https://picsum.photos/seed/fia-person-${i}/480/600`,
        },
      }),
    );
  }

  // ---- Investigations ----
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
      title: "Operation Redline — Armored Car Robbery Series",
      description:
        "A coordinated series of armored-car and jewelry-store robberies across Los Santos County attributed to a crew known as the Redline Crew. The FIA is investigating in coordination with the Los Santos Police Department robbery-homicide division. At least four incidents, one fatality, and an estimated $2.1M in losses.",
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
      title: "Vinewood Racketeering Enterprise",
      description:
        "Long-term RICO investigation into an organized criminal enterprise operating extortion, illegal gambling, and money-laundering schemes through nightlife venues in Vinewood and Del Perro.",
      status: "ACTIVE",
      priority: "HIGH",
      classification: "SECRET",
      lead: "Alena Novak",
      assigned: ["Travis Boone", "Hana Tanaka", "Leon Grady" /* n/a - fixed below */].slice(0, 2),
      chargeIdx: [4, 3, 10, 11],
      suspectIdx: [1, 2, 14],
      isPublic: false,
      daysOpen: 220,
    },
    {
      title: "LifeInvader Data Breach",
      description:
        "Unauthorized intrusion into the LifeInvader corporate network resulting in exfiltration of user records. Attribution analysis points to a small crew operating for financial gain.",
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
      title: "Grand Senora Weapons Pipeline",
      description:
        "Investigation into a weapons-trafficking pipeline moving military-grade firearms through the Grand Senora Desert to buyers in Los Santos.",
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
      title: "Route 68 Armored Convoy Attack",
      description:
        "Armed assault on a private armored convoy on Route 68 resulting in two injuries and the theft of currency in transit. High-powered weapons used; possible connection to the Grand Senora pipeline.",
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
      title: "Duggan Holdings Financial Inquiry",
      description:
        "Forensic accounting investigation into suspected layering of illicit proceeds through a network of shell entities controlled by Duggan Holdings.",
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
      title: "Del Perro Pier Shooting",
      description:
        "Daylight shooting on the Del Perro pier. One deceased, believed to be a targeted killing tied to a narcotics debt.",
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
      title: "Sandy Shores Narcotics Distribution",
      description:
        "Investigation into a methamphetamine production and distribution operation centered in Sandy Shores with statewide reach.",
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
      title: "Public Corruption — County Permitting Office",
      description:
        "Allegations that a county official accepted payments to expedite construction permits for entities linked to organized crime.",
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
      title: "Paleto Bay Bank Robbery",
      description:
        "Takeover-style robbery of the Fleeca branch in Paleto Bay. Three armed subjects, no injuries. Under investigation for links to the Redline Crew.",
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
        caseNumber: `FIA-2026-${String(i + 1).padStart(5, "0")}`,
        title: s.title,
        description: s.description,
        status: s.status,
        priority: s.priority,
        classification: s.classification,
        leadAgentId: leadAgent.id,
        fieldOfficeId: lsfo.id,
        division: "Criminal Investigative Division",
        unit: pick(["OC-4", "VC-3", "CY-2", "C-1"], i),
        jurisdiction: pick(["Los Santos County", "Blaine County", "Statewide"], i),
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
            .map((a) => ({ agentId: a.id, role: "Assigned Agent" })),
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

    // Timeline
    const tEvents: [number, string, Prisma.TimelineEventCreateInput["type"]][] = [
      [s.daysOpen, `Investigation opened by ${leadAgent.name}`, "INVESTIGATION_OPENED"],
      [s.daysOpen - 2, `Search warrant approved for premises linked to the case`, "WARRANT_APPROVED"],
      [Math.max(1, s.daysOpen - 5), `Witness statement recorded and added to the file`, "NOTE_ADDED"],
      [Math.max(1, s.daysOpen - 8), `Physical evidence logged into custody`, "EVIDENCE_ADDED"],
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

    // Notes
    await prisma.investigationNote.create({
      data: {
        investigationId: inv.id,
        authorId: leadAgent.id,
        body: "Initial assessment complete. Coordinating with partner agencies. Next step: subpoena financial records and canvass for additional witnesses.",
        createdAt: daysAgo(Math.max(1, s.daysOpen - 3)),
      },
    });

    // Evidence
    const evCount = 1 + (i % 3);
    for (let e = 0; e < evCount; e++) {
      await prisma.evidence.create({
        data: {
          investigationId: inv.id,
          evidenceNumber: `E-${1001 + investigations.length * 3 + e}`,
          type: pick(["PHYSICAL", "DIGITAL", "PHOTO", "FIREARM", "FINANCIAL", "VIDEO"], i + e) as Prisma.EvidenceCreateInput["type"],
          title: pick(
            ["CCTV footage — incident site", "Recovered firearm", "Financial ledger", "Mobile device extraction", "Latent prints", "Vehicle GPS data"],
            i + e,
          ),
          description: "Collected and entered into evidence following chain-of-custody procedures.",
          chainOfCustody: `Collected by ${leadAgent.name}; stored at ${pick(["LSFO Evidence Vault", "Regional Lab"], e)}.`,
          collectedById: leadAgent.id,
          collectedAt: daysAgo(Math.max(1, s.daysOpen - 6 - e)),
        },
      });
    }

    // Warrant
    await prisma.warrant.create({
      data: {
        warrantNumber: `W-2026-${String(i + 1).padStart(4, "0")}`,
        investigationId: inv.id,
        personId: persons[s.suspectIdx[0]].id,
        type: i % 3 === 0 ? "SEARCH" : "ARREST",
        status: s.status === "CLOSED" ? "EXECUTED" : "ACTIVE",
        description: "Authorized by the San Andreas District Court.",
        issuingJudge: pick(["Hon. P. Alvarez", "Hon. R. Kline", "Hon. S. Whitmore"], i),
        issuedDate: daysAgo(s.daysOpen - 1),
        requestedById: leadAgent.id,
        approvedById: byName("Jordan Mercer").id,
      },
    });
  }

  // Related cases
  await prisma.relatedCase.create({
    data: { fromId: investigations[0].id, toId: investigations[9].id, note: "Same crew suspected." },
  });
  await prisma.relatedCase.create({
    data: { fromId: investigations[3].id, toId: investigations[4].id, note: "Weapons match ballistics." },
  });

  // Arrest on the closed case
  await prisma.arrest.create({
    data: {
      investigationId: investigations[9].id,
      personId: persons[10].id,
      arrestDate: daysAgo(14),
      location: "Paleto Bay",
      charges: "Bank Robbery, Conspiracy",
      arrestingAgentId: byName("Travis Boone").id,
      notes: "Arrest executed without incident.",
    },
  });

  // ---- Most Wanted ----
  const mwSpecs = [
    { pIdx: 0, invIdx: 0, status: "PUBLISHED", danger: "HIGH", category: "VIOLENT_CRIME", reward: 50000, charges: ["Armed Robbery", "First Degree Murder", "Racketeering"] },
    { pIdx: 1, invIdx: 1, status: "PUBLISHED", danger: "EXTREME", category: "ORGANIZED_CRIME", reward: 100000, charges: ["Racketeering (RICO)", "Money Laundering", "Extortion"] },
    { pIdx: 5, invIdx: 6, status: "PUBLISHED", danger: "EXTREME", category: "FUGITIVE", reward: 75000, charges: ["First Degree Murder", "Conspiracy"] },
    { pIdx: 9, invIdx: 3, status: "PUBLISHED", danger: "HIGH", category: "WEAPONS", reward: 40000, charges: ["Weapons Trafficking", "Conspiracy"] },
    { pIdx: 13, invIdx: 4, status: "PUBLISHED", danger: "EXTREME", category: "VIOLENT_CRIME", reward: 85000, charges: ["Armed Robbery", "Conspiracy", "Drug Trafficking"] },
    { pIdx: 6, invIdx: 2, status: "PUBLISHED", danger: "MODERATE", category: "CYBER_CRIME", reward: 25000, charges: ["Computer Intrusion", "Wire Fraud"] },
    { pIdx: 12, invIdx: 7, status: "REVIEW", danger: "HIGH", category: "DRUG_TRAFFICKING", reward: 30000, charges: ["Drug Trafficking", "Conspiracy"] },
    { pIdx: 3, invIdx: 9, status: "CAPTURED", danger: "HIGH", category: "VIOLENT_CRIME", reward: 20000, charges: ["Bank Robbery", "Armed Robbery"] },
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
        description: `${person.fullName} is wanted by the Federal Investigative Agency in connection with ${inv.title}. ${person.description} The subject should be considered armed and dangerous. Do not attempt to apprehend. Anyone with information is urged to contact the FIA or their local law enforcement agency.`,
        charges: [...m.charges],
        reward: m.reward,
        lastKnownLocation: pick(["Vinewood Hills, Los Santos", "Sandy Shores, Blaine County", "Del Perro, Los Santos", "Paleto Bay"], i),
        vehicle: pick(["Black Bravado Buffalo, plate 46XYZ", "Grey Declasse Sabre", "White panel van, no plates", "Unknown"], i),
        associates: "Known to associate with members of the crew under investigation.",
        knownOrganizations: pick(["Redline Crew", "The Vagos Syndicate", "Sandy Shores Cartel Cell"], i),
        dateLastSeen: daysAgo(10 + i * 4),
        caseNumber: inv.caseNumber,
        leadAgency: "Federal Investigative Agency",
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

  // ---- News ----
  const newsSpecs = [
    ["PRESS_RELEASE", "FIA Announces Charges in Vinewood Racketeering Enterprise", "Multi-year investigation targets extortion and money laundering across Los Santos nightlife."],
    ["CASE_UPDATE", "Update: Route 68 Armored Convoy Attack", "Investigators release vehicle description and appeal for witnesses."],
    ["PUBLIC_NOTICE", "FIA Seeking Information on Del Perro Pier Shooting", "The public's assistance is requested in identifying those responsible."],
    ["AGENCY_NEWS", "FIA Opens New Resident Agency in Paleto Bay", "Expanded presence improves response times across northern San Andreas."],
    ["RECRUITMENT", "Now Hiring: Special Agents and Intelligence Analysts", "The FIA is accepting applications for the next academy class."],
    ["COMMUNITY", "FIA Hosts Community Safety Forum in Sandy Shores", "Agents met with residents to discuss crime prevention resources."],
    ["PRESS_RELEASE", "Subject in Paleto Bay Bank Robbery Taken Into Custody", "One individual arrested; investigation into remaining suspects continues."],
    ["CASE_UPDATE", "LifeInvader Data Breach: What Users Should Know", "The FIA outlines steps affected users can take to protect their accounts."],
    ["PUBLIC_NOTICE", "Reward Increased for Information on Aiden Walsh", "The reward for information leading to an arrest is now $75,000."],
    ["AGENCY_NEWS", "Director Reyes Delivers Annual Threat Assessment", "Organized crime and cyber intrusions remain the state's top federal concerns."],
  ] as const;
  for (let i = 0; i < newsSpecs.length; i++) {
    const [category, title, subtitle] = newsSpecs[i];
    await prisma.news.create({
      data: {
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80),
        title,
        subtitle,
        category: category as Prisma.NewsCreateInput["category"],
        status: "PUBLISHED",
        imageUrl: `https://picsum.photos/seed/fia-news-${i}/1200/675`,
        content: `${subtitle}\n\nLOS SANTOS — The Federal Investigative Agency today provided an update regarding an ongoing matter of public interest. "Our commitment is to the safety of every resident of San Andreas," a spokesperson said. "We will continue to pursue these cases with integrity and determination."\n\nThe FIA urges anyone with information to submit a tip through FIA.gov or to contact their nearest field office. Tips may be submitted anonymously.\n\nThis is a fictional press release for a GTA RP server.`,
        authorId: byName("Jordan Mercer").id,
        publishedAt: daysAgo(2 + i * 3),
        relatedInvestigationId: i < investigations.length ? investigations[i % investigations.length].id : null,
      },
    });
  }

  // ---- Applications ----
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
        currentOccupation: pick(["Police Officer", "Data Analyst", "Software Engineer", "Paramedic", "Lab Technician"], i),
        priorLeExperience: i % 2 === 0 ? "4 years with the Los Santos Police Department." : "None.",
        militaryExperience: i % 3 === 0 ? "6 years, San Andreas National Guard." : "None.",
        education: "B.S. Criminal Justice, University of San Andreas.",
        whyJoin: "I want to work the cases that matter most and protect my community at the federal level.",
        whyGoodCandidate: "Disciplined, analytical, and calm under pressure.",
        difficultDecision: "I once had to report a colleague for misconduct despite personal ties. It was the right call.",
        pressureExperience: "I regularly worked high-tempo incidents requiring rapid, sound judgment.",
        certified: true,
        assignedRecruiterId: status !== "SUBMITTED" ? byName("Alena Novak").id : null,
        createdAt: daysAgo(3 + i * 4),
      },
    });
  }

  // ---- Tips ----
  const tipSpecs = [
    ["Possible sighting of Jonathan Morrison", "I think I saw the man from the Most Wanted page at a gas station on Route 68 yesterday around 6pm.", true, 0],
    ["Information about the Redline Crew", "One of the crew members drives a black Buffalo and parks it behind the strip mall on Vespucci Blvd.", false, 0],
    ["Del Perro pier shooting", "There was a grey sedan idling near the pier for 20 minutes before it happened.", true, null],
    ["Weapons in Sandy Shores", "My neighbor has been receiving large heavy crates at night. Something is not right.", true, 3],
    ["LifeInvader breach", "A guy in a Vinewood coworking space was bragging about hacking a social network.", false, 5],
    ["Elena Vasquez", "She was seen at a private event in Vinewood Hills last weekend.", true, 1],
    ["Aiden Walsh sighting", "Someone matching his description is staying at a motel in Harmony.", true, 2],
    ["Corruption at permitting office", "Permits for one company always get approved same-day. Everyone else waits months.", true, null],
    ["Route 68 convoy attack", "I have dashcam footage from that morning. Happy to share it with an agent.", false, 4],
    ["Narcotics activity", "Heavy foot traffic at a trailer off Alhambra Drive at all hours.", true, null],
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
        name: anon ? null : pick(["A. Citizen", "Concerned Resident", "J. Doe"], i),
        email: anon ? null : "witness@example.com",
        location: pick(["Route 68", "Vespucci", "Del Perro", "Sandy Shores", "Vinewood"], i),
        status: pick(["NEW", "NEW", "REVIEWING", "ASSIGNED", "ACTIONED"], i) as Prisma.TipCreateInput["status"],
        mostWantedId: mwIdx !== null && publishedMw[mwIdx as number] ? publishedMw[mwIdx as number].id : null,
        assignedToId: i % 3 === 0 ? byName("Christophe Duval").id : null,
        createdAt: daysAgo(1 + i * 2),
      },
    });
  }

  // ---- Seed audit entries ----
  await prisma.auditLog.createMany({
    data: [
      { actorLabel: "Director Daniela Reyes (FIA-1000)", action: "system.seed", summary: "Demonstration data initialized" },
      { actorLabel: "SSA Travis Boone (FIA-1006)", action: "investigation.create", entityType: "investigation", summary: "Travis Boone created investigation FIA-2026-00001" },
      { actorLabel: "SSA Travis Boone (FIA-1006)", action: "mostwanted.transition", entityType: "most_wanted", summary: "Travis Boone moved MW-0001 to PUBLISHED" },
    ],
  });

  console.log("Seed complete.");
  console.log("\nLogin credentials (all users share the same password):");
  console.log(`  Password: ${PW}`);
  console.log("  Director:  d.reyes@fia.gov");
  console.log("  SAC:       j.mercer@fia.gov");
  console.log("  SSA:       t.boone@fia.gov");
  console.log("  Special Agent: c.duval@fia.gov");
  console.log("  Trainee:   n.frost@fia.gov");
  console.log("  Platform Admin: admin@fia.gov");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
