# DN Print Client (WPF) — Hybrid Printing + Heartbeat

Remote print agent for **Delivery Notes** (5×5 in, 12 rows/page).

## Architecture (sample-style)

```
DMS Web Portal  ←── status (Online/Offline) ──┐
       │                                       │
       │ POST /api/dn-print-jobs               │ GET /api/dn-print-agents/status
       ▼                                       │
   Backend queue                         Heartbeats (every ~3s)
       ▲                                       │
       └── poll/claim/print/complete ── DN Print Client (any LAN PC)
                                              │
                                              ▼
                                    That PC's Windows default printer
```

- Server can run on localhost (or a LAN host).
- Client runs on **any LAN PC** with a printer; set **API Base URL** to the server (`http://SERVER-IP:port`).
- With printer left as **(Windows Default Printer)**, notes push to that PC’s default printer.

## Heartbeat / Online badge

While **Start Polling** is running, the client POSTs:

`POST /api/dn-print-agents/heartbeat`  
Header: `X-DN-Print-Client-Key`

Web Delivery pages show **DN Print Online** if a heartbeat arrived within **15 seconds**; otherwise **Offline**.

## Setup

```bat
cd POS-Don-Son\DN-Print-Client
dotnet run
```

1. API Base URL → DMS API (LAN IP if not on the same machine)
2. Client Key → shared secret (`DN_PRINT_CLIENT_KEY` system setting)
3. Station Code → e.g. `DN-01`
4. Printer → leave default, or pick a queue
5. **Start Polling** → portal badge turns Online
