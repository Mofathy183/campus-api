# Thinking

## 1. What assumptions did I make?

I treated this as a 48-72 hour submission, so I optimized for a clean, reviewable API over a broader product surface. That meant assuming no email verification, no password reset, no refresh-token rotation, and no separate public registration flow because the code already makes `POST /students` the account-creation path. I also assumed the reviewer would care more about direct API usability than browser-only concerns, which is why I stayed with bearer JWTs, no cookie session layer, and no CSRF middleware. Finally, I assumed the current scope was intentionally flat: authenticated access exists, but not per-user scoping for students, courses, or assignments.

## 2. What was the hardest part?

The hardest part was not any one endpoint. It was getting the small pieces to fit together cleanly so the whole API could stay composable: validation, response envelopes, typed errors, auth, and base classes all had to be correct before the feature modules could just plug in and stay thin. That same problem showed up in deployment, where the Prisma migration flow had to be wired into Railway as a pre-deploy step so schema changes land before the app serves traffic. The real challenge was making sure the foundation was standardized enough that I would not have to go back and rework it every time a new module or runtime detail appeared.

## 3. If I had another week, what would I improve?

1. Add a proper Supertest suite around the main success and failure paths for each module, not just the current CI scaffolding.
2. Harden filtering and pagination for larger data sets, especially where `page`/`limit` and free-text search will start to feel expensive.
3. Introduce a refresh-token strategy with explicit rotation and revocation if session security becomes a real product concern.
4. Add structured request correlation IDs through the logger so I can trace one request across middleware, controller, service, and Prisma logs.
5. Document the API with an OpenAPI spec if the consumer surface grows beyond a handful of routes.

## 4. What would I refactor first?

I would first pull the repeated pagination/query parsing out of the individual list controllers. Right now each list handler calls `getPagination(req.query)` and then manually casts its own feature-specific filters, which is fine for three modules but starts to feel brittle once a fourth or fifth list endpoint appears. A small shared request-normalization layer would make the controllers thinner and reduce the chance that one feature drifts from the others as the API grows.

## 5. What AI tools did I use, and how did they help?

I used AI assistance throughout, but I did not let it invent the architecture. The decisions about auth model, folder boundaries, naming, error handling, and what to leave out were made first, then I used AI to implement against that structure and to draft documentation from the finished codebase. That meant the model was a force multiplier for boilerplate, verification, and synthesis, not the source of truth. Everything that was AI-generated was checked back against the code before I would keep it.

## 6. What did I deliberately choose not to build, and why?

- OAuth: this spec does not require third-party identity providers, and adding them would introduce a lot of surface area without helping the core API submission.
- CASL or full RBAC: the current app only needs a verified auth gate, not a policy engine with multiple role hierarchies.
- Refresh-token rotation: the shipped design is intentionally a single bearer access token, so rotating refresh tokens would add state the app does not otherwise need.
- CSRF protection: that protects cookie-based sessions, and this API uses stateless bearer auth instead.
- A full Vitest + Supertest + RTL + Playwright pyramid: this is a backend API submission, so a focused backend test suite is the right scope.
- Swagger/OpenAPI UI: the routes are small enough that the README can document them clearly, and I did not need a separate interactive docs surface for this deliverable.
