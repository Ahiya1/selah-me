# selah

A brief pause.

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd selah-me
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Check code quality |
| `npm run typecheck` | Check TypeScript types |

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy
