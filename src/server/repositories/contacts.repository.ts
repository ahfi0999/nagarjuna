import { prisma } from '@/server/db';

const MAX_CONTACTS_LIMIT = 20;

export type ContactListItem = {
  id: number;
  personName: string | null;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  contactType: string | null;
  createdAt: Date;
};

export class ContactsRepository {
  async getContacts(limit = MAX_CONTACTS_LIMIT): Promise<ContactListItem[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CONTACTS_LIMIT) {
      throw new RangeError(
        `Contacts limit must be an integer between 1 and ${MAX_CONTACTS_LIMIT}.`,
      );
    }

    return prisma.$queryRaw<ContactListItem[]>`
      SELECT
        "id",
        "personName",
        "companyName",
        "phone",
        "email",
        "contactType",
        "createdAt"
      FROM "dealers"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
  }
}

export const contactsRepository = new ContactsRepository();
