import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { auth0 } from '@/features/auth/server/auth0';
import {
  DealerTrackingMap,
  DealerTrackingMapsProvider,
} from '@/features/maps/components/dealer-tracking-map';
import {
  type DealerTrackingTimeline,
  trackingRepository,
} from '@/server/repositories/tracking.repository';

type DealerActivityTimelinePageProps = {
  params: Promise<{
    dealerId: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Not available'
    : dateFormatter.format(date);
}

function isPublicImageReference(value: string) {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function DealerActivityTimelinePage({
  params,
}: DealerActivityTimelinePageProps) {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/login');
  }

  const { dealerId: dealerIdParam } = await params;
  const dealerId = Number(dealerIdParam);

  if (!Number.isInteger(dealerId) || dealerId < 1) {
    notFound();
  }

  let timeline: DealerTrackingTimeline | null;

  try {
    timeline = await trackingRepository.getDealerTimeline(dealerId);
  } catch (error) {
    console.error('Unable to load dealer activity timeline.', error);

    return (
      <main className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/activities"
            prefetch={false}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Activities
          </Link>

          <section className="mt-8 rounded-lg border bg-card p-10 text-center shadow-sm">
            <h1 className="text-lg font-semibold">Timeline unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dealer activity could not be loaded. Please try again later.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!timeline) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Dealer Activity Timeline
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {timeline.dealerName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/activities"
              prefetch={false}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to Activities
            </Link>
            <LogoutButton />
          </div>
        </header>

        {timeline.entries.length === 0 ? (
          <section className="mt-8 rounded-lg border bg-card p-10 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No tracking activity is available for this dealer.
            </p>
          </section>
        ) : (
          <DealerTrackingMapsProvider>
            <ol className="relative mt-8 space-y-6 border-l border-border pl-6">
              {timeline.entries.map((entry) => (
                <li key={entry.trackingInfoId} className="relative">
                  <span className="absolute -left-[29px] top-6 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />

                  <article className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{entry.trackingType}</p>
                        <p className="text-sm text-muted-foreground">
                          Created by {entry.createdBy}
                        </p>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>

                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="mt-1">{entry.address}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Latitude</dt>
                        <dd className="mt-1">{entry.latitude}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Longitude</dt>
                        <dd className="mt-1">{entry.longitude}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Distance</dt>
                        <dd className="mt-1">
                          {entry.distance ?? 'Not available'}
                        </dd>
                      </div>
                    </dl>

                    <section className="mt-5">
                      <h2 className="text-sm font-semibold">Location</h2>
                      <div className="mt-2">
                        <DealerTrackingMap
                          latitude={entry.latitude}
                          longitude={entry.longitude}
                        />
                      </div>
                    </section>

                    <section className="mt-5">
                      <h2 className="text-sm font-semibold">Notes</h2>
                      {entry.notes.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No notes available.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {entry.notes.map((note) => (
                            <li
                              key={note.id}
                              className="rounded-md bg-muted/50 p-3 text-sm"
                            >
                              <p>{note.description}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(note.createdAt)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="mt-5">
                      <h2 className="text-sm font-semibold">Images</h2>
                      {entry.images.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No images available.
                        </p>
                      ) : (
                        <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                          {entry.images.map((image) => (
                            <li key={image.id}>
                              {isPublicImageReference(image.imgSrc) ? (
                                <a
                                  href={image.imgSrc}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-md border bg-muted/30"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={image.imgSrc}
                                    alt={`${entry.dealerName} tracking image`}
                                    loading="lazy"
                                    className="h-40 w-full object-cover"
                                  />
                                </a>
                              ) : (
                                <p className="rounded-md border p-3 text-sm text-muted-foreground">
                                  Image reference is not publicly accessible.
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </article>
                </li>
              ))}
            </ol>
          </DealerTrackingMapsProvider>
        )}
      </div>
    </main>
  );
}
