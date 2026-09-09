import {
  createParser,
  debounce,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { COURSE_CATEGORIES } from "@/lib/schemas/course";
import { COURSE_STATUSES } from "@/services/api/courses";
import { ESSAY_GRADING_STATUS_FILTERS } from "@/services/api/essay-grading";

export const URL_FILTER_HISTORY = "replace" as const;
export const URL_SEARCH_DEBOUNCE_MS = 500;
export const PAGE_SIZE_VALUES = [10, 20, 50, 100] as const;
export const USER_ROLE_FILTER_VALUES = ["Instructor", "Learner"] as const;
export const USER_STATUS_FILTER_VALUES = ["Active", "Inactive"] as const;
export const COURSE_STATUS_FILTER_VALUES = [
  COURSE_STATUSES.DRAFT,
  COURSE_STATUSES.PENDING,
  COURSE_STATUSES.PUBLISHED,
  COURSE_STATUSES.REJECTED,
] as const;
export const ESSAY_GRADING_STATUS_FILTER_VALUES = [
  ESSAY_GRADING_STATUS_FILTERS.PENDING,
  ESSAY_GRADING_STATUS_FILTERS.GRADED,
  ESSAY_GRADING_STATUS_FILTERS.ALL,
] as const;

export const pageParser = createParser({
  parse(value) {
    const page = Number(value);

    return Number.isInteger(page) && page >= 1 ? page : null;
  },
  serialize(value) {
    return String(value);
  },
}).withDefault(1);

export function limitParser(defaultLimit: number) {
  return createParser({
    parse(value) {
      const limit = Number(value);

      return PAGE_SIZE_VALUES.includes(
        limit as (typeof PAGE_SIZE_VALUES)[number],
      )
        ? limit
        : null;
    },
    serialize(value) {
      return String(value);
    },
  }).withDefault(defaultLimit);
}

export const searchParser = parseAsString.withDefault("").withOptions({
  history: URL_FILTER_HISTORY,
  limitUrlUpdates: debounce(URL_SEARCH_DEBOUNCE_MS),
});

export const courseCategoryFilterParser = parseAsStringLiteral([
  "",
  ...COURSE_CATEGORIES,
] as const).withDefault("");

export const courseStatusFilterParser = parseAsStringLiteral([
  "",
  ...COURSE_STATUS_FILTER_VALUES,
] as const).withDefault("");

export const userRoleFilterParser = parseAsStringLiteral([
  "",
  ...USER_ROLE_FILTER_VALUES,
] as const).withDefault("");

export const userStatusFilterParser = parseAsStringLiteral([
  "",
  ...USER_STATUS_FILTER_VALUES,
] as const).withDefault("");

export const essayGradingStatusParser = parseAsStringLiteral(
  ESSAY_GRADING_STATUS_FILTER_VALUES,
).withDefault(ESSAY_GRADING_STATUS_FILTERS.PENDING);
