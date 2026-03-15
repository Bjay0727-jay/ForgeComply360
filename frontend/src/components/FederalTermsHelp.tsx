import React, { useState, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Federal Terms Glossary Data
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  term: string;
  acronym: string;
  definition: string;
  context?: string;
  learnMoreUrl?: string;
}

export const FEDERAL_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'System Security Plan',
    acronym: 'SSP',
    definition: 'A formal document that describes the security controls in place or planned for an information system, including how each control is implemented.',
    context: 'Required for all federal information systems under FISMA. The SSP is the primary artifact reviewed during ATO assessments.',
  },
  {
    term: 'Authority to Operate',
    acronym: 'ATO',
    definition: 'Official authorization granted by an Authorizing Official (AO) allowing an information system to operate at an acceptable level of risk.',
    context: 'Without an ATO, a federal system cannot process data. ATOs are typically granted for 3 years, with ongoing continuous monitoring.',
  },
  {
    term: 'Plan of Action & Milestones',
    acronym: 'POA&M',
    definition: 'A document that identifies tasks needing to be accomplished to correct deficiencies found during security assessments. Tracks weaknesses, remediation plans, and target completion dates.',
    context: 'POA&Ms are living documents reviewed regularly by ISSOs and Authorizing Officials. They are required as part of the ATO package.',
  },
  {
    term: 'Information System Security Officer',
    acronym: 'ISSO',
    definition: 'The individual responsible for ensuring the day-to-day security posture of an information system, including monitoring, incident response, and compliance activities.',
    context: 'Every federal system must have a designated ISSO who serves as the primary point of contact for security matters.',
  },
  {
    term: 'Federal Information Processing Standard 199',
    acronym: 'FIPS 199',
    definition: 'Standards for Security Categorization of Federal Information and Information Systems. Defines three impact levels — Low, Moderate, and High — based on confidentiality, integrity, and availability.',
    context: 'FIPS 199 categorization determines the baseline set of security controls required. Most federal systems are categorized as Moderate impact.',
  },
  {
    term: 'Open Security Controls Assessment Language',
    acronym: 'OSCAL',
    definition: 'A NIST standard providing machine-readable formats (JSON, XML, YAML) for security plans, assessment results, and component definitions.',
    context: 'OSCAL enables automated processing of compliance documentation. FedRAMP is transitioning to OSCAL-based submissions.',
  },
  {
    term: 'Federal Risk and Authorization Management Program',
    acronym: 'FedRAMP',
    definition: 'A government-wide program providing a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services.',
    context: 'Cloud service providers must achieve FedRAMP authorization to sell to federal agencies. Baselines: Low, Moderate, High.',
  },
  {
    term: 'Cybersecurity Maturity Model Certification',
    acronym: 'CMMC',
    definition: 'A Department of Defense framework that assesses and certifies the cybersecurity practices of defense industrial base (DIB) contractors.',
    context: 'CMMC 2.0 has three levels: Foundational (Level 1), Advanced (Level 2), and Expert (Level 3). Required for DoD contracts handling CUI.',
  },
  {
    term: 'Federal Information Security Modernization Act',
    acronym: 'FISMA',
    definition: 'Federal law that requires agencies to develop, document, and implement information security programs to protect federal information and systems.',
    context: 'FISMA mandates annual security assessments, continuous monitoring, and reporting to OMB and Congress on cybersecurity posture.',
  },
  {
    term: 'NIST Special Publication 800-53',
    acronym: 'NIST 800-53',
    definition: 'The comprehensive catalog of security and privacy controls for federal information systems, organized into 20 control families with over 1,000 controls.',
    context: 'Rev 5 (current) includes privacy controls and is technology-neutral. It serves as the foundation for FedRAMP, FISMA, and CMMC compliance.',
  },
  {
    term: 'Risk Management Framework',
    acronym: 'RMF',
    definition: 'A NIST framework (SP 800-37) that integrates security, privacy, and cyber supply chain risk management into the system development lifecycle.',
    context: 'RMF steps: Categorize, Select, Implement, Assess, Authorize, Monitor. It replaced the Certification & Accreditation (C&A) process.',
  },
  {
    term: 'Security Technical Implementation Guide',
    acronym: 'STIG',
    definition: 'Configuration standards published by DISA (Defense Information Systems Agency) for securing DoD information systems.',
    context: 'STIGs provide hardening guidance for specific technologies (Windows, Linux, databases, network devices). Compliance is checked via SCAP tools.',
  },
  {
    term: 'Controlled Unclassified Information',
    acronym: 'CUI',
    definition: 'Information that requires safeguarding or dissemination controls consistent with federal laws, regulations, and government-wide policies.',
    context: 'CUI replaces various legacy markings (FOUO, SBU, etc.). Handling requirements are defined in NIST SP 800-171.',
  },
  {
    term: 'Continuous Monitoring',
    acronym: 'CONMON',
    definition: 'The ongoing awareness of information security, vulnerabilities, and threats to support organizational risk management decisions.',
    context: 'CONMON includes automated scanning, log review, configuration checks, and periodic control assessments. Required to maintain an ATO.',
  },
  {
    term: 'Authorizing Official',
    acronym: 'AO',
    definition: 'A senior federal official with the authority to accept the risk of operating an information system and formally authorize it (grant ATO).',
    context: 'The AO is ultimately responsible for the security of the system and reviews the ATO package including SSP, SAR, and POA&Ms.',
  },
  {
    term: 'Security Assessment Report',
    acronym: 'SAR',
    definition: 'A document that details the results of a comprehensive security assessment, including findings, recommendations, and risk ratings.',
    context: 'The SAR is produced by an independent assessor (3PAO for FedRAMP) and is a key component of the ATO package.',
  },
];

// ---------------------------------------------------------------------------
// GlossaryTooltip - Inline term with hover/click tooltip
// ---------------------------------------------------------------------------

export function GlossaryTooltip({ acronym, children }: { acronym: string; children?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const entry = FEDERAL_GLOSSARY.find(g => g.acronym === acronym);

  if (!entry) return <span>{children || acronym}</span>;

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="text-blue-600 border-b border-dashed border-blue-400 cursor-help font-medium hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-expanded={show}
        aria-describedby={`glossary-${acronym}`}
      >
        {children || acronym}
      </button>
      {show && (
        <div
          id={`glossary-${acronym}`}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-left"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{entry.acronym}</span>
            <span className="text-xs font-semibold text-gray-900">{entry.term}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{entry.definition}</p>
          {entry.context && (
            <p className="text-[11px] text-gray-400 mt-1.5 italic leading-relaxed">{entry.context}</p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FederalTermsPanel - Full glossary panel (drawer/modal)
// ---------------------------------------------------------------------------

export function FederalTermsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  const filtered = FEDERAL_GLOSSARY.filter(entry =>
    entry.acronym.toLowerCase().includes(search.toLowerCase()) ||
    entry.term.toLowerCase().includes(search.toLowerCase()) ||
    entry.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Federal Compliance Glossary"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-800 to-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Federal Compliance Glossary</h2>
              <p className="text-blue-200 text-xs mt-0.5">{FEDERAL_GLOSSARY.length} terms &middot; SSP, ATO, POA&M, ISSO, FIPS 199, OSCAL & more</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-700/50 transition-colors"
              aria-label="Close glossary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search terms (e.g. ATO, POA&M, FIPS)..."
              className="w-full pl-9 pr-4 py-2 bg-blue-700/50 text-white placeholder-blue-300 border border-blue-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {filtered.map(entry => (
            <div key={entry.acronym} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{entry.acronym}</span>
                <span className="text-sm font-semibold text-gray-900">{entry.term}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{entry.definition}</p>
              {entry.context && (
                <div className="mt-2 flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-500 leading-relaxed">{entry.context}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No terms match "{search}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            Terms based on NIST SP 800-53 Rev 5, FIPS 199/200, FISMA, and FedRAMP guidelines.
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// HelpButton - Floating help button that opens the glossary
// ---------------------------------------------------------------------------

export function FederalTermsHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-full shadow-lg flex items-center justify-center transition-colors group"
        aria-label="Open Federal Compliance Glossary"
        title="Federal Terms Help"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <FederalTermsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
