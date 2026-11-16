# Responsive Navigation Design

## Goal

Make the public header and learner navigation usable across mobile, tablet, and
desktop widths without changing routes or authentication behavior.

## Design

### Public header

- Keep the logo and the `/courses` link visible in the desktop layout.
- Keep the existing authenticated and unauthenticated actions on desktop.
- At mobile widths, replace the text-heavy action group with a menu trigger.
- Open a right-side Sheet containing:
  - The `/courses` link.
  - Authenticated learner actions: cart, notifications, profile, and logout.
  - Unauthenticated actions: sign in and register.
- Keep the theme toggle available in the compact header.
- Give the trigger and Sheet links accessible labels and touch-friendly sizing.

### Learner navigation

- Keep the existing seven-link toolbar on desktop and tablet widths.
- At mobile widths, replace the wrapping toolbar with a single learner-menu
  trigger.
- Open a right-side Sheet containing each learner route as a stacked,
  full-width link with its current icon and Vietnamese label.
- Keep the navigation border and muted background treatment consistent with the
  current layout.

### Layout and responsive behavior

- Use the existing `Sheet`, `Button`, `buttonVariants`, and `cn` utilities.
- Use responsive horizontal padding so controls do not touch the viewport edge.
- Keep the public header sticky and avoid flex shrinking on the logo and action
  controls.
- Preserve the current desktop spacing and route order.
- Keep main content centered with reduced mobile padding.

## Implementation boundaries

- `components/layout/public-header.tsx` owns the public-header mobile menu.
- A small client-side learner navigation component owns Sheet state and is
  rendered by `app/(learner)/layout.tsx`; the layout remains a server component.
- No backend, Redux, route, or dependency changes are needed.

## Validation

- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit`.
- Manually verify desktop, tablet, and narrow mobile widths if a browser is
  available.
