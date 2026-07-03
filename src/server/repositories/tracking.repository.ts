import { prisma } from '@/server/db';

export type TrackingTimelineNote = {
  id: number;
  description: string;
  createdAt: string;
};

export type TrackingTimelineImage = {
  id: number;
  imgSrc: string;
  type: string | null;
  createdAt: string;
};

export type TrackingTimelineEntry = {
  trackingInfoId: number;
  dealerId: number;
  dealerName: string;
  createdAt: string | null;
  createdBy: string;
  address: string;
  latitude: number;
  longitude: number;
  trackingType: string;
  distance: number | null;
  notes: TrackingTimelineNote[];
  images: TrackingTimelineImage[];
};

export type DealerTrackingTimeline = {
  dealerId: number;
  dealerName: string;
  entries: TrackingTimelineEntry[];
};

export class TrackingRepository {
  async getTracking(): Promise<never> {
    throw new Error('Not implemented');
  }

  async getDealerTimeline(
    dealerId: number,
  ): Promise<DealerTrackingTimeline | null> {
    if (!Number.isInteger(dealerId) || dealerId < 1) {
      throw new RangeError('Dealer ID must be a positive integer.');
    }

    const timelines = await prisma.$queryRaw<DealerTrackingTimeline[]>`
      SELECT
        dealer."id" AS "dealerId",
        dealer."personName" AS "dealerName",
        COALESCE(timeline."entries", '[]'::jsonb) AS "entries"
      FROM "dealers" AS dealer
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'trackingInfoId', tracking."id",
            'dealerId', dealer."id",
            'dealerName', dealer."personName",
            'createdAt', tracking."createdAt",
            'createdBy', creator."name",
            'address', tracking."address",
            'latitude', tracking."latitude",
            'longitude', tracking."longitude",
            'trackingType', tracking."trackingType",
            'distance', tracking."distance",
            'notes', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', note."id",
                    'description', note."description",
                    'createdAt', note."createdAt"
                  )
                  ORDER BY note."createdAt" ASC, note."id" ASC
                )
                FROM "trackingNotes" AS note
                WHERE note."trackingInfoId" = tracking."id"
              ),
              '[]'::jsonb
            ),
            'images', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', image."id",
                    'imgSrc', image."imgSrc",
                    'type', image."type",
                    'createdAt', image."createdAt"
                  )
                  ORDER BY image."createdAt" ASC, image."id" ASC
                )
                FROM "trackingImages" AS image
                WHERE image."trackingInfoId" = tracking."id"
              ),
              '[]'::jsonb
            )
          )
          ORDER BY
            tracking."createdAt" DESC NULLS LAST,
            tracking."id" DESC
        ) AS "entries"
        FROM "trackingInfo" AS tracking
        INNER JOIN "users" AS creator
          ON tracking."userId" = creator."id"
        WHERE tracking."dealerId" = dealer."id"
      ) AS timeline ON TRUE
      WHERE dealer."id" = ${dealerId}
    `;

    return timelines[0] ?? null;
  }
}

export const trackingRepository = new TrackingRepository();
