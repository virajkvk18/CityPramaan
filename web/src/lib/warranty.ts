import { DEFAULT_CITY_KEY, formatCityLocation, getCityByKey, type CityKey } from "./city-context";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export function distanceInMeters(a: GeoPoint, b: GeoPoint) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function detectRepeatFailure(cityKey: CityKey | string = DEFAULT_CITY_KEY) {
  const city = getCityByKey(cityKey);
  const repairedCase = {
    id: "CP-003",
    location: formatCityLocation(city),
    contractor: city.contractor,
    warrantyDaysLeft: 24,
    point: { lat: city.lat, lng: city.lng },
  };

  const newReport = {
    id: "CP-005",
    location: formatCityLocation(city),
    point: { lat: city.lat + 0.0001, lng: city.lng + 0.0001 },
  };

  const distance = Math.round(distanceInMeters(repairedCase.point, newReport.point));
  const isInsideWarranty = repairedCase.warrantyDaysLeft > 0;
  const isNearby = distance <= 100;

  return {
    repairedCase,
    newReport,
    distance,
    isRepeatFailure: isInsideWarranty && isNearby,
  };
}
