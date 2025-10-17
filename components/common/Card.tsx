
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div style={style} className={`bg-nexus-surface-800 border border-nexus-border-medium rounded-xl shadow-lg p-6 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default Card;