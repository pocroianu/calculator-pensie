# Romanian Pension Calculator

A modern web application for calculating Romanian pensions based on the latest legislation (Law 263/2010, updated September 2024). This calculator takes into account various factors including:
- Base contribution points
- Multiple working conditions periods
- Non-contributive periods (military service, university studies, etc.)
- Stability bonus for extended contribution periods

## Features

- **Multiple working conditions support** (Group I, Group II, Special Conditions)
- **Non-contributive periods calculation** (military, university, child care, medical)
- **Historical salary data** (1990-2025) for accurate point calculations
- **Detailed breakdown** of pension points
- **Visual representation** of point distribution
- **Bilingual support** (English and Romanian)
- **Responsive design** for mobile and desktop
- **Privacy-focused** - all data stored locally in browser

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[API Reference](docs/API_REFERENCE.md)** - Complete technical reference for all functions, types, and constants
- **[Calculation Formulas](docs/CALCULATION_FORMULAS.md)** - Mathematical documentation of pension formulas with worked examples
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Architecture overview, data flow, and extension guide
- **[Romanian Law](docs/ROMANIAN_LAW.md)** - Mapping of implementation to Romanian pension law articles

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser at http://localhost:5173
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## Key Formulas

The calculator implements the Romanian pension formula effective September 1, 2024:

```
Monthly Pension = Total Points × VPR (81.03 Lei)

Where:
  Total Points = Contribution Points + Stability Points + Non-Contributive Points
```

See [Calculation Formulas](docs/CALCULATION_FORMULAS.md) for complete documentation.

## Deployment

This project is configured for automatic deployment to GitHub Pages. To deploy:

1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Your site will be available at `https://[your-username].github.io/calculator_pensie/`

## Tech Stack

- **React** 18.3.1
- **TypeScript** 5.5.3
- **Vite** 5.4.2
- **Tailwind CSS** 3.4.1
- **Chart.js** 4.4.7
- **i18next** 24.2.1
- **Jest** 29.7.0

## License

MIT
