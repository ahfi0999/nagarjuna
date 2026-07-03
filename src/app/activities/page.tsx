import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { auth0 } from '@/features/auth/server/auth0';
import { activitiesRepository } from '@/server/repositories/activities.repository';

const PAGE_SIZE = 20;

type ActivitiesPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ActivitiesPage({
  searchParams,
}: ActivitiesPageProps) {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/login');
  }

  const { page: pageParam, search: searchParam } = await searchParams;
  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const search = (searchParam ?? '').trim();
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const [activities, totalCount] = await Promise.all([
      activitiesRepository.getActivities(PAGE_SIZE, offset, search),
      activitiesRepository.getActivitiesCount(search),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';

    return (
      <main className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Read-only CRM</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Activities
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Back to Dashboard
              </Link>
              <LogoutButton />
            </div>
          </header>

          <form method="get" action="/activities" className="mt-6">
            <div className="flex gap-2">
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search dealer, salesperson, contact type, or notes…"
                className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Search
              </button>
              {search && (
                <Link
                  href="/activities"
                  prefetch={false}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>

          <section className="mt-8 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold">All Activities</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? `${totalCount} result${totalCount === 1 ? '' : 's'} for "${search}" — page ${page} of ${totalPages}`
                  : `Page ${page} of ${totalPages} — ${totalCount} total`}
              </p>
            </div>

            {activities.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No activities are available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Dealer Name</th>
                      <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                      <th className="px-5 py-3 font-medium">Contact Type</th>
                      <th className="px-5 py-3 font-medium">Salesperson</th>
                      <th className="px-5 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {activities.map((activity, index) => (
                      <tr
                        key={`${activity.dealerId}-${activity.dateTime}-${index}`}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-5 py-4 font-medium">
                          <Link
                            href={`/activities/${activity.dealerId}`}
                            prefetch={false}
                            className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {activity.dealerName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {activity.dateTime}
                        </td>
                        <td className="px-5 py-4">{activity.contactType}</td>
                        <td className="px-5 py-4">{activity.salesperson}</td>
                        <td className="px-5 py-4">
                          {activity.notes ?? 'Not available'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t px-5 py-4">
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Showing {offset + 1}–
                  {Math.min(offset + activities.length, totalCount)} of{' '}
                  {totalCount}
                </p>
              )}
              <div className="ml-auto flex items-center gap-2">
                {hasPrevious ? (
                  <Link
                    href={`/activities?page=${page - 1}${searchQuery}`}
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Previous
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground opacity-50"
                  >
                    Previous
                  </span>
                )}
                {hasNext ? (
                  <Link
                    href={`/activities?page=${page + 1}${searchQuery}`}
                    prefetch={false}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Next
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground opacity-50"
                  >
                    Next
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Unable to load activities.', error);

    return (
      <main className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Read-only CRM</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Activities
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Back to Dashboard
              </Link>
              <LogoutButton />
            </div>
          </header>

          <section className="mt-8 rounded-lg border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Activities unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Activities could not be loaded. Please try again later.
            </p>
          </section>
        </div>
      </main>
    );
  }
}
