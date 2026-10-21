type DatedWorkshop = { data: { date: string; slug: string } };

/** ISO calendar dates sort chronologically; slugs keep same-day listings stable. */
export function compareWorkshops(a: DatedWorkshop, b: DatedWorkshop) {
  return a.data.date.localeCompare(b.data.date, 'en') || a.data.slug.localeCompare(b.data.slug, 'en');
}

/** Explicit UTC prevents a calendar date shifting with the build machine's zone. */
export function formatWorkshopDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
