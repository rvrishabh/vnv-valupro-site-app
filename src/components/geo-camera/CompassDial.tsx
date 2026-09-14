import React from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { headingQuadrant, normalizeHeading } from '../../utils/geo.utils';

type CompassDialProps = {
  size: number;
  heading: number | null;
};

const CARDINALS = [
  { label: 'N', angle: 0, color: '#FFFFFF' },
  { label: 'E', angle: 90, color: '#FFFFFF' },
  { label: 'S', angle: 180, color: '#FFFFFF' },
  { label: 'W', angle: 270, color: '#FFFFFF' },
];

const NUMBERED = [30, 60, 120, 150, 210, 240, 300, 330];

/**
 * Rotating compass rose: the dial turns so the direction the phone faces sits
 * at the top marker, with the reading ("166° SE") fixed in the middle.
 */
export function CompassDial({ size, heading }: CompassDialProps) {
  const c = size / 2;
  const r = c - 2;
  const h = heading === null ? 0 : normalizeHeading(heading);

  const polar = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: c + radius * Math.cos(rad), y: c + radius * Math.sin(rad) };
  };

  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <G rotation={-h} origin={`${c}, ${c}`}>
        {Array.from({ length: 72 }, (_, i) => {
          const angle = i * 5;
          const major = angle % 30 === 0;
          const outer = polar(angle, r - 1);
          const inner = polar(angle, r - (major ? size * 0.09 : size * 0.05));
          return (
            <Line
              key={angle}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={angle === 0 ? '#EF4444' : 'rgba(255,255,255,0.85)'}
              strokeWidth={major ? 1.6 : 0.8}
            />
          );
        })}
        {NUMBERED.map(angle => {
          const p = polar(angle, r - size * 0.17);
          return (
            <SvgText
              key={angle}
              x={p.x}
              y={p.y + size * 0.025}
              fill="rgba(255,255,255,0.8)"
              fontSize={size * 0.07}
              textAnchor="middle"
              rotation={angle}
              origin={`${p.x}, ${p.y}`}
            >
              {angle}
            </SvgText>
          );
        })}
        {CARDINALS.map(({ label, angle, color }) => {
          const p = polar(angle, r - size * 0.2);
          return (
            <SvgText
              key={label}
              x={p.x}
              y={p.y + size * 0.045}
              fill={label === 'N' ? '#EF4444' : color}
              fontSize={size * 0.13}
              fontWeight="bold"
              textAnchor="middle"
              rotation={angle}
              origin={`${p.x}, ${p.y}`}
            >
              {label}
            </SvgText>
          );
        })}
      </G>
      {/* fixed marker for "straight ahead" */}
      <Path
        d={`M ${c - size * 0.035} 1 L ${c + size * 0.035} 1 L ${c} ${size * 0.07} Z`}
        fill="#C9A84C"
      />
      <SvgText
        x={c}
        y={c + size * 0.05}
        fill="#FFFFFF"
        fontSize={size * 0.14}
        fontWeight="bold"
        textAnchor="middle"
      >
        {heading === null ? '--°' : `${Math.round(h)}° ${headingQuadrant(h)}`}
      </SvgText>
    </Svg>
  );
}
