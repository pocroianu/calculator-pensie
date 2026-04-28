/**
 * Popular Romanian Employers Database
 *
 * A curated list of well-known employers in Romania, organized by sector.
 * Used for intelligent auto-complete suggestions in the company name field.
 *
 * Sources: Top employers by revenue, headcount, and public recognition in Romania.
 */

export interface EmployerEntry {
  name: string;
  sector: string;
}

/**
 * Popular employers in Romania across various sectors.
 * These are used as suggestions when the user starts typing a company name.
 */
export const POPULAR_ROMANIAN_EMPLOYERS: EmployerEntry[] = [
  // Automotive & Manufacturing
  { name: 'Dacia Renault', sector: 'automotive' },
  { name: 'Ford România', sector: 'automotive' },
  { name: 'Continental Automotive', sector: 'automotive' },
  { name: 'Bosch România', sector: 'automotive' },
  { name: 'Pirelli România', sector: 'automotive' },
  { name: 'Star Assembly (Mercedes-Benz)', sector: 'automotive' },
  { name: 'Michelin România', sector: 'automotive' },

  // IT & Technology
  { name: 'Bitdefender', sector: 'it' },
  { name: 'UiPath', sector: 'it' },
  { name: 'Oracle România', sector: 'it' },
  { name: 'Microsoft România', sector: 'it' },
  { name: 'IBM România', sector: 'it' },
  { name: 'Amazon România', sector: 'it' },
  { name: 'Google România', sector: 'it' },
  { name: 'Endava România', sector: 'it' },
  { name: 'NTT Data România', sector: 'it' },
  { name: 'Atos România', sector: 'it' },
  { name: 'Accenture România', sector: 'it' },
  { name: 'Cognizant România', sector: 'it' },
  { name: 'Deutsche Bank Technology', sector: 'it' },
  { name: 'Luxoft România', sector: 'it' },
  { name: 'Wipro România', sector: 'it' },
  { name: 'Capgemini România', sector: 'it' },

  // Banking & Financial Services
  { name: 'Banca Comercială Română (BCR)', sector: 'banking' },
  { name: 'BRD - Groupe Société Générale', sector: 'banking' },
  { name: 'Banca Transilvania', sector: 'banking' },
  { name: 'ING Bank România', sector: 'banking' },
  { name: 'Raiffeisen Bank România', sector: 'banking' },
  { name: 'UniCredit Bank România', sector: 'banking' },
  { name: 'CEC Bank', sector: 'banking' },
  { name: 'OTP Bank România', sector: 'banking' },
  { name: 'Alpha Bank România', sector: 'banking' },

  // Energy & Utilities
  { name: 'OMV Petrom', sector: 'energy' },
  { name: 'Romgaz', sector: 'energy' },
  { name: 'Nuclearelectrica', sector: 'energy' },
  { name: 'Hidroelectrica', sector: 'energy' },
  { name: 'Transelectrica', sector: 'energy' },
  { name: 'E.ON Energie România', sector: 'energy' },
  { name: 'Enel România', sector: 'energy' },
  { name: 'ENGIE România', sector: 'energy' },
  { name: 'CEZ România', sector: 'energy' },
  { name: 'Rompetrol', sector: 'energy' },

  // Telecommunications
  { name: 'Orange România', sector: 'telecom' },
  { name: 'Vodafone România', sector: 'telecom' },
  { name: 'Telekom România (Digi)', sector: 'telecom' },
  { name: 'RCS & RDS (Digi)', sector: 'telecom' },

  // Retail & Commerce
  { name: 'Kaufland România', sector: 'retail' },
  { name: 'Lidl România', sector: 'retail' },
  { name: 'Carrefour România', sector: 'retail' },
  { name: 'Mega Image', sector: 'retail' },
  { name: 'Profi', sector: 'retail' },
  { name: 'Penny Market România', sector: 'retail' },
  { name: 'Auchan România', sector: 'retail' },
  { name: 'Dedeman', sector: 'retail' },
  { name: 'Altex', sector: 'retail' },
  { name: 'eMAG', sector: 'retail' },
  { name: 'Flanco', sector: 'retail' },

  // Healthcare & Pharma
  { name: 'Farmec', sector: 'pharma' },
  { name: 'Antibiotice Iași', sector: 'pharma' },
  { name: 'Zentiva România', sector: 'pharma' },
  { name: 'Catena', sector: 'pharma' },
  { name: 'Help Net', sector: 'pharma' },
  { name: 'MedLife', sector: 'healthcare' },
  { name: 'Regina Maria', sector: 'healthcare' },
  { name: 'Sanador', sector: 'healthcare' },

  // Construction & Real Estate
  { name: 'Holcim România', sector: 'construction' },
  { name: 'HeidelbergCement România', sector: 'construction' },

  // Transport & Logistics
  { name: 'CFR Călători', sector: 'transport' },
  { name: 'CFR Marfă', sector: 'transport' },
  { name: 'TAROM', sector: 'transport' },
  { name: 'Metrorex', sector: 'transport' },
  { name: 'STB (Societatea de Transport București)', sector: 'transport' },
  { name: 'Fan Courier', sector: 'transport' },
  { name: 'Cargus', sector: 'transport' },

  // State / Government / Public Sector
  { name: 'Poșta Română', sector: 'public' },
  { name: 'Ministerul Apărării Naționale', sector: 'public' },
  { name: 'Ministerul Afacerilor Interne', sector: 'public' },
  { name: 'Administrația Națională a Penitenciarelor', sector: 'public' },
  { name: 'Primăria București', sector: 'public' },

  // Insurance
  { name: 'Allianz-Țiriac Asigurări', sector: 'insurance' },
  { name: 'Omniasig', sector: 'insurance' },
  { name: 'Generali România', sector: 'insurance' },
  { name: 'Groupama Asigurări', sector: 'insurance' },

  // Food & Beverage
  { name: 'Coca-Cola HBC România', sector: 'food' },
  { name: 'Ursus Breweries (Asahi)', sector: 'food' },
  { name: 'Bergenbier', sector: 'food' },
  { name: 'Smithfield România', sector: 'food' },
  { name: 'Cris-Tim', sector: 'food' },
  { name: 'Scandia Food', sector: 'food' },

  // Education (common historical employers)
  { name: 'Universitatea din București', sector: 'education' },
  { name: 'Universitatea Politehnica București', sector: 'education' },
  { name: 'Universitatea Babeș-Bolyai', sector: 'education' },
  { name: 'Universitatea Alexandru Ioan Cuza', sector: 'education' },

  // Historical / Legacy Employers (for pension calculations covering older periods)
  { name: 'Combinatul Siderurgic Galați (ArcelorMittal)', sector: 'legacy' },
  { name: 'Uzina Mecanică București', sector: 'legacy' },
  { name: 'IOR (Întreprinderea Optică Română)', sector: 'legacy' },
  { name: 'IMGB (Întreprinderea de Mașini Grele)', sector: 'legacy' },
  { name: 'Tractorul Brașov', sector: 'legacy' },
  { name: 'Roman Brașov', sector: 'legacy' },
  { name: 'Electroputere Craiova', sector: 'legacy' },
  { name: 'Oltchim Râmnicu Vâlcea', sector: 'legacy' },
  { name: 'Petromidia Năvodari', sector: 'legacy' },
  { name: 'Dacia Pitești', sector: 'legacy' },
  { name: 'CAP (Cooperativa Agricolă de Producție)', sector: 'legacy' },
  { name: 'IAS (Întreprinderea Agricolă de Stat)', sector: 'legacy' },
];

/**
 * Common employment period durations in Romania (in years).
 * Used for auto-suggesting end dates based on start dates.
 */
export const COMMON_EMPLOYMENT_DURATIONS = [
  { years: 1, labelKey: 'autocomplete.duration.oneYear' },
  { years: 2, labelKey: 'autocomplete.duration.twoYears' },
  { years: 3, labelKey: 'autocomplete.duration.threeYears' },
  { years: 5, labelKey: 'autocomplete.duration.fiveYears' },
  { years: 10, labelKey: 'autocomplete.duration.tenYears' },
  { years: 15, labelKey: 'autocomplete.duration.fifteenYears' },
  { years: 20, labelKey: 'autocomplete.duration.twentyYears' },
  { years: 25, labelKey: 'autocomplete.duration.twentyFiveYears' },
  { years: 30, labelKey: 'autocomplete.duration.thirtyYears' },
  { years: 35, labelKey: 'autocomplete.duration.thirtyFiveYears' },
];

/**
 * Get all employer names as a flat array for quick filtering.
 */
export function getEmployerNames(): string[] {
  return POPULAR_ROMANIAN_EMPLOYERS.map(e => e.name);
}

/**
 * Search employers by name with fuzzy matching.
 * Returns results sorted by relevance (exact prefix match first, then contains).
 */
export function searchEmployers(query: string, limit: number = 10): EmployerEntry[] {
  if (!query || query.trim().length === 0) return [];

  const normalizedQuery = query.toLowerCase().trim();

  // Split results into categories for better ranking
  const prefixMatches: EmployerEntry[] = [];
  const wordStartMatches: EmployerEntry[] = [];
  const containsMatches: EmployerEntry[] = [];

  for (const employer of POPULAR_ROMANIAN_EMPLOYERS) {
    const normalizedName = employer.name.toLowerCase();

    if (normalizedName.startsWith(normalizedQuery)) {
      prefixMatches.push(employer);
    } else if (
      normalizedName.split(/[\s\-()]/g).some(word => word.startsWith(normalizedQuery))
    ) {
      wordStartMatches.push(employer);
    } else if (normalizedName.includes(normalizedQuery)) {
      containsMatches.push(employer);
    }
  }

  return [...prefixMatches, ...wordStartMatches, ...containsMatches].slice(0, limit);
}
