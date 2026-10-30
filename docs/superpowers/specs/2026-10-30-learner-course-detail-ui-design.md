# Learner Course Detail UI Design

## Intent

Make the course detail page feel like a polished learning destination and make its course content easier to scan, while preserving all existing API usage, actions, and business behavior.

## Current behavior and structure

The page is `/courses/[courseId]`, implemented by `app/(public)/courses/[courseId]/course-detail-client.tsx`. It loads published course data through `usePublishedCourse`, displays the thumbnail, category, title, instructor, updated date, description, enrollment or purchase actions, and ordered lesson titles. Action visibility depends on authentication, role, enrollment, and price; enrollment and cart actions use existing hooks.

## Selected approach

Use a course-first editorial layout. Keep the existing indigo theme and current course content, but give the course artwork and title a stronger hero treatment. Present existing course facts in a compact, readable line. On desktop, align the enrollment / purchase panel to the same grid row and height as the course cover, using a flex column to distribute its content; place the title and metadata below the cover. The action panel is not sticky. On small screens, keep the order as cover, title and metadata, then action panel. Place the description and collapsible lesson outline beneath the hero; use two columns on desktop and stack them on small screens.

This approach preserves the page's recognizable structure and existing controls while making the course and its curriculum the visual focus.

## UI direction

- Use the existing theme tokens for background, foreground, primary, card, border, and muted colors; maintain readable contrast in light and dark themes.
- Establish hierarchy through a distinct course title, compact category and instructor metadata, and clearly separated description and curriculum headings.
- Let the existing thumbnail lead the hero. Preserve the current no-thumbnail fallback.
- Render the lesson order with restrained sequence markers and aligned lesson rows inside a native, keyboard-accessible disclosure that starts open; lesson order is already provided by the current position sort.
- Give the existing purchase/enrollment card clearer price and action hierarchy without changing its action conditions, labels, mutation calls, or payment messaging.
- Use subtle hover and focus styling consistent with the current component system; avoid decorative motion that delays content.
- On narrow screens, stack the cover, title/metadata, action card, description, and lesson outline without horizontal scrolling or a floating control that competes with the page.

## Constraints and non-goals

- Frontend only; do not modify backend or AI repositories.
- Continue using `usePublishedCourse` and the existing enrollment/cart hooks and API data.
- Do not change route behavior, state transitions, authorization/role gates, enrollment/payment logic, or error/loading behavior.
- Do not add endpoints, data fields, testimonials, ratings, instructor details, or dependencies. The collapsible lesson outline is the only new interaction.
- Do not change shared global theme tokens or redesign unrelated pages.

## Acceptance criteria

- The page has a clear course-first hero, an action panel matching the cover height on desktop, stronger section hierarchy, and a collapsible curriculum outline beside the description on desktop and below it on small screens.
- Existing conditional actions, error/loading states, thumbnail fallback, and API calls behave as before.
- The layout works at mobile and desktop widths and respects light/dark theme colors, keyboard focus, and semantic heading order.
