// frontend/src/components/SedesNavbar.tsx
import React from 'react';

const SedesNavbar: React.FC = () => {
    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <img
                            src="/images/smileyface.webp"
                            alt="Logo"
                            className="h-14 w-24 rounded-full"
                        />
                        <span className="ml-2 text-xl font-semibold text-gray-900">Clínica Smiley</span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default SedesNavbar;