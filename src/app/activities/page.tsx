import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { auth0 } from '@/features/auth/server/auth0';
import { activitiesRepository } from '@/server/repositories/activities.repository';

export default async function ActivitiesPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/login');
  }

  try {
    const activities = await activitiesRepository.getActivities(20);

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

          <section className="mt-8 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold">All Activities</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing up to 20 activities, newest first.
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
