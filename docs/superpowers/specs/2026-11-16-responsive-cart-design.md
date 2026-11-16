# Responsive Cart Design

## Goal

Make the learner cart readable and usable on narrow screens, and replace cart
and notification popovers with direct page navigation on screens narrower than
the existing `sm` breakpoint.

## Design

### Cart page

- Stack the page heading and subtotal summary on small screens; keep the
  existing side-by-side arrangement from `sm` upward.
- Keep the summary card full width on phones and make its checkout CTA
  full-width and touch-friendly.
- Use a compact mobile cart item layout with a smaller thumbnail, a
  line-clamped title, instructor and price metadata, and a dedicated
  remove-control area.
- Restore the current horizontal item layout at `sm` and above.
- Use responsive page gutters and prevent long titles or prices from causing
  horizontal overflow.

### Pagination

- Preserve the existing pagination behavior and URL state.
- Allow the pagination summary and controls to wrap on narrow screens.
- Keep all controls keyboard accessible and touch-friendly.

### Cart and notification controls

- Keep the existing data-fetching hooks and unread/cart badges.
- Render direct links to `/learner/cart` and `/learner/notifications` below
  `sm`, using the same icon and badge presentation.
- Render the existing interactive popovers from `sm` upward.
- Use CSS breakpoint visibility instead of viewport JavaScript so there is no
  hydration mismatch or duplicate hook subscription.

## Implementation boundaries

- Modify `app/(learner)/learner/cart/page.tsx`.
- Modify `components/cart/cart-popover.tsx`.
- Modify `components/notifications/notification-popover.tsx`.
- Modify `components/ui/pagination.tsx` only for responsive wrapping.
- No new dependencies, routes, or backend changes.

## Validation

- Run targeted ESLint and Prettier checks.
- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit`.
- Manually inspect narrow phone, tablet, and desktop widths when a browser is
  available.
