/**
 * ForgeComply 360 Reporter - OSCAL SSP Viewer Component
 * Renders OSCAL System Security Plan as formatted, collapsible HTML
 * Similar to https://viewer.oscal.io
 */
import React, { useState, useMemo } from 'react';
import { C } from '../config/colors';
import type { SSPData } from '../types';

interface OscalViewerProps {
  isOpen: boolean;
  onClose: () => void;
  data: SSPData;
  documentTitle?: string;
  orgName?: string;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false, badge, badgeColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
      background: C.bg,
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: isOpen ? `${C.primary}08` : C.surface,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
        }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 10,
            background: badgeColor ? `${badgeColor}20` : `${C.primary}15`,
            color: badgeColor || C.primary,
            fontWeight: 600,
          }}>
            {badge}
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.textMuted}
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: 12,
        color: C.text,
        fontFamily: mono ? "'Fira Code', monospace" : 'inherit',
        wordBreak: 'break-word',
      }}>
        {value}
      </div>
    </div>
  );
};

const ImpactBadge: React.FC<{ level?: string }> = ({ level }) => {
  if (!level) return <span style={{ color: C.textMuted }}>—</span>;
  const colors: Record<string, string> = {
    high: C.error,
    moderate: C.warning,
    low: C.success,
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      background: `${colors[level] || C.textMuted}15`,
      color: colors[level] || C.textMuted,
    }}>
      {level}
    </span>
  );
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  const colors: Record<string, string> = {
    implemented: C.success,
    partial: C.warning,
    planned: C.primary,
    'not-applicable': C.textMuted,
    alternative: '#9333ea',
  };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 600,
      textTransform: 'uppercase',
      background: `${colors[status] || C.textMuted}15`,
      color: colors[status] || C.textMuted,
    }}>
      {status.replace('-', ' ')}
    </span>
  );
};

export const OscalViewer: React.FC<OscalViewerProps> = ({
  isOpen,
  onClose,
  data,
  documentTitle,
  orgName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const stats = useMemo(() => {
    const controlStats = { total: 0, implemented: 0, partial: 0, planned: 0, other: 0 };
    if (data.ctrlData) {
      Object.values(data.ctrlData).forEach((ctrl: any) => {
        controlStats.total++;
        if (ctrl.status === 'implemented') controlStats.implemented++;
        else if (ctrl.status === 'partial') controlStats.partial++;
        else if (ctrl.status === 'planned') controlStats.planned++;
        else controlStats.other++;
      });
    }
    return {
      controls: controlStats,
      completeness: Math.round((controlStats.implemented / Math.max(controlStats.total, 1)) * 100),
    };
  }, [data.ctrlData]);

  // Filter controls by search
  const filteredControls = useMemo(() => {
    if (!data.ctrlData) return {};
    if (!searchTerm) return data.ctrlData;
    const term = searchTerm.toLowerCase();
    const filtered: Record<string, any> = {};
    Object.entries(data.ctrlData).forEach(([id, ctrl]: [string, any]) => {
      if (
        id.toLowerCase().includes(term) ||
        ctrl.implementation?.toLowerCase().includes(term) ||
        ctrl.status?.toLowerCase().includes(term)
      ) {
        filtered[id] = ctrl;
      }
    });
    return filtered;
  }, [data.ctrlData, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: C.bg,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${C.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            📋
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
              {documentTitle || data.sysName || 'System Security Plan'}
            </h2>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              OSCAL SSP Preview • {orgName || data.owningAgency || 'Organization'} • OSCAL 1.1.2
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '12px 20px',
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{stats.completeness}%</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase' }}>Complete</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.success }}>{stats.controls.implemented}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase' }}>Implemented</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.warning }}>{stats.controls.partial}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase' }}>Partial</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{stats.controls.planned}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase' }}>Planned</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: C.surface,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search controls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 12,
                color: C.text,
                width: 140,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
        }}>
          {/* Metadata Section */}
          <Section title="Document Metadata" icon="📄" defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Document Title" value={documentTitle || `${data.sysName} System Security Plan`} />
              <Field label="OSCAL Version" value="1.1.2" mono />
              <Field label="Last Modified" value={new Date().toISOString()} mono />
              <Field label="Organization" value={orgName || data.owningAgency} />
            </div>
          </Section>

          {/* System Identification */}
          <Section title="System Identification" icon="🔖" defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="System Name" value={data.sysName} />
              <Field label="System Acronym" value={data.sysAcronym} />
              <Field label="FISMA ID" value={data.fismaId} mono />
              <Field label="FedRAMP ID" value={data.fedrampId} mono />
              <Field label="Agency Component" value={data.agencyComp} />
              <Field label="Operational Date" value={data.opDate} />
            </div>
            {data.sysDesc && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                  System Description
                </div>
                <div style={{
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.6,
                  padding: 12,
                  background: C.surface,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}>
                  {data.sysDesc}
                </div>
              </div>
            )}
          </Section>

          {/* Security Categorization */}
          <Section
            title="Security Categorization (FIPS 199)"
            icon="🛡️"
            badge={`${data.conf?.toUpperCase() || 'N/A'}-${data.integ?.toUpperCase() || 'N/A'}-${data.avail?.toUpperCase() || 'N/A'}`}
            badgeColor={data.conf === 'high' || data.integ === 'high' || data.avail === 'high' ? C.error : data.conf === 'moderate' || data.integ === 'moderate' || data.avail === 'moderate' ? C.warning : C.success}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 16,
            }}>
              <div style={{
                padding: 16,
                background: C.surface,
                borderRadius: 10,
                textAlign: 'center',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>CONFIDENTIALITY</div>
                <ImpactBadge level={data.conf} />
              </div>
              <div style={{
                padding: 16,
                background: C.surface,
                borderRadius: 10,
                textAlign: 'center',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>INTEGRITY</div>
                <ImpactBadge level={data.integ} />
              </div>
              <div style={{
                padding: 16,
                background: C.surface,
                borderRadius: 10,
                textAlign: 'center',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>AVAILABILITY</div>
                <ImpactBadge level={data.avail} />
              </div>
            </div>
            {/* Information Types */}
            {data.infoTypes && data.infoTypes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  Information Types ({data.infoTypes.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>NIST ID</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>C</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>I</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.infoTypes.map((info, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.text }}>{info.name}</td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontFamily: "'Fira Code', monospace", fontSize: 10 }}>{info.nistId || '—'}</td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}><ImpactBadge level={info.c} /></td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}><ImpactBadge level={info.i} /></td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}><ImpactBadge level={info.a} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Authorization */}
          <Section title="Authorization Information" icon="✅">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Authorization Type" value={data.authType} />
              <Field label="Authorization Duration" value={data.authDuration} />
              <Field label="Cloud Service Model" value={data.cloudModel} />
              <Field label="Deployment Model" value={data.deployModel} />
            </div>
          </Section>

          {/* Personnel */}
          <Section title="Key Personnel" icon="👥">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {data.soName && (
                <div style={{
                  padding: 14,
                  background: C.surface,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>SYSTEM OWNER</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{data.soName}</div>
                  <div style={{ fontSize: 11, color: C.primary }}>{data.soEmail}</div>
                </div>
              )}
              {data.aoName && (
                <div style={{
                  padding: 14,
                  background: C.surface,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>AUTHORIZING OFFICIAL</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{data.aoName}</div>
                  <div style={{ fontSize: 11, color: C.primary }}>{data.aoEmail}</div>
                </div>
              )}
              {data.issoName && (
                <div style={{
                  padding: 14,
                  background: C.surface,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>ISSO</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{data.issoName}</div>
                  <div style={{ fontSize: 11, color: C.primary }}>{data.issoEmail}</div>
                </div>
              )}
            </div>
          </Section>

          {/* System Boundary */}
          <Section title="System Boundary" icon="🔲">
            {data.bndNarr && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                  Boundary Narrative
                </div>
                <div style={{
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.6,
                  padding: 12,
                  background: C.surface,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}>
                  {data.bndNarr}
                </div>
              </div>
            )}
            {data.bndComps && data.bndComps.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  Boundary Components ({data.bndComps.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>Component</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>Type</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>Purpose</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 600, fontSize: 10 }}>Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bndComps.map((comp, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.text, fontWeight: 500 }}>{comp.name}</td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{comp.type}</td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{comp.purpose}</td>
                        <td style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, color: C.textMuted }}>{comp.zone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Control Implementation */}
          <Section
            title="Control Implementation"
            icon="🔒"
            badge={`${stats.controls.total} controls`}
          >
            {Object.keys(filteredControls).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: C.textMuted,
              }}>
                {searchTerm ? `No controls matching "${searchTerm}"` : 'No controls documented yet'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(filteredControls).slice(0, 50).map(([controlId, ctrl]: [string, any]) => (
                  <div
                    key={controlId}
                    style={{
                      padding: 12,
                      background: C.surface,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.primary,
                        background: `${C.primary}10`,
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}>
                        {controlId.toUpperCase()}
                      </span>
                      <StatusBadge status={ctrl.status} />
                    </div>
                    {ctrl.implementation && (
                      <div style={{
                        fontSize: 11,
                        color: C.text,
                        lineHeight: 1.5,
                      }}>
                        {ctrl.implementation.length > 300
                          ? `${ctrl.implementation.slice(0, 300)}...`
                          : ctrl.implementation}
                      </div>
                    )}
                  </div>
                ))}
                {Object.keys(filteredControls).length > 50 && (
                  <div style={{
                    textAlign: 'center',
                    padding: 12,
                    color: C.textMuted,
                    fontSize: 11,
                  }}>
                    Showing 50 of {Object.keys(filteredControls).length} controls. Use search to filter.
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: C.bg,
        }}>
          <div style={{ fontSize: 10, color: C.textMuted }}>
            ForgeComply 360 Reporter • OSCAL 1.1.2 Preview
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: C.primary,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
