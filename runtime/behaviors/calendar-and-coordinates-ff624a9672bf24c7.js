export default async function install(app) {
  const [webMercatorUtils] = await Promise.all([
    app.import("esri/geometry/support/webMercatorUtils")
  ]);
  const calendarMount = app.getMount("today-calendar");
  const coordinateMount = app.getMount("click-coordinates");

  const style = (element, rules) => Object.assign(element.style, rules);
  const addText = (parent, text, rules = {}) => {
    const node = document.createElement("div");
    node.textContent = text;
    style(node, rules);
    parent.appendChild(node);
    return node;
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthName = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(now);
  const weekdayName = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  const calendar = document.createElement("div");
  style(calendar, { fontFamily: "var(--calcite-sans-family)", color: "var(--calcite-color-text-1)", padding: "4px 0" });
  addText(calendar, monthName, { fontWeight: "700", fontSize: "1.05rem", marginBottom: "2px" });
  addText(calendar, weekdayName, { fontSize: "0.82rem", color: "var(--calcite-color-text-3)", marginBottom: "12px" });
  const grid = document.createElement("div");
  style(grid, { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", textAlign: "center", fontSize: "0.82rem" });
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => addText(grid, day, { fontWeight: "600", color: "var(--calcite-color-text-3)", paddingBottom: "4px" }));
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let blank = 0; blank < firstWeekday; blank += 1) addText(grid, "", { minHeight: "28px" });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday = day === today;
    addText(grid, String(day), { minHeight: "28px", lineHeight: "28px", borderRadius: "50%", background: isToday ? "var(--calcite-color-brand)" : "transparent", color: isToday ? "var(--calcite-color-text-inverse)" : "inherit", fontWeight: isToday ? "700" : "400" });
  }
  calendar.appendChild(grid);
  calendarMount.replaceChildren(calendar);

  const coordinatePanel = document.createElement("div");
  style(coordinatePanel, { fontFamily: "var(--calcite-sans-family)", padding: "4px 0" });
  const coordinateTitle = addText(coordinatePanel, "Click anywhere on the map", { fontWeight: "600", marginBottom: "6px" });
  const coordinateDetail = addText(coordinatePanel, "Longitude and latitude will appear here.", { color: "var(--calcite-color-text-3)", fontSize: "0.85rem", lineHeight: "1.4" });
  coordinateMount.replaceChildren(coordinatePanel);

  app.actions.register("show-click-coordinates", async ({ event }) => {
    const mapPoint = event?.mapPoint;
    if (!mapPoint) return;
    const geographic = mapPoint.spatialReference?.isWebMercator ? webMercatorUtils.webMercatorToGeographic(mapPoint) : mapPoint;
    const longitude = Number(geographic.longitude ?? geographic.x);
    const latitude = Number(geographic.latitude ?? geographic.y);
    coordinateTitle.textContent = "Selected map location";
    coordinateDetail.textContent = "Longitude: " + longitude.toFixed(6) + "\nLatitude: " + latitude.toFixed(6);
    coordinateDetail.style.whiteSpace = "pre-line";
  });

  app.onCleanup(() => {
    calendarMount.replaceChildren();
    coordinateMount.replaceChildren();
  });
}