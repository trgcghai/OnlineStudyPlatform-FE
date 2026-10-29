# Sign-In and Registration UI Redesign Plan

> **For agentic workers:** Implement the reviewed plan in the existing frontend branch.

**Goal:** Redesign the sign-in and registration screens with a shared study-cover split layout while preserving all existing form behavior.

**Architecture:** Add a presentation-only shared auth frame for the two requested pages. Keep validation, mutations, routing, fields, links, errors, and submit states in their current pages. Do not change the auth layout used by forgot-password, verify-email, or other routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, existing shadcn/Base UI components and Lucide icons.

**Spec:** Approved study-cover split design in the conversation: deep indigo abstract lesson-note panel beside a light form panel; compact visual header above the form on mobile; preserve all behavior and current auth copy/labels.

## Global Constraints

- Change only the UI of `/signin` and `/register`.
- Do not modify backend code, API calls, auth hooks, validation schemas, field registration, success/error handling, or route destinations.
- Preserve all existing inputs, labels, autocomplete values, error associations, forgot-password link, and cross-links.
- Respect light/dark theme, keyboard focus, reduced motion, and responsive widths.
- Do not add tests or run tests/build commands unless the user asks.

## Review Focus

- Login still submits the same email/password payload and redirects by role.
- Registration still submits the same four values and routes to email verification.
- Server errors, field errors, loading states, and focus behavior remain wired to their existing controls.
- Mobile layout keeps the heading, every field, and submit action visible without horizontal overflow.
- Visual decoration is non-interactive and does not imply real learner progress.

---

### Task 1: Shared presentation frame

**Files:**
- Create: `components/auth/auth-form-frame.tsx`

**Deliverable:** A responsive split frame with an ink-indigo decorative study panel and a clear form content slot. Use CSS shapes and existing icons; do not add assets, dependencies, or product claims. In compact widths, collapse the art into a short header so the form remains primary.

**Check:** Source review for responsive layout, theme-safe form surface, visible focus, reduced-motion behavior, and decorative semantics.

### Task 2: Apply the frame to sign-in and registration

**Files:**
- Modify: `app/(auth)/signin/page.tsx`
- Modify: `app/(auth)/register/page.tsx`

**Deliverable:** Wrap the existing form content in the shared frame and adjust presentation classes only. Keep each form's implementation and accessible field/error behavior intact.

**Check:** Compare form fields, handlers, links, mutation states, and route destinations against the current versions; confirm no other auth route is changed.

### Task 3: Final source review

- Review only the frontend diff for behavioral changes outside presentation.
- Format the touched files.
- Do not run tests or a build unless requested.
