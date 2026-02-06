import React, { useRef } from 'react';

interface ComplianceBadgeProps {
  grade: string;
  score: number;
  frameworks?: string[];
  verificationUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showQR?: boolean;
}

const gradeColors: Record<string, { start: string; end: string }> = {
  A: { start: '#22c55e', end: '#16a34a' },
  B: { start: '#3b82f6', end: '#2563eb' },
  C: { start: '#eab308', end: '#ca8a04' },
  D: { start: '#f97316', end: '#ea580c' },
  F: { start: '#ef4444', end: '#dc2626' },
};

const sizeConfig = {
  sm: { width: 120, height: 160, fontSize: 36, subFont: 10, padding: 8 },
  md: { width: 180, height: 240, fontSize: 54, subFont: 14, padding: 12 },
  lg: { width: 240, height: 320, fontSize: 72, subFont: 18, padding: 16 },
};

export function ComplianceBadge({
  grade,
  score,
  frameworks = [],
  verificationUrl,
  size = 'md',
  showQR = false,
}: ComplianceBadgeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const colors = gradeColors[grade.toUpperCase()] || gradeColors.F;
  const config = sizeConfig[size];
  const gradientId = `badge-gradient-${grade}`;

  const copyEmbedCode = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const embedCode = `<div style="display:inline-block">${svgString}</div>`;
    navigator.clipboard.writeText(embedCode);
  };

  const downloadAsPNG = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = config.width * 2;
    canvas.height = config.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `compliance-badge-${grade}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  const shieldPath = `
    M ${config.width / 2} ${config.padding}
    L ${config.width - config.padding} ${config.padding + 20}
    L ${config.width - config.padding} ${config.height * 0.6}
    Q ${config.width - config.padding} ${config.height * 0.85} ${config.width / 2} ${config.height - config.padding - 40}
    Q ${config.padding} ${config.height * 0.85} ${config.padding} ${config.height * 0.6}
    L ${config.padding} ${config.padding + 20}
    Z
  `;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg
        ref={svgRef}
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>

        <path d={shieldPath} fill={`url(#${gradientId})`} stroke="#ffffff" strokeWidth="2" />

        <text
          x={config.width / 2}
          y={config.height * 0.35}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={config.fontSize}
        >
          {grade.toUpperCase()}
        </text>

        <text
          x={config.width / 2}
          y={config.height * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
          fontSize={config.subFont * 1.2}
        >
          {score}%
        </text>

        <text
          x={config.width / 2}
          y={config.height * 0.62}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontSize={config.subFont * 0.8}
          opacity="0.9"
        >
          Verified Compliant
        </text>

        {showQR && (
          <g transform={`translate(${config.width / 2 - 15}, ${config.height - 45})`}>
            <rect width="30" height="30" fill="#ffffff" rx="2" />
            <text
              x="15"
              y="18"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#333333"
              fontFamily="Arial, sans-serif"
              fontSize="8"
              fontWeight="bold"
            >
              SCAN
            </text>
          </g>
        )}
      </svg>

      {frameworks.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: config.width }}>
          {frameworks.map((fw, idx) => (
            <span
              key={idx}
              style={{
                fontSize: config.subFont * 0.7,
                padding: '2px 6px',
                backgroundColor: colors.end,
                color: '#ffffff',
                borderRadius: 4,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {fw}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={copyEmbedCode}
          style={{
            fontSize: config.subFont * 0.7,
            padding: '4px 8px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
          }}
        >
          Copy Embed
        </button>
        <button
          onClick={downloadAsPNG}
          style={{
            fontSize: config.subFont * 0.7,
            padding: '4px 8px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
          }}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
