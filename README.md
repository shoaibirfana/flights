# Visa Flight & Hotel Reservation Website

A Next.js website for selling flight and hotel reservations for visa applications. Customers search **live**
flights and hotels, select one, enter traveler details and submit an order. The team then issues the
reservation PDF.

## Features
- Flight search: one-way, round trip, multi-city, cabin class, up to 9 travelers, exclude transit countries
- Hotel search: multiple cities, live hotel rates
- Live airport/city autocomplete
- Order form → email to the business + confirmation email to the customer
- Pages: Home, About, FAQ, Contact, Terms, Privacy, Refund Policy
- WhatsApp chat button
- No payment yet (to be added later)

## Live data providers
| Data | Provider | Env var |
|------|----------|---------|
| Flights, hotels, airport list | [LiteAPI / Nuitee Connect](https://liteapi.travel) | `LITEAPI_KEY` |

The sandbox key returns test data; the production key returns live data (flights in production must be
enabled by LiteAPI on request). Without a key the site shows a "not configured" message instead of results. It never shows fake data.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in API keys and SMTP settings
npm run dev                  # http://localhost:3000
```

## Customising
- Brand name, contact details, WhatsApp number and prices: `lib/site.ts`
- FAQ text: `lib/faqs.ts`
- Colors: `app/globals.css` (`@theme` block)

## Deploy
Deploys as-is to Vercel (free tier): import the repo and add the environment variables from `.env.example`.
