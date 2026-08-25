Cessna 172E Skyhawk Hangar — local setup (Windows)
====================================================

You must run npm from THIS folder, not from Downloads.

1. Install Node.js 22 LTS from https://nodejs.org
   Close and reopen PowerShell after installing.

2. Extract this zip, then:

   cd C:\Users\Aaron.Sheets\Downloads\cessna-172e-hangar
   npm install
   npm run dev

3. Open http://localhost:8080

If you see `Missing script: "dev"`, you are in the wrong directory.
Check with:

   Get-Content package.json | Select-String "dev"
   npm run

You should see scripts named dev, build, and preview.
The package name should be "cessna-172e-hangar".

OpenSCAD (the 3D CAD file, not the website)
-------------------------------------------
The hangar website can export cessna-172e.scad.
That file opens in OpenSCAD (https://openscad.org/downloads.html),
not with npm. F5 = preview, F6 = render. Units are inches.

Notes
-----
- No .env file. Auth and database are off.
- Dev server binds port 8080.
- Production build: npm run build   then   npm run preview  (port 8081)
