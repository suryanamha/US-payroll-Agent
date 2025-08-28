import React from 'react';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="white"/>
                <path d="M12 12H28V18H20V28H12V12Z" fill="#2563EB"/>
            </svg>
            <h1 className="text-3xl font-extrabold tracking-tight">Payroll Agent</h1>
        </div>
        <p className="text-sm opacity-90 hidden sm:block">Smart Payroll Solutions</p>
      </div>
    </header>
  );
}
