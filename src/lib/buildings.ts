// Vinhomes Smart City — complete zone & building directory

export interface Zone {
  id: number;
  code: string;
  name: string;
  nameVi: string;
  description: string;
  buildings: Building[];
}

export interface Building {
  id: number;
  code: string;
  name: string;
  zoneCode: string;
}

export const ZONES: Zone[] = [
  {
    id: 1,
    code: "sapphire-1",
    name: "The Sapphire 1",
    nameVi: "The Sapphire 1",
    description: "Phân khu giá hợp lý, thiết kế tối ưu",
    buildings: [
      { id: 101, code: "S101", name: "S1.01", zoneCode: "sapphire-1" },
      { id: 102, code: "S102", name: "S1.02", zoneCode: "sapphire-1" },
      { id: 103, code: "S103", name: "S1.03", zoneCode: "sapphire-1" },
      { id: 104, code: "S104", name: "S1.04", zoneCode: "sapphire-1" },
      { id: 105, code: "S105", name: "S1.05", zoneCode: "sapphire-1" },
      { id: 106, code: "S106", name: "S1.06", zoneCode: "sapphire-1" },
    ],
  },
  {
    id: 2,
    code: "sapphire-2",
    name: "The Sapphire 2",
    nameVi: "The Sapphire 2",
    description: "Phân khu giá hợp lý, thiết kế tối ưu",
    buildings: [
      { id: 201, code: "S201", name: "S2.01", zoneCode: "sapphire-2" },
      { id: 202, code: "S202", name: "S2.02", zoneCode: "sapphire-2" },
      { id: 203, code: "S203", name: "S2.03", zoneCode: "sapphire-2" },
      { id: 204, code: "S204", name: "S2.04", zoneCode: "sapphire-2" },
      { id: 205, code: "S205", name: "S2.05", zoneCode: "sapphire-2" },
    ],
  },
  {
    id: 3,
    code: "sapphire-3",
    name: "The Sapphire 3",
    nameVi: "The Sapphire 3",
    description: "Phân khu giá hợp lý, thiết kế tối ưu",
    buildings: [
      { id: 301, code: "S301", name: "S3.01", zoneCode: "sapphire-3" },
      { id: 302, code: "S302", name: "S3.02", zoneCode: "sapphire-3" },
      { id: 303, code: "S303", name: "S3.03", zoneCode: "sapphire-3" },
    ],
  },
  {
    id: 4,
    code: "sapphire-4",
    name: "The Sapphire 4",
    nameVi: "The Sapphire 4",
    description: "Phân khu giá hợp lý, thiết kế tối ưu",
    buildings: [
      { id: 401, code: "S401", name: "S4.01", zoneCode: "sapphire-4" },
      { id: 402, code: "S402", name: "S4.02", zoneCode: "sapphire-4" },
    ],
  },
  {
    id: 5,
    code: "miami",
    name: "The Miami",
    nameVi: "The Miami",
    description: "Phân khu phong cách Mỹ, gần hồ điều hòa",
    buildings: [
      { id: 501, code: "GS1", name: "GS1", zoneCode: "miami" },
      { id: 502, code: "GS2", name: "GS2", zoneCode: "miami" },
      { id: 503, code: "GS3", name: "GS3", zoneCode: "miami" },
      { id: 504, code: "GS4", name: "GS4", zoneCode: "miami" },
      { id: 505, code: "GS5", name: "GS5", zoneCode: "miami" },
      { id: 506, code: "GS6", name: "GS6", zoneCode: "miami" },
    ],
  },
  {
    id: 6,
    code: "sakura",
    name: "The Sakura",
    nameVi: "The Sakura",
    description: "Phong cách Nhật Bản, không gian sống thư giãn",
    buildings: [
      { id: 601, code: "SK1", name: "SK1", zoneCode: "sakura" },
      { id: 602, code: "SK2", name: "SK2", zoneCode: "sakura" },
      { id: 603, code: "SK3", name: "SK3", zoneCode: "sakura" },
    ],
  },
  {
    id: 7,
    code: "victoria",
    name: "The Victoria",
    nameVi: "The Victoria",
    description: "Phân khu cao cấp, biệt lập",
    buildings: [
      { id: 701, code: "V1", name: "V1", zoneCode: "victoria" },
      { id: 702, code: "V2", name: "V2", zoneCode: "victoria" },
      { id: 703, code: "V3", name: "V3", zoneCode: "victoria" },
    ],
  },
  {
    id: 8,
    code: "tonkin",
    name: "The Tonkin",
    nameVi: "The Tonkin",
    description: "Phong cách Đông Dương, sang trọng",
    buildings: [
      { id: 801, code: "TK1", name: "TK1", zoneCode: "tonkin" },
      { id: 802, code: "TK2", name: "TK2", zoneCode: "tonkin" },
    ],
  },
  {
    id: 9,
    code: "canopy",
    name: "The Canopy Residences",
    nameVi: "The Canopy Residences",
    description: "Phân khu cao cấp mới nhất",
    buildings: [
      { id: 901, code: "TC1", name: "TC1", zoneCode: "canopy" },
      { id: 902, code: "TC2", name: "TC2", zoneCode: "canopy" },
      { id: 903, code: "TC3", name: "TC3", zoneCode: "canopy" },
    ],
  },
  {
    id: 10,
    code: "masteri",
    name: "Masteri West Heights",
    nameVi: "Masteri West Heights",
    description: "Căn hộ cao cấp hợp tác với Masterise Homes",
    buildings: [
      { id: 1001, code: "MWH-A", name: "Tòa A", zoneCode: "masteri" },
      { id: 1002, code: "MWH-B", name: "Tòa B", zoneCode: "masteri" },
      { id: 1003, code: "MWH-C", name: "Tòa C", zoneCode: "masteri" },
      { id: 1004, code: "MWH-D", name: "Tòa D", zoneCode: "masteri" },
    ],
  },
  {
    id: 11,
    code: "imperia",
    name: "Imperia The Sola Park",
    nameVi: "Imperia The Sola Park",
    description: "Dự án cao cấp từ MIK Group",
    buildings: [
      { id: 1101, code: "ISP-A", name: "Tòa A", zoneCode: "imperia" },
      { id: 1102, code: "ISP-B", name: "Tòa B", zoneCode: "imperia" },
      { id: 1103, code: "ISP-C", name: "Tòa C", zoneCode: "imperia" },
      { id: 1104, code: "ISP-D", name: "Tòa D", zoneCode: "imperia" },
      { id: 1105, code: "ISP-E", name: "Tòa E", zoneCode: "imperia" },
    ],
  },
  {
    id: 12,
    code: "lumiere",
    name: "Lumiere Evergreen",
    nameVi: "Lumiere Evergreen",
    description: "Tổ hợp căn hộ cao cấp từ Masterise Homes",
    buildings: [
      { id: 1201, code: "LE-A", name: "Tòa A", zoneCode: "lumiere" },
      { id: 1202, code: "LE-B", name: "Tòa B", zoneCode: "lumiere" },
    ],
  },
];

export function getZoneByCode(code: string): Zone | undefined {
  return ZONES.find((z) => z.code === code);
}

export function getBuildingByCode(code: string): Building | undefined {
  return ZONES.flatMap((z) => z.buildings).find((b) => b.code === code);
}

export function getZoneForBuilding(code: string): Zone | undefined {
  return ZONES.find((z) => z.buildings.some((b) => b.code === code));
}

export const BUILDING_CODES = ZONES.flatMap((z) => z.buildings.map((b) => b.code));

// Map building code to display name
export function getBuildingDisplayName(code: string): string {
  const found = getBuildingByCode(code);
  if (!found) return code;
  const zone = getZoneByCode(found.zoneCode);
  return zone ? `${zone.nameVi} - ${found.name}` : found.name;
}

// TODO: Make this data API-driven instead of hardcoded
// Use fetchBuildings() for dynamic data once API endpoint is created

// Placeholder for future API-driven approach
export async function fetchBuildings(): Promise<Zone[]> {
  // In the future, this will call GET /api/zones
  return ZONES;
}
