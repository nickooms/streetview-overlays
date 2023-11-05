// Help/Api/GET-geolocation-Location_q_latlon_xy_type_c
// GET geolocation/Location?q={q}&latlon={latlon}&xy={xy}&type={type}&c={c}

import { createUrl, fetchJson } from './util.js';

const URL = 'https://geo.api.vlaanderen.be/geolocation/v4/Location';

export const getLocation = async ({ q, latlon, xy, type, c }) => {
  const params = Object.entries({
    q,
    latlon,
    xy,
    type,
    c,
  }).filter(([, value]) => value !== undefined);
  // const url = `${URL}?${new URLSearchParams(params).toString()}`;
  // console.log(url);
  // const response = await fetch(url);
  // const result = await response.json();
  const {
    LocationResult: [location],
  } = await fetchJson(createUrl(URL, params));
  return location;
};

export const getCurrentPosition = async (enableHighAccuracy = true) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        console.log(currentPosition);
        const { longitude: lng, latitude: lat } = currentPosition.coords;
        resolve({ lng, lat });
      },
      reject,
      { enableHighAccuracy }
    );
  });
