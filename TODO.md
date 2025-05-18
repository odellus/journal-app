# TO DO

- Read the code and have LLM explain what it is doing
- Add a save button
- Add user login with atproto oauth
- Add home page
- Add user profile with links to their online books/journal posts (a post is a chapter, users can compile into books and publish)
- Add feed/make a social network
- Figure out how to deploy on advanced-eschatonics.com
- Add/upload images
- configure pandoc
- mirror pandoc with real time preview(?!?)
- don't use pandoc and just render with katex like we're doing now (other option)
- updated to latest and greatest node and typescript version by using the newer patterns of rehype

The idea is we're going to have a place where people can write long form posts and they're basically ready to be organized into books and published online or via pdf/epub.





# PLAN


<details>
Great—let’s brainstorm and flesh out the list. I’ll walk through each bullet, ask clarifying questions, suggest options, and highlight possible pitfalls or sequencing considerations. Feel free to pick and choose which pieces you want to dive deeper into.

----------------------------------------------------------------------------------------------------
1. “Read the code and have LLM explain what it is doing”
• Goal: Lower the barrier for new contributors (or your future self) to understand unfamiliar areas quickly.  
• Practical approach:  
  – Add a script/CLI command (e.g., `pnpm explain <file|dir>`) that pipes source into an LLM and returns an annotated summary.  
  – Scope question: Are you envisioning automatic inline comments, a Markdown documentation file, or a chat-like experience inside the app itself?  

2. “Add a save button”
• Design decisions:  
  – Autosave vs. explicit “Save.” Many modern editors autosave every keystroke; an explicit button can still exist as a UX reassurance.  
  – Versioning: Do you keep every historical snapshot? How big might the datastore grow?  
  – Conflict resolution: If the same post is open in two tabs, what happens?  
  – Quick win: Start with a simple POST/PUT to an endpoint that responds with 200 OK and the new revision ID.  

3. “Add user login with atproto oauth”
• Why atproto?  
  – Decentralization & interoperability with the Bluesky ecosystem.  
  – Potential virality if authors can cross-post or prove identity.  
• Considerations:  
  – The OAuth flow is currently “App Password” + DID-based; you may need to open a browser window for token acquisition.  
  – Store tokens securely (HTTP-only cookies vs. localStorage).  
  – Map atproto DID ↔ local user record (if you need extra profile fields).  

4. “Add home page”
• Minimal viable home page:  
  – Hero section (“Write long-form posts. Compile into books. Publish.”)  
  – Call-to-action buttons: “Sign in,” “Read feed,” “Start writing.”  
  – Recent community posts or featured books for social proof.  

5. “Add user profile with links to their online books/journal posts”
• Data model thoughts:  
  – User  
    • did (atproto)  
    • displayName  
    • bio  
  – Post (a.k.a. chapter)  
    • title, content (markdown + latex), createdAt  
    • bookId (nullable)  
  – Book  
    • title, description, coverImage, publishStatus  
  – Relationship: Many posts → zero/one book (so chapters can later be regrouped).  
• UI:  
  – Tabs: “Posts,” “Books,” “About.”  
  – Sort filters: newest, oldest, most liked/bookmarked.  

6. “Add feed/make a social network”
• Two conceptual layers:  
  – Internal app feed (only posts written on your platform).  
  – Federated feed (pulling/aggregating atproto or ActivityPub).  
• Minimum feature set: infinite scroll, like/bookmark, comment.  
• Algorithm: chronological vs. ranked. Starting chronological drastically simplifies rollout.  

7. “Figure out how to deploy on advanced-eschatonics.com”
• Infra stack questions:  
  – Static site + serverless functions (e.g., Vercel/Netlify) or full container (Fly.io, Render)?  
  – Do you need persistent disk for compiled PDFs? S3 or object storage might solve that.  
  – Custom domain + TLS handled by your host.  

8. “Add/upload images”
• Challenges:  
  – Storage bucket + CDN (S3 + CloudFront, R2, etc.).  
  – In-editor upload handling:  
    • Drag-and-drop → upload → insert markdown `![alt](url)` automatically.  
    • Show upload progress bar.  
  – Image optimization (resize, WebP) to keep pages light.  

9. “Configure pandoc”
• Why pandoc?  
  – Converts Markdown → PDF/EPUB/LaTeX/HTML.  
  – Book compilation with front matter, TOC, etc.  
• Server-side vs. client-side:  
  – Pandoc is heavy (~80 MB). Bundling in a serverless function might be tricky.  
  – Alternative: Call a microservice container that has pandoc installed.  

10. “Mirror pandoc with real-time preview(?!?)”
• This is ambitious: live-updating PDF/EPUB previews as users type.  
• Possible phased rollout:  
  – Phase 1: Live HTML preview (Markdown → HTML).  
  – Phase 2: On-demand PDF compile (button click).  
  – Phase 3: Live PDF preview with throttling (e.g., compile at most every 10 s).  

11. “Don’t use pandoc and just render with KaTeX like we’re doing now (other option)”
• Trade-offs:  
  – Simpler deployment, no heavy binary.  
  – Loses one-click export to PDF/EPUB unless you add another converter.  
  – Maybe good for MVP; keep pandoc as a “pro” feature.  

12. “Update to latest and greatest node and typescript version by using the newer patterns of rehype”
• Tech debt item: aligning your markdown/rehype pipeline with TS 5.x, ESM modules, etc.  
• Best done before major feature work to avoid a large rebase later.  

----------------------------------------------------------------------------------------------------
Suggested sequence (to avoid blocking and keep momentum)

Phase 0: Housekeeping  
• Upgrade Node/TS + rehype stack.  
• Add automated explanation script (helps onboarding right away).

Phase 1: Core writing experience  
• Persist posts (save/autosave).  
• User login (atproto).  
• User profile page (basic).  
• Image uploads.  

Phase 2: Consumption experience  
• Home page & feed (chronological).  
• Likes/bookmarks.  

Phase 3: Book compilation  
• Decide pandoc vs. KaTeX path.  
• Implement book entity, grouping posts into books.  
• Offer compile-to-PDF on demand.  

Phase 4: Social & growth  
• Federated feed, share buttons, atproto cross-posting.  
• Realtime preview enhancements.  
• Polish deployment on advanced-eschatonics.com.  

----------------------------------------------------------------------------------------------------
Open questions to nail down sooner than later

1. Target audience: academics, fiction writers, personal bloggers?  
2. Are books public by default or private until “published”?  
3. Do you want revenue features (paid books, donations)?  
4. What’s the acceptable latency for PDF generation? seconds vs. minutes?  
5. How decentralized do you want to go (pure atproto identities vs. fallback local accounts)?  

----------------------------------------------------------------------------------------------------
Let me know which area you want to zoom in on next, or if you’d like to reorder priorities. We can continue refining each piece and drilling into UX, data schema, or infrastructure choices.
</details>



<details>
Great—let’s zoom in on the FastAPI + uv + early-stage SQLite path and map out what “CRUD on posts” and “create books out of posts” really entails.  I’ll cover:

• Package-management & project layout considerations  
• Data-model sketch (entities, relationships, migrations)  
• API surface (high-level, no code)  
• Versioning/permissions questions you’ll want to answer now  
• Migration path to Postgres or MongoDB later  
• Testing & observability hooks you’ll thank yourself for adding early

Feel free to interrupt or ask for deeper dives on any bullet.

────────────────────────────────────────
1. Package-management & project layout
────────────────────────────────────────
uv + FastAPI tends to encourage a clean, dep-isolated repo:

• pyproject.toml for dependency graph (uv respects it).  
• env/ or .venv/ kept out of source control via .gitignore.  
• src/yourapp/ … actual code.  
• tests/ … pytest.  
• alembic/ (if you choose SQLAlchemy/SQLModel) or migrator dir (if Tortoise).  
• run.sh / compose.yaml / Makefile only if you want local orchestration simplicities.

uv install fastapi sqlmodel uvicorn etc. is snappy and reproducible.

────────────────────────────────────────
2. Data model v0
────────────────────────────────────────
Minimum entities:

User  (from atproto later; for now maybe just id + handle)  
Post  (one author, markdown source, title, created_at, updated_at, status)  
Book  (one author, title, description, cover_image_url?, created_at, published_at?)  
BookChapter (pivot table: book_id, post_id, chapter_order)

Why an explicit BookChapter instead of an array field?

• portably expresses ordering  
• avoids many-to-many headaches in Mongo or Postgres later  
• easy to extend (e.g., per-chapter headings, sub-title, footnotes, etc.)

Early choice of ORM:

SQLite:  
  – SQLModel (built on SQLAlchemy 2.x) feels natural with FastAPI/Pydantic; migrations via Alembic.  
  – Tortoise-ORM is async-native but migrations are a bit rougher.  
MongoDB later:  
  – Motor (async) + ODMantic or Beanie.  
Postgres later:  
  – SQLModel will slide over with only connection-string swap; Alembic migration scripts still valid.

So SQLModel + SQLite today → Postgres tomorrow gives you the cleanest path.

────────────────────────────────────────
3. CRUD API surface (no code, just verbs & nouns)
────────────────────────────────────────
Unauthenticated for MVP; later you’ll add user-identity checks.

Posts
GET    /posts?author_id=&limit=&cursor=        → list, paginated (infinite scroll)  
POST   /posts                                  → create draft  
GET    /posts/{post_id}                        → read  
PUT    /posts/{post_id}                        → full update  
PATCH  /posts/{post_id}                        → partial update (e.g., status: “published”)  
DELETE /posts/{post_id}                        → soft-delete (flag) or hard-delete

Books
GET    /books?author_id=                       → list  
POST   /books                                  → create empty book (title, description)  
GET    /books/{book_id}                        → read (with embedded chapter list)  
PUT    /books/{book_id}                        → edit meta  
DELETE /books/{book_id}                        → delete

Book Chapters operations (option 1: nested)
POST   /books/{book_id}/chapters               → add post to book (body: post_id, order?)  
PATCH  /books/{book_id}/chapters/{post_id}     → change order or remove

(Option 2: treat BookChapter as a first-class resource if you need cross-book analytics.)

────────────────────────────────────────
4. Versioning & permissions—decide early
────────────────────────────────────────
• Do you want per-post revision history?  
  – Cheap v0: When user hits “save,” overwrite content; keep `updated_at`.  
  – Next-step: separate PostRevision table keyed by post_id + revision number.

• AuthZ surface:  
  – Only the author can mutate their posts/books.  
  – Public visibility flag on posts/books.  
  – Eventually group/private workflows? Keep a `visibility` enum ready: PUBLIC, UNLISTED, PRIVATE.

────────────────────────────────────────
5. Migration path to Postgres or MongoDB
────────────────────────────────────────
Staying SQL-ish (SQLite → Postgres):  
• Use only column types common to both engines (TEXT, INTEGER, TIMESTAMP, BOOLEAN).  
• Avoid SQLite-only pragmas (e.g., AUTOINCREMENT nuance).  
• Use Alembic from day 1; `alembic revision --autogenerate` even if the file is trivial—makes future diffs frictionless.

If you suspect a future switch to MongoDB instead:  
• Keep business logic abstracted behind repository/service layer so swapping the persistence adapter doesn’t leak SQL into handlers.  
• Accept you’ll rewrite migrations but domain models can stay.

────────────────────────────────────────
6. Testing & observability
────────────────────────────────────────
• spin up sqlite in-memory during pytest session: extremely fast.  
• FastAPI’s TestClient (sync) or AsyncClient.  
• Add logging/structlog early; funnel to stdout and Cloud log aggregator later.  
• Add OpenTelemetry instrumentation toggle; FastAPI hooks make it ~3 lines.

────────────────────────────────────────
7. Incremental roadmap for this slice
────────────────────────────────────────
Week 1  
  – Skeleton FastAPI project, health endpoint, sqlmodel + sqlite, alembic.  
  – CRUD for Post; manual curl/Postman tests.  

Week 2  
  – CRUD for Book + chapter linking.  
  – Basic OpenAPI docs auto-generated; verify validators.  
  – Seed script: create demo data for local dev.

Week 3  
  – Minimal auth placeholder (header “X-Demo-User: 1”).  
  – Write integration tests (post lifecycle, add to book).  
  – Decide on perm flags and revision strategy.

Week 4  
  – Evaluate performance, maybe run Locust on /posts.  
  – If satisfactory, begin wiring to frontend save-button flow.

────────────────────────────────────────
Open questions you may want to settle next

1. Do you anticipate many authors collaborating on the same book? (affects schema.)  
2. Are posts searchable? If yes, SQLite FTS5 extension now vs. external search later.  
3. How aggressive do you want autosave (every keystroke vs. throttle)? Impacts revision design.  
4. Any file attachments (images) referenced inside posts will need their own storage table and presigned upload mechanism—when will you tackle that?

Let me know which of these deserves a deeper dive, or if you’d like alternative recommendations for ORMs, auth libraries, or CI setup.
</details>

