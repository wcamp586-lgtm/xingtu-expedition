const fs = require("fs");
const path = require("path");
const { pinyin } = require("pinyin-pro");
const packageJson = require("../package.json");

const provincesRaw = require("@province-city-china/province");
const citiesRaw = require("@province-city-china/city");
const areasRaw = require("@province-city-china/area");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "src", "data");
const rawDir = path.join(root, "raw");
const plateHtmlPath = path.join(rawDir, "jsoncn-car-id.html");
const usCitiesCsvPath = path.join(rawDir, "uscities.csv");
const usCitiesUrl = "https://simplemaps.com/static/data/us-cities/uscities.csv";

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
  order: index + 1
}));
const usStateByAbbr = new Map(usStates.map((state) => [state.abbr, state]));
const usStateByFips = new Map(usStates.map((state) => [state.fips, state]));

const provinceShort = {
  北京市: "京",
  天津市: "津",
  河北省: "冀",
  山西省: "晋",
  内蒙古自治区: "蒙",
  辽宁省: "辽",
  吉林省: "吉",
  黑龙江省: "黑",
  上海市: "沪",
  江苏省: "苏",
  浙江省: "浙",
  安徽省: "皖",
  福建省: "闽",
  江西省: "赣",
  山东省: "鲁",
  河南省: "豫",
  湖北省: "鄂",
  湖南省: "湘",
  广东省: "粤",
  广西壮族自治区: "桂",
  海南省: "琼",
  重庆市: "渝",
  四川省: "川",
  贵州省: "贵",
  云南省: "云",
  西藏自治区: "藏",
  陕西省: "陕",
  甘肃省: "甘",
  青海省: "青",
  宁夏回族自治区: "宁",
  新疆维吾尔自治区: "新",
  台湾省: "台",
  香港特别行政区: "港",
  澳门特别行政区: "澳"
};

const cityAliases = {
  襄樊市: "襄阳市",
  昌都地区: "昌都市",
  山南地区: "山南市",
  那曲地区: "那曲市",
  林芝地区: "林芝市",
  日喀则地区: "日喀则市",
  海东地区: "海东市",
  铜仁地区: "铜仁市",
  毕节地区: "毕节市",
  吐鲁番地区: "吐鲁番市",
  哈密地区: "哈密市",
  思茅区: "普洱市",
  川沙县: "浦东新区",
  巢湖市: "合肥市",
  莱芜市: "济南市",
  银南市: "吴忠市",
  杨凌区: "咸阳市",
  顺德区: "佛山市",
  南海区: "佛山市",
  垦区: "黑龙江省-自治区直辖县级行政区划"
};

const plateLetterRank = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("").reduce((acc, letter, index) => {
  acc[letter] = index + 1;
  return acc;
}, {});

function sortKey(name) {
  return pinyin(name, { toneType: "none", type: "array" }).join("").toLowerCase();
}

function displayName(nameCn, nameEn) {
  return nameCn && nameCn !== nameEn ? `${nameCn} / ${nameEn}` : nameEn;
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

function csvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] || ""])));
}

async function loadUsCitiesCsv() {
  fs.mkdirSync(rawDir, { recursive: true });
  if (fs.existsSync(usCitiesCsvPath)) {
    return fs.readFileSync(usCitiesCsvPath, "utf8");
  }
  const response = await fetch(usCitiesUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch US places data: ${response.status}`);
  }
  const text = await response.text();
  fs.writeFileSync(usCitiesCsvPath, text, "utf8");
  return text;
}

async function buildUsData() {
  const rows = csvRows(await loadUsCitiesCsv()).filter((row) => usStateByAbbr.has(row.state_id));
  const countyMap = new Map();
  for (const row of rows) {
    const state = usStateByAbbr.get(row.state_id);
    const fips = String(row.county_fips || "").padStart(5, "0");
    if (!state || !/^\d{5}$/.test(fips)) continue;
    if (!countyMap.has(fips)) {
      const countyType = countyTypeFor(state.abbr, row.county_name);
      const countyEn = countyType.en && !new RegExp(`${countyType.en}$`, "i").test(row.county_name)
        ? `${row.county_name} ${countyType.en}`
        : row.county_name;
      countyMap.set(fips, {
        id: `US${fips}`,
        code: `US${fips}`,
        name: displayName(`${row.county_name}${countyType.cn}`, countyEn),
        nameCn: `${row.county_name}${countyType.cn}`,
        nameEn: countyEn,
        provinceCode: state.code,
        pinyin: sortKey(row.county_name),
        plate: state.abbr,
        plateRank: Number(fips.slice(2)) || 999,
        countyFips: fips
      });
    }
  }

  const provinces = usStates.map((state) => ({
    id: state.code,
    code: state.code,
    name: displayName(state.nameCn, state.nameEn),
    nameCn: state.nameCn,
    nameEn: state.nameEn,
    shortName: state.abbr,
    pinyin: sortKey(state.nameCn),
    order: state.order,
    fips: state.fips
  }));

  const cities = [...countyMap.values()].sort((a, b) => {
    const stateCompare = a.provinceCode.localeCompare(b.provinceCode);
    return stateCompare || a.nameEn.localeCompare(b.nameEn);
  });

  const areas = rows
    .filter((row) => {
      const fips = String(row.county_fips || "").padStart(5, "0");
      return countyMap.has(fips) && row.city && row.id;
    })
    .map((row) => {
      const state = usStateByAbbr.get(row.state_id);
      const fips = String(row.county_fips || "").padStart(5, "0");
      const placeTypeCn = row.incorporated === "True" ? "市镇" : "地方";
      return {
        id: `USPLACE-${row.id}`,
        code: `USPLACE-${row.id}`,
        name: displayName(`${row.city}${placeTypeCn}`, row.city),
        nameCn: `${row.city}${placeTypeCn}`,
        nameEn: row.city,
        provinceCode: state.code,
        cityCode: `US${fips}`,
        pinyin: sortKey(row.city),
        population: Number(row.population) || 0
      };
    })
    .sort((a, b) => a.provinceCode.localeCompare(b.provinceCode) || b.population - a.population || a.nameEn.localeCompare(b.nameEn));

  return {
    version: packageJson.version,
    generatedAt: new Date().toISOString(),
    labels: {
      country: "美国 / United States",
      province: "州",
      city: "县级单位",
      area: "城市/地方",
      provinceCount: "州",
      cityCount: "县级",
      areaCount: "地方",
      provinceSearchPlaceholder: "加州 / California / CA",
      cityRangeLabel: "县级范围",
      allAreasLabel: "全州地方",
      mapAreaGuide: "县级导览"
    },
    sources: [
      {
        name: "SimpleMaps US Cities Basic",
        url: usCitiesUrl,
        note: "Used for US states, county_fips, counties, and places/cities with English names."
      },
      {
        name: "us-atlas",
        url: "https://github.com/topojson/us-atlas",
        note: "Used for offline state and county vector map boundaries."
      }
    ],
    provinces,
    cities,
    areas
  };
}

function cleanName(value) {
  return String(value || "")
    .replace(/（.*?）/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/等.*/g, "")
    .replace(/全域.*/g, "")
    .trim();
}

function splitPlaces(value) {
  return cleanName(value)
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeComparable(value) {
  return cleanName(value)
    .replace(/蒙古自治州/g, "蒙古自治州")
    .replace(/巴音郭愣/g, "巴音郭楞")
    .replace(/贵族省/g, "贵州省")
    .replace(/广西省/g, "广西壮族自治区")
    .replace(/地区/g, "市")
    .replace(/自治县/g, "县")
    .replace(/自治州/g, "州")
    .replace(/特别行政区/g, "")
    .replace(/自治区/g, "")
    .replace(/[省市县区旗盟州]/g, "");
}

async function loadPlateHtml() {
  fs.mkdirSync(rawDir, { recursive: true });
  if (fs.existsSync(plateHtmlPath)) {
    return fs.readFileSync(plateHtmlPath, "utf8");
  }

  const response = await fetch("https://www.json.cn/insurance/car-id/");
  if (!response.ok) {
    throw new Error(`Failed to fetch plate data: ${response.status}`);
  }
  const html = await response.text();
  fs.writeFileSync(plateHtmlPath, html, "utf8");
  return html;
}

function extractPlateRows(html) {
  const rows = [];
  const tablePattern = /<th[^>]*>\s*([^<]+?)（([^）]+)）\s*<\/th>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g;
  let tableMatch;

  while ((tableMatch = tablePattern.exec(html))) {
    const provinceName = tableMatch[1].trim();
    const shortName = tableMatch[2].trim();
    const body = tableMatch[3];
    const rowPattern = /<tr>\s*<td>\s*([^<]+?)\s*<\/td>\s*<td>\s*([^<]+?)\s*<\/td>\s*<\/tr>/g;
    let rowMatch;

    while ((rowMatch = rowPattern.exec(body))) {
      const plate = rowMatch[1].trim();
      const place = rowMatch[2].trim();
      const letter = (plate.match(/[A-Z]/) || [null])[0];
      if (!letter || letter === "O") continue;
      rows.push({ provinceName, shortName, plate, letter, place });
    }
  }

  return rows;
}

function attachPlateData(cities, plateRows) {
  const cityByProvince = new Map();
  for (const city of cities) {
    const key = city.provinceCode;
    if (!cityByProvince.has(key)) cityByProvince.set(key, []);
    cityByProvince.get(key).push(city);
  }

  for (const row of plateRows) {
    const province = provincesRaw.find((item) => (provinceShort[item.name] || "") === row.shortName);
    if (!province) continue;
    const candidates = cityByProvince.get(province.code) || [];
    const places = splitPlaces(row.place)
      .map((place) => cityAliases[place] || place)
      .filter((place) => !/专用|机关|部队|车辆管理所|进入内地车辆/.test(place));

    for (const place of places) {
      let match = candidates.find((city) => city.name === place);
      if (!match) {
        const wanted = normalizeComparable(place);
        match = candidates.find((city) => normalizeComparable(city.name) === wanted);
      }
      if (!match) continue;

      if (!match.plate || plateLetterRank[row.letter] < match.plateRank) {
        match.plate = row.plate;
        match.plateRank = plateLetterRank[row.letter];
      }
    }
  }

  for (const city of cities) {
    if (!city.plate) {
      city.plate = "";
      city.plateRank = 999;
    }
  }
}

async function main() {
  const provinces = provincesRaw.map((item, index) => ({
    id: item.code,
    code: item.code,
    name: item.name,
    shortName: provinceShort[item.name] || "",
    pinyin: sortKey(item.name),
    order: index + 1
  }));

  const cityProvinceByCode = new Map(provincesRaw.map((item) => [item.province, item.code]));
  const cities = citiesRaw.map((item) => ({
    id: item.code,
    code: item.code,
    name: item.name,
    provinceCode: cityProvinceByCode.get(item.province),
    pinyin: sortKey(item.name),
    plate: "",
    plateRank: 999,
    isDirectCountyGroup: item.city === "90" || /直辖县级行政区划/.test(item.name)
  }));

  const plateHtml = await loadPlateHtml();
  attachPlateData(cities, extractPlateRows(plateHtml));

  const municipalityCodes = new Set(["110000", "120000", "310000", "500000"]);
  const areas = areasRaw.map((item) => {
    const provinceCode = cityProvinceByCode.get(item.province);
    const normalCityCode = `${item.province}${item.city}00`;
    const cityCode = municipalityCodes.has(provinceCode) ? provinceCode : normalCityCode;
    return {
      id: item.code,
      code: item.code,
      name: item.name,
      provinceCode,
      cityCode,
      pinyin: sortKey(item.name)
    };
  });

  const directMunicipalityCities = provinces
    .filter((province) => municipalityCodes.has(province.code))
    .map((province) => ({
      id: province.code,
      code: province.code,
      name: `${province.name}本级`,
      provinceCode: province.code,
      pinyin: province.pinyin,
      plate: province.shortName ? `${province.shortName}A` : "",
      plateRank: 1,
      isDirectCountyGroup: false,
      synthetic: true
    }));

  const chinaData = {
    version: packageJson.version,
    generatedAt: new Date().toISOString(),
    labels: {
      country: "中国",
      province: "省级行政单位",
      city: "地级行政单位",
      area: "区县级单位",
      provinceCount: "省级",
      cityCount: "地级",
      areaCount: "区县",
      provinceSearchPlaceholder: "广东 / yue",
      cityRangeLabel: "地级范围",
      allAreasLabel: "全省区县",
      mapAreaGuide: "地级导览"
    },
    sources: [
      {
        name: "province-city-china 8.5.8",
        url: "https://github.com/uiwjs/province-city-china",
        note: "GB/T 2260 county-level-and-above administrative division data."
      },
      {
        name: "JSON.cn car plate table",
        url: "https://www.json.cn/insurance/car-id/",
        note: "Used only to sort prefecture-level units by common license-plate letter."
      }
    ],
    provinces,
    cities: [...directMunicipalityCities, ...cities],
    areas
  };

  const usData = await buildUsData();
  const data = {
    ...chinaData,
    countries: {
      CN: chinaData,
      US: usData
    }
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "admin-data.js"),
    `window.ADMIN_DATA = ${JSON.stringify(data, null, 2)};\n`,
    "utf8"
  );

  console.log(
    `Built data: CN ${chinaData.provinces.length}/${chinaData.cities.length}/${chinaData.areas.length}; US ${usData.provinces.length}/${usData.cities.length}/${usData.areas.length}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
