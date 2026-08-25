# 172E Skyhawk Hangar

Interactive exploded assembly of a 1964 Cessna 172E Skyhawk — Three.js hangar plus OpenSCAD export.

## Download

- **Zip from GitHub:** https://github.com/asheets1/cessna-172e-hangar/archive/refs/heads/main.zip
- Or on the repo page: **Code → Download ZIP**

## Run locally (Windows)

Install [Node.js 22 LTS](https://nodejs.org), then in PowerShell:

```powershell
git clone https://github.com/asheets1/cessna-172e-hangar.git
cd cessna-172e-hangar
npm install
npm run dev
```

Open http://localhost:8080

If you used the zip instead of git:

```powershell
cd C:\Users\Aaron.Sheets\Downloads
Expand-Archive .\cessna-172e-hangar-main.zip -DestinationPath .
cd .\cessna-172e-hangar-main
npm install
npm run dev
```

You must be **inside** the project folder. `npm run` should list `dev`, `build`, and `preview`. Running from `Downloads` itself fails with `Missing script: "dev"`.

No `.env` file. Auth and database are off.

## OpenSCAD

In the hangar, open the **OpenSCAD** panel and download `cessna-172e.scad`. Open that file in [OpenSCAD](https://openscad.org/downloads.html) (F5 preview, F6 render). Units are inches.

Educational reconstruction from TCDS 3A12 / NACA 2412 — not official Cessna IPC data.
