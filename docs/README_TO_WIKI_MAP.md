# README to Wiki Migration Map

This project uses a documentation split model:

- `README.md` is the concise onboarding and navigation document.
- GitHub Wiki is the primary location for deep technical documentation.
- In-repo runbooks remain source-of-truth for operational procedures where needed.

Wiki base URL:

- https://github.com/carlwelchdesign/progression-lab-ai/wiki

## Section Move Map

| Previous README Section | New Home |
|---|---|
| AI Design | Wiki: `Architecture/AI-Design` |
| API Reference | Wiki: `API/Endpoints` |
| Data Model (inline Prisma block) | Wiki: `Database/Schema` (+ link to `prisma/schema.prisma`) |
| Testing deep details | Wiki: `Development/Testing` |
| Storybook setup details | Wiki: `Development/Storybook` |
| Build and deployment deep notes | `DEPLOYMENT.md` + Wiki: `Deployment` |
| Security deep details | `SECURITY_*.md` + Wiki: `Security` |
| Prompt versioning operational detail | `PROMPT_VERSIONING_RUNBOOK.md` + Wiki: `Features/Prompt-Versioning` |

## Recommended Initial Wiki Page Set

- Home
- Architecture
- Architecture/AI-Design
- API
- API/Endpoints
- Database
- Database/Schema
- Development
- Development/Local-Setup
- Development/Testing
- Development/Storybook
- Deployment
- Security
- Features/Prompt-Versioning
- Reference/Common-Commands

## Editorial Rules

1. Keep `README.md` focused on orientation, quick start, and links.
2. Put deep implementation details in wiki pages.
3. Keep operational runbooks in-repo when deployment or incident response depends on versioned docs.
4. If a section exceeds quick-start needs, summarize and link out.

## Follow-up Checklist

- [ ] Create the initial wiki pages listed above.
- [ ] Move AI contract + schema walkthrough to wiki.
- [ ] Move full endpoint matrix to wiki.
- [ ] Move schema narrative and ER-style notes to wiki.
- [ ] Add wiki links in relevant PR templates or contributing docs.
