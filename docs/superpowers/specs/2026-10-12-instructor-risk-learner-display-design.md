# Instructor Risk Learner Display Design

## Context

The instructor Learning Risk page currently exposes raw learner and enrollment identifiers in the risk table. The backend already enriches risk score responses with optional learner and course summaries, but the frontend type and table rendering do not consume those fields.

## Goals

- Show human-readable learner information instead of raw learner IDs.
- Remove enrollment IDs from the Learning Risk table UI.
- Link learner identity to the course enrollment management page filtered by learner email.
- Preserve the existing risk workflow, quick view action, filters, and course selection behavior.

## Design

The frontend `RiskScore` type will include optional `learner` and `course` summaries matching the backend response. The risk learners table will render the learner cell as a single link containing the learner name and email. The link target will be `/instructor/courses/{courseId}/enrollments?q={learnerEmail}` when an email is available.

If learner data is missing, the table will keep the row visible and show placeholders: `Không rõ học viên` and `Chưa có email`. The learner cell will not create an email-filtered enrollment link when there is no email. The enrollment ID will not be rendered.

The course column will prefer `item.course?.title` and fall back to the selected course title. The course select already displays course titles, so it only needs to remain unchanged unless a fallback is required by the implementation.

## Error Handling

Missing optional enrichment data is handled locally with placeholders and fallback course title. Existing loading, empty, and error states remain unchanged.

## Testing

Run frontend typecheck after implementation with `pnpm exec tsc --noEmit`. There is no configured frontend test script.
