import React, { useState, useEffect } from 'react';

const messages = [
  "Crunching the numbers...",
  "Consulting New Jersey tax codes...",
  "Calculating withholdings...",
  "Finalizing your pay stub...",
  "Almost there..."
];

export function Loader() {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[400px]">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <p className="text-xl font-semibold text-gray-800 mb-2">Generating Pay Stub</p>
      <p className="text-gray-600 transition-opacity duration-500">{message}</p>
    </div>
  );
}
