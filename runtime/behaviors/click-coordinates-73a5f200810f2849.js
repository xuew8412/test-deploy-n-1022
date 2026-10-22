export default async function install(app) {
  const Graphic = await app.import("esri/Graphic");
  const mount = app.getMount("coord-readout");

  let clickedGraphic = null;

  const root = document.createElement("div");
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "10px";
  root.style.fontFamily = "var(--calcite-sans-family, system-ui, sans-serif)";
  root.style.fontSize = "14px";
  root.style.lineHeight = "1.4";

  const intro = document.createElement("p");
  intro.textContent = "Click anywhere on the map to show its coordinates and mark the clicked point.";
  intro.style.margin = "0";

  const lat = document.createElement("div");
  const lon = document.createElement("div");
  const xy = document.createElement("div");
  const copyHint = document.createElement("p");
  copyHint.style.margin = "0";
  copyHint.style.color = "var(--calcite-color-text-3)";
  copyHint.textContent = "No point selected yet.";

  function line(label, value) {
    return `${label}: ${value}`;
  }

  function setEmpty() {
    lat.textContent = line("Latitude", "—");
    lon.textContent = line("Longitude", "—");
    xy.textContent = line("Web Mercator", "—");
  }

  function clearClickedGraphic() {
    if (clickedGraphic) {
      app.view.graphics.remove(clickedGraphic);
      clickedGraphic = null;
    }
  }

  function markClickedPoint(point) {
    clearClickedGraphic();
    clickedGraphic = new Graphic({
      geometry: point.clone ? point.clone() : point,
      symbol: {
        type: "simple-marker",
        style: "circle",
        size: 16,
        color: [0, 122, 194, 0.9],
        outline: {
          color: [255, 255, 255, 1],
          width: 2
        }
      }
    });
    app.view.graphics.add(clickedGraphic);
  }

  setEmpty();
  root.append(intro, lat, lon, xy, copyHint);
  mount.replaceChildren(root);

  app.actions.register("show-coordinates", async ({ event }) => {
    try {
      const point = event?.mapPoint;
      if (!point) {
        copyHint.textContent = "No map point was returned for that click.";
        return;
      }

      markClickedPoint(point);

      const geographic = point.longitude != null && point.latitude != null
        ? point
        : point.spatialReference?.isWGS84
          ? point
          : point.clone();
      const latitude = geographic.latitude;
      const longitude = geographic.longitude;
      lat.textContent = line("Latitude", Number.isFinite(latitude) ? latitude.toFixed(6) : "unavailable");
      lon.textContent = line("Longitude", Number.isFinite(longitude) ? longitude.toFixed(6) : "unavailable");
      xy.textContent = line("Web Mercator", `${point.x.toFixed(2)}, ${point.y.toFixed(2)}`);
      copyHint.textContent = Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        : "Coordinates unavailable for this click.";
    } catch (error) {
      copyHint.textContent = "Could not read coordinates for that click.";
      app.reportError(error);
    }
  });

  app.onCleanup(() => {
    clearClickedGraphic();
    mount.replaceChildren();
  });
}