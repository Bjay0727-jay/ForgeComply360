import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

function getStrength(password: string): { score: number; label: string; color: string; requirements: Requirement[] } {
  const requirements: Requirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    { label: '12+ characters (recommended)', met: password.length >= 12 },
  ];

  const metCount = requirements.filter(r => r.met).length;

  if (metCount <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500', requirements };
  if (metCount <= 3) return { score: 2, label: 'Fair', color: 'bg-orange-500', requirements };
  if (metCount <= 4) return { score: 3, label: 'Good', color: 'bg-yellow-500', requirements };
  return { score: 4, label: 'Strong', color: 'bg-green-500', requirements };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color, requirements } = getStrength(password);

  const labelColor = score === 1 ? 'text-red-600' : score === 2 ? 'text-orange-600' : score === 3 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {req.met ? (
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </div>
            )}
            <span className={`text-xs ${req.met ? 'text-green-700' : 'text-gray-500'}`}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
