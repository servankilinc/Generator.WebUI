# AGENTS.md

## Commands
```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build (typecheck already runs via tsc)
npm run lint     # eslint .
npm run preview  # vite preview
```
No test framework exists — skip test commands.

## Conventions
- **TypeScript**: `verbatimModuleSyntax` + `erasableSyntaxOnly` — always use `import type` for type-only imports.
- **Prettier**: `arrowParens: "avoid"`, `bracketSameLine: true`, `singleQuote: true`, `jsxSingleQuote: true`, `trailingComma: "none"`, `printWidth: 150`.
- **React Router v7**: use `{ Component: Foo }` (capital C) in route config, not `{ element: <Foo/> }`.
- **CSS**: Tailwind v4 — config lives in `src/styles/index.css` via `@theme`, not in `tailwind.config.js`.
- **Imports**: path alias `@/` → `src/`.

## Architecture
| Directory | Purpose |
|-----------|---------|
| `src/views/` | Page-level components, one subdir per domain |
| `src/components/ui/` | shadcn primitives (radix-ui + @base-ui/react) |
| `src/components/global/` | App-wide shared components |
| `src/models/` | TypeScript interfaces + Zod schemas |
| `src/redux/` | Store (`configureStore`) with slices: `theme`, `project`, `entity` |
| `src/lib/` | `axios-helper.ts` (singleton, baseURL hardcoded to `http://localhost:5092/`), `utils.ts` (`cn`) |

## Gotchas
- **DTO view** (`/dtos/:entityId`) uses local state + direct axios calls, while **entity/project** views use Redux slices — match the existing pattern of the file you edit.
- `@base-ui/react` and `radix-ui` are both dependencies — check which one neighboring files use before reaching for a new primitive.
- Sonner toast is the notification library (`import { toast } from 'sonner'`).
- No CI workflows or commit hooks detected.
