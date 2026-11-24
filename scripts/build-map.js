const fs = require("fs");
const path = require("path");
const topojson = require("topojson-client");

const packageJson = require("../package.json");
const provincesRaw = require("@province-city-china/province");
const citiesRaw = require("@province-city-china/city");
const areasRaw = require("@province-city-china/area");

const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "raw", "datav-geojson");
const outDir = path.join(root, "src", "data");
const outFile = path.join(outDir, "china-map.js");
const datavBaseUrl = "https://geo.datav.aliyun.com/areas_v3/bound";
const municipalityCodes = new Set(["110000", "120000", "310000", "500000"]);
const width = 1000;
const padding = 22;
const missingGeoCodes = [];

const usStates = [
  ["01", "AL", "Alabama", "阿拉巴马州"], ["02", "AK", "Alaska", "阿拉斯加州"],
  ["04", "AZ", "Arizona", "亚利桑那州"], ["05", "AR", "Arkansas", "阿肯色州"],
  ["06", "CA", "California", "加利福尼亚州"], ["08", "CO", "Colorado", "科罗拉多州"],
  ["09", "CT", "Connecticut", "康涅狄格州"], ["10", "DE", "Delaware", "特拉华州"],
  ["11", "DC", "District of Columbia", "哥伦比亚特区"], ["12", "FL", "Florida", "佛罗里达州"],
  ["13", "GA", "Georgia", "佐治亚州"], ["15", "HI", "Hawaii", "夏威夷州"],
  ["16", "ID", "Idaho", "爱达荷州"], ["17", "IL", "Illinois", "伊利诺伊州"],
  ["18", "IN", "Indiana", "印第安纳州"], ["19", "IA", "Iowa", "艾奥瓦州"],
  ["20", "KS", "Kansas", "堪萨斯州"], ["21", "KY", "Kentucky", "肯塔基州"],
  ["22", "LA", "Louisiana", "路易斯安那州"], ["23", "ME", "Maine", "缅因州"],
  ["24", "MD", "Maryland", "马里兰州"], ["25", "MA", "Massachusetts", "马萨诸塞州"],
  ["26", "MI", "Michigan", "密歇根州"], ["27", "MN", "Minnesota", "明尼苏达州"],
  ["28", "MS", "Mississippi", "密西西比州"], ["29", "MO", "Missouri", "密苏里州"],
  ["30", "MT", "Montana", "蒙大拿州"], ["31", "NE", "Nebraska", "内布拉斯加州"],
  ["32", "NV", "Nevada", "内华达州"], ["33", "NH", "New Hampshire", "新罕布什尔州"],
  ["34", "NJ", "New Jersey", "新泽西州"], ["35", "NM", "New Mexico", "新墨西哥州"],
  ["36", "NY", "New York", "纽约州"], ["37", "NC", "North Carolina", "北卡罗来纳州"],
  ["38", "ND", "North Dakota", "北达科他州"], ["39", "OH", "Ohio", "俄亥俄州"],
  ["40", "OK", "Oklahoma", "俄克拉何马州"], ["41", "OR", "Oregon", "俄勒冈州"],
  ["42", "PA", "Pennsylvania", "宾夕法尼亚州"], ["44", "RI", "Rhode Island", "罗得岛州"],
  ["45", "SC", "South Carolina", "南卡罗来纳州"], ["46", "SD", "South Dakota", "南达科他州"],
  ["47", "TN", "Tennessee", "田纳西州"], ["48", "TX", "Texas", "得克萨斯州"],
  ["49", "UT", "Utah", "犹他州"], ["50", "VT", "Vermont", "佛蒙特州"],
  ["51", "VA", "Virginia", "弗吉尼亚州"], ["53", "WA", "Washington", "华盛顿州"],
  ["54", "WV", "West Virginia", "西弗吉尼亚州"], ["55", "WI", "Wisconsin", "威斯康星州"],
  ["56", "WY", "Wyoming", "怀俄明州"]
].map(([fips, abbr, nameEn, nameCn], index) => ({
  fips,
  abbr,
  code: `US-${abbr}`,
  nameEn,
  nameCn,
  name: nameCn === nameEn ? nameEn : `${nameCn} / ${nameEn}`,
  order: index + 1
}));
const usStateByFips = new Map(usStates.map((state) => [state.fips, state]));

const provinceByCode = new Map(provincesRaw.map((item) => [item.code, item]));
const provinceCodeByPrefix = new Map(provincesRaw.map((item) => [item.province, item.code]));
const cityRecords = citiesRaw.map((item) => ({
  code: item.code,
  name: item.name,
  provinceCode: provinceCodeByPrefix.get(item.province),
  isDirectCountyGroup: item.city === "90" || /直辖县级行政区划/.test(item.name)
}));
const cityByCode = new Map(cityRecords.map((item) => [item.code, item]));
const citiesByProvince = groupBy(cityRecords, "provinceCode");

const areaRecords = areasRaw.map((item) => {
  const provinceCode = provinceCodeByPrefix.get(item.province);
  const normalCityCode = `${item.province}${item.city}00`;
  const cityCode = municipalityCodes.has(provinceCode) ? provinceCode : normalCityCode;
  return {
    code: item.code,
    name: item.name,
    provinceCode,
    cityCode
  };
});
const areaByCode = new Map(areaRecords.map((item) => [item.code, item]));
const areasByProvince = groupBy(areaRecords, "provinceCode");
const areasByCity = groupBy(areaRecords, "cityCode");

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "";
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {});
}

async function fetchGeoJson(code, required = false) {
  fs.mkdirSync(rawDir, { recursive: true });
  const file = path.join(rawDir, `${code}_full.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  const url = `${datavBaseUrl}/${code}_full.json`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Lutuji offline map builder)"
    }
  });

  if (!response.ok) {
    if (required) throw new Error(`Failed to fetch map ${code}: ${response.status}`);
    missingGeoCodes.push(code);
    return null;
  }

  const text = await response.text();
  const parsed = JSON.parse(text);
  fs.writeFileSync(file, JSON.stringify(parsed), "utf8");
  return parsed;
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function featureCode(feature) {
  return String(feature?.properties?.adcode || "");
}

function featureName(feature) {
  return String(feature?.properties?.name || "");
}

function validFeature(feature) {
  return (/^\d{6}$/.test(featureCode(feature)) || /^US(?:-[A-Z]{2}|\d{5})$/.test(featureCode(feature))) && feature?.geometry;
}

function ringsFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates || [];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat();
  return [];
}

function collectBounds(features) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const feature of features) {
    for (const ring of ringsFromGeometry(feature.geometry)) {
      for (const coord of ring) {
        const lon = Number(coord[0]);
        const lat = Number(coord[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    }
  }

  if (!Number.isFinite(minLon)) {
    return null;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let splitIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i += 1) {
    const distance = distanceToSegment(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      splitIndex = i;
    }
  }

  if (maxDistance <= tolerance) return [points[0], points[end]];
  return rdp(points.slice(0, splitIndex + 1), tolerance).slice(0, -1).concat(rdp(points.slice(splitIndex), tolerance));
}

function isSamePoint(a, b) {
  return Math.abs(a[0] - b[0]) < 0.001 && Math.abs(a[1] - b[1]) < 0.001;
}

function segmentKey(a, b) {
  const left = `${Number(a[0]).toFixed(5)},${Number(a[1]).toFixed(5)}`;
  const right = `${Number(b[0]).toFixed(5)},${Number(b[1]).toFixed(5)}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function buildAdjacency(features) {
  const segmentOwners = new Map();
  const adjacency = new Map();

  for (const feature of features) {
    const code = featureCode(feature);
    if (!code) continue;
    if (!adjacency.has(code)) adjacency.set(code, new Set());
    for (const ring of ringsFromGeometry(feature.geometry)) {
      for (let i = 1; i < ring.length; i += 1) {
        const key = segmentKey(ring[i - 1], ring[i]);
        if (!segmentOwners.has(key)) segmentOwners.set(key, new Set());
        segmentOwners.get(key).add(code);
      }
    }
  }

  for (const owners of segmentOwners.values()) {
    const codes = [...owners];
    if (codes.length < 2) continue;
    for (let i = 0; i < codes.length; i += 1) {
      for (let j = i + 1; j < codes.length; j += 1) {
        adjacency.get(codes[i])?.add(codes[j]);
        adjacency.get(codes[j])?.add(codes[i]);
      }
    }
  }

  return adjacency;
}

function greedyFourColor(units, adjacency) {
  const colors = new Map();
  const codes = units.map((unit) => unit.code);
  const ordered = [...codes].sort((a, b) => (adjacency.get(b)?.size || 0) - (adjacency.get(a)?.size || 0));

  for (const code of ordered) {
    const used = new Set([...((adjacency.get(code) || new Set()))].map((near) => colors.get(near)).filter((value) => value !== undefined));
    let color = [0, 1, 2, 3].find((candidate) => !used.has(candidate));
    if (color === undefined) {
      color = [...used, 0].sort((a, b) => a - b)[0] % 4;
    }
    colors.set(code, color);
  }

  return colors;
}

function projectFeature(feature, projector, tolerance) {
  const segments = [];

  for (const ring of ringsFromGeometry(feature.geometry)) {
    const projected = ring
      .map((coord) => projector(coord))
      .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));

    if (projected.length < 3) continue;

    const open = isSamePoint(projected[0], projected[projected.length - 1]) ? projected.slice(0, -1) : projected;
    let simplified = rdp(open, tolerance);
    if (simplified.length < 3) simplified = open.slice(0, Math.min(open.length, 3));
    if (!isSamePoint(simplified[0], simplified[simplified.length - 1])) simplified = simplified.concat([simplified[0]]);

    const commands = simplified.map((point, index) => {
      const x = Number(point[0].toFixed(1));
      const y = Number(point[1].toFixed(1));
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    });
    segments.push(`${commands.join(" ")}Z`);
  }

  return segments.join(" ");
}

function makeScope(features, level, nameResolver) {
  const cleanFeatures = features.filter(validFeature);
  const bounds = collectBounds(cleanFeatures);
  if (!bounds) {
    return { level, viewBox: "0 0 1000 420", units: [] };
  }

  const midLat = ((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180);
  const xFactor = Math.max(Math.cos(midLat), 0.45);
  const rawMinX = bounds.minLon * xFactor;
  const rawMaxX = bounds.maxLon * xFactor;
  const rawMinY = -bounds.maxLat;
  const rawMaxY = -bounds.minLat;
  const scale = (width - padding * 2) / Math.max(rawMaxX - rawMinX, 1);
  const height = Math.max(360, Math.ceil((rawMaxY - rawMinY) * scale + padding * 2));
  const tolerance = level === "area" ? 0.85 : level === "city" ? 0.65 : 0.55;

  const projector = (coord) => {
    const x = (Number(coord[0]) * xFactor - rawMinX) * scale + padding;
    const y = (-Number(coord[1]) - rawMinY) * scale + padding;
    return [x, y];
  };

  const seen = new Set();
  const units = [];
  const adjacency = buildAdjacency(cleanFeatures);
  for (const feature of cleanFeatures) {
    const code = featureCode(feature);
    if (seen.has(code)) continue;
    const d = projectFeature(feature, projector, tolerance);
    if (!d) continue;
    seen.add(code);
    units.push({
      code,
      name: nameResolver(code, featureName(feature)),
      d
    });
  }

  units.sort((a, b) => a.code.localeCompare(b.code));
  const colors = greedyFourColor(units, adjacency);
  for (const unit of units) {
    unit.color = colors.get(unit.code) ?? 0;
  }
  return {
    level,
    viewBox: `0 0 ${width} ${height}`,
    units
  };
}

function featuresFromGeo(geoJson) {
  return (geoJson?.features || []).filter(validFeature);
}

function selectFeaturesByCodes(features, codes) {
  const wanted = new Set(codes);
  return features.filter((feature) => wanted.has(featureCode(feature)));
}

function resolveProvinceName(code, fallback) {
  return provinceByCode.get(code)?.name || fallback || code;
}

function resolveCityName(code, fallback) {
  const city = cityByCode.get(code);
  if (city) return city.name;
  const area = areaByCode.get(code);
  if (area) return area.name;
  return fallback || code;
}

function resolveAreaName(code, fallback) {
  return areaByCode.get(code)?.name || fallback || code;
}

function makeSingleProvinceScope(countryFeatures, provinceCode) {
  const province = provinceByCode.get(provinceCode);
  const feature = countryFeatures.find((item) => featureCode(item) === provinceCode);
  if (!feature || !province) return null;
  return makeScope([feature], "city", () => `${province.name}本级`);
}

function countyTypeFor(stateAbbr, countyName) {
  if (stateAbbr === "LA") return { en: "Parish", cn: "堂区" };
  if (stateAbbr === "AK") {
    if (/Census Area$/i.test(countyName)) return { en: "", cn: "人口普查区" };
    if (/Municipality$/i.test(countyName)) return { en: "", cn: "自治市" };
    return { en: "Borough", cn: "自治市镇" };
  }
  if (stateAbbr === "DC") return { en: "", cn: "特区" };
  if (/city$/i.test(countyName)) return { en: "", cn: "独立市" };
  return { en: "County", cn: "县" };
}

function usCountyName(fips, rawName) {
  const state = usStateByFips.get(String(fips).slice(0, 2));
  if (!state) return rawName || fips;
  const type = countyTypeFor(state.abbr, rawName);
  const en = type.en && !new RegExp(`${type.en}$`, "i").test(rawName) ? `${rawName} ${type.en}` : rawName;
  return `${rawName}${type.cn} / ${en}`;
}

function usFeature(feature, code, name) {
  return {
    type: "Feature",
    properties: {
      ...(feature.properties || {}),
      adcode: code,
      name
    },
    geometry: feature.geometry
  };
}

function buildUsMap() {
  const topologyPath = require.resolve("us-atlas/counties-10m.json");
  const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
  const stateFeaturesRaw = topojson.feature(topology, topology.objects.states).features;
  const countyFeaturesRaw = topojson.feature(topology, topology.objects.counties).features;
  const allowedStateFips = new Set(usStates.map((state) => state.fips));
  const stateFeatures = stateFeaturesRaw
    .filter((feature) => allowedStateFips.has(String(feature.id).padStart(2, "0")))
    .map((feature) => {
      const state = usStateByFips.get(String(feature.id).padStart(2, "0"));
      return usFeature(feature, state.code, state.name);
    });
  const countyFeatures = countyFeaturesRaw
    .filter((feature) => allowedStateFips.has(String(feature.id).padStart(5, "0").slice(0, 2)))
    .map((feature) => {
      const fips = String(feature.id).padStart(5, "0");
      return usFeature(feature, `US${fips}`, usCountyName(fips, feature.properties?.name || fips));
    });

  const countyByCode = new Map(countyFeatures.map((feature) => [featureCode(feature), feature]));
  const provinceScope = makeScope(stateFeatures, "province", (code, fallback) => usStates.find((state) => state.code === code)?.name || fallback);
  const cityScopes = {};
  const areaProvinceScopes = {};
  const areaCityScopes = {};

  for (const state of usStates) {
    const stateCountyFeatures = countyFeatures.filter((feature) => featureCode(feature).slice(2, 4) === state.fips);
    if (!stateCountyFeatures.length) continue;
    const scope = makeScope(stateCountyFeatures, "city", (code, fallback) => countyByCode.get(code)?.properties?.name || fallback);
    cityScopes[state.code] = scope;
    areaProvinceScopes[state.code] = scope;
    for (const feature of stateCountyFeatures) {
      const code = featureCode(feature);
      areaCityScopes[code] = makeScope([feature], "area", (unitCode, fallback) => countyByCode.get(unitCode)?.properties?.name || fallback);
    }
  }

  return {
    version: packageJson.version,
    projection: "upright-equirectangular",
    coloring: {
      name: "four-color-greedy",
      note: "Adjacent US state and county boundaries are assigned one of four visual color channels where topology exposes shared segments."
    },
    source: {
      name: "us-atlas counties-10m",
      url: "https://github.com/topojson/us-atlas",
      note: "Offline TopoJSON state and county boundaries converted to SVG paths for US state and county-equivalent practice."
    },
    coverage: {
      countyBoundaryUnits: countyFeatures.length,
      countyListUnits: countyFeatures.length,
      missingSourceCodes: []
    },
    scopes: {
      province: provinceScope,
      city: cityScopes,
      areaProvince: areaProvinceScopes,
      areaCity: areaCityScopes
    }
  };
}

async function main() {
  const country = await fetchGeoJson("100000", true);
  const countryFeatures = featuresFromGeo(country).filter((feature) => provinceByCode.has(featureCode(feature)));
  const provinceScope = makeScope(countryFeatures, "province", resolveProvinceName);

  const provinceCodes = provincesRaw.map((item) => item.code);
  const cityFetchCodes = cityRecords
    .filter((city) => !city.isDirectCountyGroup && !municipalityCodes.has(city.provinceCode))
    .map((city) => city.code);
  const fetchCodes = [...new Set([...provinceCodes, ...cityFetchCodes])].filter((code) => code !== "710000");
  const geoByCode = new Map();

  await mapLimit(fetchCodes, 8, async (code) => {
    const geoJson = await fetchGeoJson(code);
    if (geoJson) geoByCode.set(code, geoJson);
  });

  const cityScopes = {};
  const areaProvinceScopes = {};
  const areaCityScopes = {};
  let areaUnitTotal = 0;

  for (const province of provincesRaw) {
    const provinceCode = province.code;
    const provinceGeoFeatures = featuresFromGeo(geoByCode.get(provinceCode));
    const provinceCities = citiesByProvince[provinceCode] || [];
    const provinceAreas = areasByProvince[provinceCode] || [];

    if (municipalityCodes.has(provinceCode)) {
      const cityScope = makeSingleProvinceScope(countryFeatures, provinceCode);
      if (cityScope) cityScopes[provinceCode] = cityScope;
    } else if (provinceGeoFeatures.length) {
      cityScopes[provinceCode] = makeScope(provinceGeoFeatures, "city", resolveCityName);
    } else {
      const cityScope = makeSingleProvinceScope(countryFeatures, provinceCode);
      if (cityScope) cityScopes[provinceCode] = cityScope;
    }

    if (!provinceAreas.length) continue;

    const provinceAreaFeatures = [];
    const seenProvinceAreas = new Set();

    function addAreaFeature(feature) {
      const code = featureCode(feature);
      if (seenProvinceAreas.has(code) || !areaByCode.has(code)) return;
      seenProvinceAreas.add(code);
      provinceAreaFeatures.push(feature);
    }

    if (municipalityCodes.has(provinceCode)) {
      provinceGeoFeatures.forEach(addAreaFeature);
      if (provinceAreaFeatures.length) {
        const scope = makeScope(provinceAreaFeatures, "area", resolveAreaName);
        areaProvinceScopes[provinceCode] = scope;
        areaCityScopes[provinceCode] = scope;
        areaUnitTotal += scope.units.length;
      }
      continue;
    }

    for (const city of provinceCities) {
      const cityAreas = areasByCity[city.code] || [];
      if (!cityAreas.length) continue;
      const cityAreaCodes = cityAreas.map((item) => item.code);

      let cityAreaFeatures = [];
      if (city.isDirectCountyGroup) {
        cityAreaFeatures = selectFeaturesByCodes(provinceGeoFeatures, cityAreaCodes);
      } else {
        cityAreaFeatures = selectFeaturesByCodes(featuresFromGeo(geoByCode.get(city.code)), cityAreaCodes);
      }

      cityAreaFeatures.forEach(addAreaFeature);
      if (cityAreaFeatures.length) {
        areaCityScopes[city.code] = makeScope(cityAreaFeatures, "area", resolveAreaName);
      }
    }

    if (provinceAreaFeatures.length) {
      areaProvinceScopes[provinceCode] = makeScope(provinceAreaFeatures, "area", resolveAreaName);
      areaUnitTotal += areaProvinceScopes[provinceCode].units.length;
    }
  }

  const chinaMapData = {
    version: packageJson.version,
    projection: "upright-equirectangular",
    coloring: {
      name: "four-color-greedy",
      note: "Adjacent boundaries are assigned one of four visual color channels where source topology exposes shared segments."
    },
    source: {
      name: "DataV GeoAtlas areas_v3",
      url: datavBaseUrl,
      note: "Offline GeoJSON boundaries converted to SVG paths for province, prefecture-level, and county-level practice."
    },
    coverage: {
      countyBoundaryUnits: areaUnitTotal,
      countyListUnits: areaRecords.length,
      missingSourceCodes: [...new Set(missingGeoCodes)].sort()
    },
    scopes: {
      province: provinceScope,
      city: cityScopes,
      areaProvince: areaProvinceScopes,
      areaCity: areaCityScopes
    }
  };
  const usMapData = buildUsMap();

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    outFile,
    `window.CHINA_MAP = ${JSON.stringify(chinaMapData)};\nwindow.USA_MAP = ${JSON.stringify(usMapData)};\nwindow.ADMIN_MAPS = { CN: window.CHINA_MAP, US: window.USA_MAP };\n`,
    "utf8"
  );
  console.log(
    `Built map data: CN ${provinceScope.units.length} provinces, ${Object.keys(cityScopes).length} city scopes, ${Object.keys(areaCityScopes).length} county scopes, ${areaUnitTotal}/${areaRecords.length} county boundary units; US ${usMapData.scopes.province.units.length} states, ${Object.keys(usMapData.scopes.city).length} state county scopes.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
