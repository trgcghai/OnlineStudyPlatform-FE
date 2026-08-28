# Learner And Instructor Layout Polish Design

Date: 2026-08-28
Scope: Frontend only

## Context

The public area already has a polished header in `components/layout/public-shell.tsx`: sticky header, `LMS AI` brand, public course navigation, theme toggle, notifications, authenticated profile link, and logout. The learner layout currently has a separate custom header, which creates visual drift from public pages. Instructor pages use the sidebar shell, but the top bar only exposes notifications and logout, with no visible profile entry. Instructor and admin course tables render thumbnails through CSS `backgroundImage`, which should be replaced with `next/image` for consistency and image handling.

## Goals

- Make learner pages use the same public header visual treatment.
- Keep learner-specific navigation visible for `Khóa học của tôi` and `Hồ sơ`.
- Add profile information to the instructor layout without disrupting the sidebar console structure.
- Replace course thumbnail background images in instructor/admin rows with real `<Image>` elements.
- Keep the changes small and aligned with existing components and styling.

## Non-Goals

- No backend changes.
- No redesign of public landing pages.
- No new navigation system or route restructuring.
- No changes to enrollment or course data contracts.

## Proposed Approach

Extract the header portion of `PublicShell` into a shared `PublicHeader` component. `PublicShell` will continue to render the same header and footer, while the learner layout will render `PublicHeader` directly inside its `AuthGuard` wrapper.

The learner layout will keep the same header appearance as public pages. Learner-specific information will live below the header in a compact navigation strip containing links to `Khóa học của tôi` and `Hồ sơ`. This satisfies the request to keep the header the same while still exposing learner information in the layout.

The instructor layout will keep its sidebar shell and add profile information in the existing top-right action area. It should show a profile link with the authenticated user's name when available, plus the existing notification popover and logout button.

Course thumbnails in both instructor and admin course tables will use `next/image` inside the existing fixed-size thumbnail container. If no thumbnail exists, the current `ImageIcon` fallback remains.

## Component Changes

- Add `components/layout/public-header.tsx`:
  - client component;
  - contains the current public header markup;
  - reads auth state from Redux selectors, same as `PublicShell` currently does;
  - keeps the public header links and actions unchanged.
- Update `components/layout/public-shell.tsx`:
  - remove inline header markup;
  - render `<PublicHeader />` above page content;
  - keep the footer unchanged.
- Update `app/(learner)/layout.tsx`:
  - replace the custom learner header with `<PublicHeader />`;
  - keep `AuthGuard` with learner role restriction;
  - add a learner layout body section with quick links to `/learner/courses` and `/profile`;
  - preserve centered content spacing similar to the current `main`.
- Update `app/(instructor)/layout.tsx`:
  - read the current authenticated user through the existing Redux `selectAuthUser` selector;
  - add a profile link to `/instructor/profile` in the top-right area;
  - render the user's name when present, otherwise `Hồ sơ`;
  - keep `NotificationPopover` and `LogoutButton` unchanged.
- Update instructor course row thumbnail in `app/(instructor)/instructor/courses/page.tsx`:
  - import `Image` from `next/image`;
  - replace CSS `backgroundImage` with `<Image src={course.thumbnail} alt={course.title} fill sizes="56px" className="object-cover" />`;
  - keep fallback icon when `course.thumbnail` is null.
- Update admin course approval row thumbnail in `app/(admin)/admin/courses/approvals/page.tsx` similarly.

## Data Flow

- Header/profile display uses persisted auth user data already available in Redux via `selectAuthUser`.
- No new API calls are required.
- Existing notification and logout behavior remains unchanged.

## Responsive Behavior

- Public header behavior remains unchanged from the existing implementation.
- Learner quick links should wrap cleanly on small screens and not duplicate the public header's authenticated profile button visually.
- Instructor top-right actions should remain compact on small widths; if space is limited, the profile link can hide the name and keep the icon/button shape.
- Thumbnail containers keep the existing `size-14` dimensions in tables.

## Error Handling

- If the auth user is missing during hydration, render the profile link as `Hồ sơ`.
- If a thumbnail URL is missing, render the current fallback icon.
- If a thumbnail URL fails to load, no special retry UI is required for this polish task.

## Verification

- Manual check public pages still show the same header/footer.
- Manual check learner pages show the same public header plus learner layout links for `Khóa học của tôi` and `Hồ sơ`.
- Manual check instructor pages show profile information in the top bar.
- Manual check instructor and admin course tables render thumbnail images through real image elements and keep fallback icons.
- Run frontend verification after implementation: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.
