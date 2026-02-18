import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

export function LegalPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Legal Disclaimer"
        subtitle="Important information about using Forge Cyber Defense"
      />
      <LegalDisclaimer variant="inline" />
    </div>
  );
}
