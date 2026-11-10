# Petra Lodge — UltraMax 7 Pro Premium Rebrand

Official branding: supplied Petra Lodge logo. Gallery: client-supplied lodge photographs (all stored locally in assets, not placeholder stock).

## Website
Responsive five-page site with hero slider, typewriter headings, animated prices, reveal effects, 3D flip cards, gallery filter and lightbox, WhatsApp booking assistant, live booking calculations, mobile bottom navigation and installable PWA.

## Room pricing (ZAR per room per night)
- Single Suite: R900, capacity 1 guest
- Double Room: R1,100, capacity 2 guests
- Family Room: R1,300, capacity 3 guests

## Booking flow
1. Guest enters arrival/departure, room, guest count, contact details.
2. Browser validates and estimates total.
3. POST `/api/bookings` saves a pending enquiry to Neon when `DATABASE_URL` is configured.
4. Two WhatsApp handoff links are provided (+27744211111 and +27676923517). The guest must open both and press Send in each to deliver the request to both numbers.
5. An *automatic* WhatsApp notification requires Meta WhatsApp Cloud API setup, an approved utility template and env variables. Without it, only the guest-initiated WhatsApp handoff works.

No payment collection and no availability guarantees are implemented. Bookings are pending until staff confirm. The website does not use historical customer data from the legacy WordPress export.

## Environment variables
`DATABASE_URL`: Neon Postgres connection string (set privately in Vercel).
`WHATSAPP_ACCESS_TOKEN`: optional Meta API access token.
`WHATSAPP_PHONE_NUMBER_ID`: optional approved Meta sender phone ID.
`WHATSAPP_TEMPLATE_NAME`: optional approved WhatsApp utility template name, configured for four body parameters (reference, guest, dates, room).
`BOOKING_NOTIFY_TO`: optional primary notification number in E.164 format (default 27744211111).
`BOOKING_NOTIFY_TO_SECONDARY`: optional second notification number in E.164 format (default 27676923517). Both require a valid Meta WhatsApp Cloud API sender, access token and approved template.

## Local development
`npm install` then `npm run dev` (Vercel Dev for API routes), or `python -m http.server 8000` for static preview without API.

## Important
Old WordPress content indicates address `41A Danie Theron Street`, but an image of a gate reads `56B`; this discrepancy must be confirmed before showing a street address. Site currently says only Eastleigh, Edenvale. Historical spa and conference facilities are described as enquiries only, not assumed currently available.

## Contact routing (10 Nov 2026)
- Main calls: **011 609 9805** (`tel:+27116099805`).
- Listed WhatsApp: **+27 74 421 1111**.
- Additional direct WhatsApp button: **+27 67 692 3517**.
- WhatsApp URL handoffs do not send to two numbers automatically. A two-button confirmation offers both chats; the visitor must send each. A Cloud API integration may notify both only once authorised and configured.
