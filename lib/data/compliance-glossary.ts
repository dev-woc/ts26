/**
 * Federal Government Contract Compliance Glossary
 *
 * Plain-language reference for small business contractors encountering
 * federal compliance requirements for the first time.
 *
 * Covers: Delivery & Acceptance, FAR Clause Compliance, Reporting Deliverables,
 * Quality Control, Security & Clearance, Subcontracting, Common Gotchas,
 * and Post-Award Timeline requirements.
 */

export interface GlossaryTerm {
  term: string;
  shortDef: string;
  fullExplanation: string;
  contractorMustDo: string[];
  commonMistakes: string[];
  timing: string;
  farRef: string;
}

export interface GlossaryCategory {
  id: string;
  label: string;
  description: string;
  terms: GlossaryTerm[];
}

export interface ComplianceGlossary {
  version: string;
  lastUpdated: string;
  disclaimer: string;
  categories: GlossaryCategory[];
}

export const complianceGlossary: ComplianceGlossary = {
  version: "1.0.0",
  lastUpdated: "2026-03-04",
  disclaimer:
    "This glossary is provided for educational reference only and does not constitute legal advice. Always consult your Contracting Officer and legal counsel for guidance specific to your contract.",
  categories: [
    {
      id: "delivery",
      label: "Delivery & Acceptance",
      description:
        "Requirements governing how goods and services are delivered, inspected, and formally accepted by the government.",
      terms: [
        {
          term: "First Article Test (FAT)",
          shortDef:
            "A test of the very first unit you produce to prove you can build to spec before making the rest.",
          fullExplanation:
            "Before a contractor goes into full production, the government requires them to build and submit one or more sample units (the 'first article') for testing and approval. The government — or sometimes a third-party lab — tests the sample against every requirement in the contract. Only after the first article is approved can production begin. This protects the government from discovering defects after thousands of units have already been manufactured.",
          contractorMustDo: [
            "Build the first article exactly to contract specifications — no deviations.",
            "Submit a First Article Test Report documenting every test performed, results, and any nonconformances.",
            "Obtain written government approval before starting production runs.",
            "Coordinate scheduling with the Contracting Officer (CO) and QA representative well in advance.",
            "Budget time and cost for FAT into your proposal — it is a real deliverable.",
          ],
          commonMistakes: [
            "Starting production before receiving written FAT approval — this creates unauthorized work and can void the contract.",
            "Submitting a unit that differs from what you plan to produce at scale — the first article must be representative.",
            "Failing to include FAT costs in the bid price; the government will not cover unplanned testing costs.",
            "Missing the FAT delivery deadline, which can trigger a default clause.",
          ],
          timing: "Typically 30–90 days after contract award, before production begins. Exact date is specified in the contract's 'First Article' delivery line.",
          farRef: "FAR 52.209-3 (Fixed-Price, First Article Approval—Contractor Testing) or FAR 52.209-4 (Government Testing)",
        },
        {
          term: "Inspection and Test Plan (ITP)",
          shortDef:
            "A written plan you give the government explaining exactly how you will inspect your own work before delivering it.",
          fullExplanation:
            "An ITP is a documented quality roadmap that describes every inspection step, test, measurement, and check-point you will perform during manufacturing or service delivery. It identifies who does each check, how often, what tools are used, and what the acceptance criteria are. The government reviews and approves your ITP to verify your quality system is adequate before work begins. Without an approved ITP you generally cannot proceed with deliverable production.",
          contractorMustDo: [
            "Write the ITP before work begins — it must describe processes in enough detail that a government QA rep can follow and witness inspections.",
            "Include inspection points, test methods, sample sizes, measurement equipment, acceptance/rejection criteria, and responsible personnel.",
            "Submit ITP to the Contracting Officer's Representative (COR) or Quality Assurance Representative (QAR) for review and approval.",
            "Follow the approved ITP exactly during performance; any deviations require a formal change request.",
            "Maintain records of all inspections performed per the ITP.",
          ],
          commonMistakes: [
            "Treating the ITP as a formality and writing a vague, generic plan — government reviewers will reject it and require resubmission.",
            "Failing to update the ITP when processes change mid-contract.",
            "Not keeping inspection records that trace back to the ITP — missing records = nonconformance.",
          ],
          timing: "Due within 30–60 days of contract award, or before work begins on the first deliverable, whichever is sooner.",
          farRef: "FAR 46.401–46.406 (Government contract quality assurance); DFARS 246.401 for defense contracts",
        },
        {
          term: "Certificate of Conformance (CoC)",
          shortDef:
            "A signed statement you submit with your deliverable certifying that it meets all contract requirements.",
          fullExplanation:
            "A Certificate of Conformance is a formal document in which the contractor — typically a senior quality or operations official — certifies under penalty of law that the delivered items or services fully conform to all contract specifications, drawings, and requirements. It substitutes for or supplements government inspection when the government elects not to inspect every unit. Signing a false CoC can result in False Claims Act liability.",
          contractorMustDo: [
            "Complete the CoC using the format required by your contract (government may provide a form, or may specify content).",
            "Have an authorized official (quality manager, VP of operations, or similar) sign and date it.",
            "Reference the contract number, CLIN, lot number, quantity, and NSN/part number on the CoC.",
            "Submit with the shipment or invoice — do not submit the invoice without the CoC if it is required.",
            "Maintain a copy in your quality records.",
          ],
          commonMistakes: [
            "Having an unauthorized person sign the CoC — it must be a company official with authority.",
            "Submitting invoices without the required CoC, which causes the payment office to reject the invoice.",
            "Certifying conformance for items that have open nonconformances — this is a False Claims Act violation.",
          ],
          timing: "Submitted with each delivery or as specified in the contract's CDRL or delivery schedule.",
          farRef: "FAR 52.246-15 (Certificate of Conformance)",
        },
        {
          term: "DD-250 / Wide Area Workflow (WAWF) Acceptance",
          shortDef:
            "The electronic form the government signs to officially accept your delivery — without it, you will not get paid.",
          fullExplanation:
            "The DD Form 250 (Material Inspection and Receiving Report) is the traditional paper form used to document government acceptance of goods. Most DOD contracts now require submission through Wide Area Workflow (WAWF), the DOD's web-based system. In WAWF, the contractor submits a 'receiving report' electronically, the government inspector approves it, and the acceptance record is automatically routed to the paying office. Payment cannot be released without an accepted WAWF document. Civilian agency contracts may use similar acceptance systems (e.g., IPP — Invoice Processing Platform).",
          contractorMustDo: [
            "Register for a WAWF account at wawftraining.eb.mil or wawf.eb.mil before your first delivery.",
            "Obtain your CAGE code and DUNS/UEI — these are required to submit in WAWF.",
            "Submit the correct WAWF document type (Combo, Invoice Only, Receiving Report, etc.) per your contract instructions.",
            "Ensure the government COR/QAR inspects and accepts the delivery — follow up if acceptance is delayed beyond payment terms.",
            "For civilian agencies, check if your contract uses IPP (Invoice Processing Platform) instead of WAWF.",
          ],
          commonMistakes: [
            "Not registering for WAWF until after first delivery — registration can take days; do it immediately after award.",
            "Submitting the wrong WAWF document type (e.g., Invoice Only when contract requires a Combo), which causes rejection.",
            "Entering the wrong CAGE code, contract number, or CLIN, forcing the government to reject and require resubmission.",
            "Not following up when the government fails to accept promptly — unpaid invoices age out of WAWF.",
          ],
          timing: "Submit within the timeframe specified in the contract after delivery. Prompt Payment Act requires government payment within 30 days of a proper invoice.",
          farRef: "FAR 52.232-25 (Prompt Payment); DFARS 252.232-7003 (Electronic Submission of Payment Requests — requires WAWF)",
        },
        {
          term: "Receiving Report",
          shortDef:
            "The official government record confirming they physically received what you delivered, separate from acceptance.",
          fullExplanation:
            "A receiving report documents that the government physically received the goods or services. It is distinct from acceptance — the government can receive items but still reject them after inspection. For services contracts, the COR typically signs a receiving report (or equivalent) confirming services were performed as invoiced. This document is essential to the payment chain; without it, the accounting office has no basis to pay your invoice.",
          contractorMustDo: [
            "Ensure someone at the delivery location signs for receipt — obtain a copy of the signed receiving document.",
            "In WAWF, submit a Receiving Report (RR) document if your contract requires it separate from an invoice.",
            "For services, make sure the COR signs the monthly or delivery-based receiving report promptly.",
            "Keep copies of all receiving reports in your contract file.",
          ],
          commonMistakes: [
            "Assuming delivery equals payment — the government must formally receive AND accept before payment is triggered.",
            "Not following up when the government fails to sign receiving reports, which stalls the entire payment process.",
          ],
          timing: "Generated at the time of each physical delivery or upon service completion.",
          farRef: "FAR 46.501 (Receiving Reports); DFARS 252.246-7000 (Material Inspection and Receiving Report)",
        },
        {
          term: "Acceptance",
          shortDef:
            "The government's formal declaration that your deliverable meets contract requirements — this is when title transfers.",
          fullExplanation:
            "Acceptance is the formal act by which the government takes possession of and legal title to delivered items or confirms services are satisfactory. Once the government accepts, it generally cannot later reject for defects that should have been found during inspection, though it retains rights for latent defects, fraud, and gross mistakes. Acceptance does not automatically mean payment has been processed — that is a separate step.",
          contractorMustDo: [
            "Ensure all deliverables meet contract requirements before presenting for acceptance — do not attempt to accept defective items.",
            "Coordinate with the COR to schedule acceptance inspections.",
            "Respond promptly to any government rejections and document your corrective actions.",
          ],
          commonMistakes: [
            "Confusing receipt with acceptance — the government can reject after inspection even if they signed for receipt.",
            "Ignoring a rejection notice, which starts the clock on a potential default if not corrected.",
          ],
          timing: "Follows inspection of each delivery. The government typically has 30 days to accept or reject after receipt.",
          farRef: "FAR 46.501–46.503 (Acceptance)",
        },
        {
          term: "Shipping/Delivery Instructions ('Per Contract')",
          shortDef:
            "When the contract says 'per contract,' it means go read the specific delivery section — there is a precise address, schedule, and method required.",
          fullExplanation:
            "'Per contract' is a placeholder phrase meaning the exact requirement is spelled out elsewhere in the contract — usually in Section F (Deliveries or Performance) or a CDRL. It is not vague; it is pointing you to specific dates, shipping addresses, packaging requirements, and sometimes government-bill-of-lading (GBL) requirements. New contractors often miss that 'per contract' means they must look up and comply with a specific, binding requirement.",
          contractorMustDo: [
            "Read Section F of your contract completely — all delivery addresses, dates, and methods are there.",
            "Check CDRLs (DD Form 1423) for each data deliverable — each has its own 'when needed' date and submittal address.",
            "Verify whether you must use a Government Bill of Lading (GBL) for freight, or if FOB Destination vs. FOB Origin changes who pays shipping.",
            "Confirm whether deliveries require advance notice to the receiving activity.",
          ],
          commonMistakes: [
            "Shipping to the wrong address because you used the contracting office address instead of the ship-to address in Section F.",
            "Missing early-delivery restrictions — some contracts prohibit early delivery as it creates storage problems for the government.",
            "Using your own freight carrier when the contract requires a GBL — you may not be reimbursed.",
          ],
          timing: "Varies by contract; all dates are in Section F or on CDRLs.",
          farRef: "FAR 47.301 (Shipment terms); FAR Clause 52.247-34 (FOB Destination)",
        },
      ],
    },
    {
      id: "far-clauses",
      label: "FAR Clause Compliance",
      description:
        "Key Federal Acquisition Regulation (FAR) clauses that impose active compliance obligations — not just terms to acknowledge, but things you must actually do.",
      terms: [
        {
          term: "FAR 52.204-10 — Reporting Executive Compensation",
          shortDef:
            "If you receive $30,000+ in federal contracts, you must publicly report your top executives' pay annually.",
          fullExplanation:
            "This clause requires contractors receiving $30,000 or more in federal awards to report the total compensation of their five most highly compensated executives to the Federal Funding Accountability and Transparency Act (FFATA) Subaward Reporting System (FSRS) at fsrs.gov. The data becomes publicly visible. It applies per award year and affects both prime contractors and first-tier subcontractors above $30,000.",
          contractorMustDo: [
            "Register at FSRS.gov.",
            "Report the names and total compensation (not just salary — include bonuses, stock, benefits) of the five most highly compensated executives.",
            "Submit annually by the end of the month following the month of contract award.",
            "Update FSRS.gov if compensation changes materially.",
          ],
          commonMistakes: [
            "Reporting only base salary instead of total compensation — bonuses, deferred compensation, and benefits must be included.",
            "Missing the reporting deadline because the contractor did not realize this was a recurring obligation.",
            "Assuming this only applies to large businesses — small businesses must comply too.",
          ],
          timing: "Due by the end of the month following contract award, then annually.",
          farRef: "FAR 52.204-10 (Reporting Executive Compensation and First-Tier Subcontract Awards)",
        },
        {
          term: "FAR 52.204-21 — Basic Safeguarding of Covered Contractor Information Systems",
          shortDef:
            "If you handle any federal contract information on your IT systems, you must implement 15 basic cybersecurity controls.",
          fullExplanation:
            "This clause requires contractors (and subcontractors) whose information systems process, store, or transmit Federal Contract Information (FCI) to implement 15 basic safeguarding requirements derived from NIST SP 800-171. FCI is any information provided by the government or generated under a contract that is not intended for public release. This is distinct from Controlled Unclassified Information (CUI), which has even stricter requirements.",
          contractorMustDo: [
            "Identify all systems that touch contract information.",
            "Implement the 15 controls: limit access, control external connections, encrypt portable devices, use antivirus, apply security patches, protect audit logs, and more.",
            "Train employees on acceptable use and security practices.",
            "Include this clause in subcontracts that involve FCI.",
          ],
          commonMistakes: [
            "Assuming this only applies if you handle classified information — FCI is any contract data, even mundane project files.",
            "Using personal email or Google Drive to exchange contract documents without government approval.",
            "Not flowing the clause down to subcontractors who touch your contract data.",
          ],
          timing: "Effective immediately upon contract award — must be compliant before any FCI is received.",
          farRef: "FAR 52.204-21 (Basic Safeguarding of Covered Contractor Information Systems)",
        },
        {
          term: "FAR 52.209-6 — Protecting the Government's Interest When Subcontracting",
          shortDef:
            "Before using a subcontractor, you must check that they are not debarred or suspended from federal contracting.",
          fullExplanation:
            "This clause prohibits contractors from entering into subcontracts above $35,000 with parties that are debarred, suspended, or proposed for debarment. The contractor must verify subcontractor status in SAM.gov before award and check that they have an active registration. Contractors are responsible for their subcontractors' eligibility — using a debarred sub can expose you to termination.",
          contractorMustDo: [
            "Search every proposed subcontractor in SAM.gov (sam.gov) before awarding the subcontract.",
            "Document the SAM.gov check result (screenshot with date) and keep it in the contract file.",
            "Verify subcontractors are still active in SAM.gov if the subcontract spans more than one year.",
            "Include a representation in subcontract agreements that the sub is not debarred or suspended.",
          ],
          commonMistakes: [
            "Checking SAM.gov once and never again — debarment can happen at any time during contract performance.",
            "Not documenting the check — in an audit, you need proof you verified status.",
            "Confusing an expired SAM.gov registration with debarment — both are problems, but for different reasons.",
          ],
          timing: "Before awarding any subcontract over $35,000; periodically throughout performance.",
          farRef: "FAR 52.209-6 (Protecting the Government's Interest When Subcontracting with Contractors Debarred, Suspended, or Proposed for Debarment)",
        },
        {
          term: "FAR 52.219-14 — Limitations on Subcontracting (Small Business Set-Asides)",
          shortDef:
            "If you win as a small business set-aside, you must perform a significant portion of the work yourself — not just broker it to a large business.",
          fullExplanation:
            "When a contract is set aside for small businesses, FAR 52.219-14 limits how much work you can subcontract to large businesses. For manufacturing, you must perform at least 50% of the cost of manufacturing in-house (or with other small businesses). For general construction it is 15%, and for other services it is 50% of the labor. The intent is to ensure the benefits of set-asides actually flow to small businesses.",
          contractorMustDo: [
            "Calculate your planned subcontracting ratio before bidding to ensure you can comply.",
            "Track labor costs or manufacturing costs throughout performance to verify you remain compliant.",
            "Submit documentation if required by the CO proving compliance at contract close-out.",
            "If you cannot comply, notify the CO immediately — do not just proceed and hope no one checks.",
          ],
          commonMistakes: [
            "Winning a small business set-aside with the intention of subcontracting 80%+ of the work to a large partner — this is illegal and called 'pass-through' or 'brokering.'",
            "Not tracking the percentages during performance until it is too late to correct.",
            "Failing to understand that the rule applies to labor cost for services, not revenue.",
          ],
          timing: "Must be maintained throughout contract performance; documented at close-out.",
          farRef: "FAR 52.219-14 (Limitations on Subcontracting); SBA 13 CFR 125.6",
        },
        {
          term: "FAR 52.222-26 — Equal Opportunity",
          shortDef:
            "You must not discriminate in hiring or employment and must post required notices — violations can get you debarred.",
          fullExplanation:
            "This clause requires contractors with contracts of $10,000 or more to comply with Executive Order 11246, which prohibits employment discrimination based on race, color, religion, sex, sexual orientation, gender identity, or national origin. Contractors with 50+ employees and $50,000+ contracts must also have a written Affirmative Action Program (AAP) and file an EEO-1 Report annually with the EEOC.",
          contractorMustDo: [
            "Post the 'EEO is the Law' poster in all locations where employees work.",
            "Include EEO language in job postings.",
            "If you have 50+ employees and $50,000+ in contracts, develop a written AAP.",
            "File the EEO-1 report with the EEOC annually.",
            "Cooperate with OFCCP (Office of Federal Contract Compliance Programs) compliance reviews.",
          ],
          commonMistakes: [
            "Not posting the required EEO poster in all work locations, including remote offices.",
            "Small businesses with under 50 employees thinking they are exempt from everything — the basic non-discrimination requirement applies to all.",
            "Failing to file EEO-1 reports once the 50-employee / $50,000 thresholds are crossed.",
          ],
          timing: "EEO poster: immediately upon award. EEO-1 report: annually by September 30.",
          farRef: "FAR 52.222-26 (Equal Opportunity); FAR 52.222-41 for Service Contract Labor Standards",
        },
        {
          term: "FAR 52.232-33 — Payment by Electronic Funds Transfer (EFT)",
          shortDef:
            "The government will only pay you by direct deposit — you must have an active bank account registered in SAM.gov.",
          fullExplanation:
            "The government is required by law to make all payments electronically. Your bank routing and account information must be registered and current in SAM.gov. If your SAM.gov registration expires or your banking info is wrong, the government cannot pay you — and they are not required to chase you down to fix it.",
          contractorMustDo: [
            "Register bank account information in SAM.gov before submitting your first invoice.",
            "Renew your SAM.gov registration annually — it expires every 12 months.",
            "Update banking info immediately if you change banks or account numbers.",
            "Verify your EFT info before each invoice submission to avoid payment delays.",
          ],
          commonMistakes: [
            "Letting SAM.gov registration expire during contract performance — payment stops until renewed.",
            "Changing banks and forgetting to update SAM.gov, causing payments to bounce back.",
            "Not checking SAM.gov registration before a big invoice submission.",
          ],
          timing: "Must be active at time of every invoice submission. Renew SAM.gov annually.",
          farRef: "FAR 52.232-33 (Payment by Electronic Funds Transfer — System for Award Management)",
        },
        {
          term: "FAR 52.246-2 / 52.246-4 — Inspection of Supplies / Inspection of Services",
          shortDef:
            "The government has the right to inspect your work at any time and reject anything that does not conform to contract requirements.",
          fullExplanation:
            "These clauses give the government broad rights to inspect contractor deliverables — both at the contractor's facility during production and upon delivery. The government may reject nonconforming items at any time before acceptance, and the contractor must replace or correct them at no additional cost. For services, the government may inspect performance in real-time. Passing inspection does not waive government rights for later-discovered latent defects.",
          contractorMustDo: [
            "Maintain your own internal quality inspection process — do not rely on the government to find your defects.",
            "Make your facility accessible to government QA representatives (QARs) during normal business hours.",
            "Correct any identified nonconformances promptly and document corrective actions.",
            "Keep inspection records and make them available to the government upon request.",
          ],
          commonMistakes: [
            "Assuming that if the government does not show up to inspect, you can skip your own inspections.",
            "Delivering items with known defects and hoping the government does not notice — rejection costs you money to fix and damages your past performance record.",
          ],
          timing: "Government inspection rights exist throughout contract performance and up to the end of the acceptance period.",
          farRef: "FAR 52.246-2 (Inspection of Supplies — Fixed-Price); FAR 52.246-4 (Inspection of Services — Fixed-Price)",
        },
        {
          term: "FAR 52.247-34 — FOB Destination",
          shortDef:
            "You pay for shipping and bear risk of loss until goods are delivered and accepted at the government's door.",
          fullExplanation:
            "'FOB Destination' (Free On Board Destination) means the contractor is responsible for freight costs and bears the risk of loss or damage until the shipment is physically delivered to the designated delivery point. If the shipment is lost or damaged in transit, you must replace it at no cost to the government. This is the default for most government supply contracts and significantly affects your cost structure.",
          contractorMustDo: [
            "Build freight costs into your bid price — they are your responsibility.",
            "Purchase insurance or self-insure for goods in transit.",
            "Use carriers with track records for the type of freight you are shipping.",
            "Get proof of delivery (signed receipts) for every shipment.",
          ],
          commonMistakes: [
            "Not including freight in bid price because you assumed 'the government pays shipping.'",
            "Not insuring high-value shipments and absorbing a total loss when freight is damaged.",
          ],
          timing: "Applies to every shipment made under the contract.",
          farRef: "FAR 52.247-34 (F.O.B. Destination)",
        },
      ],
    },
    {
      id: "reporting",
      label: "Reporting Deliverables",
      description:
        "Recurring reports, data submissions, and formal deliverables that contractors must produce throughout contract performance.",
      terms: [
        {
          term: "Contract Data Requirements List (CDRL)",
          shortDef:
            "A formal list of every document, report, and data item you must deliver to the government, with due dates.",
          fullExplanation:
            "A CDRL (DD Form 1423 for DOD, or equivalent data lists for civilian agencies) is the contractual roadmap of all data deliverables. Each line item on the CDRL describes a specific document or report, the applicable Data Item Description (DID) that defines format and content, the due date or frequency, who to submit it to, and how many copies. CDRLs have the force of contract requirements — missing a CDRL due date is the same as missing any other deliverable.",
          contractorMustDo: [
            "Read every CDRL line item immediately upon contract award and calendar all due dates.",
            "Obtain and read the referenced DID for each CDRL item — it tells you exactly what format and content the government requires.",
            "Assign ownership of each CDRL deliverable to a specific team member.",
            "Submit to the correct authority (Technical POC, COR, or contracting office) as specified on the CDRL.",
            "Track CDRL submissions in your contract management system.",
          ],
          commonMistakes: [
            "Ignoring CDRLs and focusing only on the hardware or service deliverables — CDRL items are equally binding.",
            "Submitting the right report to the wrong office — each CDRL line specifies who receives the document.",
            "Not reading the DID and submitting a report in the wrong format, causing rejection and rework.",
          ],
          timing: "Each CDRL has its own due date — can be one-time, monthly, quarterly, or upon specific events.",
          farRef: "DD Form 1423 (Contract Data Requirements List); FAR Subpart 11.4 (Delivery)",
        },
        {
          term: "Data Item Description (DID)",
          shortDef:
            "The government's spec sheet for a required report — it tells you exactly what to put in the document and how to format it.",
          fullExplanation:
            "A DID (Data Item Description) is a standardized document — maintained by the Defense Technical Information Center (DTIC) or issuing agency — that defines the required content, format, and preparation instructions for a specific type of contract data deliverable. For example, DI-MGMT-81466 defines what goes in a Program Management Plan. Each CDRL line references a DID number, and the contractor must follow it. You can find most DIDs free on the ASSIST database at assist.dla.mil.",
          contractorMustDo: [
            "Download the referenced DID for every CDRL line at assist.dla.mil.",
            "Read the DID completely — it is the authoritative format specification.",
            "Structure your deliverable to match the DID's required sections and data elements.",
            "If the contract tailors (modifies) a DID, follow the tailoring instructions in the contract rather than the base DID.",
          ],
          commonMistakes: [
            "Submitting a generic report without following the DID format — the government will reject it.",
            "Not knowing that DIDs exist and writing the report in whatever format seems logical.",
            "Ignoring DID tailoring in the contract and following the default DID instead.",
          ],
          timing: "Follow the DID for every submission of the associated CDRL deliverable.",
          farRef: "MIL-STD-963C (Data Item Descriptions — DOD standard); DTIC ASSIST database",
        },
        {
          term: "Monthly Status Report (MSR)",
          shortDef:
            "A regular written report to the government summarizing what you accomplished, what is planned next, and any problems.",
          fullExplanation:
            "A Monthly Status Report (sometimes called a Monthly Progress Report) is a routine narrative deliverable that keeps the government informed of contract performance. Typical content includes: work accomplished this period, work planned for next period, milestones achieved or missed, schedule status (ahead/behind/on-track), cost status, issues and risks, and corrective actions. The exact required content is defined in the referenced DID or in Section C (Statement of Work).",
          contractorMustDo: [
            "Submit by the due date specified in the CDRL — commonly the 5th–15th business day of the following month.",
            "Address every topic required by the DID or SOW — do not omit sections.",
            "Be honest about schedule slips and problems — hiding problems in status reports is the fastest way to destroy government trust.",
            "Reference milestones and deliverables by their contract identifiers (CLIN, milestone number).",
          ],
          commonMistakes: [
            "Submitting a vague, congratulatory report with no specifics — government reviewers will send it back.",
            "Only reporting good news and burying problems — the government will learn eventually, and lack of early warning makes the damage worse.",
            "Submitting late because the PM was busy — status reports are contract deliverables with late penalties.",
          ],
          timing: "Typically monthly, due within 5–15 business days after the reporting period closes.",
          farRef: "DI-MGMT-80368A (Status Report — typical DID reference); contract SOW Section C",
        },
        {
          term: "Contractor Performance Assessment Reporting System (CPARS)",
          shortDef:
            "The government's official scorecard for your work — ratings here follow you to every future bid.",
          fullExplanation:
            "CPARS is the federal database where government Contracting Officers and CORs rate contractor performance on cost, schedule, quality, and management on contracts exceeding $150,000 (construction) or $750,000 (other). Ratings are: Outstanding, Very Good, Satisfactory, Marginal, and Unsatisfactory. Future contracting officers check CPARS when evaluating past performance. Bad ratings are painful and stay in the system for 6 years. You have the right to review and respond to your rating.",
          contractorMustDo: [
            "Register your point-of-contact in CPARS — the government cannot submit a rating if you are not registered.",
            "Proactively cultivate a good relationship with your COR — they often write the CPARS narrative.",
            "When you receive a draft rating, review it carefully within the 14-day comment period.",
            "If you disagree with a rating, write a professional, fact-based rebuttal in the contractor comment field.",
            "Address any performance issues early rather than letting them accumulate into a bad rating.",
          ],
          commonMistakes: [
            "Not registering in CPARS and missing your opportunity to comment on ratings.",
            "Responding to negative ratings with emotional or accusatory language — keep rebuttals professional and factual.",
            "Assuming a Satisfactory rating is fine — for competitive proposals, Very Good or Outstanding is expected.",
          ],
          timing: "Assessed annually and at contract completion. You have 14 days to comment on a draft assessment.",
          farRef: "FAR 42.1502 (Policy — Past Performance Information); FAR 42.1503 (Procedures)",
        },
        {
          term: "Funds Expenditure / Funding Status Report",
          shortDef:
            "A periodic financial report showing how much of the contract funding you have spent and what you forecast to spend.",
          fullExplanation:
            "On cost-reimbursement contracts (CPFF, CPIF, etc.), the government requires regular funding status reports showing actual costs incurred to date, forecast costs through completion, and any projected overruns. This allows the government to manage its budget and provide additional funding before you hit the ceiling. On fixed-price contracts, these may not be required, but some CDRLs still ask for financial status summaries.",
          contractorMustDo: [
            "Set up a cost accounting system that tracks actual expenditures by contract CLIN.",
            "Submit funding reports in the format and frequency specified on the CDRL.",
            "Report imminent overrun risks at least 75 days before you expect to hit the funding ceiling (the 75% and Limitation of Cost/Funds clauses require notification).",
            "Never continue work after hitting a funding ceiling without written authorization from the CO.",
          ],
          commonMistakes: [
            "Not notifying the government when costs are trending over the funded amount — you may have to absorb the overrun.",
            "Continuing to work and incurring costs after the funded ceiling is reached — you cannot bill these costs.",
            "Using cash-basis accounting instead of an accrual system for cost-reimbursement contracts.",
          ],
          timing: "Typically monthly or quarterly per CDRL; 75-day advance notice of funding ceiling breach required.",
          farRef: "FAR 52.232-20 (Limitation of Cost); FAR 52.232-22 (Limitation of Funds)",
        },
        {
          term: "Contract Closeout / Final Invoice",
          shortDef:
            "The formal process at the end of a contract where all deliverables, reports, invoices, and property are reconciled before the contract is closed.",
          fullExplanation:
            "Contract closeout is the administrative process after all work is complete where the CO verifies all deliverables were accepted, all invoices were submitted and paid, all government-furnished property was returned, all required reports were submitted, and any disputes were resolved. Contractors must submit their final invoice within the timeframe specified in the contract (often 60–120 days after performance ends). Failing to submit a final invoice on time can forfeit remaining funds.",
          contractorMustDo: [
            "Submit all final CDRL deliverables before closeout begins.",
            "Submit the final invoice clearly marked 'FINAL' within the timeframe in the contract.",
            "Return all Government-Furnished Equipment (GFE) and Government-Furnished Property (GFP) and obtain receipts.",
            "Resolve any open contract modifications or disputes.",
            "Ensure the Contractor Release of Claims is signed if required.",
          ],
          commonMistakes: [
            "Missing the final invoice deadline and losing the right to bill remaining costs.",
            "Not returning GFE/GFP, which can result in financial liability.",
            "Assuming the contract auto-closes — you must actively submit required closeout documents.",
          ],
          timing: "Closeout begins after final delivery acceptance. Final invoice typically due within 60–120 days of physical completion.",
          farRef: "FAR 4.804 (Closeout of Contract Files); FAR 52.216-7 (Allowable Cost and Payment) for cost-type",
        },
      ],
    },
    {
      id: "quality",
      label: "Quality Control",
      description:
        "Quality systems, standards, and government surveillance programs contractors must understand and comply with.",
      terms: [
        {
          term: "Quality Control Plan (QCP)",
          shortDef:
            "Your written system for catching your own defects before the government does.",
          fullExplanation:
            "A Quality Control Plan documents the contractor's internal quality management system — how you prevent, detect, and correct defects before delivering to the government. For services contracts, QCPs are particularly important because the government uses a Quality Assurance Surveillance Plan (QASP) to audit your QCP. A strong QCP that actually gets followed is your best protection against poor CPARS ratings and cure notices.",
          contractorMustDo: [
            "Write a QCP that matches the actual work you will perform — not a generic, copy-pasted template.",
            "Define specific inspection methods, frequencies, checkpoints, and responsible personnel for each major work area.",
            "Establish a process for documenting and correcting deficiencies internally.",
            "Submit the QCP for government approval if required by the contract (typically within 30 days of award).",
            "Train all employees on the QCP and enforce it consistently.",
          ],
          commonMistakes: [
            "Submitting a boilerplate QCP that has no connection to the actual work requirements.",
            "Writing a QCP and then never following it — government surveillance will expose the gap.",
            "Not updating the QCP when scope or processes change.",
          ],
          timing: "Typically due within 30 days of contract award; must be maintained throughout performance.",
          farRef: "FAR 46.301–46.311 (Contractor Responsibilities); Service contracts: Performance Work Statement (PWS) and QASP",
        },
        {
          term: "Quality Assurance Surveillance Plan (QASP)",
          shortDef:
            "The government's plan for how they will monitor your work — understand it so you know what they are grading you on.",
          fullExplanation:
            "A QASP is the government's counterpart to your QCP. It describes how, when, and how often the government (typically the COR) will inspect your performance. Methods include 100% inspection, statistical sampling, random inspection, customer complaint tracking, and periodic reviews. The QASP ties directly to the performance standards in the Performance Work Statement (PWS). Understanding the QASP lets you prioritize your own quality efforts where the government will be looking.",
          contractorMustDo: [
            "Request a copy of the QASP if it is not included in the contract — you are entitled to see it.",
            "Map the QASP surveillance points to your internal QCP checkpoints.",
            "Perform self-assessments using the same methods the government will use.",
            "Cooperate fully with government surveillance visits — denying access is a contract violation.",
          ],
          commonMistakes: [
            "Not reading the QASP and being blindsided by government inspection findings.",
            "Assuming the COR only checks monthly — some QASPs require daily observation.",
          ],
          timing: "Government surveillance occurs throughout performance per the QASP schedule.",
          farRef: "FAR 37.601 (Performance-Based Acquisition — generally); agency-specific QASP guidance",
        },
        {
          term: "ISO 9001 Certification",
          shortDef:
            "An internationally recognized quality management system certification that some government contracts require as a baseline.",
          fullExplanation:
            "ISO 9001 is the international standard for quality management systems. Some federal contracts, particularly in manufacturing and engineering services, require ISO 9001 certification as an eligibility requirement. Certification requires an independent third-party audit (called a 'certification body') to verify your quality management system meets all ISO 9001 requirements. Certification typically takes 6–18 months and costs $5,000–$50,000+ depending on company size.",
          contractorMustDo: [
            "Check whether the solicitation or contract requires ISO 9001 certification — if so, you must have it before award.",
            "Hire an accredited certification body (look for ANAB or UKAS accreditation) for the audit.",
            "Maintain certification through annual surveillance audits and triennial full recertification audits.",
            "Integrate ISO 9001 requirements into your daily operations — certifiers check whether it is lived, not just documented.",
          ],
          commonMistakes: [
            "Confusing ISO 9001 registration with actually operating a quality system — auditors look for evidence of implementation.",
            "Letting certification lapse mid-contract because you missed a surveillance audit.",
            "Assuming ISO 9001 is always required — many small business contracts do not require it.",
          ],
          timing: "Must be certified prior to contract award if required. Surveillance audits typically annually; full recertification every 3 years.",
          farRef: "Contract-specific — referenced in Section L/M (evaluation criteria) or Section C (SOW) if required",
        },
        {
          term: "AS9100 Certification",
          shortDef:
            "The aerospace and defense industry's enhanced quality standard — required for many defense manufacturing contracts.",
          fullExplanation:
            "AS9100 is the quality management standard specifically for the aerospace and defense industry, building on ISO 9001 with additional requirements for aviation, space, and defense manufacturing. It adds requirements for risk management, configuration management, and specific documentation controls critical to flight-safety items. Many prime contractors require AS9100 certification as a prerequisite for supplier qualification.",
          contractorMustDo: [
            "Obtain AS9100 certification through an IAQG-accredited certification body.",
            "Implement configuration management, first article inspection, and supplier control processes as required by AS9100.",
            "Maintain an OASIS (Online Aerospace Supplier Information System) registration — primes check this database before purchasing.",
            "Comply with additional customer-specific requirements (CSRs) from your prime contractor.",
          ],
          commonMistakes: [
            "Assuming ISO 9001 certification is sufficient for aerospace supply chain work — AS9100 is a higher bar.",
            "Not registering in OASIS, so prime contractors cannot verify your certification status.",
          ],
          timing: "Required before award for qualifying contracts. Annual surveillance audits; 3-year recertification cycle.",
          farRef: "DFARS 246.870 (Counterfeit Electronic Parts); contract-specific AS9100 requirements",
        },
        {
          term: "Nonconformance Report (NCR)",
          shortDef:
            "A formal document you must generate any time a product or process does not meet contract requirements.",
          fullExplanation:
            "An NCR is an internal quality document that records any instance where a product, material, or service does not conform to specified requirements. It triggers a formal corrective action process: disposition the item (use-as-is, repair, rework, or scrap), determine the root cause, implement corrective action, and verify effectiveness. Government contracts often require NCR logs to be available for government review. On DOD contracts, certain nonconformances must be formally submitted to the government for disposition (Material Review Board).",
          contractorMustDo: [
            "Create an NCR immediately when a nonconformance is discovered — do not use or ship the item first.",
            "Segregate and tag nonconforming items to prevent accidental use.",
            "Investigate root cause and implement corrective action.",
            "Maintain an NCR log available for government review.",
            "For DOD contracts, consult your contract to determine if government Material Review Board (MRB) concurrence is required before dispositioning certain nonconformances.",
          ],
          commonMistakes: [
            "Shipping a nonconforming item without disposition and hoping the government does not notice — this can trigger immediate rejection, rework costs, and False Claims exposure if a CoC was signed.",
            "Not maintaining an NCR log, making it impossible to demonstrate a functioning quality system.",
          ],
          timing: "Generated immediately upon discovery of nonconformance; corrective action typically required within 30 days.",
          farRef: "FAR 46.407 (Nonconforming Supplies or Services); MIL-STD-1520C for DOD (Material Review Board)",
        },
      ],
    },
    {
      id: "security",
      label: "Security & Clearance Compliance",
      description:
        "Requirements for information security, personnel clearances, and cybersecurity compliance on government contracts.",
      terms: [
        {
          term: "DD Form 254 (Contract Security Classification Specification)",
          shortDef:
            "The document that tells you exactly what classified information your contract involves and what security requirements apply.",
          fullExplanation:
            "The DD-254 is the government's primary document for communicating security classification requirements to contractors. It identifies the classification level of information you will handle, the clearance levels your employees must hold, whether your facility requires a Facility Clearance (FCL), what safeguarding requirements apply, and who your security officer contacts are. Every contractor handling classified information on DOD contracts will receive a DD-254 as part of the contract package.",
          contractorMustDo: [
            "Read the DD-254 in full immediately upon contract award.",
            "Contact the Defense Counterintelligence and Security Agency (DCSA) if a Facility Clearance (FCL) is required — initiation can take 6–18 months.",
            "Ensure all employees who will access classified information have the required security clearances before they access anything.",
            "Designate a Facility Security Officer (FSO) — a trained individual responsible for security compliance.",
            "Implement all physical security and information security controls specified in the DD-254.",
          ],
          commonMistakes: [
            "Not reading the DD-254 until weeks into performance and then discovering you need an FCL that takes a year to get.",
            "Allowing employees without clearances to access classified areas or information, even briefly.",
            "Not designating a trained FSO — this is a regulatory requirement, not optional.",
          ],
          timing: "Review immediately upon contract award; FCL sponsorship should be initiated before work begins if one is needed.",
          farRef: "DFARS 252.204-7000 (Disclosure of Information); National Industrial Security Program Operating Manual (NISPOM) — 32 CFR Part 117",
        },
        {
          term: "DFARS 252.204-7012 — Safeguarding Covered Defense Information (CDI) / Cyber Incident Reporting",
          shortDef:
            "If you handle sensitive defense data on your IT systems, you must meet NIST 800-171 cybersecurity standards and report cyber attacks within 72 hours.",
          fullExplanation:
            "DFARS 252.204-7012 requires DOD contractors to implement the 110 security controls in NIST SP 800-171 on all information systems that process, store, or transmit Covered Defense Information (CDI). CDI includes Controlled Unclassified Information (CUI) marked as having DOD distribution limitations. Additionally, if you suffer a cyber incident, you must report it to the DOD Cyber Crime Center (DC3) within 72 hours and preserve all images of compromised systems for 90 days.",
          contractorMustDo: [
            "Assess your current systems against all 110 NIST SP 800-171 controls and document the results in a System Security Plan (SSP).",
            "Create a Plan of Action and Milestones (POA&M) for any controls you cannot immediately implement.",
            "Upload your SSP assessment score to the Supplier Performance Risk System (SPRS) — the government checks this before award.",
            "Report cyber incidents to DC3 at dibnet.dod.mil within 72 hours.",
            "Flow DFARS 252.204-7012 down to all subcontractors who handle CDI.",
          ],
          commonMistakes: [
            "Thinking basic antivirus and a firewall satisfies NIST 800-171 — there are 110 controls covering access control, incident response, media protection, and more.",
            "Not submitting to SPRS — since 2020, contracting officers check SPRS scores and a missing score can disqualify you.",
            "Waiting more than 72 hours to report a cyber incident, which is a contract violation.",
          ],
          timing: "SPRS score must be current before contract award; SSP maintained throughout performance; cyber incidents reported within 72 hours.",
          farRef: "DFARS 252.204-7012 (Safeguarding Covered Defense Information and Cyber Incident Reporting); NIST SP 800-171",
        },
        {
          term: "Cybersecurity Maturity Model Certification (CMMC)",
          shortDef:
            "The DOD's new mandatory cybersecurity certification program — by 2025 you need third-party certification to bid on many defense contracts.",
          fullExplanation:
            "CMMC 2.0 is DOD's framework to verify that defense contractors actually implement the cybersecurity controls they claim to have. It has three levels: Level 1 (basic cyber hygiene — 17 controls, self-assessment), Level 2 (aligned to NIST 800-171 — 110 controls, requires a third-party assessment for most contracts), and Level 3 (advanced — reserved for the most sensitive programs). Unlike previous self-certification, Level 2 and Level 3 require audits by certified C3PAO assessors.",
          contractorMustDo: [
            "Determine which CMMC level your target contracts will require — this is specified in the solicitation.",
            "For Level 1: complete self-assessment annually and affirm in SPRS.",
            "For Level 2: hire a certified CMMC Third Party Assessment Organization (C3PAO) to perform the assessment.",
            "Implement all required NIST 800-171 controls before your C3PAO assessment.",
            "Maintain CMMC certification through triennial reassessments.",
          ],
          commonMistakes: [
            "Waiting until a solicitation requires CMMC to start preparing — the assessment process takes 6–18 months and significant investment.",
            "Confusing CMMC Level 1 (self-assessment) with Level 2 (third-party audit) — bidding on Level 2 contracts without a C3PAO certificate will result in disqualification.",
            "Not budgeting for CMMC assessment costs, which can run $30,000–$200,000+ depending on company size and readiness.",
          ],
          timing: "CMMC requirements will be phased into all DOD contracts between 2025–2027. Start preparation immediately.",
          farRef: "DFARS 252.204-7021 (Contractor Compliance with DoD CMMC Level Requirement); 32 CFR Part 170",
        },
        {
          term: "Controlled Unclassified Information (CUI)",
          shortDef:
            "Sensitive but unclassified government information that requires specific safeguarding and marking — more common than classified, and often overlooked.",
          fullExplanation:
            "CUI is information the government creates or possesses that requires safeguarding under law, regulation, or policy, but is not classified. Examples include technical drawings, export-controlled data (ITAR/EAR), privacy data (PII), law enforcement sensitive, and critical infrastructure information. Contractors must properly mark, handle, store, and transmit CUI using approved methods (e.g., encrypted email, controlled physical storage). Mishandling CUI can result in contract termination and debarment.",
          contractorMustDo: [
            "Identify all CUI you receive or create under the contract — look for the 'CUI' marking on government documents.",
            "Handle, store, and transmit CUI only through approved methods (encrypted email, government-approved cloud).",
            "Mark all documents you create that contain CUI with the proper CUI header/footer and designation.",
            "Train all employees with access to CUI on handling requirements.",
            "Report unauthorized disclosures of CUI to the government immediately.",
          ],
          commonMistakes: [
            "Emailing CUI via unencrypted email (standard Gmail, Outlook without encryption) — this is a reportable incident.",
            "Storing CUI on personal devices or unauthorized cloud storage.",
            "Not recognizing unmarked CUI — some legacy government documents are CUI even without the marking.",
          ],
          timing: "Compliance required from the moment CUI is received; immediate reporting of incidents.",
          farRef: "32 CFR Part 2002 (CUI); DFARS 252.204-7012; Executive Order 13556",
        },
        {
          term: "Facility Clearance (FCL)",
          shortDef:
            "Your company's official government clearance to store and handle classified information at your facility — separate from individual employee clearances.",
          fullExplanation:
            "A Facility Clearance is a determination by DCSA (Defense Counterintelligence and Security Agency) that your company and its facility meet the security requirements to access, store, and work with classified information. An FCL is company-level — individual employees still need separate personnel clearances. Getting an FCL requires DCSA sponsorship (usually through a prime contractor or government customer), background investigations of company leadership, physical security upgrades, and a documented security program.",
          contractorMustDo: [
            "Request FCL sponsorship from your prime contractor or government customer — you cannot self-sponsor.",
            "Designate a Facility Security Officer (FSO) and register with DCSA.",
            "Implement physical security measures (access controls, secure storage areas) as specified by DCSA.",
            "Submit to a DCSA security review and subsequent periodic reinspections.",
            "Maintain continuous FSO training and program compliance.",
          ],
          commonMistakes: [
            "Not starting the FCL process early enough — it takes 6–18+ months and you cannot perform classified work without it.",
            "Losing the FCL when key cleared personnel leave without transferring security program responsibilities.",
          ],
          timing: "Must be in place before accessing any classified information. Annual self-inspections required; DCSA reviews typically every 12–18 months.",
          farRef: "NISPOM (32 CFR Part 117); DCSA guidance at dcsa.mil",
        },
      ],
    },
    {
      id: "subcontracting",
      label: "Subcontracting Compliance",
      description:
        "Requirements governing how prime contractors manage, report on, and flow down requirements to subcontractors.",
      terms: [
        {
          term: "Small Business Subcontracting Plan",
          shortDef:
            "A required written plan committing to use small businesses as subcontractors — and you will be held to the numbers you promise.",
          fullExplanation:
            "For contracts over $750,000 (or $1.5M for construction) awarded to large businesses, FAR 52.219-9 requires a formal Small Business Subcontracting Plan with specific percentage goals for subcontracting to small businesses, small disadvantaged businesses (SDB), women-owned small businesses (WOSB), HUBZone small businesses, service-disabled veteran-owned small businesses (SDVOSB), and veteran-owned small businesses (VOSB). The prime must submit semi-annual and annual reports (SF-294/ISR/SSR) showing actual results against the plan.",
          contractorMustDo: [
            "Develop a realistic subcontracting plan as part of your proposal — do not commit to percentages you cannot achieve.",
            "Submit the subcontracting plan to the CO for approval before award.",
            "Actively recruit and use qualifying small business subcontractors throughout performance.",
            "Submit the Individual Subcontract Report (ISR) semi-annually and the Summary Subcontract Report (SSR) annually via eSRS (Electronic Subcontracting Reporting System).",
            "Document your good-faith efforts to meet the plan goals.",
          ],
          commonMistakes: [
            "Setting aggressive subcontracting goals in the proposal to win, then failing to meet them — this results in 'Unsatisfactory' past performance ratings.",
            "Not knowing that eSRS (esrs.gov) is where reports go — missing electronic filings counts as noncompliance.",
            "Thinking the plan is just a paper requirement that nobody checks — DCMA and SBA do audit subcontracting plan compliance.",
          ],
          timing: "Plan submitted with proposal or before award. ISR due within 30 days after each 6-month period; SSR due within 30 days after fiscal year end.",
          farRef: "FAR 52.219-9 (Small Business Subcontracting Plan); FAR 52.219-16 (Liquidated Damages — Subcontracting Plan)",
        },
        {
          term: "Consent to Subcontract",
          shortDef:
            "On cost-type contracts, you must get the government's written permission before hiring certain subcontractors.",
          fullExplanation:
            "FAR 52.244-2 requires that on cost-reimbursement contracts, contractors obtain the Contracting Officer's written consent before placing subcontracts above $25,000 (or a higher threshold specified in the contract) that are cost-type, time-and-materials, or labor-hour subcontracts — or any fixed-price subcontract above $1M. The CO reviews the proposed subcontract for cost reasonableness, subcontractor qualifications, and terms. Without consent, the subcontract costs may be disallowed.",
          contractorMustDo: [
            "Submit a consent to subcontract request to the CO with the proposed subcontract, a price/cost analysis, and subcontractor qualifications.",
            "Do not award the subcontract or obligate the subcontractor to begin work until written consent is received.",
            "Include consent to subcontract flow-down requirements in your subcontracts if required.",
            "Keep a log of all subcontracts and their consent status.",
          ],
          commonMistakes: [
            "Awarding subcontracts before receiving consent and then discovering the government will not reimburse those costs.",
            "Assuming consent from a prior contract year carries over to a new option year — consent is typically needed per order or year.",
          ],
          timing: "Request must be submitted and approved before the subcontract is awarded.",
          farRef: "FAR 52.244-2 (Subcontracts); FAR 44.201 (Consent to Subcontract — Policy)",
        },
        {
          term: "Flow-Down Requirements",
          shortDef:
            "Contract clauses your prime contract requires you to pass down to your subcontractors in their subcontract agreements.",
          fullExplanation:
            "Many FAR and DFARS clauses contain flow-down provisions requiring prime contractors to include those same clauses in their subcontracts. Common examples include: FAR 52.204-21 (cybersecurity), FAR 52.222-26 (equal opportunity), FAR 52.222-50 (human trafficking), DFARS 252.204-7012 (safeguarding CDI), and small business subcontracting requirements. Failure to flow down required clauses can make the prime contractor liable for the sub's noncompliance.",
          contractorMustDo: [
            "Review each clause in your prime contract for flow-down language (typically says 'insert this clause in subcontracts...').",
            "Include all required flow-down clauses in every subcontract at the applicable tier.",
            "Train your subcontract managers on which clauses must be flowed down.",
            "Audit subcontractors' compliance with flowed-down requirements, particularly cybersecurity and labor standards.",
          ],
          commonMistakes: [
            "Using a standard commercial subcontract template that omits all government-required clauses.",
            "Failing to flow DFARS 252.204-7012 to subcontractors who handle CDI — this is audited and enforced.",
            "Not checking flow-down requirements when contract modifications add new clauses.",
          ],
          timing: "Must be included at subcontract award; reviewed whenever prime contract is modified.",
          farRef: "FAR 44.403 (Subcontract Clause — Flow-Down); specific clauses identify their own flow-down triggers",
        },
        {
          term: "Subcontractor Past Performance",
          shortDef:
            "The government considers your subcontractors' past performance when rating you — choose subcontractors carefully.",
          fullExplanation:
            "In performance assessments, the government evaluates the prime contractor's management of subcontractors, including whether subcontractor performance problems were identified and corrected. Large subcontractors may receive their own CPARS ratings through the prime. Poor subcontractor performance that the prime failed to manage reflects negatively on the prime's management CPARS rating. Subcontractor failures are not an acceptable excuse for missed deliverables.",
          contractorMustDo: [
            "Check CPARS (cpars.gov) for subcontractors' historical performance before awarding subcontracts (you can search as a prime).",
            "Verify subcontractors' past performance references.",
            "Actively manage subcontractor performance — conduct regular reviews, not just invoice approvals.",
            "Document issues and corrective actions taken with subcontractors.",
          ],
          commonMistakes: [
            "Selecting subcontractors based solely on lowest price without checking their past performance history.",
            "Adopting a hands-off approach to subcontractor management and being blindsided by failures.",
          ],
          timing: "Due diligence before award; active management throughout performance.",
          farRef: "FAR 42.1502(e) (Subcontractor past performance); FAR 15.305(a)(2) (Proposal evaluation — past performance)",
        },
      ],
    },
    {
      id: "gotchas",
      label: "Common Gotchas & Enforcement",
      description:
        "Situations that commonly trigger cure notices, show cause letters, or contract terminations — and how to avoid them.",
      terms: [
        {
          term: "Cure Notice",
          shortDef:
            "A formal government warning that you are in danger of defaulting — you have 10 days to tell them how you will fix it.",
          fullExplanation:
            "A Cure Notice is a written notice from the Contracting Officer that the contractor's performance is endangering timely contract completion. Upon receiving a cure notice, the contractor has 10 days to provide a written plan for curing the deficiency. If the plan is not submitted or is not adequate, the government can proceed to terminate the contract for default. A cure notice is a major red flag — it directly impacts your past performance rating and ability to win future contracts.",
          contractorMustDo: [
            "Respond within 10 days with a written cure plan — do not miss this deadline.",
            "Be specific in the cure plan: what the problem is, what caused it, exactly what you will do to fix it, and when it will be fixed.",
            "Implement the cure plan immediately and provide regular updates to the CO.",
            "Do not argue about whether the cure notice was justified in your initial response — fix the problem first, dispute later.",
          ],
          commonMistakes: [
            "Ignoring or delaying response to a cure notice — 10 days is a hard deadline.",
            "Submitting a vague cure plan that promises to 'do better' without specifics — this will not satisfy the government.",
            "Curing the immediate problem without addressing the root cause, leading to a second cure notice.",
          ],
          timing: "Response due within 10 calendar days of receiving the cure notice.",
          farRef: "FAR 49.607 (Cure Notice); FAR 52.249-8 (Default — Fixed-Price Supply and Service)",
        },
        {
          term: "Show Cause Notice",
          shortDef:
            "A more serious warning than a cure notice — you must explain why your contract should NOT be terminated for default.",
          fullExplanation:
            "A Show Cause Notice is issued when the government already has grounds to terminate the contract for default and is giving the contractor an opportunity to present reasons why it should not do so. This typically happens after a cure period fails or when a delivery date has already been missed. The contractor must explain what happened, why it was excusable (if claiming excuse), and what they can do to complete performance. Failure to adequately respond results in termination for default.",
          contractorMustDo: [
            "Respond promptly (typically within 10 days, but check the notice — the deadline may be shorter).",
            "Consult legal counsel before responding — a show cause response can affect your rights in later disputes.",
            "Document all excusable causes: government-caused delays, acts of God, labor disputes, and other grounds recognized in FAR 52.249-8.",
            "Provide a realistic completion schedule with specific milestones.",
            "If you cannot complete the work, be honest — negotiating a termination for convenience is far better for your record than a termination for default.",
          ],
          commonMistakes: [
            "Responding emotionally or blaming the government without documenting facts.",
            "Claiming excusable delay without specific evidence to support the claim.",
            "Not consulting a contracts attorney before responding — this is a legally consequential document.",
          ],
          timing: "Response typically due within 10 days of receipt; confirm deadline in the notice itself.",
          farRef: "FAR 49.607(b) (Show Cause Notice); FAR 52.249-8 (Default clause)",
        },
        {
          term: "Termination for Default (T4D)",
          shortDef:
            "The worst outcome: the government ends your contract because of your failure — you may owe them money and your past performance record is permanently damaged.",
          fullExplanation:
            "A Termination for Default is the government's remedy when a contractor fails to perform and cannot cure the failure. The consequences are severe: the government can reprocure the work from another contractor and charge you the excess costs; you get no payment for unaccepted work; your CPARS record is marked with a termination for default; and you may be suspended or debarred from future contracting. T4D can be converted to a Termination for Convenience (T4C) if the contractor successfully protests the default.",
          contractorMustDo: [
            "Contact the CO immediately when you recognize you cannot meet a key contract requirement — early communication always produces better outcomes than hiding problems.",
            "Document everything — if the delay was caused by the government or excusable causes, that documentation is your protection.",
            "If you receive a T4D notice, immediately consult a government contracts attorney — you have limited time to appeal.",
            "File an appeal to the appropriate Board of Contract Appeals or the Court of Federal Claims if the T4D is wrongful.",
          ],
          commonMistakes: [
            "Not communicating performance problems early and hoping they resolve on their own.",
            "Not keeping contemporaneous records of government-caused delays that could excuse your default.",
            "Accepting a T4D without challenging it when there are legitimate excusable causes.",
          ],
          timing: "The government can issue a T4D at any time after a cure or show cause period expires without resolution.",
          farRef: "FAR 49.401–49.402 (Termination for Default); FAR 52.249-8 (Default clause)",
        },
        {
          term: "Termination for Convenience (T4C)",
          shortDef:
            "The government can end your contract at any time for any reason — but they must pay you for work done and reasonable settlement costs.",
          fullExplanation:
            "Unlike T4D, a Termination for Convenience allows the government to end a contract when it is in the government's interest to do so — even if the contractor has done nothing wrong. The contractor is entitled to be paid for all costs incurred for work accepted, plus a reasonable profit on that work and settlement costs (e.g., subcontract settlements, costs of stopping work). The contractor must submit a settlement proposal — this is a detailed accounting of all costs incurred and settlement costs claimed.",
          contractorMustDo: [
            "Stop all work immediately upon receipt of a T4C notice (unless the CO instructs you to continue certain work).",
            "Terminate all subcontracts and purchase orders promptly.",
            "Preserve all work in progress and submit an inventory of undelivered items.",
            "Submit a settlement proposal within one year of the termination notice (or within the time specified).",
            "Maintain detailed cost records to support your settlement claim.",
          ],
          commonMistakes: [
            "Continuing to incur costs after a T4C notice — post-termination costs are generally not allowable.",
            "Not submitting a settlement proposal because it is complex — unclaimed costs are lost.",
            "Not preserving work in progress for government disposition.",
          ],
          timing: "Settlement proposal typically due within 1 year of termination notice.",
          farRef: "FAR 49.101–49.112 (Termination for Convenience); FAR 52.249-2 (T4C for Fixed-Price contracts)",
        },
        {
          term: "False Claims Act (FCA) Liability",
          shortDef:
            "Federal law that makes it illegal to submit a false or fraudulent claim to the government — violations carry treble damages and $27,000+ per claim penalties.",
          fullExplanation:
            "The False Claims Act imposes liability on anyone who knowingly submits a false or fraudulent claim for payment to the government, or makes false statements to get a false claim paid. 'Knowingly' includes reckless disregard and deliberate ignorance — you do not have to actually intend fraud. Common violations: billing for work not performed, misrepresenting cost or pricing data, falsely certifying compliance with contract requirements, and submitting invoices for unallowable costs on cost-type contracts. Penalties are triple the government's damages plus $13,946–$27,894 per false claim (adjusted annually).",
          contractorMustDo: [
            "Never sign a Certificate of Conformance, certification, or invoice for goods or services that do not conform to contract requirements.",
            "Ensure cost accounting on cost-type contracts is accurate and only allowable, allocable costs are billed.",
            "Train employees on FCA basics — any employee can be a whistleblower (qui tam relator).",
            "If you discover a potential FCA issue, consult legal counsel immediately about voluntary disclosure.",
          ],
          commonMistakes: [
            "Billing for labor at rates higher than actually paid (the most common FCA violation in services contracts).",
            "Certifying compliance with socioeconomic requirements (small business size, 8(a) eligibility) you do not actually meet.",
            "Signing cost or pricing certifications without verifying the underlying data.",
          ],
          timing: "Applies to every invoice, certification, and claim submitted throughout the contract.",
          farRef: "31 U.S.C. §§ 3729–3733 (False Claims Act); FAR 3.901–3.906 (Anti-kickback procedures); FAR 15.403 (Certified Cost or Pricing Data)",
        },
        {
          term: "Anti-Kickback Act Violations",
          shortDef:
            "You cannot offer, pay, or receive anything of value to influence contract award or subcontract decisions — even a business lunch can be a problem.",
          fullExplanation:
            "The Anti-Kickback Act prohibits contractors, subcontractors, and their employees from providing or accepting anything of value (kickbacks) intended to improperly obtain or reward favorable treatment in connection with government contract awards. This includes cash payments, gifts, entertainment, and future employment offers. It also includes payments to government employees to influence their decisions. Violations are criminal — up to 10 years in prison and substantial fines.",
          contractorMustDo: [
            "Establish and enforce a gift and entertainment policy limiting what employees can give or receive.",
            "Train employees on the Anti-Kickback Act, especially those involved in subcontract sourcing.",
            "Report suspected kickback activity to the CO or Inspector General.",
            "Include anti-kickback provisions in subcontract agreements.",
          ],
          commonMistakes: [
            "Providing lavish entertainment to government employees in the belief it is harmless relationship-building.",
            "Not documenting legitimate business meals/entertainment with specific business purpose.",
          ],
          timing: "Applies throughout the entire contractor-government relationship.",
          farRef: "FAR 52.203-7 (Anti-Kickback Procedures); 41 U.S.C. Chapter 87 (Anti-Kickback Act)",
        },
        {
          term: "Organizational Conflicts of Interest (OCI)",
          shortDef:
            "If your company helps write the requirements for a contract, you may be prohibited from bidding on it.",
          fullExplanation:
            "An OCI occurs when a contractor's objectivity in performing work is impaired, or when they have an unfair competitive advantage, due to their relationship with the government or other contracts. Common OCI types: (1) Impaired objectivity — you evaluate your own work; (2) Unequal access to information — you have access to non-public competitor pricing; (3) Biased ground rules — you wrote the specs that favor your own products. OCIs can disqualify you from contract award even after winning.",
          contractorMustDo: [
            "Disclose any potential OCI to the CO as soon as you become aware of it.",
            "Develop a mitigation plan if an OCI exists but can be managed.",
            "Be cautious about accepting advisory and assistance work if you might later bid on the implementation contract.",
            "Review all pre-solicitation activities for potential OCI issues before bidding.",
          ],
          commonMistakes: [
            "Not disclosing a potential OCI because you assume the government will not find out — undisclosed OCIs discovered after award can result in contract termination.",
            "Not recognizing that subcontractor relationships can also create OCI issues for the prime.",
          ],
          timing: "Disclose immediately upon discovery; OCI plans submitted with proposals if required.",
          farRef: "FAR 9.5 (Organizational and Consultant Conflicts of Interest); FAR 52.209-7 (Information Regarding Responsibility Matters)",
        },
        {
          term: "Prompt Payment Act & Interest Penalties",
          shortDef:
            "The government owes you interest if they pay late — but only if you submitted a 'proper invoice.'",
          fullExplanation:
            "The Prompt Payment Act requires the government to pay within 30 days of a proper invoice (or within the number of days specified in the contract). If payment is late, the government owes you interest at the Prompt Payment Act rate (typically around 8%). However, the 30-day clock does not start until the invoice is 'proper' — meaning it has the correct contract number, CLIN, invoice number, amount, vendor address, description of goods/services, and all required supporting documentation. Improper invoices are returned without starting the clock.",
          contractorMustDo: [
            "Submit invoices only after confirming they contain every required element (check your contract's billing instructions).",
            "Include all required supporting documents: receiving reports, timesheets, CoC, CDRL deliverables if required.",
            "Use WAWF or IPP as required — paper invoices may not start the payment clock.",
            "Track invoice submission dates and follow up if payment is not received within 30 days.",
          ],
          commonMistakes: [
            "Submitting an invoice and assuming the 30-day clock is running, when the government actually rejected it as improper and you were not notified.",
            "Not including required backup documentation, causing repeated rejections and cash flow problems.",
          ],
          timing: "Government must pay within 30 days of a proper invoice. Interest accrues automatically on late payments.",
          farRef: "FAR 52.232-25 (Prompt Payment); 31 U.S.C. §§ 3901–3907 (Prompt Payment Act)",
        },
      ],
    },
    {
      id: "post-award-timeline",
      label: "Post-Award Deliverables Timeline",
      description:
        "What you must typically deliver in the first 30, 60, and 90 days after contract award — before you may have delivered a single product or service.",
      terms: [
        {
          term: "Kick-Off Meeting (KOM)",
          shortDef:
            "A required post-award meeting with the government to align on contract requirements, roles, and schedule — usually mandatory within 30 days of award.",
          fullExplanation:
            "The post-award Kick-Off Meeting (KOM) is a formal meeting between the contractor and government team to review contract requirements, introduce key personnel, establish points of contact, clarify ambiguities, and review the schedule. Many contracts require the contractor to prepare and submit a KOM agenda and a post-KOM meeting minutes summary. The KOM is your best opportunity to surface and resolve ambiguities before they become disputes.",
          contractorMustDo: [
            "Prepare a proposed KOM agenda and submit it to the COR/CO at least 5 business days before the meeting.",
            "Bring all key personnel: PM, technical lead, contracts/subcontracts manager.",
            "Come prepared with questions about unclear requirements — this is the time to ask.",
            "Document the meeting and distribute minutes within 5–10 business days.",
          ],
          commonMistakes: [
            "Treating the KOM as a formality and not preparing questions — missed clarifications become costly change orders or disputes later.",
            "Not including all required attendees, particularly the Facility Security Officer if a DD-254 is involved.",
          ],
          timing: "Typically within 14–30 days of contract award; date may be specified in the contract.",
          farRef: "Referenced in PWS/SOW Section C or contract requirement; no specific FAR clause, but industry-standard practice",
        },
        {
          term: "Project Management Plan (PMP)",
          shortDef:
            "A formal written plan describing how you will manage the project — schedule, resources, risks, communications, and more.",
          fullExplanation:
            "A Project Management Plan (PMP) is a comprehensive document describing how the contractor will execute, monitor, and control the contract. It typically includes: organizational structure, key personnel roles, master schedule (often an Integrated Master Schedule — IMS), risk management approach, communications plan, quality management approach, and subcontract management approach. The PMP is reviewed and approved by the government and becomes a contract baseline document.",
          contractorMustDo: [
            "Write the PMP to the level of detail required by the DID (e.g., DI-MGMT-81466).",
            "Include a realistic Integrated Master Schedule (IMS) in the PMP or as a standalone deliverable.",
            "Submit draft PMP at least 30 days before the approval due date to allow government review time.",
            "Update the PMP whenever significant changes occur — it is a living document.",
          ],
          commonMistakes: [
            "Submitting a generic PMP template without tailoring it to the specific contract work.",
            "Creating an overly optimistic schedule in the PMP and then immediately falling behind it.",
            "Not updating the PMP when scope changes — the approved PMP is a baseline document that must stay current.",
          ],
          timing: "Typically due within 30–60 days of contract award.",
          farRef: "DI-MGMT-81466 (Program Management Plan — DID); referenced on CDRL",
        },
        {
          term: "Key Personnel Notification",
          shortDef:
            "If your contract designates key personnel, you must notify the government if any of them leave and get approval before replacing them.",
          fullExplanation:
            "Most government contracts designate certain key personnel (Program Manager, Principal Investigator, Lead Systems Engineer, etc.) whose qualifications were evaluated in the proposal. The contractor must notify the CO in writing before replacing any key personnel and obtain approval of the replacement. In some contracts, the CO has the right to reject a proposed replacement. Using non-approved personnel in key positions can be a contract violation.",
          contractorMustDo: [
            "Identify all key personnel in your contract and put safeguards in place to retain them.",
            "Notify the CO in writing at least 30 days before a planned departure (or immediately for unplanned departures).",
            "Propose a replacement with equal or better qualifications.",
            "Do not allow the departing key person to transfer responsibilities until the replacement is approved.",
          ],
          commonMistakes: [
            "Replacing a key person without notifying the government — this can result in a cure notice or withheld payment.",
            "Proposing a replacement with significantly lesser qualifications than the original — the CO can reject the proposal.",
            "Not reading the key personnel clause carefully — some contracts allow 30 days notice, others require approval before any transition.",
          ],
          timing: "Notice required typically 30 days before replacement or immediately if unplanned.",
          farRef: "FAR 52.237-3 (Continuity of Services); contract-specific key personnel clauses in Section H or I",
        },
        {
          term: "Contractor Furnished Equipment / Government Furnished Property (GFP) Accountability",
          shortDef:
            "If the government loans you equipment or materials, you are financially liable for them — maintain a formal inventory.",
          fullExplanation:
            "Government-Furnished Property (GFP) includes equipment, materials, data, and facilities that the government provides for contractor use. The contractor assumes legal responsibility for care, custody, and safekeeping of all GFP from the moment of receipt. You must maintain a formal GFP inventory, report any loss, damage, or destruction immediately, and return all GFP at contract closeout. Loss or damage can result in financial liability to the contractor.",
          contractorMustDo: [
            "Acknowledge receipt of all GFP in writing upon delivery.",
            "Create and maintain a GFP inventory log with item descriptions, serial numbers, and locations.",
            "Report any loss, damage, or destruction within 10 days of discovery.",
            "Store GFP in a secure, designated location — do not commingle with contractor-owned property.",
            "Return all GFP at contract closeout and obtain government receipts.",
          ],
          commonMistakes: [
            "Treating GFP as 'free equipment' without maintaining accountability — you are liable for losses.",
            "Commingling GFP with company-owned property and being unable to account for it at closeout.",
            "Not reporting GFP damage immediately, which can transform a simple accident into a fraud allegation.",
          ],
          timing: "Inventory established at receipt; quarterly or semi-annual reporting often required; full reconciliation at contract close.",
          farRef: "FAR 52.245-1 (Government Property); FAR Part 45 (Government Property)",
        },
        {
          term: "SAM.gov Registration Maintenance",
          shortDef:
            "You must maintain an active, accurate SAM.gov registration throughout contract performance — it expires annually and must be renewed.",
          fullExplanation:
            "System for Award Management (SAM.gov) is the federal contractor database. Without an active SAM.gov registration, you cannot receive payments. Registration expires every 12 months and must be manually renewed. The renewal process takes 2–5 business days but can take up to 2 weeks if your CAGE code needs updating. Lapsed registration is surprisingly common and can freeze all payment processing.",
          contractorMustDo: [
            "Set a calendar reminder 60 days before your SAM.gov expiration date.",
            "Log in to SAM.gov annually and renew even if nothing has changed.",
            "Update any changes to your banking information, address, NAICS codes, or points of contact promptly.",
            "Verify your registration is Active before submitting any invoice.",
          ],
          commonMistakes: [
            "Missing the annual renewal and discovering the expiration only when a payment is returned.",
            "Updating banking information directly at your bank without updating SAM.gov — ACH payments go to the SAM.gov-registered account.",
          ],
          timing: "Annual renewal required. Set reminders 60 days before expiration.",
          farRef: "FAR 52.204-7 (System for Award Management); FAR 52.232-33 (EFT Payment)",
        },
        {
          term: "30-Day Post-Award Checklist (Summary)",
          shortDef:
            "The critical first 30 days after award set the tone for your entire contract — here is what typically must be done.",
          fullExplanation:
            "Most government contracts require a burst of administrative and planning activity in the first 30 days. Missing early deadlines signals poor management and can trigger government concern before any work product is produced. The 30-day window is when you establish your quality plan, hold kick-off meetings, submit key plans, verify security clearances, and set up your payment systems.",
          contractorMustDo: [
            "Day 1: Read every page of the contract — all sections, all clauses, all attachments.",
            "Day 1: Identify and calendar all CDRL due dates.",
            "Day 1: Verify SAM.gov registration is active and banking info is current.",
            "Day 1–5: Register for WAWF/IPP if not already registered.",
            "Day 1–5: Assign a CPARS point of contact and register in CPARS.",
            "Day 1–7: Identify all key personnel and verify their availability.",
            "Day 1–7: Identify all GFP expected and prepare to take accountability.",
            "Day 7–14: Prepare and submit KOM agenda to CO/COR.",
            "Day 14–21: Hold KOM.",
            "Day 21–30: Submit QCP if required (check CDRL due date).",
            "Day 21–30: Submit Draft PMP if required.",
            "Day 30: Confirm first CDRL deliverable due dates are calendared and assigned.",
          ],
          commonMistakes: [
            "Not reading the full contract until a problem arises — discover requirements before they become violations.",
            "Assuming your contract manager / BD person will handle administration while you focus on technical work — everyone needs to understand the compliance requirements.",
          ],
          timing: "First 30 calendar days post-award.",
          farRef: "Multiple — see individual checklist items",
        },
        {
          term: "Wage Determination / Service Contract Act (SCA) Compliance",
          shortDef:
            "For service contracts, the government sets minimum wages and fringe benefits you must pay your employees — these differ by job category and location.",
          fullExplanation:
            "The Service Contract Act (SCA), incorporated via FAR 52.222-41, requires contractors performing services to pay employees no less than the wage rates and fringe benefits determined by the Department of Labor for the specific county and occupation category. Wage Determinations (WDs) are incorporated into the contract and list specific minimum rates for janitors, security guards, technicians, and hundreds of other job titles. Paying below the WD rates — even in the first month — triggers back-pay obligations and debarment risk.",
          contractorMustDo: [
            "Read the Wage Determination incorporated in your contract and identify the applicable wage rates for every job title you will use.",
            "Pay at least the WD minimum rates — you can pay more, never less.",
            "Provide the required fringe benefits (health & welfare, vacation) or the cash equivalent.",
            "Post the Notice to Employees poster (WHD Publication 1313) at all work sites.",
            "Maintain payroll records for 3 years after contract completion.",
          ],
          commonMistakes: [
            "Using your standard company pay scales without checking the WD — your rates may be below the legal minimums.",
            "Not knowing that SCA applies to most service contracts over $2,500 — it is very broad.",
            "Treating health and welfare fringe benefit rates as optional — they are a legal minimum the employee must receive.",
          ],
          timing: "Compliance required from day one of performance; payroll records retained 3 years post-completion.",
          farRef: "FAR 52.222-41 (Service Contract Labor Standards); 41 U.S.C. Chapter 67 (Service Contract Act); FAR 52.222-43 (Fair Labor Standards Act and SCA — Price Adjustment)",
        },
        {
          term: "Buy American Act Compliance",
          shortDef:
            "For supply contracts, goods you deliver must generally be manufactured in the United States — and you must certify this.",
          fullExplanation:
            "The Buy American Act (BAA) requires that goods and materials acquired for use in the U.S. must be domestic end products (manufactured in the U.S. with at least 55% domestic component cost — or 75% under TINA thresholds for iron, steel, and certain other items). Contractors must certify compliance with the BAA when submitting offers and must track whether their components meet the domestic content thresholds. Exceptions apply for certain products not available domestically, or under Trade Agreements Act (TAA) for certain countries.",
          contractorMustDo: [
            "Review the Buy American certification in your contract offer — you signed it, and it is legally binding.",
            "Trace your supply chain for components to verify country of origin.",
            "Document the domestic content percentage for each end product.",
            "If using foreign components above threshold, apply for a waiver before delivery or verify TAA applicability.",
          ],
          commonMistakes: [
            "Certifying BAA compliance without actually tracing the supply chain — signing a false certification is FCA exposure.",
            "Assuming products made in a TAA-compliant country (e.g., Canada, UK, most EU countries) automatically satisfy BAA — TAA compliance is a separate analysis.",
            "Not knowing that China, Russia, and most others are NOT TAA-compliant countries.",
          ],
          timing: "Certification submitted with offer; compliance required for every delivery throughout contract.",
          farRef: "FAR 52.225-1 (Buy American — Supplies); FAR 52.225-3 (Buy American Act — Free Trade Agreements — Israeli Trade Act); 41 U.S.C. Chapter 83",
        },
      ],
    },
  ],
};

