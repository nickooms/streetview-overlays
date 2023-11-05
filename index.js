// import { feature } from '@turf/turf';
import { getLocation } from './GeoLocation.js';
import { getFeature, getFeatureByIds } from './WFS.js';
import { createUrl, fetchJson } from './util.js';
import { getCurrentPanorama } from './Panorama.js';
import { getFeatureId } from './Feature.js';
// import distance from './node_modules/@turf/distance/dist/es/index.js';
// import {} from './canny.js'

const METADATA_URL = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const TILE_URL = 'https://streetviewpixels-pa.googleapis.com/v1/tile';
const CRS_GPS = 'EPSG:4326';
const POLYLINE_STROKE = { strokeOpacity: 1.0, strokeWeight: 2 };
const POLYLINE_STROKE_HOVERED = { strokeOpacity: 0.5, strokeWeight: 5 };
const POLYGON_FILL = { fillOpacity: 0.2 };
// const PANO = 'r7FL2g8psCiM9VKn8DMOcQ';
const KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';

let panorama;
let PANO;

const getRandomColor = () => Math.floor(Math.random() * 0xffffff).toString(16);

const coordinateArrayToLatLng = ([lng, lat]) => ({ lat, lng });

const tile = ({ panoid, x, y, zoom }) =>
  new Promise((resolve) => {
    const img = document.createElement('img');
    img.addEventListener('load', () => resolve(img));
    img.src = createUrl(TILE_URL, {
      cb_client: 'maps_sv.tactile',
      panoid,
      x,
      y,
      zoom,
      nbt: 1,
      fover: 2,
    });
  });

const tiles = (panoid = PANO, zoom = 2) => {
  const c = document.createElement('canvas');
  c.id = 'panorama-canvas';
  const ctx = c.getContext('2d');
  const [w, h] = [2 ** zoom, 2 ** (zoom - 1)];
  c.width = w * 512;
  c.height = h * 512;
  const cols = new Array(w).fill(0).map((_, i) => i);
  const rows = new Array(h).fill(0).map((_, i) => i);
  const promises = rows
    .map((y) =>
      cols.map(async (x) => {
        ctx.drawImage(await tile({ panoid, x, y, zoom }), x * 512, y * 512);
      })
    )
    .flat(2);
  Promise.all(promises)
    .then((t) => {
      console.log(t);
    })
    .catch((e) => console.error(e));
  document.body.appendChild(c);
};

const getPanoramaMetadata = async (panoramaId) =>
  fetchJson(createUrl(METADATA_URL, { pano: panoramaId, key: KEY }));

export async function initMap() {
  const currentPanorama = await getCurrentPanorama();
  console.log(currentPanorama);
  PANO = currentPanorama;
  /* const url = `${METADATA_URL}?${new URLSearchParams({
    pano: PANO,
    key: KEY,
  }).toString()}`;
  const response = await fetch(url);
  const result = await response.json(); */
  const metadata = await getPanoramaMetadata(PANO);
  console.log(metadata);
  const { lat, lng } = metadata.location;
  const l = await getLocation({ latlon: `${lat},${lng}` });
  const q = l.FormattedAddress.replace(l.Housenumber, '')
    .replace(l.Municipality, '')
    .replace(l.Zipcode, '')
    .split(',')
    .reverse()
    .join(', ');
  const street = await getLocation({ q: l.Municipality + ', ' + l.Thoroughfarename });
  console.log(street);
  const { BoundingBox } = street;
  const { LowerLeft, UpperRight } = BoundingBox;
  const distancec = 0;
  const [X, Y, LAT, LON] = ['X_Lambert72', 'Y_Lambert72', 'Lat_WGS84', 'Lon_WGS84'];
  const minimum = [LowerLeft[X] - distancec, LowerLeft[Y] - distancec];
  const maximum = [UpperRight[X] + distancec, UpperRight[Y] + distancec];
  const min = await getLocation({ xy: minimum.join(',') });
  const max = await getLocation({ xy: maximum.join(',') });
  const bbox = [
    ...minimum,
    ...maximum,
    // minimum.Location[LON],
    // minimum.Location[LAT],
    // maximum.Location[LON],
    // maximum.Location[LAT],
  ];
  tiles();
  const center = { lat, lng };
  // const astorPlace = { lat: 40.729884, lng: -73.990988 };
  const map = new google.maps.Map(document.getElementById('map'), {
    center,
    zoom: 20,
    streetViewControl: false,
  });

  document.getElementById('toggle').addEventListener('click', toggleStreetView);

  // const MARKER_URL = 'https://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe';
  // const YELLOW_MARKER_URL = `${MARKER_URL}|FFFF00`;
  // 'https://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe|FFFF00';
  // const RED_MARKER_URL = 'https://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe|FF0000';

  /* const cafeMarker = new google.maps.Marker({
    position: { lat, lng },
    map,
    icon: YELLOW_MARKER_URL,
    title: 'Cafe',
  }); */
  // const gbg = await getFeature('GBG', bbox);
  // console.log(b);
  // const buildingIds = gbg.features.map(getFeatureId);
  // console.log(buildingIds);
  // const buildings = await getFeatureByIds(buildingIds, CRS_GPS);
  // console.log(buildings);
  /* const getFeatureBoundingBoxCenter = (feature) => {
    const { bbox } = feature;
    const [minX, minY, maxX, maxY] = bbox;
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  }; */

  const isType1WallPoint = (feature) => feature.properties.TYPE === 1;

  const isNearbyPoint = (centerPoint, distance) => (coordinates) =>
    turf.distance(turf.point(coordinates), centerPoint) < distance;

  const gvp = await getFeature('GVP', bbox);
  const gbgIds = gvp.features.map(getFeatureId);
  const wallPoints = await getFeatureByIds(gbgIds, CRS_GPS);
  const centerPoint = turf.point([lng, lat]);
  const frontWallPoints = wallPoints.features
    .filter(isType1WallPoint)
    .filter((feature) => isNearbyPoint(centerPoint, 0.05)(feature.geometry.coordinates));
  console.log(frontWallPoints);

  const gvl = await getFeature('GVL', bbox);
  const gvlIds = gvl.features.map(getFeatureId);
  const wallLines = await getFeatureByIds(gvlIds, CRS_GPS);
  const frontWallLines = wallLines.features
    .filter((feature) =>
      feature.geometry.coordinates.every((coordinate) =>
        isNearbyPoint(centerPoint, 0.05)(coordinate)
      )
    )
    .filter(isType1WallPoint);
  console.log(frontWallLines);
  /* const getDistance = (a, b) => {
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]);
    return Math.sqrt(dx * dx + dy * dy);
  }; */
  const panoramaCanvas = document.getElementById('panorama-canvas');
  const ctx = panoramaCanvas.getContext('2d');
  new google.maps.StreetViewService().getPanorama({ pano: PANO }, (data, status) => {
    console.log(status);
    console.log(data);
    const { centerHeading } = data.tiles;
    // Object.entries(data.PK).forEach(([p, { lat, lng }]) => {
    //   const cafeMarker = new google.maps.Marker({
    //     position: { lat, lng },
    //     map,
    //     icon: RED_MARKER_URL,
    //     title: 'Cafe',
    //   });
    //   cafeMarker.setMap(map);
    // });
    // frontWallPoints.forEach((feature) => {
    /* const { coordinates } = feature.geometry;
      let bearing = turf.bearing(centerPoint, turf.point(coordinates));
      bearing -= centerHeading;
      if (bearing < 180) {
        bearing += 360;
      }
      if (bearing > 180) {
        bearing -= 360;
      }
      const x = Math.floor(((bearing + 180) / 360) * panoramaCanvas.width);
      const randomColor = getRandomColor(); */
    // ctx.strokeStyle = `#${randomColor}`;
    /* ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, panoramaCanvas.height);
      ctx.stroke();
      ctx.closePath(); */
    // const [lng, lat] = coordinates;
    /* const wallPointMarker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: `${MARKER_URL}|${randomColor}`,
        title: 'WallPoint',
      });
      wallPointMarker.setMap(map); */
    /* const polyline = new google.maps.Polyline({
        path: [center, { lat, lng }],
        geodesic: true,
        strokeColor: `#${randomColor}`,
        ...POLYLINE_STROKE,
      });
      polyline.addListener('mouseover', () => {
        polyline.setOptions(POLYLINE_STROKE_HOVERED);
      });
      polyline.addListener('mouseout', () => {
        polyline.setOptions(POLYLINE_STROKE);
      });
      polyline.addListener('click', () => {
        panoramaCanvas.style.display = 'block';
      }); */
    // polyline.setMap(map);
    // });

    frontWallLines.forEach((feature) => {
      const randomColor = getRandomColor();
      const { coordinates } = feature.geometry;

      let bearings = coordinates.map((coordinate) =>
        turf.bearing(centerPoint, turf.point(coordinate))
      );
      bearings.forEach((bearing, index) => {
        bearing -= centerHeading;
        if (bearing < 180) {
          bearing += 360;
        }
        if (bearing > 180) {
          bearing -= 360;
        }
        bearings[index] = bearing;
      });
      const xs = bearings.map((bearing) =>
        Math.floor(((bearing + 180) / 360) * panoramaCanvas.width)
      );
      // const randomColor = getRandomColor();
      ctx.strokeStyle = `#${randomColor}`;
      ctx.fillStyle = `#${randomColor}66`;
      // ctx.fillOpacity = 0.2;
      ctx.beginPath();
      // ctx.moveTo(Math.floor(panoramaCanvas.width / 2), panoramaCanvas.height);
      xs.forEach((x, index) => {
        if (index === 0) {
          ctx.moveTo(x, panoramaCanvas.height);
        } else {
          ctx.lineTo(x, panoramaCanvas.height);
        }
      });
      xs.reverse().forEach((x) => {
        ctx.lineTo(x, 0);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      const lines = coordinates.map(coordinateArrayToLatLng);
      const polygon = new google.maps.Polygon({
        paths: [{ lng, lat }, ...lines],
        geodesic: true,
        strokeColor: `#${randomColor}`,
        ...POLYLINE_STROKE,
        fillColor: `#${randomColor}`,
        ...POLYGON_FILL,
      });
      const hide = () => {
        panoramaCanvas.style.display = 'none';
      };
      polygon.addListener('mouseover', () => {
        polygon.setOptions(POLYLINE_STROKE_HOVERED);
      });
      polygon.addListener('mouseout', () => {
        polygon.setOptions(POLYLINE_STROKE);
      });
      polygon.addListener('click', () => {
        panoramaCanvas.style.display = 'block';
        panoramaCanvas.addEventListener('click', hide, { once: true });
        // alert(JSON.stringify(feature.properties, null, 2));
      });
      polygon.setMap(map);
    });
  });

  /* buildings.features.forEach((feature) => {
    if (!isNearbyPoint(centerPoint, 0.05)(feature.bbox)) {
      return;
    }
    const [border] = feature.geometry.coordinates;
    const polygon = new google.maps.Polygon({
      paths: [border.map(coordinateArrayToLatLng)],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 1,
      fillColor: '#FF0000',
      fillOpacity: 0.2,
    });
    // polygon.setMap(map);
  }); */

  /* false &&
    frontWallLines.forEach((feature, index) => {
      const lines = feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      const line = new google.maps.Polygon({
        paths: [lines],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      line.setMap(map);
    }); */
  // const buildingCenters = buildings.features.map(getFeatureBoundingBoxCenter);
  // console.log(buildingCenters);
  /* const bankMarker = new google.maps.Marker({
    position: { lat: 40.729681, lng: -73.991138 },
    map,
    icon: YELLOW_MARKER_URL,
    title: 'Bank',
  });
  const busMarker = new google.maps.Marker({
    position: { lat: 40.729559, lng: -73.990741 },
    map,
    icon: YELLOW_MARKER_URL,
    title: 'Bus Stop',
  }); */

  panorama = map.getStreetView();
  panorama.setPosition(center);
  panorama.setPov({
    heading: 265,
    pitch: 0,
  });
}

function toggleStreetView() {
  const toggle = panorama.getVisible();

  if (toggle == false) {
    panorama.setVisible(true);
  } else {
    panorama.setVisible(false);
  }
}

window.initMap = initMap;
