const raceToCodeMap = {
    // Countries (English & Portuguese)
    'australia': 'au',
    'bahrain': 'bh',
    'china': 'cn',
    'azerbaijan': 'az', 'azerbaijão': 'az',
    'spain': 'es', 'espanha': 'es',
    'canada': 'ca',
    'austria': 'at',
    'hungary': 'hu',
    'belgium': 'be', 'bélgica': 'be',
    'netherlands': 'nl', 'holanda': 'nl',
    'italy': 'it', 'itália': 'it',
    'singapore': 'sg', 'singapura': 'sg',
    'japan': 'jp', 'japão': 'jp',
    'qatar': 'qa', 'catar': 'qa',
    'mexico': 'mx',
    'brazil': 'br', 'brasil': 'br',
    'united arab emirates': 'ae', 'emirados árabes': 'ae',
    'saudi arabia': 'sa', 'arábia saudita': 'sa',
    'great britain': 'gb', 'grã-bretanha': 'gb',
    'united states': 'us', 'estados unidos': 'us',
    'usa': 'us',
    
    // Tracks / Cities that map to countries
    'miami': 'us',
    'monaco': 'mc', 'mônaco': 'mc',
    'silverstone': 'gb',
    'monza': 'it',
    'suzuka': 'jp',
    'spa-francorchamps': 'be', 'belgica': 'be',
    'spa': 'be',
    'zandvoort': 'nl',
    'austin': 'us',
    'cota': 'us',
    'interlagos': 'br',
    'são paulo': 'br',
    'las vegas': 'us',
    'abu dhabi': 'ae',
    'jeddah': 'sa',
    'imola': 'it'
};

export const getCountryCodeForRace = (raceTitle) => {
    if (!raceTitle) return null;
    const lowerTitle = raceTitle.toLowerCase();

    for (const key in raceToCodeMap) {
        if (lowerTitle.includes(key)) {
            return raceToCodeMap[key];
        }
    }
    
    return null; // Return null if no match is found
}; 