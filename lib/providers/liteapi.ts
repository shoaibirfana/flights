// Live hotel data from LiteAPI (https://docs.liteapi.travel).
import type { HotelStay } from "../booking";
import { ProviderError } from "./duffel";

const API = "https://api.liteapi.travel/v3.0";

function key(): string {
  const k = process.env.LITEAPI_KEY;
  if (!k) throw new ProviderError("Hotel search is not configured yet (missing LITEAPI_KEY).", 503);
  return k;
}

async function lite<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "X-API-Key": key(), Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Hotel provider error (${res.status})`;
    console.error("LiteAPI error", res.status, JSON.stringify(json));
    throw new ProviderError(msg, res.status >= 500 ? 502 : 400);
  }
  return json as T;
}

type LiteHotel = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  stars?: number;
  rating?: number;
  main_photo?: string;
  thumbnail?: string;
};

type LiteRate = {
  hotelId: string;
  roomTypes?: {
    offerId?: string;
    offerRetailRate?: { amount: number; currency: string };
    rates?: { name?: string; boardName?: string; retailRate?: { total?: { amount: number; currency: string }[] } }[];
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
    if (!hotel || !r.roomTypes?.length) continue;
    // Cheapest room type for this hotel
    let best: { price: number; currency: string; room: string; board: string } | null = null;
    for (const rt of r.roomTypes) {
      const total = rt.offerRetailRate ?? rt.rates?.[0]?.retailRate?.total?.[0];
      if (!total) continue;
      if (!best || total.amount < best.price) {
        best = {
          price: total.amount,
          currency: total.currency,
          room: rt.rates?.[0]?.name ?? "Room",
          board: rt.rates?.[0]?.boardName ?? "",
        };
      }
    }
    if (!best) continue;
    offers.push({
      id: hotel.id,
      name: hotel.name,
      address: [hotel.address, hotel.city].filter(Boolean).join(", "),
      stars: hotel.stars ?? null,
      rating: hotel.rating ?? null,
      photo: hotel.thumbnail || hotel.main_photo || null,
      roomName: best.room,
      board: best.board,
      price: best.price,
      currency: best.currency,
    });
  }
  return offers.sort((a, z) => a.price - z.price).slice(0, 50);
}
