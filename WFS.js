const SERVICE = 'WFS';
const GET_FEATURE = 'GetFeature';

const URL = 'https://geo.api.vlaanderen.be/GRB/wfs';

export const getFeature = async (layer, bbox, srsname = 'EPSG:31370') => {
  const url = `${URL}?${new URLSearchParams({
    service: SERVICE,
    request: GET_FEATURE,
    version: '2.0.0',
    outputformat: 'application/json',
    srsname,
    typename: `GRB:${layer}`,
    bbox: bbox.join(','),
  }).toString()}`;
  console.dir(url);
  const response = await fetch(url);
  const featureCollection = await response.json();
  return featureCollection;
};

export const getFeatureByIds = async (ids, srsName = 'EPSG:31370') => {
  const request = `<?xml version="1.0" ?>
<wfs:GetFeature
service="WFS"
version="2.0.0"
outputFormat="application/json"
xmlns:GRB="https://geo.api.vlaanderen.be/GRB"
xmlns:myns="http://www.someserver.com/myns"
xmlns:wfs="http://www.opengis.net/wfs/2.0"
xmlns:fes="http://www.opengis.net/fes/2.0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.opengis.net/wfs/2.0
                    http://schemas.opengis.net/wfs/2.0/wfs.xsd">
<wfs:Query  srsName="urn:ogc:def:crs:${srsName}">
  <fes:Filter>
    ${ids.map((id) => `<fes:ResourceId rid="${id}"/>`)}
  </fes:Filter>
</wfs:Query>
</wfs:GetFeature>`;
  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'text/xml',
    },
    body: request,
  });
  const featureCollection = await response.json();
  return featureCollection;
};
