const appData = window.ADMIN_DATA;
const countryDataSets = appData.countries || { CN: appData };
const mapSets = window.ADMIN_MAPS || { CN: window.CHINA_MAP };
let data = countryDataSets.CN || Object.values(countryDataSets)[0];
let mapData = mapSets.CN || Object.values(mapSets)[0];
const progressStorageKey = "china-map-memory-progress";
const legacyStudyStorageKey = "lutuji-study-records-v1";
const studyStorageKey = "xingtu-expedition-study-records-v1";
const uiPrefsStorageKey = "xingtu-expedition-ui-preferences-v1";
const savedUiPrefs = loadUiPreferences();

const els = {
  countrySelect: document.getElementById("countrySelect"),
  nameModeSelect: document.getElementById("nameModeSelect"),
  provinceCount: document.getElementById("provinceCount"),
  cityCount: document.getElementById("cityCount"),
  areaCount: document.getElementById("areaCount"),
  provinceSearch: document.getElementById("provinceSearch"),
  provinceList: document.getElementById("provinceList"),
  levelSelect: document.getElementById("levelSelect"),
  citySelect: document.getElementById("citySelect"),
  sortSelect: document.getElementById("sortSelect"),
  studyFilterSelect: document.getElementById("studyFilterSelect"),
  itemSearch: document.getElementById("itemSearch"),
  itemList: document.getElementById("itemList"),
  listTitle: document.getElementById("listTitle"),
  listSubtitle: document.getElementById("listSubtitle"),
  studyFilterStats: document.getElementById("studyFilterStats"),
  applySuggestedFilterBtn: document.getElementById("applySuggestedFilterBtn"),
  resetUiPrefsBtn: document.getElementById("resetUiPrefsBtn"),
  copyListBtn: document.getElementById("copyListBtn"),
  practiceScope: document.getElementById("practiceScope"),
  answerInput: document.getElementById("answerInput"),
  checkBtn: document.getElementById("checkBtn"),
  revealBtn: document.getElementById("revealBtn"),
  clearBtn: document.getElementById("clearBtn"),
  resultBox: document.getElementById("resultBox"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  lastScore: document.getElementById("lastScore"),
  totalAccuracy: document.getElementById("totalAccuracy"),
  flashPrompt: document.getElementById("flashPrompt"),
  drawCardBtn: document.getElementById("drawCardBtn"),
  provinceMap: document.getElementById("provinceMap"),
  mapTitle: document.getElementById("mapTitle"),
  mapHint: document.getElementById("mapHint"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  resetMapBtn: document.getElementById("resetMapBtn"),
  cruiseMapBtn: document.getElementById("cruiseMapBtn"),
  drillMapBtn: document.getElementById("drillMapBtn"),
  mapZoomLabel: document.getElementById("mapZoomLabel"),
  drawMapBtn: document.getElementById("drawMapBtn"),
  revealMapBtn: document.getElementById("revealMapBtn"),
  mapAnswerInput: document.getElementById("mapAnswerInput"),
  checkMapBtn: document.getElementById("checkMapBtn"),
  rememberMapBtn: document.getElementById("rememberMapBtn"),
  weakMapBtn: document.getElementById("weakMapBtn"),
  skipMapBtn: document.getElementById("skipMapBtn"),
  mapDrillStatus: document.getElementById("mapDrillStatus"),
  mapResult: document.getElementById("mapResult"),
  studyAttempts: document.getElementById("studyAttempts"),
  studyAccuracy: document.getElementById("studyAccuracy"),
  studyStreak: document.getElementById("studyStreak"),
  studyRank: document.getElementById("studyRank"),
  planBrief: document.getElementById("planBrief"),
  startPlanBtn: document.getElementById("startPlanBtn"),
  copyPlanBtn: document.getElementById("copyPlanBtn"),
  reviewQueue: document.getElementById("reviewQueue"),
  startReviewBtn: document.getElementById("startReviewBtn"),
  copyReviewBtn: document.getElementById("copyReviewBtn"),
  copyShortcutsBtn: document.getElementById("copyShortcutsBtn"),
  quickQuizBtn: document.getElementById("quickQuizBtn"),
  weakQuizBtn: document.getElementById("weakQuizBtn"),
  streakQuizBtn: document.getElementById("streakQuizBtn"),
  conquestQuizBtn: document.getElementById("conquestQuizBtn"),
  copyWeakBtn: document.getElementById("copyWeakBtn"),
  exportRecordsBtn: document.getElementById("exportRecordsBtn"),
  clearRecordsBtn: document.getElementById("clearRecordsBtn"),
  quizCard: document.getElementById("quizCard"),
  quizModeLabel: document.getElementById("quizModeLabel"),
  quizPrompt: document.getElementById("quizPrompt"),
  quizAnswerInput: document.getElementById("quizAnswerInput"),
  quizCheckBtn: document.getElementById("quizCheckBtn"),
  quizNextBtn: document.getElementById("quizNextBtn"),
  quizEndBtn: document.getElementById("quizEndBtn"),
  quizFeedback: document.getElementById("quizFeedback"),
  missionBrief: document.getElementById("missionBrief"),
  badgeList: document.getElementById("badgeList"),
  leaderboardList: document.getElementById("leaderboardList"),
  weakList: document.getElementById("weakList"),
  recordFeed: document.getElementById("recordFeed"),
  sourceNote: document.getElementById("sourceNote")
};

const state = {
  countryCode: countryDataSets[savedUiPrefs.countryCode] ? savedUiPrefs.countryCode : "CN",
  nameMode: ["both", "cn", "en"].includes(savedUiPrefs.nameMode) ? savedUiPrefs.nameMode : "both",
  provinceCode: savedUiPrefs.provinceCode || "440000",
  cityCode: savedUiPrefs.cityCode || "",
  currentItems: [],
  mapQuizCode: "",
  mapSelectedCode: "",
  mapReviewCode: "",
  mapReviewStatus: "",
  mapRememberedCode: "",
  mapWeakCode: "",
  mapDrill: null,
  currentMapKey: "",
  mapZoom: 1.6,
  progress: loadProgress(),
  study: loadStudy(),
  quiz: null
};
let resetUiPrefsFeedbackTimer = null;

let citiesByProvince;
let areasByProvince;
let areasByCity;
let provincesByCode;
let citiesByCode;
let areasByCode;
let learnableItemsByCode;

data = countryDataSets[state.countryCode] || data;
mapData = mapSets[state.countryCode] || mapData;

function loadUiPreferences() {
  try {
    const parsed = JSON.parse(window.localStorage?.getItem(uiPrefsStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUiPreferences() {
  try {
    window.localStorage?.setItem(uiPrefsStorageKey, JSON.stringify({
      countryCode: state.countryCode,
      nameMode: els.nameModeSelect?.value || state.nameMode,
      level: els.levelSelect?.value || "city",
      sort: els.sortSelect?.value || "plate",
      studyFilter: els.studyFilterSelect?.value || "all",
      provinceCode: state.provinceCode,
      cityCode: state.cityCode,
      mapZoom: state.mapZoom
    }));
  } catch {
    // UI preferences are a convenience; the trainer should keep working without storage.
  }
}

function clearUiPreferences() {
  try {
    window.localStorage?.removeItem(uiPrefsStorageKey);
  } catch {
    // Clearing a convenience setting should never block normal practice.
  }
}

function labelText(key, fallback) {
  return data.labels?.[key] || fallback;
}

function resetCountryRuntime() {
  citiesByProvince = groupBy(data.cities, "provinceCode");
  areasByProvince = groupBy(data.areas, "provinceCode");
  areasByCity = groupBy(data.areas, "cityCode");
  provincesByCode = new Map(data.provinces.map((item) => [item.code, item]));
  citiesByCode = new Map(data.cities.map((item) => [item.code, item]));
  areasByCode = new Map(data.areas.map((item) => [item.code, item]));
  learnableItemsByCode = new Map([...data.provinces, ...data.cities, ...data.areas].map((item) => [item.code, item]));
}

function updateCountryChrome() {
  els.provinceCount.textContent = data.provinces.length;
  els.cityCount.textContent = data.cities.filter((item) => !item.synthetic && !item.isDirectCountyGroup).length;
  els.areaCount.textContent = data.areas.length;
  const metricLabels = document.querySelectorAll(".metric-grid span");
  if (metricLabels[0]) metricLabels[0].textContent = labelText("provinceCount", "省级");
  if (metricLabels[1]) metricLabels[1].textContent = labelText("cityCount", "地级");
  if (metricLabels[2]) metricLabels[2].textContent = labelText("areaCount", "区县");
  const provinceSearchLabel = els.provinceSearch?.closest("label")?.querySelector("span");
  if (provinceSearchLabel) provinceSearchLabel.textContent = labelText("province", "省份");
  const citySelectLabel = document.querySelector('label[for="citySelect"]');
  if (citySelectLabel) citySelectLabel.textContent = labelText("cityRangeLabel", "地级范围");
  const provinceOption = document.querySelector('#levelSelect option[value="province"]');
  const cityOption = document.querySelector('#levelSelect option[value="city"]');
  const areaOption = document.querySelector('#levelSelect option[value="area"]');
  if (provinceOption) provinceOption.textContent = labelText("province", "省级行政单位");
  if (cityOption) cityOption.textContent = labelText("city", "地级行政单位");
  if (areaOption) areaOption.textContent = labelText("area", "区县级单位");
  els.provinceSearch.placeholder = labelText("provinceSearchPlaceholder", "广东 / yue");
  els.sourceNote.textContent = `数据源：${data.sources.map((source) => source.name).join("；")}；地图：${mapData?.source?.name || "离线矢量图"}。安装后无需联网。`;
}

function defaultProvinceCode(countryCode) {
  if (countryCode === "CN" && countryDataSets.CN?.provinces?.some((item) => item.code === "440000")) return "440000";
  if (countryCode === "US" && countryDataSets.US?.provinces?.some((item) => item.code === "US-CA")) return "US-CA";
  return (countryDataSets[countryCode]?.provinces || [])[0]?.code || "";
}

function setSelectValue(select, value) {
  if (!select || value === undefined || value === null) return false;
  if (![...select.options].some((option) => option.value === value)) return false;
  select.value = value;
  return true;
}

function applyInitialUiPreferences() {
  setSelectValue(els.countrySelect, state.countryCode);
  setSelectValue(els.nameModeSelect, state.nameMode);
  state.nameMode = els.nameModeSelect?.value || state.nameMode;
  if (!provincesByCode.has(state.provinceCode)) state.provinceCode = defaultProvinceCode(state.countryCode);
  if (state.cityCode && !citiesByCode.has(state.cityCode)) state.cityCode = "";
  setSelectValue(els.levelSelect, savedUiPrefs.level || "city");
  setSelectValue(els.sortSelect, savedUiPrefs.sort || "plate");
  setSelectValue(els.studyFilterSelect, savedUiPrefs.studyFilter || "all");
  if (Number.isFinite(savedUiPrefs.mapZoom)) {
    state.mapZoom = Math.max(0.75, Math.min(3.35, Number(savedUiPrefs.mapZoom)));
  } else {
    syncZoomFromLevel();
  }
}

function resetUiPreferences() {
  clearUiPreferences();
  if (resetUiPrefsFeedbackTimer) window.clearTimeout(resetUiPrefsFeedbackTimer);
  state.countryCode = "CN";
  data = countryDataSets.CN || data;
  mapData = mapSets.CN || mapData;
  resetCountryRuntime();
  state.nameMode = "both";
  state.provinceCode = defaultProvinceCode("CN");
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapQuizCode = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  state.currentMapKey = "";
  state.currentItems = [];
  state.mapZoom = 1.6;
  setSelectValue(els.countrySelect, "CN");
  setSelectValue(els.nameModeSelect, "both");
  setSelectValue(els.levelSelect, "city");
  setSelectValue(els.sortSelect, "plate");
  setSelectValue(els.studyFilterSelect, "all");
  els.provinceSearch.value = "";
  els.itemSearch.value = "";
  updateCountryChrome();
  renderProvinces();
  renderItems();
  if (els.studyFilterStats) {
    els.studyFilterStats.textContent = `${els.studyFilterStats.textContent} 偏好已重置，学习记录已保留。`;
  }
  if (els.resetUiPrefsBtn) {
    els.resetUiPrefsBtn.textContent = "已重置";
    resetUiPrefsFeedbackTimer = window.setTimeout(() => {
      els.resetUiPrefsBtn.textContent = "重置偏好";
      resetUiPrefsFeedbackTimer = null;
    }, 1600);
  }
}

resetCountryRuntime();
updateCountryChrome();
applyInitialUiPreferences();

function switchCountry(countryCode) {
  if (!countryDataSets[countryCode]) return;
  state.countryCode = countryCode;
  data = countryDataSets[countryCode];
  mapData = mapSets[countryCode] || null;
  state.provinceCode = defaultProvinceCode(countryCode);
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapQuizCode = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  state.currentMapKey = "";
  state.currentItems = [];
  state.mapZoom = 1.6;
  els.levelSelect.value = "city";
  els.provinceSearch.value = "";
  els.itemSearch.value = "";
  els.answerInput.value = "";
  els.resultBox.innerHTML = "";
  els.mapResult.textContent = "抽题后会高亮一个轮廓。";
  setMapDrillStatus("巡航或五连练可先观察，再记住/还不熟。");
  resetCountryRuntime();
  updateCountryChrome();
  renderProvinces();
  renderItems();
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "";
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {});
}

function loadProgress() {
  try {
    return JSON.parse(window.localStorage?.getItem(progressStorageKey) || "{}");
  } catch {
    return {};
  }
}

function saveProgress() {
  try {
    window.localStorage?.setItem(progressStorageKey, JSON.stringify(state.progress));
  } catch {
    // Progress persistence is optional; checking answers must keep working in restricted environments.
  }
}

function freshStudy() {
  return {
    attempts: [],
    itemStats: {},
    streak: { current: 0, best: 0, lastDate: "" },
    xp: 0
  };
}

function loadStudy() {
  try {
    const stored = window.localStorage?.getItem(studyStorageKey) || window.localStorage?.getItem(legacyStudyStorageKey);
    const parsed = JSON.parse(stored || "null");
    return {
      ...freshStudy(),
      ...(parsed || {}),
      streak: { ...freshStudy().streak, ...(parsed?.streak || {}) },
      itemStats: parsed?.itemStats || {},
      attempts: Array.isArray(parsed?.attempts) ? parsed.attempts : []
    };
  } catch {
    return freshStudy();
  }
}

function saveStudy() {
  try {
    window.localStorage?.setItem(studyStorageKey, JSON.stringify(state.study));
    window.localStorage?.removeItem(legacyStudyStorageKey);
  } catch {
    // Study records are helpful but the practice flow should not depend on storage permission.
  }
}

function currentNameMode() {
  return els.nameModeSelect?.value || state.nameMode || "both";
}

function displayName(item, mode = currentNameMode()) {
  if (!item) return "";
  const name = item.name || "";
  const cn = item.nameCn || "";
  const en = item.nameEn || "";
  if (mode === "cn" && cn) return cn;
  if (mode === "en" && en) return en;
  if (cn && en && cn !== en) return `${cn} / ${en}`;
  return name || cn || en || "";
}

function provinceName(code) {
  return displayName(provincesByCode.get(code));
}

function cityName(code) {
  return displayName(citiesByCode.get(code));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function directMunicipalityItem() {
  return (citiesByProvince[state.provinceCode] || []).find((item) => item.synthetic);
}

function getMapScope() {
  const level = els.levelSelect.value;
  if (!mapData?.scopes) return null;
  if (level === "province") return mapData.scopes.province;
  if (level === "city") return mapData.scopes.city?.[state.provinceCode] || null;
  if (!state.cityCode && directMunicipalityItem()) return mapData.scopes.areaProvince?.[state.provinceCode] || null;
  if (!state.cityCode) return mapData.scopes.city?.[state.provinceCode] || null;
  if (state.cityCode) return mapData.scopes.areaCity?.[state.cityCode] || null;
  return mapData.scopes.areaProvince?.[state.provinceCode] || null;
}

function currentMapHasUnit(code) {
  return (getMapScope()?.units || []).some((unit) => unit.code === code);
}

function getMapScopeKey() {
  const level = els.levelSelect.value;
  if (level === "province") return "province:all";
  if (level === "city") return `city:${state.provinceCode}`;
  return `area:${state.provinceCode}:${state.cityCode || "all"}`;
}

function getMapTitle() {
  const level = els.levelSelect.value;
  if (level === "province") return `${labelText("province", "省级")}空白地图`;
  if (level === "city") return `${provinceName(state.provinceCode)}${labelText("city", "地级")}空白地图`;
  if (!state.cityCode && directMunicipalityItem()) return `${provinceName(state.provinceCode)}${labelText("area", "区县")}空白地图`;
  if (!state.cityCode) return `${provinceName(state.provinceCode)}${labelText("mapAreaGuide", "地级导览")}地图`;
  if (state.cityCode) return `${cityName(state.cityCode)}${labelText("area", "区县")}空白地图`;
  return `${provinceName(state.provinceCode)}${labelText("area", "区县")}空白地图`;
}

function firstCityWithAreas(provinceCode) {
  return (citiesByProvince[provinceCode] || []).find((item) => {
    return !item.synthetic && !item.isDirectCountyGroup && (areasByCity[item.code] || []).length > 0;
  });
}

function syncZoomFromLevel() {
  const level = els.levelSelect.value;
  if (level === "province") state.mapZoom = 0.85;
  else if (level === "city") state.mapZoom = 1.6;
  else state.mapZoom = state.cityCode ? 2.8 : 2.1;
}

function updateMapZoomLabel() {
  const level = els.levelSelect.value;
  const label = level === "province" ? labelText("province", "省级") : level === "city" ? labelText("city", "地级") : state.cityCode ? labelText("area", "区县") : labelText("mapAreaGuide", "地级导览");
  if (els.mapZoomLabel) els.mapZoomLabel.textContent = `${label} · ${state.mapZoom.toFixed(1)}x`;
}

function changeMapZoom(delta, focusCode = "") {
  state.mapZoom = Math.max(0.75, Math.min(3.35, state.mapZoom + delta));
  const currentLevel = els.levelSelect.value;

  if (state.mapZoom < 1.2) {
    if (currentLevel !== "province") {
      els.levelSelect.value = "province";
      state.cityCode = "";
      state.mapSelectedCode = "";
      state.mapQuizCode = "";
    }
  } else if (state.mapZoom < 2.35) {
    if (currentLevel === "province" && provincesByCode.has(focusCode)) {
      state.provinceCode = focusCode;
      state.cityCode = "";
    }
    if (els.levelSelect.value !== "city") {
      els.levelSelect.value = "city";
      state.cityCode = "";
      state.mapSelectedCode = "";
      state.mapQuizCode = "";
    }
  } else {
    if (currentLevel === "province" && provincesByCode.has(focusCode)) {
      state.provinceCode = focusCode;
    }
    if (currentLevel === "city" && citiesByCode.has(focusCode)) {
      state.cityCode = focusCode;
    }
    if (!state.cityCode) {
      state.cityCode = firstCityWithAreas(state.provinceCode)?.code || "";
    }
    els.levelSelect.value = "area";
    state.mapSelectedCode = "";
    state.mapQuizCode = "";
  }

  renderProvinces();
  renderItems();
}

function resetMapView() {
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapQuizCode = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  state.mapZoom = 1.6;
  els.levelSelect.value = "city";
  if (els.mapAnswerInput) els.mapAnswerInput.value = "";
  if (els.mapResult) els.mapResult.textContent = "";
  if (els.mapDrillStatus) els.mapDrillStatus.textContent = "巡航或五连练可先观察，再记住/还不熟。";
  renderProvinces();
  renderItems();
  els.mapHint.textContent = `地图已复位到当前${labelText("province", "省份")}的${labelText("city", "地级")}视图；滚轮可继续缩放分层。`;
}

function getMapTargetItems() {
  const level = els.levelSelect.value;
  if (level === "province") return getBaseItems();
  if (level === "city") {
    const synthetic = directMunicipalityItem();
    if (synthetic) return applyStudyFilter([synthetic]);
  }
  if (level === "area" && !state.cityCode) {
    if (directMunicipalityItem()) return getBaseItems();
    return applyStudyFilter((citiesByProvince[state.provinceCode] || []).filter((item) => !item.synthetic && !item.isDirectCountyGroup));
  }
  if (level === "area" && state.countryCode === "US") {
    return applyStudyFilter([citiesByCode.get(state.cityCode)].filter(Boolean));
  }
  return getBaseItems();
}

function getMapItem(code) {
  const level = els.levelSelect.value;
  if (level === "province") return provincesByCode.get(code) || null;
  if (level === "city") return citiesByCode.get(code) || (code === state.provinceCode ? directMunicipalityItem() : null);
  if (state.countryCode === "US") return citiesByCode.get(code) || areasByCode.get(code) || learnableItemsByCode.get(code) || null;
  return areasByCode.get(code) || learnableItemsByCode.get(code) || null;
}

function renderMap() {
  if (!els.provinceMap || !mapData) return;

  const scope = getMapScope();
  const key = getMapScopeKey();
  const targetCodes = new Set(getMapTargetItems().map((item) => item.code));
  els.mapTitle.textContent = getMapTitle();

  if (!scope || !scope.units.length) {
    state.currentMapKey = key;
    els.provinceMap.innerHTML = `<div class="empty-state">当前范围没有可用的下级地图边界。</div>`;
    els.mapHint.textContent = "可以切换到省级地图，或选择有下级数据的省市。";
    updateMapZoomLabel();
    return;
  }

  const unitMarkup = scope.units
    .map((unit) => {
      const target = targetCodes.has(unit.code);
      const color = Number.isInteger(unit.color) ? unit.color : 0;
      const item = getMapItem(unit.code);
      const unitLabel = displayName(item) || unit.name;
      return `<path class="map-unit color-${color}${target ? "" : " muted"}" tabindex="0" role="button" data-code="${escapeHtml(unit.code)}" data-target="${target ? "1" : "0"}" aria-label="${escapeHtml(unitLabel)}" d="${escapeHtml(unit.d)}"></path>`;
    })
    .join("");

  els.provinceMap.innerHTML = `
    <svg viewBox="${escapeHtml(scope.viewBox)}" role="img" aria-label="${escapeHtml(getMapTitle())}">
      <g>${unitMarkup}</g>
    </svg>
  `;
  const mappedTargetCount = scope.units.filter((unit) => targetCodes.has(unit.code)).length;
  const targetCount = targetCodes.size;
  if (targetCount && mappedTargetCount < targetCount) {
    els.mapHint.textContent = `${getMapTitle()}：${mappedTargetCount}/${targetCount} 个条目有独立轮廓；市辖区、开发区等无独立边界的条目仍在名单默写中检测。`;
  } else {
    els.mapHint.textContent = `${getMapTitle()}：点击轮廓可定位，抽测会从当前地图范围内出题。`;
  }
  state.currentMapKey = key;
  syncMapSelection();
  updateMapZoomLabel();
}

function syncMapSelection() {
  if (!els.provinceMap) return;
  const activeCode = state.mapSelectedCode || state.cityCode || state.provinceCode;
  els.provinceMap.querySelectorAll(".map-unit").forEach((unit) => {
    unit.classList.toggle("active", unit.dataset.code === activeCode);
    unit.classList.toggle("quiz", unit.dataset.code === state.mapQuizCode);
  });
}

function describeMapUnit(code) {
  const level = els.levelSelect.value;
  const item = getMapItem(code) || provincesByCode.get(code) || citiesByCode.get(code) || areasByCode.get(code);
  if (!item) return "";
  const title = displayName(item);
  if (level === "province") {
    const cityCount = (citiesByProvince[code] || []).filter((entry) => !entry.isDirectCountyGroup && !entry.synthetic).length;
    const areaCount = (areasByProvince[code] || []).length;
    return `${title}：${cityCount || "直辖/特别"} 个${labelText("city", "地级范围")}，${areaCount} 个${labelText("area", "区县级单位")}。`;
  }
  if (level === "city" || (level === "area" && !state.cityCode && citiesByCode.has(code))) {
    const areaCount = (areasByCity[code] || areasByProvince[item.provinceCode] || []).length;
    return `${title}：当前${labelText("city", "地级范围")}，包含 ${areaCount} 个${labelText("area", "区县级单位")}。`;
  }
  return `${title}：${labelText("area", "区县级单位")}。`;
}

function selectMapUnit(code) {
  state.mapSelectedCode = code;
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapQuizCode = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;

  if (els.levelSelect.value === "province" && provincesByCode.has(code)) {
    state.provinceCode = code;
    state.cityCode = "";
    state.mapSelectedCode = "";
    renderProvinces();
    renderItems();
  } else if (els.levelSelect.value === "city" && citiesByCode.has(code)) {
    state.cityCode = code;
    syncMapSelection();
  } else if (els.levelSelect.value === "area" && !state.cityCode && citiesByCode.has(code)) {
    state.cityCode = code;
    state.mapSelectedCode = "";
    els.citySelect.value = code;
    renderItems();
  } else {
    syncMapSelection();
  }

  els.mapHint.textContent = describeMapUnit(code);
}

function getMapQuizTargets() {
  const scope = getMapScope();
  if (!scope) return [];
  const mapCodes = new Set(scope.units.map((unit) => unit.code));
  return getMapTargetItems().filter((item) => mapCodes.has(item.code));
}

function setMapDrillStatus(text) {
  if (els.mapDrillStatus) els.mapDrillStatus.textContent = text;
}

function showMapDrillItem(feedback = "") {
  const drill = state.mapDrill;
  if (!drill) return;
  if (drill.index >= drill.items.length) {
    finishMapDrill();
    return;
  }
  const target = drill.items[drill.index];
  state.mapQuizCode = "";
  state.mapSelectedCode = target.code;
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  if (els.mapAnswerInput) els.mapAnswerInput.value = "";
  syncMapSelection();
  els.mapResult.innerHTML = `${feedback ? `${escapeHtml(feedback)}<br>` : ""}五连练 ${drill.index + 1}/${drill.items.length}：<span class="ok">${escapeHtml(displayName(target))}</span>。判断是否记住。`;
  els.mapHint.textContent = describeMapUnit(target.code);
  setMapDrillStatus(`五连练进行中：已记住 ${drill.remembered} 个，还不熟 ${drill.weak} 个，跳过 ${drill.skipped} 个。`);
}

function finishMapDrill() {
  const drill = state.mapDrill;
  if (!drill) return;
  state.mapDrill = null;
  const text = `本轮五连练完成：记住 ${drill.remembered} 个，还不熟 ${drill.weak} 个，跳过 ${drill.skipped} 个。`;
  setMapDrillStatus(text);
  els.mapResult.innerHTML = `<span class="ok">${escapeHtml(text)}</span>`;
}

function startMapDrill() {
  const targets = getMapQuizTargets();
  if (!targets.length) {
    els.mapResult.innerHTML = `<span class="miss">当前范围没有可连练的地图边界。</span>`;
    setMapDrillStatus("切换到有地图边界的范围后再开始五连练。");
    return;
  }
  const items = shuffle(targets).slice(0, Math.min(5, targets.length));
  state.mapDrill = {
    items,
    index: 0,
    remembered: 0,
    weak: 0,
    skipped: 0
  };
  showMapDrillItem();
}

function advanceMapDrill(target, remembered) {
  const drill = state.mapDrill;
  if (!drill || drill.items[drill.index]?.code !== target.code) return false;
  if (remembered) drill.remembered += 1;
  else drill.weak += 1;
  drill.index += 1;
  showMapDrillItem(`${displayName(target)}${remembered ? " 已记住" : " 已加入薄弱点"}。`);
  return true;
}

function skipMapDrillItem() {
  const drill = state.mapDrill;
  if (!drill) {
    els.mapResult.innerHTML = `<span class="miss">先开始五连练，再跳过当前轮廓。</span>`;
    return;
  }
  const target = drill.items[drill.index];
  if (!target) {
    finishMapDrill();
    return;
  }
  drill.skipped += 1;
  drill.index += 1;
  showMapDrillItem(`${displayName(target)} 已跳过。`);
}

function cruiseMapUnit() {
  const targets = getMapQuizTargets();
  if (!targets.length) {
    els.mapResult.innerHTML = `<span class="miss">当前范围没有可巡航的地图边界。</span>`;
    return;
  }
  const target = targets[Math.floor(Math.random() * targets.length)];
  state.mapQuizCode = "";
  state.mapSelectedCode = target.code;
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  if (els.mapAnswerInput) els.mapAnswerInput.value = "";
  syncMapSelection();
  els.mapResult.innerHTML = `巡航定位：<span class="ok">${escapeHtml(displayName(target))}</span>。`;
  els.mapHint.textContent = describeMapUnit(target.code);
  setMapDrillStatus("巡航定位后，可点记住或还不熟，也可按 M / W。");
}

function drawMapQuiz() {
  const targets = getMapQuizTargets();
  if (!targets.length) {
    els.mapResult.innerHTML = `<span class="miss">当前范围没有可抽测的地图边界。</span>`;
    return;
  }
  const target = targets[Math.floor(Math.random() * targets.length)];
  state.mapQuizCode = target.code;
  state.mapSelectedCode = target.code;
  state.mapReviewCode = "";
  state.mapReviewStatus = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  els.mapAnswerInput.value = "";
  els.mapResult.textContent = "已高亮一个轮廓，请写出它的名称。";
  els.mapHint.textContent = "观察高亮位置，再输入名称检查。";
  syncMapSelection();
  els.mapAnswerInput.focus();
}

function checkMapAnswer() {
  const target = getMapItem(state.mapQuizCode);
  if (!target) {
    els.mapResult.innerHTML = `<span class="miss">先抽一道地图题。</span>`;
    return;
  }

  const answer = els.mapAnswerInput.value.trim();
  if (!answer) {
    els.mapResult.innerHTML = `<span class="miss">先写下地名，再检查。</span>`;
    els.mapAnswerInput.focus();
    return;
  }

  const accepted = new Set(aliases(target).map(normalize).concat(aliases(target)));
  if (accepted.has(answer) || accepted.has(normalize(answer))) {
    els.mapResult.innerHTML = `<span class="ok">正确：</span>${escapeHtml(displayName(target))}。`;
    recordAttempt({
      mode: "看图写名",
      correct: 1,
      total: 1,
      items: [target],
      correctCodes: [target.code],
      wrongCodes: []
    });
    syncMapSelection();
    return;
  }

  els.mapResult.innerHTML = `<span class="miss">还不对。</span>答案是 ${escapeHtml(displayName(target))}。`;
  recordAttempt({
    mode: "看图写名",
    correct: 0,
    total: 1,
    items: [target],
    correctCodes: [],
    wrongCodes: [target.code]
  });
}

function selectedMapPracticeTarget() {
  return learnableItemsByCode.get(state.mapReviewCode) || getMapItem(state.mapSelectedCode || state.mapQuizCode);
}

function rememberMapUnit() {
  const target = selectedMapPracticeTarget();
  if (!target) {
    els.mapResult.innerHTML = `<span class="miss">先巡航或点击一个地图轮廓。</span>`;
    return;
  }
  if (state.mapRememberedCode === target.code) {
    els.mapResult.innerHTML = `已记录：<span class="ok">${escapeHtml(displayName(target))}</span>。继续巡航可换一个位置。`;
    return;
  }
  state.mapRememberedCode = target.code;
  if (target.code === state.mapReviewCode) state.mapReviewStatus = "remembered";
  recordAttempt({
    mode: "巡航记忆",
    correct: 1,
    total: 1,
    items: [target],
    correctCodes: [target.code],
    wrongCodes: []
  });
  els.mapResult.innerHTML = `已记住：<span class="ok">${escapeHtml(displayName(target))}</span>，已写入练习记录。`;
  els.mapHint.textContent = describeMapUnit(target.code);
  syncMapSelection();
  advanceMapDrill(target, true);
}

function markMapUnitWeak() {
  const target = selectedMapPracticeTarget();
  if (!target) {
    els.mapResult.innerHTML = `<span class="miss">先巡航或点击一个地图轮廓。</span>`;
    return;
  }
  if (state.mapWeakCode === target.code) {
    els.mapResult.innerHTML = `已标记：<span class="miss">${escapeHtml(displayName(target))}</span>。继续巡航可换一个位置。`;
    return;
  }
  state.mapWeakCode = target.code;
  if (target.code === state.mapReviewCode) state.mapReviewStatus = "weak";
  recordAttempt({
    mode: "巡航薄弱",
    correct: 0,
    total: 1,
    items: [target],
    correctCodes: [],
    wrongCodes: [target.code]
  });
  els.mapResult.innerHTML = `已加入薄弱点：<span class="miss">${escapeHtml(displayName(target))}</span>，错题复习会优先出现。`;
  els.mapHint.textContent = describeMapUnit(target.code);
  syncMapSelection();
  advanceMapDrill(target, false);
}

function revealMapAnswer() {
  const reviewTarget = learnableItemsByCode.get(state.mapReviewCode);
  const target = reviewTarget || getMapItem(state.mapQuizCode || state.mapSelectedCode || state.cityCode || state.provinceCode);
  if (!target) return;
  const label = reviewTarget ? "复盘答案" : "当前轮廓";
  const answerHtml = `${label}：<span class="ok">${escapeHtml(displayName(target))}</span>。`;
  els.mapResult.innerHTML = reviewTarget ? reviewActionPrompt(reviewTarget, answerHtml) : answerHtml;
  els.mapHint.textContent = describeMapUnit(target.code);
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/特别行政区/g, "")
    .replace(/壮族自治区|回族自治区|维吾尔自治区|自治区/g, "")
    .replace(/土家族苗族自治州|哈尼族彝族自治州|布依族苗族自治州|苗族侗族自治州|藏族羌族自治州|蒙古族藏族自治州|柯尔克孜自治州|傈僳族自治州|傣族景颇族自治州|朝鲜族自治州|自治州/g, "")
    .replace(/自治县/g, "")
    .replace(/[省市县区旗盟州地区]/g, "");
}

function aliases(item) {
  const base = new Set();
  for (const name of [item.name, item.nameCn, item.nameEn, displayName(item)]) {
    if (!name) continue;
    base.add(name);
    base.add(normalize(name));
    if (String(name).endsWith("本级")) base.add(String(name).replace("本级", ""));
  }
  return [...base].filter(Boolean);
}

function parseAnswers(text) {
  return [...new Set(text
    .split(/[\n\r,，、;；\s　]+/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

function itemLevel(item) {
  if (provincesByCode.has(item.code)) return "province";
  if (citiesByCode.has(item.code)) return "city";
  return "area";
}

function scopeLabel() {
  return `${getScopeTitle()} · ${studyFilterLabel()}`.replace(/\s+/g, " ");
}

function rankTitle(xp) {
  if (xp >= 1800) return "山河宗师";
  if (xp >= 1000) return "舆图掌柜";
  if (xp >= 520) return "府州猎手";
  if (xp >= 180) return "识途者";
  return "新手行者";
}

function updateStudyStreak() {
  const today = todayKey();
  const streak = state.study.streak || { current: 0, best: 0, lastDate: "" };
  if (streak.lastDate === today) return;
  streak.current = streak.lastDate === yesterdayKey() ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best || 0, streak.current);
  streak.lastDate = today;
  state.study.streak = streak;
}

function recordAttempt({ mode, correct, total, items, correctCodes = [], wrongCodes = [], seconds = 0 }) {
  if (!total) return;
  updateStudyStreak();
  const accuracy = Math.round((correct / Math.max(total, 1)) * 100);
  const perfectBonus = correct === total ? 8 : 0;
  state.study.xp = (state.study.xp || 0) + correct * 6 + perfectBonus;

  const attempt = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    mode,
    scope: scopeLabel(),
    correct,
    total,
    accuracy,
    seconds
  };
  state.study.attempts.unshift(attempt);
  state.study.attempts = state.study.attempts.slice(0, 120);

  const correctSet = new Set(correctCodes);
  const wrongSet = new Set(wrongCodes);
  for (const item of items) {
    const code = item.code;
    if (!code || (!correctSet.has(code) && !wrongSet.has(code))) continue;
    const stat = state.study.itemStats[code] || {
      code,
      name: displayName(item),
      level: itemLevel(item),
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      lastSeen: ""
    };
    stat.name = displayName(item);
    stat.level = itemLevel(item);
    stat.seen += 1;
    stat.lastSeen = attempt.date;
    if (correctSet.has(code)) {
      stat.correct += 1;
      stat.streak = (stat.streak || 0) + 1;
    }
    if (wrongSet.has(code)) {
      stat.wrong += 1;
      stat.streak = 0;
    }
    state.study.itemStats[code] = stat;
  }

  saveStudy();
  if (studyFilterValue() === "all") updateStudyUI();
  else renderItems();
}

function studyTotals() {
  const attempts = state.study.attempts || [];
  const total = attempts.reduce((sum, item) => sum + item.total, 0);
  const correct = attempts.reduce((sum, item) => sum + item.correct, 0);
  return {
    attempts: attempts.length,
    total,
    correct,
    accuracy: Math.round((correct / Math.max(total, 1)) * 100)
  };
}

function renderMiniRows(container, rows, emptyText) {
  if (!container) return;
  container.innerHTML = rows.length
    ? rows.join("")
    : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
}

function buildStudyPlan() {
  const scopeItems = getScopeItems();
  const counts = studyFilterCounts(scopeItems);
  const weakItems = scopeItems.filter((item) => itemMatchesStudyFilter(item, "weak"));
  const newItems = scopeItems.filter((item) => itemMatchesStudyFilter(item, "new"));
  const plan = {
    title: "巩固当前范围",
    targetFilter: "all",
    mode: "quick",
    buttonText: "开始速记",
    summary: "先做一轮速记十题，把当前范围重新激活。",
    focus: sortItems(scopeItems).slice(0, 3)
  };

  if (counts.weak > 0) {
    plan.title = "先修薄弱点";
    plan.targetFilter = "weak";
    plan.mode = "weak";
    plan.buttonText = "开始错题复习";
    plan.summary = `当前范围有 ${counts.weak} 个薄弱点，先把错得最多的地名压回长期记忆。`;
    plan.focus = weakItems.slice(0, 3);
  } else if (counts.new > 0) {
    plan.title = "开新图";
    plan.targetFilter = "new";
    plan.mode = "quick";
    plan.buttonText = "开始新题速记";
    plan.summary = `当前范围还有 ${counts.new} 个未练条目，适合先做一轮轻量抽问。`;
    plan.focus = sortItems(newItems).slice(0, 3);
  } else if (counts.mastered === counts.all && counts.all > 0) {
    plan.title = "地图回忆巩固";
    plan.targetFilter = "all";
    plan.mode = "conquest";
    plan.buttonText = "开始地图征服";
    plan.summary = "本范围文字记忆已经稳定，切到地图高亮作答，把名称和位置绑定起来。";
    plan.focus = sortItems(scopeItems).slice(0, 3);
  }

  plan.counts = counts;
  return plan;
}

function renderStudyPlan() {
  if (!els.planBrief) return;
  const plan = buildStudyPlan();
  const focusNames = plan.focus.length
    ? plan.focus.map((item) => escapeHtml(displayName(item))).join(" · ")
    : "当前范围暂无可训练条目";
  els.planBrief.innerHTML = `<strong>${escapeHtml(plan.title)}</strong><p>${escapeHtml(plan.summary)}</p><small>训练池：全部 ${plan.counts.all} · 薄弱 ${plan.counts.weak} · 未练 ${plan.counts.new} · 已掌握 ${plan.counts.mastered}</small><small>优先看：${focusNames}</small>`;
  if (els.startPlanBtn) {
    els.startPlanBtn.textContent = plan.buttonText;
    els.startPlanBtn.disabled = plan.counts.all === 0;
  }
  if (els.copyPlanBtn) {
    els.copyPlanBtn.disabled = plan.counts.all === 0;
  }
}

function daysSince(dateText) {
  if (!dateText) return 99;
  const then = new Date(dateText).getTime();
  if (!Number.isFinite(then)) return 99;
  return Math.max(0, Math.floor((Date.now() - then) / 86400000));
}

function reviewAgeLabel(stat) {
  if (!stat?.lastSeen) return "未练";
  const days = daysSince(stat.lastSeen);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days >= 30) return "30天+";
  return `${days}天前`;
}

function reviewAgeClass(stat) {
  if (!stat?.lastSeen) return "is-new";
  const days = daysSince(stat.lastSeen);
  if (days === 0) return "is-fresh";
  if (days >= 7) return "is-stale";
  return "is-aging";
}

function buildReviewQueue(limit = 8) {
  return getScopeItems()
    .map((item) => {
      const stat = itemStudyStat(item);
      const seen = stat?.seen || 0;
      const correct = stat?.correct || 0;
      const wrong = stat?.wrong || 0;
      const accuracy = seen ? correct / seen : 0;
      const staleDays = daysSince(stat?.lastSeen);
      const mastered = isMastered(item);
      let score = 0;
      let reason = "保持手感";

      if (!seen) {
        score = 120;
        reason = "未练过";
      } else if (wrong > 0 && !mastered) {
        score = wrong * 28 + (1 - accuracy) * 45 + Math.min(staleDays, 30);
        reason = `错 ${wrong} 次`;
      } else if (!mastered) {
        score = 70 + (1 - accuracy) * 30 + Math.min(staleDays, 18);
        reason = "待稳固";
      } else {
        score = Math.min(staleDays, 30) + 8 - Math.min(stat?.streak || 0, 8);
        reason = staleDays >= 7 ? `${staleDays} 天未练` : "保持手感";
      }

      return { item, stat, score, reason, staleDays, accuracy: Math.round(accuracy * 100) };
    })
    .sort((a, b) => b.score - a.score || b.staleDays - a.staleDays || a.item.code.localeCompare(b.item.code))
    .slice(0, limit);
}

function renderReviewQueue() {
  if (!els.reviewQueue) return;
  const queue = buildReviewQueue(6);
  const activeItem = learnableItemsByCode.get(state.mapReviewCode);
  if (activeItem && !queue.some((row) => row.item.code === activeItem.code)) {
    const stat = itemStudyStat(activeItem);
    const seen = stat?.seen || 0;
    const accuracy = seen ? Math.round(((stat?.correct || 0) / seen) * 100) : 0;
    queue.unshift({ item: activeItem, stat, reason: "当前复盘", accuracy });
  }
  const rows = queue.map(({ item, stat, reason, accuracy }) => {
    const seen = stat?.seen || 0;
    const active = item.code === state.mapReviewCode;
    const statusLabel = reviewStatusLabel(item.code);
    const statusClass = state.mapReviewStatus ? ` status-${state.mapReviewStatus}` : "";
    const queueTag = reviewQueueTag(item, stat, accuracy);
    const tooltip = reviewQueueTooltip(item, stat, reason, accuracy, queueTag);
    return `<button class="mini-row review-row review-jump${active ? " active" : ""}" type="button" data-review-code="${escapeHtml(item.code)}" aria-pressed="${active ? "true" : "false"}" title="${escapeHtml(tooltip)}">
      <b>${escapeHtml(displayName(item))}${active ? `<span class="review-current${statusClass}">${escapeHtml(statusLabel)}</span>` : ""}</b>
      <span class="review-meta"><span class="review-reason">${escapeHtml(reason)}</span><span class="review-tag ${queueTag.className}">${escapeHtml(queueTag.label)}</span></span>
      <small>${seen ? `${seen} 次` : "新"}</small>
      <small class="review-age ${reviewAgeClass(stat)}">${seen ? `${accuracy}% · ${reviewAgeLabel(stat)}` : "0% · 未练"}</small>
    </button>`;
  });
  renderMiniRows(els.reviewQueue, rows, "当前范围暂无复盘项");
  const hasItems = rows.length > 0;
  if (els.startReviewBtn) els.startReviewBtn.disabled = !hasItems;
  if (els.copyReviewBtn) els.copyReviewBtn.disabled = !hasItems;
}

function reviewQueueTooltip(item, stat, reason, accuracy, queueTag) {
  const seen = stat?.seen || 0;
  const age = reviewAgeLabel(stat);
  const rate = seen ? `${accuracy}%` : "0%";
  return `${displayName(item)}｜${queueTag.label}｜${reason}｜正确率 ${rate}｜上次 ${age}｜${reviewAdvice(item)}`;
}

function reviewQueueTag(item, stat, accuracy) {
  const seen = stat?.seen || 0;
  if (!seen) return { label: "新项目", className: "is-new" };
  if ((stat?.wrong || 0) > 0 && !isMastered(item)) return { label: "薄弱", className: "is-weak" };
  if (isMastered(item)) return { label: "较稳", className: "is-steady" };
  if (accuracy < 80) return { label: "待巩固", className: "is-review" };
  return { label: "保持", className: "is-review" };
}

function reviewStatusLabel(code) {
  if (code !== state.mapReviewCode) return "";
  if (state.mapReviewStatus === "remembered") return "已记住";
  if (state.mapReviewStatus === "weak") return "待加强";
  return "当前";
}

function reviewStatSummary(item) {
  const stat = itemStudyStat(item);
  if (!stat || !stat.seen) return "复盘数据：新项目 · 正确率 0%";
  const accuracy = Math.round((stat.correct / Math.max(stat.seen, 1)) * 100);
  return `复盘数据：${stat.seen} 次 · 错 ${stat.wrong || 0} 次 · 正确率 ${accuracy}%`;
}

function reviewAdvice(item) {
  const stat = itemStudyStat(item);
  if (!stat || !stat.seen) return "复盘建议：先看图默写一次，答不出再按 A 看答案。";
  const accuracy = stat.correct / Math.max(stat.seen, 1);
  if ((stat.wrong || 0) >= Math.max(2, stat.correct || 0)) return "复盘建议：先按 W 保留薄弱标记，再用错题复习压一轮。";
  if (isMastered(item)) return "复盘建议：已较稳，按 M 收尾或切到地图征服保持手感。";
  if (accuracy < 0.8) return "复盘建议：先看轮廓回忆名字，再按 M/W 记录真实掌握度。";
  return "复盘建议：接近掌握，连续答对两次后就可以降频复习。";
}

function reviewActionPrompt(item, lead) {
  return `${lead}<div class="review-action-hint">
    <span>下一步</span>
    <b><kbd>M</kbd> 记住</b>
    <b><kbd>W</kbd> 还不熟</b>
    <b><kbd>V</kbd> 开始复盘</b>
  </div><small>${escapeHtml(reviewStatSummary(item))} · 当前操作会记录：${escapeHtml(displayName(item))}</small><small>${escapeHtml(reviewAdvice(item))}</small>`;
}

function focusReviewItemOnMap(code) {
  const item = learnableItemsByCode.get(code);
  if (!item) return;
  state.provinceCode = item.provinceCode || item.code;
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapReviewCode = item.code;
  state.mapReviewStatus = "";
  state.mapQuizCode = "";
  state.mapRememberedCode = "";
  state.mapWeakCode = "";
  state.mapDrill = null;
  if (provincesByCode.has(item.code)) {
    els.levelSelect.value = "province";
    syncZoomFromLevel();
    renderProvinces();
    renderItems();
    state.mapSelectedCode = item.code;
  } else if (citiesByCode.has(item.code)) {
    els.levelSelect.value = "city";
    syncZoomFromLevel();
    renderProvinces();
    renderItems();
    state.cityCode = item.code;
    state.mapSelectedCode = item.code;
  } else {
    els.levelSelect.value = "area";
    state.cityCode = item.cityCode || "";
    syncZoomFromLevel();
    renderProvinces();
    renderItems();
    setSelectValue(els.citySelect, state.cityCode);
    state.mapSelectedCode = item.code;
  }
  if (!currentMapHasUnit(state.mapSelectedCode) && item.cityCode && citiesByCode.has(item.cityCode)) {
    els.levelSelect.value = "city";
    state.cityCode = "";
    state.mapSelectedCode = "";
    state.mapQuizCode = "";
    state.mapZoom = 1.6;
    renderProvinces();
    renderItems();
    state.cityCode = item.cityCode;
    state.mapSelectedCode = item.cityCode;
    syncMapSelection();
    els.mapHint.textContent = `${displayName(item)} 暂无独立边界，已定位到 ${cityName(item.cityCode)}。`;
    if (els.mapResult) {
      els.mapResult.innerHTML = reviewActionPrompt(item, `复盘定位：<span class="ok">${escapeHtml(displayName(item))}</span>，已高亮所属范围。`);
    }
    return;
  }
  if (!currentMapHasUnit(state.mapSelectedCode) && item.provinceCode && provincesByCode.has(item.provinceCode)) {
    els.levelSelect.value = "province";
    state.cityCode = "";
    state.mapSelectedCode = item.provinceCode;
    state.mapQuizCode = "";
    state.mapZoom = 0.85;
    renderProvinces();
    renderItems();
    syncMapSelection();
    els.mapHint.textContent = `${displayName(item)} 暂无独立边界，已定位到 ${provinceName(item.provinceCode)}。`;
    if (els.mapResult) {
      els.mapResult.innerHTML = reviewActionPrompt(item, `复盘定位：<span class="ok">${escapeHtml(displayName(item))}</span>，已高亮上级范围。`);
    }
    return;
  }
  syncMapSelection();
  els.mapHint.textContent = describeMapUnit(item.code);
  if (els.mapResult) {
    els.mapResult.innerHTML = reviewActionPrompt(item, `复盘定位：<span class="ok">${escapeHtml(displayName(item))}</span>。`);
  }
}

function updateStudyUI() {
  const totals = studyTotals();
  els.studyAttempts.textContent = String(totals.attempts);
  els.studyAccuracy.textContent = `${totals.accuracy}%`;
  els.studyStreak.textContent = `${state.study.streak?.current || 0} 天`;
  els.studyRank.textContent = rankTitle(state.study.xp || 0);

  const today = todayKey();
  const todayAttempts = (state.study.attempts || []).filter((item) => item.date.startsWith(today));
  const todayCorrect = todayAttempts.reduce((sum, item) => sum + item.correct, 0);
  const todayTotal = todayAttempts.reduce((sum, item) => sum + item.total, 0);
  const missionDone = todayAttempts.length >= 3 || todayCorrect >= 20;
  els.missionBrief.innerHTML = `<strong>${missionDone ? "今日任务完成" : "今日远征"}</strong><br>完成 3 轮练习或答对 20 题。当前 ${todayAttempts.length}/3 轮，${todayCorrect}/20 题，今日正确率 ${Math.round((todayCorrect / Math.max(todayTotal, 1)) * 100)}%。`;
  renderStudyPlan();
  renderReviewQueue();

  const mapAttempts = (state.study.attempts || []).filter((item) => item.mode.includes("图") || item.mode.includes("征服")).length;
  const perfectAttempts = (state.study.attempts || []).filter((item) => item.correct === item.total && item.total > 0).length;
  const badges = [
    ["首战记录", totals.attempts >= 1],
    ["百题巡航", totals.total >= 100],
    ["三日连航", (state.study.streak?.current || 0) >= 3],
    ["全对闪击", perfectAttempts >= 1],
    ["星图猎手", mapAttempts >= 5],
    ["府州掌控", (state.study.xp || 0) >= 520]
  ];
  els.badgeList.innerHTML = badges
    .map(([name, earned]) => `<span class="badge${earned ? " earned" : ""}">${earned ? "已解锁" : "未解锁"} · ${escapeHtml(name)}</span>`)
    .join("");

  const leaders = [...(state.study.attempts || [])]
    .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct || new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((item, index) => `<div class="mini-row"><b>${index + 1}. ${escapeHtml(item.mode)}</b><span class="ok">${item.correct}/${item.total}</span><small>${escapeHtml(item.scope)}</small><small>${item.accuracy}%</small></div>`);
  renderMiniRows(els.leaderboardList, leaders, "暂无排行");

  const currentCodes = new Set(getBaseItems().map((item) => item.code));
  const weak = Object.values(state.study.itemStats || {})
    .filter((item) => item.wrong > 0 && currentCodes.has(item.code))
    .sort((a, b) => b.wrong - a.wrong || (a.correct / Math.max(a.seen, 1)) - (b.correct / Math.max(b.seen, 1)))
    .slice(0, 6)
    .map((item) => {
      const liveItem = learnableItemsByCode.get(item.code);
      const rate = Math.round((item.correct / Math.max(item.seen, 1)) * 100);
      return `<button class="mini-row weak-row weak-jump" type="button" data-weak-code="${escapeHtml(item.code)}" title="定位到地图复盘">
        <b>${escapeHtml(displayName(liveItem) || item.name)}</b>
        <span class="miss">${item.wrong} 错</span>
        <small>${item.seen} 次</small>
        <small>${rate}%</small>
      </button>`;
    });
  renderMiniRows(els.weakList, weak, "当前范围暂无错题");

  const records = (state.study.attempts || []).slice(0, 6).map((item) => {
    const when = new Date(item.date).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `<div class="mini-row"><b>${escapeHtml(item.mode)}</b><span>${item.correct}/${item.total}</span><small>${escapeHtml(item.scope)}</small><small>${when}</small></div>`;
  });
  renderMiniRows(els.recordFeed, records, "暂无记录");
}

function quizPromptFor(item) {
  const level = itemLevel(item);
  if (level === "province") {
    return `写出简称「${item.shortName || item.order}」对应的省级单位`;
  }
  if (level === "city") {
    const plate = item.plate ? `车牌 ${item.plate}，` : "";
    return `${provinceName(item.provinceCode)}，${plate}代码 ${item.code}`;
  }
  const city = cityName(item.cityCode) || provinceName(item.provinceCode);
  return `${city}，代码 ${item.code}`;
}

function getWeakQuizItems() {
  const current = getBaseItems();
  const byCode = new Map(current.map((item) => [item.code, item]));
  const weakCodes = Object.values(state.study.itemStats || {})
    .filter((item) => item.wrong > 0 && byCode.has(item.code))
    .sort((a, b) => b.wrong - a.wrong || a.streak - b.streak)
    .map((item) => byCode.get(item.code));
  return weakCodes.length ? weakCodes.slice(0, 10) : shuffle(current).slice(0, 10);
}

function getReviewQuizItems() {
  return buildReviewQueue(10).map((row) => row.item);
}

function startQuiz(mode) {
  const baseItems = getBaseItems();
  if (!baseItems.length) {
    els.quizFeedback.innerHTML = `<span class="miss">当前范围没有可练习条目。</span>`;
    return;
  }

  const modeName = mode === "review" ? "复盘队列" : mode === "weak" ? "错题复习" : mode === "streak" ? "连胜挑战" : mode === "conquest" ? "四色征服" : "速记十题";
  const mapItems = mode === "conquest" ? getMapQuizTargets() : [];
  const items = mode === "weak"
    ? getWeakQuizItems()
    : mode === "review"
      ? getReviewQuizItems()
    : mode === "conquest"
      ? shuffle(mapItems.length ? mapItems : baseItems).slice(0, 8)
      : shuffle(baseItems).slice(0, mode === "streak" ? 20 : 10);
  state.quiz = {
    mode,
    modeName,
    items,
    index: 0,
    correct: 0,
    correctCodes: [],
    wrongCodes: [],
    answered: false,
    startedAt: Date.now()
  };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;
  const item = quiz.items[quiz.index];
  if (!item) {
    finishQuiz();
    return;
  }
  els.quizCard.dataset.code = item.code;
  els.quizModeLabel.textContent = `${quiz.modeName} · ${quiz.index + 1}/${quiz.items.length}`;
  if (quiz.mode === "conquest") {
    state.mapQuizCode = item.code;
    state.mapSelectedCode = item.code;
    syncMapSelection();
    els.quizPrompt.textContent = "观察地图里的高亮轮廓，写出它的名称";
  } else {
    els.quizPrompt.textContent = quizPromptFor(item);
  }
  els.quizAnswerInput.value = "";
  els.quizFeedback.textContent = "写出对应地名。";
  quiz.answered = false;
  els.quizAnswerInput.focus();
}

function checkQuizAnswer() {
  const quiz = state.quiz;
  if (!quiz) {
    startQuiz("quick");
    return;
  }
  const item = quiz.items[quiz.index];
  if (!item || quiz.answered) return;
  const answer = els.quizAnswerInput.value.trim();
  if (!answer) {
    els.quizFeedback.innerHTML = `<span class="miss">先写下答案。</span>`;
    els.quizAnswerInput.focus();
    return;
  }
  const accepted = new Set(aliases(item).map(normalize).concat(aliases(item)));
  const ok = accepted.has(answer) || accepted.has(normalize(answer));
  quiz.answered = true;
  if (ok) {
    quiz.correct += 1;
    quiz.correctCodes.push(item.code);
    els.quizFeedback.innerHTML = `<span class="ok">正确。</span>${escapeHtml(displayName(item))}`;
  } else {
    quiz.wrongCodes.push(item.code);
    els.quizFeedback.innerHTML = `<span class="miss">不对。</span>答案是 ${escapeHtml(displayName(item))}。`;
    if (quiz.mode === "streak") {
      finishQuiz();
    }
  }
}

function nextQuizQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;
  if (!quiz.answered) {
    checkQuizAnswer();
    if (!quiz.answered) return;
  }
  quiz.index += 1;
  renderQuizQuestion();
}

function finishQuiz() {
  const quiz = state.quiz;
  if (!quiz) return;
  const answeredTotal = Math.max(quiz.correctCodes.length + quiz.wrongCodes.length, quiz.index);
  const usedItems = quiz.items.slice(0, Math.max(answeredTotal, 1));
  const seconds = Math.round((Date.now() - quiz.startedAt) / 1000);
  recordAttempt({
    mode: quiz.modeName,
    correct: quiz.correct,
    total: usedItems.length,
    items: usedItems,
    correctCodes: quiz.correctCodes,
    wrongCodes: quiz.wrongCodes,
    seconds
  });
  els.quizModeLabel.textContent = `${quiz.modeName} · 已结算`;
  els.quizPrompt.textContent = `本轮 ${quiz.correct}/${usedItems.length}`;
  els.quizFeedback.innerHTML = quiz.correct === usedItems.length ? `<span class="ok">全对，段位经验已增加。</span>` : `<span class="miss">错题已进入薄弱点。</span>`;
  if (quiz.mode === "conquest") {
    state.mapQuizCode = "";
    syncMapSelection();
  }
  state.quiz = null;
}

function currentWeakRows(limit = 5) {
  const currentCodes = new Set(getBaseItems().map((item) => item.code));
  return Object.values(state.study.itemStats || {})
    .filter((item) => item.wrong > 0 && currentCodes.has(item.code))
    .sort((a, b) => b.wrong - a.wrong || (a.correct / Math.max(a.seen, 1)) - (b.correct / Math.max(b.seen, 1)))
    .slice(0, limit)
    .map((item, index) => {
      const liveItem = learnableItemsByCode.get(item.code);
      const rate = Math.round((item.correct / Math.max(item.seen, 1)) * 100);
      return `${index + 1}. ${displayName(liveItem) || item.name}：错 ${item.wrong} 次，练 ${item.seen} 次，正确率 ${rate}%`;
    });
}

function recentRecordRows(limit = 5) {
  return (state.study.attempts || [])
    .slice(0, limit)
    .map((item, index) => {
      const when = new Date(item.date).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      return `${index + 1}. ${item.mode}：${item.correct}/${item.total}，${item.accuracy}% · ${item.scope} · ${when}`;
    });
}

function formatStudyExport() {
  const totals = studyTotals();
  const weakRows = currentWeakRows();
  const recentRows = recentRecordRows();
  return [
    "星图远征学习记录",
    `练习次数：${totals.attempts}`,
    `题目总数：${totals.total}`,
    `正确率：${totals.accuracy}%`,
    `连续学习：${state.study.streak?.current || 0} 天`,
    `段位：${rankTitle(state.study.xp || 0)}`,
    "",
    "当前范围薄弱点：",
    ...(weakRows.length ? weakRows : ["暂无薄弱点"]),
    "",
    "最近记录：",
    ...(recentRows.length ? recentRows : ["暂无记录"])
  ].join("\n");
}

function formatWeakExport() {
  const generatedAt = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const weakRows = currentWeakRows(12);
  return [
    "星图远征薄弱点清单",
    `当前范围：${getScopeTitle()}`,
    `生成：${generatedAt}`,
    weakRows.length ? "建议：先从前 5 项开始五连练，再回到地图巡航。" : "建议：当前范围暂无薄弱点，可以切到未练过或换一个范围。",
    "",
    ...(weakRows.length ? weakRows : ["暂无薄弱点"])
  ].join("\n");
}

function formatStudyPlanExport() {
  const generatedAt = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const plan = buildStudyPlan();
  const focusRows = plan.focus.map((item, index) => `${index + 1}. ${displayName(item)} ${item.code}`);
  return [
    "星图远征今日计划",
    `当前范围：${getScopeTitle()}`,
    `计划：${plan.title}`,
    `建议玩法：${plan.buttonText}`,
    `训练过滤：${studyFilterLabel(plan.targetFilter)}`,
    `训练池：全部 ${plan.counts.all} · 薄弱 ${plan.counts.weak} · 未练 ${plan.counts.new} · 已掌握 ${plan.counts.mastered}`,
    `生成：${generatedAt}`,
    "",
    plan.summary,
    "",
    "优先看：",
    ...(focusRows.length ? focusRows : ["当前范围暂无可训练条目"])
  ].join("\n");
}

function formatReviewQueueExport() {
  const generatedAt = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const rows = buildReviewQueue(12).map(({ item, stat, reason, accuracy }, index) => {
    const seen = stat?.seen || 0;
    return `${index + 1}. ${displayName(item)} ${item.code}：${reason}，练 ${seen} 次，正确率 ${seen ? accuracy : 0}%`;
  });
  return [
    "星图远征复盘队列",
    `当前范围：${getScopeTitle()}`,
    `生成：${generatedAt}`,
    "建议：按顺序完成一轮复盘，再回到地图巡航确认位置。",
    "",
    ...(rows.length ? rows : ["当前范围暂无复盘项"])
  ].join("\n");
}

function startStudyPlan() {
  const plan = buildStudyPlan();
  if (!plan.counts.all) {
    els.quizFeedback.textContent = "当前范围暂无可训练条目。";
    return;
  }
  if (els.studyFilterSelect) els.studyFilterSelect.value = plan.targetFilter;
  if (els.itemSearch) els.itemSearch.value = "";
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  renderItems();
  startQuiz(plan.mode);
}

function startReviewQueue() {
  if (!buildReviewQueue(1).length) {
    els.quizFeedback.textContent = "当前范围暂无复盘项。";
    return;
  }
  startQuiz("review");
}

async function copyStudyPlan() {
  const ok = await writeClipboard(formatStudyPlanExport()).catch(() => false);
  els.quizFeedback.textContent = ok ? "星图计划已复制。" : "星图计划复制失败。";
}

async function copyReviewQueue() {
  const ok = await writeClipboard(formatReviewQueueExport()).catch(() => false);
  els.quizFeedback.textContent = ok ? "复盘队列已复制。" : "复盘队列复制失败。";
}

async function copyWeakList() {
  const ok = await writeClipboard(formatWeakExport()).catch(() => false);
  els.quizFeedback.textContent = ok ? "薄弱点清单已复制。" : "薄弱点清单复制失败。";
}

async function copyStudyRecords() {
  const ok = await writeClipboard(formatStudyExport()).catch(() => false);
  els.quizFeedback.textContent = ok ? "学习记录已复制。" : "学习记录复制失败。";
}

function formatShortcutGuide() {
  return [
    "星图远征快捷键",
    "P：开始星图计划",
    "Shift+P：复制星图计划",
    "Shift+W：复制薄弱点",
    "Shift+L：复制当前清单",
    "Shift+R：导出学习记录",
    "Shift+K：复制快捷键表",
    "Q：速记十题",
    "E：错题复习",
    "T：连胜挑战",
    "G：四色征服",
    "V：开始复盘队列",
    "Shift+V：复制复盘队列",
    "Enter：作答，答完后进入下一题",
    "N：下一题",
    "F：结算当前训练",
    "C：地图巡航",
    "D：五连练",
    "M：记住当前地图项",
    "W：标记当前地图项还不熟",
    "S：跳过当前地图项",
    "A：显示地图答案",
    "+ / -：地图放大或缩小",
    "0：地图复位"
  ].join("\n");
}

async function copyShortcutGuide() {
  const ok = await writeClipboard(formatShortcutGuide()).catch(() => false);
  els.quizFeedback.textContent = ok ? "快捷键表已复制。" : "快捷键表复制失败。";
}

function sortItems(items) {
  const sort = els.sortSelect.value;
  return [...items].sort((a, b) => {
    if (sort === "plate") {
      return (
        (a.plateRank ?? 999) - (b.plateRank ?? 999) ||
        String(a.plate || "").localeCompare(String(b.plate || ""), "zh-Hans-CN") ||
        a.code.localeCompare(b.code)
      );
    }
    if (sort === "pinyin") return a.pinyin.localeCompare(b.pinyin) || a.code.localeCompare(b.code);
    if (sort === "geo") {
      const provinceA = provincesByCode.get(a.provinceCode)?.order || a.order || 999;
      const provinceB = provincesByCode.get(b.provinceCode)?.order || b.order || 999;
      return provinceA - provinceB || a.code.localeCompare(b.code);
    }
    return a.code.localeCompare(b.code);
  });
}

function filterText(item) {
  return [displayName(item), item.name, item.nameCn, item.nameEn, normalize(item.name), normalize(item.nameCn), normalize(item.nameEn), item.code, item.pinyin, item.plate, provinceName(item.provinceCode), cityName(item.cityCode)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function studyFilterValue() {
  return els.studyFilterSelect?.value || "all";
}

function studyFilterLabel(filter = studyFilterValue()) {
  return {
    all: "全部条目",
    weak: "薄弱优先",
    new: "未练过",
    mastered: "已掌握"
  }[filter] || "全部条目";
}

function itemStudyStat(item) {
  return state.study.itemStats?.[item.code] || null;
}

function isMastered(item) {
  const stat = itemStudyStat(item);
  if (!stat || !stat.seen) return false;
  const accuracy = stat.correct / Math.max(stat.seen, 1);
  return stat.seen >= 2 && stat.correct >= 2 && accuracy >= 0.8 && (stat.streak || 0) >= 2;
}

function itemMatchesStudyFilter(item, filter = studyFilterValue()) {
  if (filter === "all") return true;
  const stat = itemStudyStat(item);
  if (filter === "weak") return Boolean(stat && stat.wrong > 0 && !isMastered(item));
  if (filter === "new") return !stat || !stat.seen;
  if (filter === "mastered") return isMastered(item);
  return true;
}

function applyStudyFilter(items, filter = studyFilterValue()) {
  return items.filter((item) => itemMatchesStudyFilter(item, filter));
}

function studyFilterCounts(items) {
  return {
    all: items.length,
    weak: items.filter((item) => itemMatchesStudyFilter(item, "weak")).length,
    new: items.filter((item) => itemMatchesStudyFilter(item, "new")).length,
    mastered: items.filter((item) => itemMatchesStudyFilter(item, "mastered")).length
  };
}

function recommendedStudyFilter(counts) {
  if (!counts || !counts.all) return "";
  if (counts.weak > 0) return "weak";
  if (counts.new > 0) return "new";
  return "";
}

function studyFilterSuggestion(counts) {
  if (!counts || !counts.all) return "建议：当前范围暂无训练条目";
  if (counts.weak > 0) return `建议：先刷薄弱优先 ${counts.weak} 项`;
  if (counts.new > 0) return `建议：开新图，未练过 ${counts.new} 项`;
  if (counts.mastered === counts.all) return "建议：本范围已掌握，可切换下一层级或下一地区";
  return "建议：继续快速抽测，把零散记忆压实";
}

function updateStudyFilterStats(counts) {
  if (!counts) return;
  if (els.studyFilterSelect) {
    for (const option of els.studyFilterSelect.options) {
      const value = option.value;
      option.textContent = `${studyFilterLabel(value).replace("条目", "")} ${counts[value] ?? 0}`;
    }
  }
  if (els.studyFilterStats) {
    els.studyFilterStats.textContent = `训练池：全部 ${counts.all} · 薄弱 ${counts.weak} · 未练 ${counts.new} · 已掌握 ${counts.mastered}。${studyFilterSuggestion(counts)}`;
  }
  if (els.applySuggestedFilterBtn) {
    const target = recommendedStudyFilter(counts);
    const active = studyFilterValue();
    els.applySuggestedFilterBtn.dataset.target = target;
    els.applySuggestedFilterBtn.disabled = !target || target === active;
    els.applySuggestedFilterBtn.textContent = target ? `切到${studyFilterLabel(target).replace("条目", "")}` : "按建议训练";
  }
}

function updateSortAvailability() {
  const plateOption = els.sortSelect.querySelector('option[value="plate"]');
  const level = els.levelSelect.value;
  plateOption.disabled = level !== "city";
  if (level !== "city" && els.sortSelect.value === "plate") {
    els.sortSelect.value = level === "province" ? "geo" : "code";
  }
}

function renderProvinces() {
  const keyword = els.provinceSearch.value.trim().toLowerCase();
  const normalizedKeyword = normalize(keyword);
  const provinces = data.provinces.filter((province) => {
    const haystack = `${displayName(province)} ${province.name || ""} ${province.nameCn || ""} ${province.nameEn || ""} ${normalize(province.name)} ${normalize(province.nameCn)} ${normalize(province.nameEn)} ${province.shortName} ${province.pinyin}`.toLowerCase();
    return !keyword || haystack.includes(keyword) || (normalizedKeyword && haystack.includes(normalizedKeyword));
  });

  els.provinceList.innerHTML = provinces.length
    ? provinces
        .map((province) => {
      const cityCount = (citiesByProvince[province.code] || []).filter((item) => !item.isDirectCountyGroup && !item.synthetic).length;
      const areaCount = (areasByProvince[province.code] || []).length;
      const active = province.code === state.provinceCode ? " active" : "";
      return `<button class="province-button${active}" type="button" data-code="${province.code}">
        <b>${escapeHtml(province.shortName || province.order)}</b>
        <span>${escapeHtml(displayName(province))}</span>
        <small>${cityCount || "直辖"} / ${areaCount}</small>
      </button>`;
    })
        .join("")
    : `<div class="empty-state">没有匹配的${escapeHtml(labelText("province", "省份"))}</div>`;
}

function renderCitySelect() {
  const level = els.levelSelect.value;
  const cities = sortItems(citiesByProvince[state.provinceCode] || []).filter((city) => {
    return city.synthetic || city.isDirectCountyGroup || (areasByCity[city.code] || []).length > 0;
  });

  els.citySelect.disabled = level !== "area";
  if (level !== "area") {
    els.citySelect.innerHTML = `<option value="">无需选择</option>`;
    state.cityCode = "";
    return;
  }

  const options = [`<option value="">${escapeHtml(labelText("allAreasLabel", "全省区县"))}</option>`]
    .concat(
      cities.map((city) => {
        const areaCount = (areasByCity[city.code] || []).length;
        return `<option value="${escapeHtml(city.code)}">${escapeHtml(displayName(city))}（${areaCount}）</option>`;
      })
    )
    .join("");

  els.citySelect.innerHTML = options;
  if (state.cityCode && cities.some((city) => city.code === state.cityCode)) {
    els.citySelect.value = state.cityCode;
  } else {
    state.cityCode = "";
  }
}

function getScopeItems() {
  const level = els.levelSelect.value;
  if (level === "province") return data.provinces;
  if (level === "city") {
    return (citiesByProvince[state.provinceCode] || []).filter((item) => !item.isDirectCountyGroup && !item.synthetic);
  }
  if (state.cityCode) return areasByCity[state.cityCode] || [];
  return areasByProvince[state.provinceCode] || [];
}

function getBaseItems() {
  return applyStudyFilter(getScopeItems());
}

function getScopeTitle() {
  const level = els.levelSelect.value;
  if (level === "province") return `${data.provinces.length} 个${labelText("province", "省级行政单位")}`;
  if (level === "city") return `${provinceName(state.provinceCode)}的${labelText("city", "地级行政单位")}`;
  if (state.cityCode) return `${cityName(state.cityCode)}的${labelText("area", "区县级单位")}`;
  return `${provinceName(state.provinceCode)}的${labelText("area", "区县级单位")}`;
}

function renderItems() {
  updateSortAvailability();
  renderCitySelect();
  const keyword = els.itemSearch.value.trim().toLowerCase();
  const normalizedKeyword = normalize(keyword);
  const scopeItems = getScopeItems();
  const filterCounts = studyFilterCounts(scopeItems);
  updateStudyFilterStats(filterCounts);
  const baseItems = sortItems(applyStudyFilter(scopeItems));
  const filtered = baseItems.filter((item) => {
    const haystack = filterText(item);
    return !keyword || haystack.includes(keyword) || (normalizedKeyword && haystack.includes(normalizedKeyword));
  });
  state.currentItems = filtered;

  els.listTitle.textContent = getScopeTitle();
  els.listSubtitle.textContent = `当前显示 ${filtered.length} 项，训练过滤：${studyFilterLabel()} ${filterCounts[studyFilterValue()] ?? baseItems.length} 项，完整范围 ${scopeItems.length} 项。`;
  els.practiceScope.textContent = `检测范围：${getScopeTitle()}；训练过滤：${studyFilterLabel()}。`;

  els.itemList.innerHTML = filtered.length
    ? filtered
        .map((item, index) => {
      const meta = els.levelSelect.value === "area" ? cityName(item.cityCode) || provinceName(item.provinceCode) : provinceName(item.provinceCode);
      const plate = item.plate ? `<span class="plate-badge">${escapeHtml(item.plate)}</span>` : `<span></span>`;
      return `<div class="item-row">
        <code>${String(index + 1).padStart(2, "0")}</code>
        <div><strong>${escapeHtml(displayName(item))}</strong><br><span>${escapeHtml(meta)}</span></div>
        <code>${escapeHtml(item.code)}</code>
        ${plate}
      </div>`;
    })
        .join("")
    : `<div class="empty-state">当前筛选没有结果</div>`;

  renderMap();
  updateProgressUI();
  updateStudyUI();
  saveUiPreferences();
}

function progressKey() {
  return [state.countryCode, els.levelSelect.value, state.provinceCode || "all", state.cityCode || "all", studyFilterValue()].join(":");
}

function updateProgressUI() {
  const progress = state.progress[progressKey()];
  if (!progress) {
    els.lastScore.textContent = "尚未检测";
    els.totalAccuracy.textContent = "0%";
    return;
  }
  els.lastScore.textContent = `${progress.lastCorrect}/${progress.lastTotal}`;
  els.totalAccuracy.textContent = `${Math.round((progress.correct / Math.max(progress.total, 1)) * 100)}%`;
}

function renderChips(items, warn = false) {
  if (!items.length) return "";
  return `<div class="chip-list">${items.map((item) => `<span class="chip${warn ? " warn" : ""}">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function checkAnswers() {
  const target = getBaseItems();
  const answers = parseAnswers(els.answerInput.value);
  if (!answers.length) {
    els.resultBox.innerHTML = `<div class="miss">先默写一些答案，再检查。</div>`;
    els.answerInput.focus();
    return;
  }
  if (!target.length) {
    els.resultBox.innerHTML = `<div class="miss">当前范围没有可检测条目。</div>`;
    return;
  }

  const targetAliasMap = new Map();
  for (const item of target) {
    for (const alias of aliases(item)) targetAliasMap.set(alias, item.code);
  }

  const matched = new Set();
  const extras = [];

  for (const answer of answers) {
    const direct = targetAliasMap.get(answer);
    const loose = targetAliasMap.get(normalize(answer));
    const hit = direct || loose;
    if (hit) matched.add(hit);
    else extras.push(answer);
  }

  const targetCodes = target.map((item) => item.code);
  const missedItems = target.filter((item) => !matched.has(item.code));
  const missed = missedItems.map((item) => displayName(item));
  const correct = targetCodes.length - missed.length;
  const correctCodes = target.filter((item) => matched.has(item.code)).map((item) => item.code);
  const wrongCodes = missedItems.map((item) => item.code);
  const key = progressKey();
  const progress = state.progress[key] || { correct: 0, total: 0, lastCorrect: 0, lastTotal: 0 };
  progress.correct += correct;
  progress.total += targetCodes.length;
  progress.lastCorrect = correct;
  progress.lastTotal = targetCodes.length;
  state.progress[key] = progress;
  saveProgress();

  els.resultBox.innerHTML = `
    <div><span class="ok">正确 ${correct}</span> / ${targetCodes.length}，遗漏 ${missed.length}，范围外 ${extras.length}。</div>
    ${missed.length ? `<div class="miss">遗漏：</div>${renderChips(missed, true)}` : `<div class="ok">本轮全对。</div>`}
    ${extras.length ? `<div class="miss">未匹配：</div>${renderChips(extras, true)}` : ""}
  `;
  updateProgressUI();
  recordAttempt({
    mode: "清单默写",
    correct,
    total: targetCodes.length,
    items: target,
    correctCodes,
    wrongCodes
  });
}

function revealAnswers() {
  const names = sortItems(getBaseItems()).map((item) => displayName(item));
  els.resultBox.innerHTML = `<div>标准答案：</div>${renderChips(names)}`;
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const buffer = document.createElement("textarea");
  buffer.value = text;
  buffer.setAttribute("readonly", "");
  buffer.style.position = "fixed";
  buffer.style.opacity = "0";
  document.body.appendChild(buffer);
  buffer.select();
  const ok = document.execCommand?.("copy") ?? false;
  buffer.remove();
  return ok;
}

async function copyCurrentList() {
  const generatedAt = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const modeLabels = {
    cn: "中文",
    en: "English",
    both: "中英"
  };
  const header = [
    "星图远征清单",
    `范围：${getScopeTitle()}`,
    `训练过滤：${studyFilterLabel()}`,
    `地名显示：${modeLabels[currentNameMode()] || "中英"}`,
    `条目：${state.currentItems.length}`,
    `生成：${generatedAt}`,
    ""
  ];
  const lines = state.currentItems.map((item, index) => {
    const plate = item.plate ? ` ${item.plate}` : "";
    return `${index + 1}. ${displayName(item)} ${item.code}${plate}`;
  });
  let ok = false;
  try {
    ok = await writeClipboard(header.concat(lines.length ? lines : ["当前筛选没有结果"]).join("\n"));
  } catch {
    ok = false;
  }
  els.copyListBtn.textContent = ok ? "已复制" : "复制失败";
  setTimeout(() => {
    els.copyListBtn.textContent = "复制清单";
  }, 1400);
}

function drawCard() {
  const level = els.levelSelect.value;
  if (level === "province") {
    els.flashPrompt.textContent = `默写全部 ${data.provinces.length} 个${labelText("province", "省级行政单位")}`;
    return;
  }

  if (level === "city") {
    const province = data.provinces[Math.floor(Math.random() * data.provinces.length)];
    state.provinceCode = province.code;
    state.cityCode = "";
    state.mapSelectedCode = "";
    state.mapQuizCode = "";
    renderProvinces();
    renderItems();
    els.flashPrompt.textContent = `默写：${displayName(province)}的${labelText("city", "地级行政单位")}`;
    return;
  }

  const provinceCities = data.cities.filter((item) => !item.isDirectCountyGroup && !item.synthetic);
  const city = provinceCities[Math.floor(Math.random() * provinceCities.length)];
  state.provinceCode = city.provinceCode;
  state.cityCode = city.code;
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  renderProvinces();
  renderItems();
  els.citySelect.value = city.code;
  els.flashPrompt.textContent = `默写：${displayName(city)}的${labelText("area", "区县级单位")}`;
}

els.provinceList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-code]");
  if (!button) return;
  state.provinceCode = button.dataset.code;
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  renderProvinces();
  renderItems();
});

els.provinceMap?.addEventListener("click", (event) => {
  const unit = event.target.closest(".map-unit[data-code]");
  if (!unit) return;
  selectMapUnit(unit.dataset.code);
});

els.provinceMap?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const unit = event.target.closest(".map-unit[data-code]");
  if (!unit) return;
  event.preventDefault();
  selectMapUnit(unit.dataset.code);
});

els.provinceMap?.addEventListener("wheel", (event) => {
  event.preventDefault();
  const unit = event.target.closest?.(".map-unit[data-code]");
  const focusCode = unit?.dataset?.code || state.mapSelectedCode || state.cityCode || state.provinceCode;
  changeMapZoom(event.deltaY < 0 ? 0.45 : -0.45, focusCode);
}, { passive: false });

els.countrySelect?.addEventListener("change", () => switchCountry(els.countrySelect.value));
els.nameModeSelect?.addEventListener("change", () => {
  state.nameMode = els.nameModeSelect.value;
  renderProvinces();
  renderItems();
  updateStudyUI();
});
els.provinceSearch.addEventListener("input", renderProvinces);
els.levelSelect.addEventListener("change", () => {
  state.cityCode = "";
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  syncZoomFromLevel();
  renderItems();
});
els.citySelect.addEventListener("change", () => {
  state.cityCode = els.citySelect.value;
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  if (els.levelSelect.value === "area") state.mapZoom = state.cityCode ? 2.8 : 2.1;
  renderItems();
});
els.sortSelect.addEventListener("change", renderItems);
els.studyFilterSelect?.addEventListener("change", () => {
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  renderItems();
});
els.applySuggestedFilterBtn?.addEventListener("click", () => {
  const target = els.applySuggestedFilterBtn.dataset.target;
  if (!target || !els.studyFilterSelect || els.studyFilterSelect.value === target) return;
  els.studyFilterSelect.value = target;
  state.mapSelectedCode = "";
  state.mapQuizCode = "";
  state.mapDrill = null;
  renderItems();
});
els.resetUiPrefsBtn?.addEventListener("click", resetUiPreferences);
els.itemSearch.addEventListener("input", renderItems);
els.zoomOutBtn?.addEventListener("click", () => changeMapZoom(-0.8, state.mapSelectedCode || state.cityCode || state.provinceCode));
els.zoomInBtn?.addEventListener("click", () => changeMapZoom(0.8, state.mapSelectedCode || state.cityCode || state.provinceCode));
els.resetMapBtn?.addEventListener("click", resetMapView);
els.checkBtn.addEventListener("click", checkAnswers);
els.revealBtn.addEventListener("click", revealAnswers);
els.clearBtn.addEventListener("click", () => {
  els.answerInput.value = "";
  els.resultBox.innerHTML = "";
});
els.answerInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    checkAnswers();
  }
});
els.copyListBtn.addEventListener("click", copyCurrentList);
els.drawCardBtn.addEventListener("click", drawCard);
els.quickQuizBtn?.addEventListener("click", () => startQuiz("quick"));
els.weakQuizBtn?.addEventListener("click", () => startQuiz("weak"));
els.streakQuizBtn?.addEventListener("click", () => startQuiz("streak"));
els.conquestQuizBtn?.addEventListener("click", () => startQuiz("conquest"));
els.quizCheckBtn?.addEventListener("click", checkQuizAnswer);
els.quizNextBtn?.addEventListener("click", nextQuizQuestion);
els.quizEndBtn?.addEventListener("click", finishQuiz);
els.startPlanBtn?.addEventListener("click", startStudyPlan);
els.copyPlanBtn?.addEventListener("click", copyStudyPlan);
els.startReviewBtn?.addEventListener("click", startReviewQueue);
els.copyReviewBtn?.addEventListener("click", copyReviewQueue);
els.reviewQueue?.addEventListener("click", (event) => {
  const row = event.target.closest(".review-jump[data-review-code]");
  if (!row) return;
  focusReviewItemOnMap(row.dataset.reviewCode);
});
els.weakList?.addEventListener("click", (event) => {
  const row = event.target.closest(".weak-jump[data-weak-code]");
  if (!row) return;
  focusReviewItemOnMap(row.dataset.weakCode);
});
els.copyShortcutsBtn?.addEventListener("click", copyShortcutGuide);
els.copyWeakBtn?.addEventListener("click", copyWeakList);
els.quizAnswerInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (state.quiz?.answered) nextQuizQuestion();
    else checkQuizAnswer();
  }
});
els.exportRecordsBtn?.addEventListener("click", copyStudyRecords);
els.clearRecordsBtn?.addEventListener("click", () => {
  if (typeof confirm === "function" && !confirm("清空全部练习记录、排行和错题统计？")) return;
  state.study = freshStudy();
  saveStudy();
  renderItems();
  els.quizFeedback.textContent = "练习记录已清空。";
});
els.cruiseMapBtn?.addEventListener("click", cruiseMapUnit);
els.drillMapBtn?.addEventListener("click", startMapDrill);
els.drawMapBtn?.addEventListener("click", drawMapQuiz);
els.checkMapBtn?.addEventListener("click", checkMapAnswer);
els.rememberMapBtn?.addEventListener("click", rememberMapUnit);
els.weakMapBtn?.addEventListener("click", markMapUnitWeak);
els.skipMapBtn?.addEventListener("click", skipMapDrillItem);
els.revealMapBtn?.addEventListener("click", revealMapAnswer);
els.mapAnswerInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    checkMapAnswer();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const tagName = event.target?.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || event.target?.isContentEditable) return;
  const focusCode = state.mapSelectedCode || state.cityCode || state.provinceCode;
  const key = String(event.key || "").toLowerCase();
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    changeMapZoom(0.8, focusCode);
  } else if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    changeMapZoom(-0.8, focusCode);
  } else if (event.key === "0") {
    event.preventDefault();
    resetMapView();
  } else if (key === "c") {
    event.preventDefault();
    cruiseMapUnit();
  } else if (key === "d") {
    event.preventDefault();
    startMapDrill();
  } else if (key === "p" && event.shiftKey) {
    event.preventDefault();
    copyStudyPlan();
  } else if (key === "p") {
    event.preventDefault();
    startStudyPlan();
  } else if (key === "l" && event.shiftKey) {
    event.preventDefault();
    copyCurrentList();
  } else if (key === "r" && event.shiftKey) {
    event.preventDefault();
    copyStudyRecords();
  } else if (key === "k" && event.shiftKey) {
    event.preventDefault();
    copyShortcutGuide();
  } else if (key === "v" && event.shiftKey) {
    event.preventDefault();
    copyReviewQueue();
  } else if (key === "v") {
    event.preventDefault();
    startReviewQueue();
  } else if (key === "q") {
    event.preventDefault();
    startQuiz("quick");
  } else if (key === "e") {
    event.preventDefault();
    startQuiz("weak");
  } else if (key === "t") {
    event.preventDefault();
    startQuiz("streak");
  } else if (key === "g") {
    event.preventDefault();
    startQuiz("conquest");
  } else if (key === "n") {
    event.preventDefault();
    nextQuizQuestion();
  } else if (key === "f") {
    event.preventDefault();
    finishQuiz();
  } else if (key === "m") {
    event.preventDefault();
    rememberMapUnit();
  } else if (key === "w" && event.shiftKey) {
    event.preventDefault();
    copyWeakList();
  } else if (key === "w") {
    event.preventDefault();
    markMapUnitWeak();
  } else if (key === "s") {
    event.preventDefault();
    skipMapDrillItem();
  } else if (key === "a") {
    event.preventDefault();
    revealMapAnswer();
  }
});
els.resetProgressBtn.addEventListener("click", () => {
  if (typeof confirm === "function" && !confirm("重置当前范围的练习进度？")) return;
  delete state.progress[progressKey()];
  saveProgress();
  updateProgressUI();
  els.resultBox.innerHTML = "本页进度已重置。";
});

renderMap();
renderProvinces();
renderItems();
