// Live hotel search: GET /data/hotels (city catalog) → POST /hotels/rates (prices for those hotel IDs).
import type { HotelStay } from "../booking";
import { lite } from "./liteapi";

type LiteHotel = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stars?: number;
  starRating?: number;
  rating?: number;
  main_photo?: string;
  thumbnail?: string;
};

type Amount = { amount: number; currency: string };
type LiteRate = {
  hotelId: string;
  roomTypes?: {
    offerRetailRate?: Amount;
    rates?: {
      name?: string;
      boardName?: string;
      offerRetailRate?: Amount;
      retailRate?: { total?: Amount[]; suggestedSellingPrice?: Amount[] };
    }[];
  }[];
};

export type HotelOffer = {
  id: string;
  name: string;
  address: string;
  stars: number | null;
  rating: number | null;
  photo: string | null;
  roomName: string;
  board: string;
  price: number;
  currency: string;
};

// Whole-stay total for one rate, trying the documented fields in order.
function rateTotal(r: NonNullable<NonNullable<LiteRate["roomTypes"]>[number]["rates"]>[number]): Amount | null {
  for (const a of [r.retailRate?.total?.[0], r.retailRate?.suggestedSellingPrice?.[0], r.offerRetailRate]) {
    if (a && typeof a.amount === "number" && a.amount > 0) return a;
  }
  return null;
}

export async function searchHotels(stay: HotelStay, travelers: number): Promise<HotelOffer[]> {
  const params = new URLSearchParams({ countryCode: stay.countryCode, cityName: stay.city, limit: "100" });
  const { data: hotels = [] } = await lite<{ data?: LiteHotel[] }>(`/data/hotels?${params}`);
  if (hotels.length === 0) return [];

  // Split travelers into rooms of up to 2 adults each.
  const occupancies = Array.from({ length: Math.ceil(travelers / 2) }, (_, i) => ({
    adults: Math.min(2, travelers - i * 2),
  }));

  const { data: rates = [] } = await lite<{ data?: LiteRate[] }>("/hotels/rates", {
    method: "POST",
    body: JSON.stringify({
      hotelIds: hotels.map((h) => h.id),
      checkin: stay.checkIn,
      checkout: stay.checkOut,
      occupancies,
      currency: "USD",
      guestNationality: process.env.HOTEL_GUEST_NATIONALITY || "PK",
      timeout: 15,
    }),
  });

  const byId = new Map(hotels.map((h) => [h.id, h]));
  const offers: HotelOffer[] = [];
  for (const r of rates) {
    const hotel = byId.get(r.hotelId);
    if (!hotel) continue;
    // Cheapest rate across this hotel's room types
    let best: { total: Amount; room: string; board: string } | null = null;
    for (const rt of r.roomTypes ?? []) {
      for (const rate of rt.rates ?? []) {
        const total = rateTotal(rate) ?? rt.offerRetailRate ?? null;
        if (total && (!best || total.amount < best.total.amount)) {
          best = { total, room: rate.name ?? "Room", board: rate.boardName ?? "" };
        }
      }
    }
    if (!best) continue;
    offers.push({
      id: hotel.id,
      name: hotel.name,
      address: [hotel.address, hotel.city].filter(Boolean).join(", "),
      stars: hotel.stars ?? hotel.starRating ?? null,
      rating: hotel.rating ?? null,
      photo: hotel.thumbnail || hotel.main_photo || null,
      roomName: best.room,
      board: best.board,
      price: best.total.amount,
      currency: best.total.currency,
    });
  }
  return offers.sort((a, z) => a.price - z.price).slice(0, 50);
}
