import { prisma } from '@/server/db';

const MAX_ACTIVITIES_LIMIT = 20;

export type ActivityListItem = {
  dealerId: number;
  dealerName: string;
  dateTime: string;
  contactType: string;
  salesperson: string;
  notes: string | null;
};

export class ActivitiesRepository {
  async getActivities(
    limit = MAX_ACTIVITIES_LIMIT,
  ): Promise<ActivityListItem[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ACTIVITIES_LIMIT) {
      throw new RangeError(
        `Activities limit must be an integer between 1 and ${MAX_ACTIVITIES_LIMIT}.`,
      );
    }

    return prisma.$queryRaw<ActivityListItem[]>`
      SELECT
        dealer."id" AS "dealerId",
        dealer."personName" AS "dealerName",
        follow_up."followUpDate" AS "dateTime",
        dealer."contactType",
        salesperson."name" AS "salesperson",
        follow_up."notes"
      FROM "followUps" AS follow_up
      INNER JOIN "dealers" AS dealer
        ON follow_up."dealerId" = dealer."id"
      INNER JOIN "users" AS salesperson
        ON follow_up."userId" = salesperson."id"
      ORDER BY
        follow_up."createdAt" DESC NULLS LAST,
        follow_up."id" DESC
      LIMIT ${limit}
    `;
  }
}

export const activitiesRepository = new ActivitiesRepository();
