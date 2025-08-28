import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto py-6">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Payroll Agent. All rights reserved.</p>
        <p className="text-xs text-gray-400 mt-2">
          Disclaimer: This is a tool for estimation purposes only and does not constitute financial or legal advice.
          Please consult with a qualified professional for accurate payroll calculations and compliance.
        </p>
      </div>
    </footer>
  );
}
