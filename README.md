# USHER - Government Bid Management System

A modern Next.js application for automated government contracting and bid management.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Python Serverless Functions
- **Database**: Vercel Postgres (PostgreSQL)
- **Authentication**: NextAuth.js v5
- **Storage**: Vercel Blob (for PDFs)
- **Deployment**: Vercel

## Features

- 🔐 Multi-user authentication (Email/Password + Google OAuth)
- 📊 SAM.gov opportunity tracking
- 💰 Automated pricing analysis using USASpending API
- 🔍 Subcontractor discovery via Google Places API
- 📄 Professional SOW PDF generation
- 📈 Bid profitability analysis
- ⏰ Automated opportunity fetching (cron jobs)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- PostgreSQL database (Vercel Postgres recommended)
- API Keys:
  - SAM.gov API key
  - Google Places API key
  - OpenAI API key (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run database migrations (when database is configured):
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
usher-nextjs/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── python/           # Shared Python modules
│       ├── api/          # API clients
│       └── bots/         # Discovery bots
├── prisma/               # Database schema
│   └── schema.prisma
├── api/python/           # Python serverless functions
└── public/               # Static assets
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models:

- **User** - User accounts and authentication
- **Opportunity** - SAM.gov opportunities
- **Subcontractor** - Business contacts
- **Bid** - Pricing and profitability analysis
- **CronJob** - Automated task tracking

## Python Integration

Python serverless functions handle:
- SAM.gov API integration
- USASpending API queries
- Google Places searches
- SOW PDF generation
- Pricing calculations

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js setup
- [x] Prisma database schema
- [x] NextAuth authentication
- [x] Python modules migration

### Phase 2: Opportunities Module
- [ ] Fetch opportunities from SAM.gov
- [ ] Display opportunities list
- [ ] Opportunity detail pages
- [ ] Search and filter functionality

### Phase 3: Subcontractors & Pricing
- [ ] Subcontractor discovery
- [ ] Pricing analysis
- [ ] Bid creation

### Phase 4: SOW Generation
- [ ] PDF SOW generation
- [ ] Vercel Blob integration
- [ ] Download functionality

### Phase 5: Dashboard & Automation
- [ ] Main dashboard
- [ ] Cron jobs setup
- [ ] Analytics and charts

### Phase 6: Polish & Deploy
- [ ] UI/UX refinements
- [ ] Testing
- [ ] Production deployment

## Contributing

This is a private project. Contact the maintainer for contribution guidelines.

## License

Proprietary
