# AI Study Workspace API Documentation

## Auth Endpoints
- `POST /api/auth/register`: Register a new user.
  - Body: `{ email, password, name }`
- `POST /api/auth/login`: Login and receive JWT.
  - Body: `{ email, password }`

## Workspace Endpoints (Authenticated)
- `POST /api/workspaces`: Create a new workspace.
  - Body: `{ title, description }`
- `GET /api/workspaces`: List owned workspaces.
- `GET /api/workspaces/shared`: List workspaces shared with you.
- `GET /api/workspaces/:id`: Get workspace details (including documents and quizzes).
- `POST /api/workspaces/:id/share`: Share workspace with another user.
  - Body: `{ email, role }` (role: viewer/editor)

## Document Endpoints (Authenticated)
- `POST /api/documents/upload`: Upload a study document (PDF/TXT).
  - Form Data: `file`, `workspaceId`, `title`
- `GET /api/documents/workspace/:workspaceId`: Get all documents in a workspace.

## AI Endpoints (Authenticated)
- `POST /api/ai/query`: Chat with your documents.
  - Body: `{ query, workspaceId, documentIds? }`
- `POST /api/ai/generate-quiz`: Generate a quiz from materials.
  - Body: `{ workspaceId, documentIds?, numQuestions? }`
- `POST /api/ai/explain`: Explain a specific concept simply.
  - Body: `{ topic, workspaceId, documentIds? }`

## Attempt Endpoints (Authenticated)
- `POST /api/attempts`: Submit a quiz attempt.
  - Body: `{ quizId, answers: { questionId: "Selected Option" } }`
- `GET /api/attempts/user`: Get your history of quiz attempts and scores.

## Setup Instructions
1. `npm install`
2. Configure `.env` with `DATABASE_URL`, `JWT_SECRET`, and `OPENAI_API_KEY`.
3. `npx prisma migrate dev`
4. `npm run dev`
