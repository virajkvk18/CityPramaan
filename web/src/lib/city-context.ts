export type CityKey =
  | "bhopal"
  | "jabalpur"
  | "mumbai"
  | "delhi"
  | "pune"
  | "hyderabad"
  | "chennai";

export type DemoCity = {
  key: CityKey;
  name: string;
  state: string;
  primaryArea: string;
  secondaryArea: string;
  repairWard: string;
  contractor: string;
  lat: number;
  lng: number;
};

export const DEFAULT_CITY_KEY: CityKey = "bhopal";

export const demoCities: DemoCity[] = [
  {
    key: "bhopal",
    name: "Bhopal",
    state: "Madhya Pradesh",
    primaryArea: "MP Nagar Zone 1",
    secondaryArea: "Arera Colony Link Road",
    repairWard: "Ward 46",
    contractor: "Bhopal RoadWorks",
    lat: 23.2599,
    lng: 77.4126,
  },
  {
    key: "jabalpur",
    name: "Jabalpur",
    state: "Madhya Pradesh",
    primaryArea: "Civic Centre",
    secondaryArea: "Napier Town Main Road",
    repairWard: "Ward 32",
    contractor: "Jabalpur CivicWorks",
    lat: 23.1815,
    lng: 79.9864,
  },
  {
    key: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    primaryArea: "Bandra Linking Road",
    secondaryArea: "Andheri East Metro Road",
    repairWard: "Ward H-West",
    contractor: "Mumbai InfraWorks",
    lat: 19.0607,
    lng: 72.8362,
  },
  {
    key: "delhi",
    name: "Delhi",
    state: "Delhi NCR",
    primaryArea: "Connaught Place Outer Circle",
    secondaryArea: "Lajpat Nagar Ring Road",
    repairWard: "NDMC Zone 4",
    contractor: "Capital Civic Works",
    lat: 28.6315,
    lng: 77.2167,
  },
  {
    key: "pune",
    name: "Pune",
    state: "Maharashtra",
    primaryArea: "FC Road",
    secondaryArea: "Hinjawadi Phase 1",
    repairWard: "Ward 14",
    contractor: "Pune RoadGrid",
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    key: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    primaryArea: "HITEC City Main Road",
    secondaryArea: "Banjara Hills Road No. 12",
    repairWard: "GHMC Ward 104",
    contractor: "Deccan UrbanFix",
    lat: 17.4435,
    lng: 78.3772,
  },
  {
    key: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    primaryArea: "T. Nagar Usman Road",
    secondaryArea: "Anna Salai",
    repairWard: "Zone 10",
    contractor: "Chennai CivicBuild",
    lat: 13.0418,
    lng: 80.2341,
  },
];

export function getCityByKey(key: string | null | undefined) {
  return demoCities.find((city) => city.key === key) ?? demoCities[0];
}

export function formatCityLocation(city: DemoCity, area = city.primaryArea) {
  return `${area}, ${city.name}`;
}

export function getNearestSupportedCity(latitude: number, longitude: number) {
  return demoCities
    .map((city) => ({
      city,
      distance: getDistanceKm(latitude, longitude, city.lat, city.lng),
    }))
    .sort((first, second) => first.distance - second.distance)[0].city;
}

export function getDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
