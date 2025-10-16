
import React from 'react';
import { NexusLogo } from './Icons.tsx';
import Card from './common/Card.tsx';

interface WelcomeProps {
  onAccept: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onAccept }) => {
  return (
    <div className="aurora-background flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-2xl w-full text-center animate-fadeIn glassmorphism-card bg-nexus-surface-800/90 backdrop-blur-md">
        <div className="flex justify-center mb-6">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-nexus-accent-gold to-nexus-accent-cyan rounded-full blur-xl opacity-50"></div>
                <NexusLogo className="w-20 h-20 text-nexus-accent-gold relative z-10" />
            </div>
        </div>
        <h1 className="text-4xl font-extrabold text-nexus-text-primary tracking-tight">Welcome to BWGA Nexus AI</h1>
        <p className="mt-4 text-lg text-nexus-text-secondary">
          Global Economic Empowerment OS
        </p>
        <div className="mt-8 p-4 bg-nexus-surface-700/50 border border-nexus-border-medium rounded-lg text-left text-sm text-nexus-text-secondary space-y-2">
            <p><strong>Disclaimer:</strong> This is an AI-Human Intelligence Platform intended for guidance and decision-support. Information is sourced from publicly available data and should be independently verified before making strategic or financial commitments.</p>
            <p>By proceeding, you acknowledge and agree to our terms of use and compliance policies.</p>
        </div>
        <div className="mt-8">
          <button
            onClick={onAccept}
            className="w-full bg-gradient-to-r from-nexus-accent-gold to-nexus-accent-gold-dark text-black font-bold py-3 px-8 rounded-xl text-lg shadow-lg shadow-nexus-accent-gold/30 hover:shadow-xl hover:shadow-nexus-accent-gold/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nexus-accent-gold/50"
          >
            Acknowledge & Enter
          </button>
        </div>
      </Card>
    </div>
  );
};
