import React from 'react';
import { Localized } from '@fluent/react';

// Centralized judgment/outcome options for display
export const fullDisplayJudgmentOptions = {
    'SP': { labelId: 'judgment-option-sp', fallback: 'Stop and Go Penalty (SP)' },
    'L': { labelId: 'judgment-option-l', fallback: 'Light Penalty (L)' },
    'M': { labelId: 'judgment-option-m', fallback: 'Medium Penalty (M)' },
    'G': { labelId: 'judgment-option-g', fallback: 'Grid Penalty (G)' },
    'NO_ACTION': { labelId: 'judgment-option-no-action', fallback: 'No Action Warranted' }, // Primarily for juror votes
    'NO_PENALTY': { labelId: 'judgment-option-no-penalty', fallback: 'No Penalty' }       // Primarily for final outcomes
    // CUSTOM_PENALTY will fall through to raw key display, which is acceptable for now.
};

export const getJudgmentDisplay = (judgmentKey) => {
    if (!judgmentKey) return null; // Return null or 'N/A' string if key is empty
    const option = fullDisplayJudgmentOptions[judgmentKey];
    if (!option) return judgmentKey; // Fallback to raw key if not found (e.g., CUSTOM_PENALTY)
    return <Localized id={option.labelId} fallback={option.fallback} />;
}; 