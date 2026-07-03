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

type ActivitiesCountResult = { count: bigint };

export class ActivitiesRepository {
  async getActivities(
    limit = MAX_ACTIVITIES_LIMIT,
    offset = 0,
    search = '',
  ): Promise<ActivityListItem[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ACTIVITIES_LIMIT) {
      throw new RangeError(
        `Activities limit must be an integer between 1 and ${MAX_ACTIVITIES_LIMIT}.`,
      );
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new RangeError('Activities offset must be a non-negative integer.');
    }

    const term = search.trim();

    if (!term) {
      return prisma.$queryRaw<ActivityListItem[]>`
        SELECT
          dealer."id"              AS "dealerId",
          dealer."personName"      AS "dealerName",
          follow_up."followUpDate" AS "dateTime",
          dealer."contactType",
          salesperson."name"       AS "salesperson",
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
        OFFSET ${offset}
      `;
    }

    const pattern = `%${term}%`;
    return prisma.$queryRaw<ActivityListItem[]>`
      SELECT
        dealer."id"              AS "dealerId",
        dealer."personName"      AS "dealerName",
        follow_up."followUpDate" AS "dateTime",
        dealer."contactType",
        salesperson."name"       AS "salesperson",
        follow_up."notes"
      FROM "followUps" AS follow_up
      INNER JOIN "dealers" AS dealer
        ON follow_up."dealerId" = dealer."id"
      INNER JOIN "users" AS salesperson
        ON follow_up."userId" = salesperson."id"
      WHERE (
        dealer."personName"     ILIKE ${pattern}
        OR salesperson."name"   ILIKE ${pattern}
        OR dealer."contactType" ILIKE ${pattern}
        OR follow_up."notes"    ILIKE ${pattern}
      )
      ORDER BY
        follow_up."createdAt" DESC NULLS LAST,
        follow_up."id" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  async getActivitiesCount(search = ''): Promise<number> {
    const term = search.trim();

    const result = term
      ? await prisma.$queryRaw<ActivitiesCountResult[]>`
          SELECT COUNT(*) AS "count"
          FROM "followUps" AS follow_up
          INNER JOIN "dealers" AS dealer
            ON follow_up."dealerId" = dealer."id"
          INNER JOIN "users" AS salesperson
            ON follow_up."userId" = salesperson."id"
          WHERE (
            dealer."personName"     ILIKE ${`%${term}%`}
            OR salesperson."name"   ILIKE ${`%${term}%`}
            OR dealer."contactType" ILIKE ${`%${term}%`}
            OR follow_up."notes"    ILIKE ${`%${term}%`}
          )
        `
      : await prisma.$queryRaw<ActivitiesCountResult[]>`
          SELECT COUNT(*) AS "count"
          FROM "followUps" AS follow_up
          INNER JOIN "dealers" AS dealer
            ON follow_up."dealerId" = dealer."id"
          INNER JOIN "users" AS salesperson
            ON follow_up."userId" = salesperson."id"
        `;

    return Number(result[0]?.count ?? 0);
  }
}

export const activitiesRepository = new ActivitiesRepository();
