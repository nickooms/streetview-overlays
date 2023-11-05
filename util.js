export const createUrl = (url, params) => `${url}?${new URLSearchParams(params).toString()}`;

export const fetchJson = async (url) => {
  const response = await fetch(url);
  const result = await response.json();
  return result;
};
