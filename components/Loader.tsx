
import React, { useState, useEffect } from 'react';
import type { PayrollFormData } from '../types';

const STATE_NAMES: Record<PayrollFormData['state'], string> = {
    NJ: 'New Jersey',
    FL: 'Florida',
    NY: 'New York',
    IN: 'Indiana',
    CA: 'California',
    OR: 'Oregon',
    DE: 'Delaware',
    DC: 'District of Columbia',
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    GA: 'Georgia',
    TX: 'Texas',
    NV: 'Nevada',
    NH: 'New Hampshire',
    SD: 'South Dakota',
    TN: 'Tennessee',
    WY: 'Wyoming',
    OH: 'Ohio',
    PA: 'Pennsylvania',
    MI: 'Michigan',
    KY: 'Kentucky',
};

export function Loader({ state }: { state?: PayrollFormData['state'] }) {
    const stateName = state ? STATE_NAMES[state] : 'state and federal';
    const messages = [
        "Crunching the numbers...",
        `Consulting ${stateName} tax codes...`,
        "Calculating withholdings...",
        "Finalizing your pay stub...",
        "Almost there..."
    ];

    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        // This effect will re-run if the `state` prop changes, which re-creates `messages`.
        // We need to reset the message to the first one of the new list.
        setMessage(messages[0]);
        let index = 0;
        const intervalId = setInterval(() => {
            index = (index + 1) % messages.length;
            setMessage(messages[index]);
        }, 2500);

        return () => clearInterval(intervalId);
    }, [state]); // Depend on state to restart the interval with new messages.

    return (
        <div className="flex flex-col items-center justify-center text-center p-10 min-h-[400px]">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-6"></div>
            <p className="text-xl font-semibold text-gray-800 mb-2">Generating Pay Stub</p>
            <p className="text-gray-600 transition-opacity duration-500">{message}</p>
        </div>
    );
}
