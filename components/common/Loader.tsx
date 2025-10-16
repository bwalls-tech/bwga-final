import React from 'react';

const Loader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-16 h-16 border-4 border-nexus-accent-gold/50 border-dashed rounded-full animate-spin"></div>
    <p className="mt-4 text-lg text-nexus-text-secondary">{message}</p>
  </div>
);

export default Loader;