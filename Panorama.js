import { getCurrentPosition, getLocation } from './GeoLocation.js';

export const getPanorama = async ({ lat, lng }) =>
  new Promise((resolve, reject) => {
    new google.maps.StreetViewService().getPanorama(
      { location: { lat, lng }, radius: 100 },
      (data, status) => {
        // console.log(data);
        if (status !== 'OK') reject(status);
        resolve(data.location.pano);
      }
    );
  });

export const getCurrentPanorama = async () => {
  const { lng, lat } = await getCurrentPosition();
  const panoramaId = await getPanorama({ lng, lat });
  return panoramaId;
};
