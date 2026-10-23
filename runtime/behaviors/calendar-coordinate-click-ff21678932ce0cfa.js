export default async function install(app) {
  const mount = app.getMount("today-calendar");
  const [webMercatorUtils, GraphicsLayer, Graphic] = await Promise.all([
    app.import("esri/geometry/support/webMercatorUtils"), app.import("esri/layers/GraphicsLayer"), app.import("esri/Graphic")
  ]);
  const glowLayer = new GraphicsLayer({ id: "shining-clicked-locations", title: "Shining clicked locations" });
  app.map.add(glowLayer);
  const now = new Date(), year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
  const root = document.createElement("section");
  root.style.cssText = "box-sizing:border-box;padding:14px;border-radius:16px;color:var(--calcite-color-text-1);background:linear-gradient(145deg,rgba(0,191,255,.20),rgba(255,92,206,.14) 48%,rgba(255,214,10,.16));border:1px solid rgba(255,255,255,.28);box-shadow:0 0 24px rgba(0,191,255,.22),inset 0 0 22px rgba(255,255,255,.06);font-family:var(--calcite-sans-family);";
  const heading = document.createElement("div"); heading.style.cssText = "font-weight:700;font-size:18px;letter-spacing:.02em;text-shadow:0 0 12px rgba(0,229,195,.85);"; heading.textContent = "✦ " + now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const monthTitle = document.createElement("div"); monthTitle.style.cssText = "margin:14px 0 8px;font-weight:650;color:#FFD60A;"; monthTitle.textContent = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdays = document.createElement("div"); weekdays.style.cssText = "display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;font-size:11px;text-align:center;color:var(--calcite-color-text-3);";
  ["S","M","T","W","T","F","S"].forEach((d) => { const cell = document.createElement("div"); cell.textContent = d; weekdays.appendChild(cell); });
  const grid = document.createElement("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:5px;";
  for (let i = 0; i < new Date(year, month, 1).getDay(); i++) grid.appendChild(document.createElement("div"));
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) { const cell = document.createElement("div"); cell.textContent = String(day); cell.style.cssText = "height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:13px;"; if (day === today) cell.style.cssText += "background:#00BFFF;color:#06131e;font-weight:800;box-shadow:0 0 16px #00BFFF,0 0 30px rgba(255,92,206,.7);"; grid.appendChild(cell); }
  const divider = document.createElement("div"); divider.style.cssText = "height:1px;margin:15px 0 11px;background:linear-gradient(90deg,transparent,#00E5C3,transparent);";
  const coordTitle = document.createElement("div"); coordTitle.style.cssText = "font-weight:700;font-size:14px;color:#00E5C3;"; coordTitle.textContent = "✦ Map coordinates";
  const coords = document.createElement("div"); coords.style.cssText = "margin-top:7px;padding:10px;border-radius:10px;background:rgba(2,14,28,.50);font-family:monospace;font-size:12px;line-height:1.6;color:#e8fbff;"; coords.textContent = "Click the map to capture a shining location.";
  root.append(heading, monthTitle, weekdays, grid, divider, coordTitle, coords); mount.replaceChildren(root);
  app.actions.register("show-click-coordinates", ({ event }) => {
    const point = event && event.mapPoint; if (!point) { coords.textContent = "No map coordinate was returned for this click."; return; }
    const geographic = point.spatialReference && point.spatialReference.isWebMercator ? webMercatorUtils.webMercatorToGeographic(point) : point;
    const lon = Number(geographic.longitude ?? geographic.x), lat = Number(geographic.latitude ?? geographic.y);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) { coords.textContent = "Coordinate conversion was unavailable."; return; }
    glowLayer.add(new Graphic({ geometry: point.clone(), attributes: { label: "Shining location " + (glowLayer.graphics.length + 1) }, symbol: { type: "simple-marker", style: "circle", size: 20, color: [0, 229, 195, 0.88], outline: { color: [255, 255, 255, 1], width: 2 } }, popupTemplate: { title: "{label}", content: "A location captured from the map." } }));
    coords.textContent = "Longitude  " + lon.toFixed(6) + "°\nLatitude   " + lat.toFixed(6) + "°\nSaved glow points  " + glowLayer.graphics.length;
  });
  app.onCleanup(() => { if (app.map.findLayerById("shining-clicked-locations")) app.map.remove(glowLayer); mount.replaceChildren(); });
}