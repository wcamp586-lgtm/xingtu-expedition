const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadAdminData() {
  const code = fs.readFileSync(path.join(root, "src", "data", "admin-data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.ADMIN_DATA;
}

function loadChinaMap() {
  const code = fs.readFileSync(path.join(root, "src", "data", "china-map.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window;
}

const expectedVersion = packageJson.version;
const expectedName = packageJson.build.productName;
const indexHtml = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
const mainJs = fs.readFileSync(path.join(root, "src", "main.js"), "utf8");
const rendererJs = fs.readFileSync(path.join(root, "src", "renderer.js"), "utf8");
const stylesCss = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");
const data = loadAdminData();
const maps = loadChinaMap();
const chinaMap = maps.CHINA_MAP;
const usaMap = maps.USA_MAP;
const usData = data.countries?.US;

const visibleCities = data.cities.filter((item) => !item.synthetic && !item.isDirectCountyGroup);
const cityByCode = new Map(data.cities.map((item) => [item.code, item]));
const provinceByCode = new Map(data.provinces.map((item) => [item.code, item]));

assert(indexHtml.includes(`${expectedVersion} · 中美地图版免安装版`), "index.html version label is out of sync");
assert(indexHtml.includes(expectedName), "index.html product name is out of sync");
assert(mainJs.includes("app.getVersion()"), "main window title should use package version");
assert(data.version === expectedVersion, "generated data version is out of sync");
assert(chinaMap.version === expectedVersion, "generated map version is out of sync");
assert(usaMap.version === expectedVersion, "generated USA map version is out of sync");
assert(mainJs.includes("new Tray"), "main process should create a system tray icon");
assert(mainJs.includes('label: "退出"'), "tray menu should include explicit exit action");
assert(mainJs.includes("event.preventDefault()"), "window close should be intercepted for tray background mode");
assert(mainJs.includes("mainWindow.hide()"), "window close should hide to tray instead of quitting");
assert(mainJs.includes("isQuitting = true"), "tray exit should set a real quit flag");
assert(mainJs.includes("Menu.setApplicationMenu(buildAppMenu())"), "native menu should be enabled");
assert(mainJs.includes("关于星图远征"), "about menu should identify 星图远征");
assert(mainJs.includes("重生归来"), "about dialog should include the requested dramatic copy");
assert(indexHtml.includes("./data/china-map.js"), "index.html should load offline map data");
assert(indexHtml.includes("countrySelect") && indexHtml.includes("美国 / United States"), "index.html should expose China/US country switching");
assert(indexHtml.includes("nameModeSelect"), "index.html should expose bilingual place-name display modes");
assert(indexHtml.includes("studyFilterSelect"), "index.html should expose smart study filters");
assert(indexHtml.includes("studyFilterStats"), "index.html should expose smart study filter counts");
assert(indexHtml.includes("applySuggestedFilterBtn"), "index.html should expose one-click suggested study filter");
assert(indexHtml.includes("resetUiPrefsBtn"), "index.html should expose UI preference reset");
assert(indexHtml.includes("copyWeakBtn"), "index.html should expose one-click weak-point copy");
assert(indexHtml.includes("planBrief") && indexHtml.includes("startPlanBtn") && indexHtml.includes("copyPlanBtn"), "index.html should expose the study plan panel");
assert(indexHtml.includes("reviewQueue") && indexHtml.includes("startReviewBtn") && indexHtml.includes("copyReviewBtn"), "index.html should expose the review queue panel");
assert(indexHtml.includes("看图抽测"), "index.html should expose map quiz");
assert(indexHtml.includes("resetMapBtn"), "index.html should expose map reset control");
assert(indexHtml.includes("cruiseMapBtn"), "index.html should expose map cruise control");
assert(indexHtml.includes("drillMapBtn"), "index.html should expose map drill control");
assert(indexHtml.includes("rememberMapBtn"), "index.html should expose map memory control");
assert(indexHtml.includes("weakMapBtn"), "index.html should expose map weak-point control");
assert(indexHtml.includes("skipMapBtn"), "index.html should expose map drill skip control");
assert(indexHtml.includes("mapDrillStatus"), "index.html should expose map drill status");
assert(indexHtml.includes("快捷键：C") && indexHtml.includes("快捷键：D") && indexHtml.includes("快捷键：S") && indexHtml.includes("快捷键：A"), "map controls should expose shortcut tooltips");
assert(indexHtml.includes("快捷键：P"), "study plan should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Shift+P"), "copy plan should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Shift+W"), "copy weak points should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Shift+L"), "copy current list should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Shift+R"), "export records should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Shift+K") && indexHtml.includes("copyShortcutsBtn"), "copy shortcuts should expose a keyboard shortcut tooltip");
assert(indexHtml.includes("Q/E/T/G") && indexHtml.includes("快捷键：Q") && indexHtml.includes("快捷键：G"), "quiz modes should expose direct keyboard shortcuts");
assert(indexHtml.includes("<kbd>V</kbd>") && indexHtml.includes("快捷键：V") && indexHtml.includes("Shift+V"), "review queue should expose direct keyboard shortcuts");
assert(indexHtml.includes("Enter") && indexHtml.includes("作答/续题"), "quiz answer flow should expose the Enter shortcut");
assert(indexHtml.includes("N/F") && indexHtml.includes("快捷键：N") && indexHtml.includes("快捷键：F"), "quiz question controls should expose next and finish shortcuts");
assert(indexHtml.includes("shortcut-strip") && indexHtml.includes("训练快捷键"), "index.html should show a shortcut reminder strip");
assert(indexHtml.includes("训练中心"), "index.html should expose richer practice center");
assert(indexHtml.includes("速记十题"), "index.html should expose quick quiz mode");
assert(rendererJs.includes("formatStudyExport"), "renderer should build richer study exports");
assert(rendererJs.includes("星图远征清单") && rendererJs.includes("训练过滤："), "renderer should copy study lists with context headers");
assert(rendererJs.includes("formatWeakExport") && rendererJs.includes("\u661f\u56fe\u8fdc\u5f81\u8584\u5f31\u70b9\u6e05\u5355"), "renderer should copy focused weak-point lists");
assert(rendererJs.includes("buildStudyPlan") && rendererJs.includes("formatStudyPlanExport") && rendererJs.includes("\u661f\u56fe\u8fdc\u5f81\u4eca\u65e5\u8ba1\u5212"), "renderer should build and copy smart study plans");
assert(rendererJs.includes("startStudyPlan") && rendererJs.includes("studyFilterLabel(plan.targetFilter)"), "renderer should connect study plans to filters and quiz modes");
assert(rendererJs.includes("buildReviewQueue") && rendererJs.includes("formatReviewQueueExport") && rendererJs.includes("\u661f\u56fe\u8fdc\u5f81\u590d\u76d8\u961f\u5217"), "renderer should build and copy review queues");
assert(rendererJs.includes("startReviewQueue") && rendererJs.includes('startQuiz("review")'), "renderer should start review queue practice");
assert(rendererJs.includes("focusReviewItemOnMap") && rendererJs.includes("review-jump") && rendererJs.includes("data-review-code"), "renderer should let review queue rows locate items on the map");
assert(rendererJs.includes("weak-jump") && rendererJs.includes("data-weak-code") && rendererJs.includes("dataset.weakCode"), "renderer should let weak-point rows locate items on the map");
assert(rendererJs.includes("reviewQueueTag") && rendererJs.includes("review-tag") && rendererJs.includes("新项目") && rendererJs.includes("薄弱") && rendererJs.includes("较稳"), "renderer should label review queue rows by learning state");
assert(rendererJs.includes("reviewQueueTooltip") && rendererJs.includes("上次") && rendererJs.includes("reviewAdvice(item)") && rendererJs.includes("title=\"${escapeHtml(tooltip)}\""), "renderer should add rich hover hints to review queue rows");
assert(rendererJs.includes("reviewAgeLabel") && rendererJs.includes("30天+") && rendererJs.includes("0% · 未练"), "renderer should show last-practiced age in review queue rows");
assert(rendererJs.includes("reviewAgeClass") && rendererJs.includes('class="review-age ${reviewAgeClass(stat)}"'), "renderer should classify review queue age labels");
assert(rendererJs.includes('review-jump${active ? " active" : ""}') && rendererJs.includes('aria-pressed="${active ? "true" : "false"}"'), "renderer should mark the active review queue row");
assert(rendererJs.includes("reviewStatusLabel") && rendererJs.includes("mapReviewStatus") && rendererJs.includes("已记住") && rendererJs.includes("待加强"), "renderer should label review queue rows with action status");
assert(rendererJs.includes("queue.unshift") && rendererJs.includes("当前复盘"), "renderer should keep the active review item pinned when scope changes");
assert(rendererJs.includes("mapReviewCode") && rendererJs.includes("selectedMapPracticeTarget") && rendererJs.includes("learnableItemsByCode.get(state.mapReviewCode)"), "renderer should keep review row actions attached to the original review item");
assert(rendererJs.includes("reviewActionPrompt") && rendererJs.includes("当前操作会记录") && rendererJs.includes("<kbd>M</kbd>"), "renderer should show next-step actions after review map location");
assert(rendererJs.includes("reviewStatSummary") && rendererJs.includes("复盘数据") && rendererJs.includes("正确率"), "renderer should show study stats in review location prompts");
assert(rendererJs.includes("reviewAdvice") && rendererJs.includes("复盘建议") && rendererJs.includes("先看图默写") && rendererJs.includes("地图征服"), "renderer should show next-step advice in review location prompts");
assert(rendererJs.includes("const reviewTarget = learnableItemsByCode.get(state.mapReviewCode)") && rendererJs.includes("复盘答案"), "renderer should reveal the original review item after review map location");
assert(rendererJs.includes("reviewTarget ? reviewActionPrompt(reviewTarget, answerHtml) : answerHtml"), "renderer should preserve review action hints after revealing a review answer");
assert(rendererJs.includes("switchCountry"), "renderer should switch between China and USA datasets");
assert(rendererJs.includes("displayName") && rendererJs.includes("nameCn") && rendererJs.includes("nameEn"), "renderer should support bilingual place-name display");
assert(rendererJs.includes("itemMatchesStudyFilter") && rendererJs.includes("studyFilterValue"), "renderer should connect smart study filters to practice data");
assert(rendererJs.includes("studyFilterCounts") && rendererJs.includes("updateStudyFilterStats"), "renderer should show smart study filter counts");
assert(rendererJs.includes("studyFilterSuggestion"), "renderer should show smart next-step study suggestions");
assert(rendererJs.includes("recommendedStudyFilter") && rendererJs.includes("applySuggestedFilterBtn"), "renderer should apply suggested study filters");
assert(rendererJs.includes("loadUiPreferences") && rendererJs.includes("saveUiPreferences"), "renderer should persist UI preferences");
assert(rendererJs.includes("mapZoom: state.mapZoom") && rendererJs.includes("savedUiPrefs.mapZoom"), "renderer should persist map zoom preferences");
assert(rendererJs.includes("resetUiPreferences") && rendererJs.includes("clearUiPreferences"), "renderer should reset UI preferences without clearing study data");
assert(rendererJs.includes("学习记录已保留") && rendererJs.includes("resetUiPrefsFeedbackTimer"), "renderer should confirm UI preference reset without implying study data was cleared");
assert(rendererJs.includes('event.key === "0"'), "renderer should expose keyboard map reset");
assert(rendererJs.includes("cruiseMapUnit"), "renderer should support map cruising");
assert(rendererJs.includes("startMapDrill"), "renderer should support map drill mode");
assert(rendererJs.includes("rememberMapUnit"), "renderer should support marking cruised map units as remembered");
assert(rendererJs.includes("markMapUnitWeak"), "renderer should support marking cruised map units as weak");
assert(rendererJs.includes("skipMapDrillItem"), "renderer should support skipping map drill items");
assert(rendererJs.includes('key === "c"') && rendererJs.includes('key === "d"') && rendererJs.includes('key === "m"') && rendererJs.includes('key === "w"') && rendererJs.includes('key === "s"') && rendererJs.includes('key === "a"'), "renderer should expose keyboard map practice shortcuts");
assert(rendererJs.includes('key === "p"') && rendererJs.includes("startStudyPlan()"), "renderer should expose a keyboard shortcut for the study plan");
assert(rendererJs.includes("copyStudyPlan") && rendererJs.includes("event.shiftKey"), "renderer should expose a Shift+P shortcut for copying the study plan");
assert(rendererJs.includes("copyWeakList") && rendererJs.includes("formatWeakExport") && rendererJs.includes('key === "w" && event.shiftKey'), "renderer should expose a Shift+W shortcut for copying weak points");
assert(rendererJs.includes('key === "l" && event.shiftKey') && rendererJs.includes("copyCurrentList()"), "renderer should expose a Shift+L shortcut for copying the current list");
assert(rendererJs.includes("copyStudyRecords") && rendererJs.includes('key === "r" && event.shiftKey'), "renderer should expose a Shift+R shortcut for exporting records");
assert(rendererJs.includes("formatShortcutGuide") && rendererJs.includes("copyShortcutGuide") && rendererJs.includes('key === "k" && event.shiftKey'), "renderer should expose a Shift+K shortcut for copying shortcut help");
assert(rendererJs.includes('key === "v" && event.shiftKey') && rendererJs.includes("copyReviewQueue()") && rendererJs.includes('key === "v"') && rendererJs.includes("startReviewQueue()"), "renderer should expose V shortcuts for review queue practice");
assert(rendererJs.includes('key === "q"') && rendererJs.includes('startQuiz("quick")') && rendererJs.includes('key === "g"') && rendererJs.includes('startQuiz("conquest")'), "renderer should expose direct quiz mode shortcuts");
assert(rendererJs.includes("V：开始复盘队列") && rendererJs.includes("Shift+V：复制复盘队列"), "shortcut guide should document review queue shortcuts");
assert(rendererJs.includes("Enter：作答，答完后进入下一题"), "shortcut guide should document Enter quiz flow");
assert(rendererJs.includes('key === "n"') && rendererJs.includes("nextQuizQuestion()") && rendererJs.includes('key === "f"') && rendererJs.includes("finishQuiz()"), "renderer should expose next and finish quiz shortcuts");
assert(stylesCss.includes("@media (max-width: 720px)"), "styles should keep map answer controls responsive");
assert(stylesCss.includes(".map-answer-row input") && stylesCss.includes("grid-column: 1 / -1"), "map answer input should span on narrow screens");
assert(stylesCss.includes("repeat(4, minmax(0, 1fr))"), "map answer controls should fit four action buttons on narrow screens");
assert(stylesCss.includes(".map-drill-status"), "styles should present map drill status");
assert(stylesCss.includes(".plan-box") && stylesCss.includes(".plan-actions"), "styles should present the study plan panel");
assert(stylesCss.includes(".review-queue") && stylesCss.includes(".review-actions"), "styles should present the review queue panel");
assert(stylesCss.includes(".review-jump") && stylesCss.includes("focus-visible"), "styles should present clickable review queue rows");
assert(stylesCss.includes(".weak-jump") && stylesCss.includes("border-left-color: var(--clay)"), "styles should present clickable weak-point rows");
assert(stylesCss.includes(".review-tag") && stylesCss.includes(".review-tag.is-weak") && stylesCss.includes(".review-tag.is-steady"), "styles should present review queue learning-state tags");
assert(stylesCss.includes(".review-age.is-fresh") && stylesCss.includes(".review-age.is-stale") && stylesCss.includes(".review-age.is-new"), "styles should distinguish review queue age labels");
assert(stylesCss.includes(".review-jump.active") && stylesCss.includes("border-left: 3px solid var(--accent)"), "styles should highlight the active review queue row");
assert(stylesCss.includes(".review-current") && stylesCss.includes("border-radius: 999px"), "styles should show the active review row badge");
assert(stylesCss.includes(".review-current.status-remembered") && stylesCss.includes(".review-current.status-weak"), "styles should distinguish remembered and weak review row badges");
assert(stylesCss.includes(".review-action-hint") && stylesCss.includes(".review-action-hint kbd"), "styles should present review location action hints");
assert(stylesCss.includes(".shortcut-strip") && stylesCss.includes(".shortcut-strip kbd"), "styles should present the shortcut reminder strip");
assert(stylesCss.includes(".shortcut-copy"), "styles should present the shortcut copy button");
assert(indexHtml.includes("错题复习"), "index.html should expose weak-item review mode");
assert(indexHtml.includes("排行榜"), "index.html should expose leaderboard records");
assert(indexHtml.includes("四色征服"), "index.html should expose map conquest mode");
assert(indexHtml.includes("今日任务"), "index.html should expose daily missions");
assert(indexHtml.includes("徽章"), "index.html should expose badges");
assert(fs.existsSync(path.join(root, "scripts", "portable.js")), "portable build script should exist");

assert(data.provinces.length === 34, "province count should be 34");
assert(data.countries?.CN?.provinces.length === 34, "China dataset should remain available");
assert(usData?.provinces.length === 51, "US dataset should include 50 states plus DC");
assert(usData?.cities.length >= 3000, "US dataset should include county-equivalent units");
assert(usData?.areas.length >= 30000, "US dataset should include places/cities");
assert(usData.provinces.some((item) => item.name.includes("California") && item.name.includes("加利福尼亚州")), "US state names should include Chinese and English");
assert(usData.cities.some((item) => item.name.includes("Los Angeles") && item.name.includes("县")), "US county names should include Chinese type and English");
assert(visibleCities.length === 333, "visible prefecture-level count should be 333");
assert(data.areas.length === 3285, "county-level count should be 3285");
assert(chinaMap.scopes.province.units.length === 34, "province map should cover 34 province-level units");
assert(Object.keys(chinaMap.scopes.city).length === 34, "city maps should be available for 34 province-level scopes");
assert(chinaMap.scopes.city["440000"].units.some((item) => item.code === "440300"), "Guangdong city map should include Shenzhen");
assert(chinaMap.scopes.areaCity["440300"].units.some((item) => item.code === "440305"), "Shenzhen county map should include Nanshan");
assert(chinaMap.scopes.areaProvince["650000"].units.length >= 100, "Xinjiang county map should include county-level boundaries");
assert(Object.values(chinaMap.scopes.areaCity).reduce((sum, scope) => sum + scope.units.length, 0) >= 2800, "county maps should include real boundaries for ordinary county-level units");
assert(chinaMap.coverage.countyBoundaryUnits >= 2800, "map coverage should track county boundary units");
assert(chinaMap.coverage.countyListUnits === data.areas.length, "map coverage should track full county list size");
assert(chinaMap.projection === "upright-equirectangular", "map should use the upright projection");
assert(chinaMap.coloring.name === "four-color-greedy", "map should include four-color metadata");
assert(chinaMap.scopes.city["440000"].units.every((item) => Number.isInteger(item.color) && item.color >= 0 && item.color <= 3), "map units should carry four-color channels");
assert(chinaMap.source.url.includes("geo.datav.aliyun.com"), "map source should be tracked");
assert(usaMap.scopes.province.units.length === 51, "USA map should include 50 states plus DC");
assert(Object.keys(usaMap.scopes.city).length === 51, "USA map should include county scopes for each state/DC");
assert(usaMap.scopes.city["US-CA"].units.some((item) => item.code === "US06037"), "California county map should include Los Angeles County");
assert(usaMap.coverage.countyBoundaryUnits >= 3000, "USA map should include county-equivalent boundaries");

assert(provinceByCode.get("440000")?.shortName === "粤", "Guangdong short name should be 粤");
assert(cityByCode.get("440100")?.plate === "粤A", "Guangzhou should map to 粤A");
assert(cityByCode.get("440300")?.plate === "粤B", "Shenzhen should map to 粤B");
assert(cityByCode.get("130100")?.plate === "冀A", "Shijiazhuang should map to 冀A");
assert(cityByCode.get("420600")?.plate === "鄂F", "Xiangyang should map to 鄂F");
assert(cityByCode.get("460400")?.plate === "琼F", "Danzhou should map to 琼F");

const directMunicipalities = data.cities.filter((item) => item.synthetic);
assert(directMunicipalities.length === 4, "direct municipalities should have four synthetic city entries");

assert(fs.existsSync(path.join(root, "build", "icon.ico")), "Windows icon should be generated");
assert(fs.existsSync(path.join(root, "build", "icon.png")), "Preview icon should be generated");

console.log(
  `Tests passed: ${data.provinces.length} provinces, ${visibleCities.length} prefecture-level units, ${data.areas.length} county-level units, version ${expectedVersion}.`
);
