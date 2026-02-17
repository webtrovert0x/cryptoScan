import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color, isPositive }) => {
  if (!data || data.length === 0) return null;

  const width = 120;
  const height = 40;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Generate path points
  const points = data.map((price, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((price - min) / range) * height; // Invert Y because SVG coordinates go down
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillPathD = `${pathD} V ${height} H 0 Z`;

  // Determine color based on trend if not explicitly provided
  const finalColor = color 
    ? color 
    : (isPositive ? '#13ec5b' : '#f87171');

  // Create a unique ID for the gradient to avoid conflicts
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className="overflow-visible drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]"
        preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={finalColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={finalColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path 
        d={pathD} 
        fill="none" 
        stroke={finalColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d={fillPathD} 
        fill={`url(#${gradientId})`} 
        stroke="none" 
      />
    </svg>
  );
};