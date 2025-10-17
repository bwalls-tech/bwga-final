import React, { useState, useEffect } from 'react';
import type { View } from '../types.ts';
import { NAV_ITEMS } from '../constants.tsx';
import { DataProfessionalIcon } from './Icons.tsx';

interface HeaderProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    title: string;
    description: string;
    children: React.ReactNode;
}> = ({ onClick, isActive, title, description, children }) => (
    <button
        onClick={onClick}
        className={`group relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 min-w-[80px] ${
            isActive 
                ? 'bg-nexus-accent-cyan/10 text-nexus-accent-cyan border border-nexus-accent-cyan/20 shadow-md' 
                : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-primary-900/50 border border-transparent'
        }`}
        title={`${title} - ${description}`}
    >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
            {children}
        </div>
        <div className="text-center">
            <div className="font-semibold text-sm">{title}</div>
            <div className={`text-xs transition-all duration-300 ${isActive ? 'opacity-70' : 'opacity-0 h-0 group-hover:opacity-70 group-hover:h-auto'}`}>{description}</div>
        </div>
        {isActive && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-nexus-accent-cyan rounded-full animate-pulse"></div>
        )}
    </button>
);

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        // The main content area doesn't scroll, the views do. This won't work. Let's remove it.
        // For a true SPA, the main window doesn't scroll. This effect is better handled by the parent component if needed.
        // For now, let's make the header always have the "scrolled" appearance for consistency.
        setScrolled(true); 
    }, []);

    const handleNavClick = (view: View) => {
        onViewChange(view);
        setMobileMenuOpen(false);
        // No need to scroll, the view will just change in place.
    };

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-nexus-surface-800/90 backdrop-blur-xl border-b border-nexus-border-medium shadow-sm`}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Section */}
                    <div 
                        className="flex items-center gap-4 cursor-pointer group"
                        onClick={() => handleNavClick('mission')}
                    >
                        <DataProfessionalIcon className="w-12 h-12 text-nexus-text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-nexus-text-primary to-nexus-text-secondary bg-clip-text text-transparent tracking-wide">
                                BWGA Nexus AI
                            </h1>
                            <p className="text-xs text-nexus-text-muted font-medium">
                                Global Economic Empowerment OS
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {NAV_ITEMS.map((item) => (
                            <NavButton
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                isActive={currentView === item.id}
                                title={item.title}
                                description={item.description}
                            >
                                <item.icon className="w-6 h-6" />
                            </NavButton>
                        ))}
                    </nav>

                    {/* Mobile Menu */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-full text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-surface-700/50 transition-all duration-300"
                        >
                            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                                <span className={`block w-full h-0.5 bg-current transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                                <span className={`block w-full h-0.5 bg-current transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block w-full h-0.5 bg-current transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
                    mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <nav className="py-4 space-y-2">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left ${
                                    currentView === item.id
                                        ? 'bg-nexus-accent-cyan/10 text-nexus-accent-cyan border border-nexus-accent-cyan/20'
                                        : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-nexus-primary-900/50'
                                }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">{item.title}</div>
                                    <div className="text-xs opacity-70">{item.description}</div>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};