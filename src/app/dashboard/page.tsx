import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { auth0 } from '@/features/auth/server/auth0';
import { contactsRepository } from '@/server/repositories/contacts.repository';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
});

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/login');
  }

  const displayName = session.user.name ?? session.user.email ?? 'there';

  try {
    const contacts = await contactsRepository.getContacts(5);

    return (
      <main className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/contacts"
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Contacts
              </Link>
              <LogoutButton />
            </div>
          </header>

          <section className="mt-8 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Recent Contacts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The five most recently created contacts.
              </p>
            </div>

            {contacts.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No contacts are available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Person Name</th>
                      <th className="px-5 py-3 font-medium">Company Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Contact Type</th>
                      <th className="px-5 py-3 font-medium">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-muted/30">
                        <td className="px-5 py-4 font-medium">
                          {contact.personName ?? 'ï¿½'}
                        </td>
                        <td className="px-5 py-4">
                          {contact.companyName ?? 'ï¿½'}
                        </td>
                        <td className="px-5 py-4">{contact.phone ?? 'ï¿½'}</td>
                        <td className="px-5 py-4">
                          {contact.contactType ?? 'ï¿½'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {dateFormatter.format(contact.createdAt)}
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
    console.error('Unable to load recent contacts.', error);

    return (
      <main className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/contacts"
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Contacts
              </Link>
              <LogoutButton />
            </div>
          </header>

          <section className="mt-8 rounded-lg border bg-card p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Recent Contacts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contacts could not be loaded. Please try again later.
            </p>
          </section>
        </div>
      </main>
    );
  }
}
