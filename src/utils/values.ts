export const SITE_NAME = "Sahithyan's Notes";
export const SITE_DOMAIN = "notes.sahithyan.dev";
export const SITE_HOST_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Sahithyan's engineering notes and study materials";

export const CGPA = 3.82;

// Exam season date ranges per semester. { month: 1-indexed, day: 1-indexed }
export const EXAM_PERIODS: {
  start: { month: number; day: number };
  end: { month: number; day: number };
}[] = [
  { start: { month: 6, day: 15 }, end: { month: 7, day: 2 } }, // S1
  { start: { month: 5, day: 23 }, end: { month: 6, day: 16 } }, // S2
  { start: { month: 8, day: 23 }, end: { month: 9, day: 13 } }, // S3
  { start: { month: 5, day: 23 }, end: { month: 6, day: 16 } }, // S4
];
