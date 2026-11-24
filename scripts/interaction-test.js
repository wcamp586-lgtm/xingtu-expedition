const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function click(window, element) {
  element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

function input(window, element, value) {
  element.value = value;
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function wheel(window, element, deltaY) {
  const event = new window.Event("wheel", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "deltaY", { value: deltaY });
  element.dispatchEvent(event);
}

const html = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
const renderer = fs.readFileSync(path.join(root, "src", "renderer.js"), "utf8");
const dom = new JSDOM(html, {
  url: "https://lutuji.local/index.html",
  runScripts: "outside-only",
  pretendToBeVisual: true
});

const { window } = dom;
window.ADMIN_DATA = loadAdminData();
const maps = loadChinaMap();
window.CHINA_MAP = maps.CHINA_MAP;
window.USA_MAP = maps.USA_MAP;
window.ADMIN_MAPS = maps.ADMIN_MAPS;
window.confirm = () => true;
window.navigator.clipboard = {
  value: "",
  async writeText(value) {
    this.value = value;
  }
};

window.eval(renderer);

const document = window.document;
assert(document.title === packageJson.build.productName, "document title should use product name");
assert(document.querySelector(".brand h1").textContent === packageJson.build.productName, "brand should render");
assert(document.getElementById("cityCount").textContent === "333", "city metric should exclude synthetic/direct county groups");
assert(document.querySelectorAll(".item-row").length === 21, "default Guangdong city list should render 21 rows");
assert(document.getElementById("studyFilterStats").textContent.includes("全部 21"), "study filter stats should show the default scope count");
assert(document.getElementById("studyFilterStats").textContent.includes("建议"), "study filter stats should include a next-step suggestion");
assert(document.getElementById("applySuggestedFilterBtn").disabled === false, "suggested filter action should be available when new items exist");
assert(document.querySelector(".province-button[data-code='110000'] small").textContent.includes("直辖"), "municipality count should show direct-governed label");
document.getElementById("countrySelect").value = "US";
document.getElementById("countrySelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("provinceCount").textContent === "51", "US mode should show states plus DC");
assert(Number(document.getElementById("cityCount").textContent) >= 3000, "US mode should show county-equivalent units");
assert(document.querySelector(".province-button[data-code='US-CA']"), "US mode should include California");
assert(document.querySelector(".province-button[data-code='US-CA']").textContent.includes("California"), "US state labels should include English names");
assert(document.querySelector(".map-unit[data-code='US06037']"), "US California county map should include Los Angeles County");
document.getElementById("levelSelect").value = "area";
document.getElementById("levelSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
document.getElementById("citySelect").value = "US06037";
document.getElementById("citySelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("itemList").textContent.includes("Los Angeles"), "US county area mode should list places with English names");
assert(document.getElementById("mapTitle").textContent.includes("Los Angeles"), "US selected county should drive the map title");
document.getElementById("nameModeSelect").value = "en";
document.getElementById("nameModeSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelector(".province-button[data-code='US-CA']").textContent.includes("California"), "English display mode should keep US state names readable");
let savedPrefs = JSON.parse(window.localStorage.getItem("xingtu-expedition-ui-preferences-v1"));
assert(savedPrefs.countryCode === "US" && savedPrefs.nameMode === "en", "UI preferences should persist country and name mode");
input(window, document.getElementById("itemSearch"), "los angeles");
assert(document.getElementById("itemList").textContent.includes("Los Angeles"), "English search should find US place names");
input(window, document.getElementById("itemSearch"), "");
click(window, document.getElementById("quickQuizBtn"));
const usQuickCode = document.getElementById("quizCard").dataset.code;
const usQuickItem = window.ADMIN_DATA.countries.US.areas.find((item) => item.code === usQuickCode);
document.getElementById("quizAnswerInput").value = (usQuickItem.nameEn || usQuickItem.name || "").toLowerCase();
click(window, document.getElementById("quizCheckBtn"));
assert(document.querySelector("#quizFeedback .ok"), "US quick quiz should accept lowercase English answers");
click(window, document.getElementById("quizEndBtn"));
document.getElementById("countrySelect").value = "CN";
document.getElementById("countrySelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelectorAll(".item-row").length === 21, "switching back to China should restore Guangdong city list");
assert(document.getElementById("mapTitle").textContent.includes("广东省地级"), "default map should follow city level and selected province");
assert(document.querySelector(".map-unit[data-code='440300']"), "Guangdong city map should include Shenzhen");
assert([...document.querySelectorAll(".map-unit")].some((unit) => /color-[0-3]/.test(unit.getAttribute("class"))), "map units should render four-color classes");

wheel(window, document.getElementById("provinceMap"), 500);
assert(document.getElementById("levelSelect").value === "province", "wheel zoom out should switch to province map");
assert(document.getElementById("mapZoomLabel").textContent.includes("省级"), "zoom label should sync to province level");
savedPrefs = JSON.parse(window.localStorage.getItem("xingtu-expedition-ui-preferences-v1"));
assert(savedPrefs.level === "province" && savedPrefs.mapZoom < 1.2, "UI preferences should persist zoomed-out province map state");
wheel(window, document.querySelector(".map-unit[data-code='440000']"), -500);
assert(document.getElementById("levelSelect").value === "city", "wheel zoom in on province should switch to city map");
assert(document.querySelector(".map-unit[data-code='440300']"), "wheel zoom in should restore Guangdong city map");
click(window, document.getElementById("zoomInBtn"));
assert(document.getElementById("levelSelect").value === "area", "zoom in button should switch to area level");
click(window, document.getElementById("resetMapBtn"));
assert(document.getElementById("levelSelect").value === "city", "reset map should return to city level");
assert(document.getElementById("mapHint").textContent.includes("复位"), "reset map should explain the reset state");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "-", bubbles: true }));
assert(document.getElementById("levelSelect").value === "province", "keyboard zoom out should switch to province level");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "=", bubbles: true }));
assert(document.getElementById("levelSelect").value === "city", "keyboard zoom in should switch to city level");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "+", bubbles: true }));
assert(document.getElementById("levelSelect").value === "area", "keyboard zoom in should switch to area level");
document.getElementById("mapResult").textContent = "temporary";
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "0", bubbles: true }));
assert(document.getElementById("levelSelect").value === "city", "keyboard reset should return to city level");
assert(document.getElementById("mapResult").textContent === "", "map reset should clear stale map result");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "c", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("巡航定位"), "keyboard cruise should select a map unit");
const attemptsBeforeKeyRemember = document.getElementById("studyAttempts").textContent;
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "m", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("已记住"), "keyboard remember should mark the selected map unit");
assert(document.getElementById("studyAttempts").textContent !== attemptsBeforeKeyRemember, "keyboard remember should create a study record");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "c", bubbles: true }));
const attemptsBeforeKeyWeak = document.getElementById("studyAttempts").textContent;
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "w", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("薄弱点"), "keyboard weak should mark the selected map unit");
assert(document.getElementById("studyAttempts").textContent !== attemptsBeforeKeyWeak, "keyboard weak should create a study record");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("当前轮廓"), "keyboard answer should reveal the selected map unit");
const resultBeforeInputShortcut = document.getElementById("mapResult").textContent;
document.getElementById("mapAnswerInput").dispatchEvent(new window.KeyboardEvent("keydown", { key: "c", bubbles: true }));
assert(document.getElementById("mapResult").textContent === resultBeforeInputShortcut, "keyboard shortcuts should not fire while typing in inputs");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "d", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("五连练"), "keyboard drill should start map drill mode");
assert(document.getElementById("mapDrillStatus").textContent.includes("进行中"), "map drill should show running status");
const attemptsBeforeDrill = Number(document.getElementById("studyAttempts").textContent);
["m", "w", "s", "m", "w"].forEach((key) => {
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }));
});
assert(document.getElementById("mapDrillStatus").textContent.includes("完成"), "map drill should finish after five decisions");
assert(document.getElementById("mapDrillStatus").textContent.includes("跳过 1"), "map drill should count skipped items");
assert(Number(document.getElementById("studyAttempts").textContent) >= attemptsBeforeDrill + 4, "map drill should record non-skipped map decisions");

click(window, document.querySelector(".map-unit[data-code='440300']"));
assert(document.getElementById("mapHint").textContent.includes("深圳市"), "city map click should describe clicked city");

click(window, document.getElementById("cruiseMapBtn"));
const cruisedUnit = document.querySelector(".map-unit.active");
assert(cruisedUnit, "map cruise should highlight one active unit");
assert(!document.querySelector(".map-unit.quiz"), "map cruise should not mark the unit as a quiz target");
assert(document.getElementById("mapResult").textContent.includes("巡航定位"), "map cruise should identify the selected unit");
const cruisedName = window.ADMIN_DATA.cities.find((item) => item.code === cruisedUnit.dataset.code)?.name;
const attemptsBeforeRemember = document.getElementById("studyAttempts").textContent;
click(window, document.getElementById("rememberMapBtn"));
assert(document.getElementById("mapResult").textContent.includes("已记住"), "remember map should confirm the selected unit");
assert(document.getElementById("studyAttempts").textContent !== attemptsBeforeRemember, "remember map should create a study record");
const attemptsAfterRemember = document.getElementById("studyAttempts").textContent;
click(window, document.getElementById("rememberMapBtn"));
assert(document.getElementById("studyAttempts").textContent === attemptsAfterRemember, "remember map should not duplicate the same selected unit");
click(window, document.getElementById("weakMapBtn"));
assert(document.getElementById("mapResult").textContent.includes("薄弱点"), "weak map should confirm the selected unit");
assert(document.getElementById("studyAttempts").textContent !== attemptsAfterRemember, "weak map should create a study record");
assert(document.getElementById("weakList").textContent.includes(cruisedName), "weak map should add the unit to weak review");
const attemptsAfterWeak = document.getElementById("studyAttempts").textContent;
click(window, document.getElementById("weakMapBtn"));
assert(document.getElementById("studyAttempts").textContent === attemptsAfterWeak, "weak map should not duplicate the same selected unit");
const firstWeakRow = document.querySelector(".weak-jump[data-weak-code]");
assert(firstWeakRow, "weak review should render clickable map-locate rows");
const firstWeakCode = firstWeakRow.dataset.weakCode;
click(window, firstWeakRow);
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u5b9a\u4f4d"), "clicking a weak row should locate it on the map");
assert(document.querySelector(`.review-jump.active[data-review-code="${firstWeakCode}"]`), "clicking a weak row should pin it in the review queue");

const fullCityRowCount = document.querySelectorAll(".item-row").length;
document.getElementById("studyFilterSelect").value = "weak";
document.getElementById("studyFilterSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("itemList").textContent.includes(cruisedUnit.dataset.code), "weak study filter should keep the marked weak map unit visible");
assert(document.querySelectorAll(".item-row").length < fullCityRowCount, "weak study filter should narrow the current list");
assert(document.getElementById("studyFilterStats").textContent.includes("薄弱"), "study filter stats should update after choosing weak mode");
assert(document.querySelector("#studyFilterSelect option[value='weak']").textContent.match(/\d+/), "study filter options should include live counts");
document.getElementById("studyFilterSelect").value = "all";
document.getElementById("studyFilterSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
click(window, document.getElementById("applySuggestedFilterBtn"));
assert(document.getElementById("studyFilterSelect").value === "weak", "suggested filter action should switch to the recommended weak filter");
savedPrefs = JSON.parse(window.localStorage.getItem("xingtu-expedition-ui-preferences-v1"));
assert(savedPrefs.studyFilter === "weak", "UI preferences should persist the smart study filter");
document.getElementById("studyFilterSelect").value = "new";
document.getElementById("studyFilterSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelectorAll(".item-row").length > 0 && document.querySelectorAll(".item-row").length < fullCityRowCount, "new study filter should hide already practiced items");
click(window, document.getElementById("resetUiPrefsBtn"));
assert(document.getElementById("countrySelect").value === "CN", "reset UI preferences should restore China mode");
assert(document.getElementById("levelSelect").value === "city", "reset UI preferences should restore city level");
assert(document.getElementById("studyFilterSelect").value === "all", "reset UI preferences should restore all study filter");
assert(document.getElementById("mapZoomLabel").textContent.includes("地级"), "reset UI preferences should restore city zoom label");
assert(document.getElementById("resetUiPrefsBtn").textContent === "已重置", "reset UI preferences should show a short confirmation");
assert(document.getElementById("studyFilterStats").textContent.includes("学习记录已保留"), "reset UI preferences should clarify study records are kept");
savedPrefs = JSON.parse(window.localStorage.getItem("xingtu-expedition-ui-preferences-v1"));
assert(savedPrefs.countryCode === "CN" && savedPrefs.studyFilter === "all", "reset UI preferences should save the clean default state");
document.getElementById("studyFilterSelect").value = "all";
document.getElementById("studyFilterSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelectorAll(".item-row").length === fullCityRowCount, "all study filter should restore the current list");

click(window, document.getElementById("drawMapBtn"));
const quizUnit = document.querySelector(".map-unit.quiz");
assert(quizUnit, "map quiz should highlight one unit");
document.getElementById("mapAnswerInput").value = window.ADMIN_DATA.cities.find((item) => item.code === quizUnit.dataset.code).name;
click(window, document.getElementById("checkMapBtn"));
assert(document.getElementById("mapResult").textContent.includes("正确"), "map quiz should accept the highlighted city name");

document.getElementById("levelSelect").value = "area";
document.getElementById("levelSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("mapTitle").textContent.includes("广东省地级导览"), "area level without city should show prefecture-level guide map");
assert(document.querySelector(".map-unit[data-code='440300']"), "area guide map should include Shenzhen city boundary");
click(window, document.querySelector(".map-unit[data-code='440300']"));
assert(document.getElementById("citySelect").value === "440300", "clicking a city in area guide map should select that city");
assert(document.getElementById("mapTitle").textContent.includes("深圳市区县"), "city selection should drill into county map");
document.getElementById("citySelect").value = "440300";
document.getElementById("citySelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("mapTitle").textContent.includes("深圳市区县"), "area level map should follow selected city");
assert(document.querySelector(".map-unit[data-code='440305']"), "Shenzhen county map should include Nanshan");
click(window, document.getElementById("drawMapBtn"));
const areaQuizUnit = document.querySelector(".map-unit.quiz");
assert(areaQuizUnit, "area map quiz should highlight a county-level unit");
document.getElementById("mapAnswerInput").value = window.ADMIN_DATA.areas.find((item) => item.code === areaQuizUnit.dataset.code).name;
click(window, document.getElementById("checkMapBtn"));
assert(document.getElementById("mapResult").textContent.includes("正确"), "map quiz should accept the highlighted county name");
assert(document.getElementById("studyAttempts").textContent !== "0", "map quiz should create study records");

click(window, document.getElementById("quickQuizBtn"));
const quickCode = document.getElementById("quizCard").dataset.code;
const quickItem = window.ADMIN_DATA.areas.find((item) => item.code === quickCode);
document.getElementById("quizAnswerInput").value = quickItem.name;
click(window, document.getElementById("quizCheckBtn"));
assert(document.getElementById("quizFeedback").textContent.includes("正确"), "quick quiz should accept the current answer");
click(window, document.getElementById("quizEndBtn"));
assert(document.getElementById("recordFeed").textContent.includes("速记十题"), "quick quiz should add a recent record");
assert(document.getElementById("leaderboardList").textContent.includes("速记十题"), "quick quiz should update leaderboard");

click(window, document.getElementById("weakQuizBtn"));
assert(document.getElementById("quizModeLabel").textContent.includes("错题复习"), "weak review mode should start");
click(window, document.getElementById("quizEndBtn"));
click(window, document.getElementById("conquestQuizBtn"));
assert(document.getElementById("quizModeLabel").textContent.includes("四色征服"), "map conquest mode should start");
assert(document.querySelector(".map-unit.quiz"), "map conquest should highlight a map unit");
click(window, document.getElementById("quizEndBtn"));
assert(document.getElementById("missionBrief").textContent.includes("今日"), "daily mission should render");
assert(document.getElementById("badgeList").textContent.includes("首战记录"), "badge list should render");
assert(document.getElementById("planBrief").textContent.length > 0, "study plan should render");
assert(document.getElementById("reviewQueue").textContent.length > 0, "review queue should render");
assert(document.querySelector(".review-tag"), "review queue should render learning-state tags");
assert(document.getElementById("reviewQueue").textContent.includes("% ·"), "review queue should show last-practiced age with accuracy");
assert(document.querySelector(".review-age"), "review queue should render styled age labels");
const firstReviewRow = document.querySelector(".review-jump[data-review-code]");
assert(firstReviewRow, "review queue should render clickable map-locate rows");
assert(firstReviewRow.getAttribute("title")?.includes("\u4e0a\u6b21") && firstReviewRow.getAttribute("title")?.includes("\u590d\u76d8\u5efa\u8bae"), "review queue row should expose rich hover hints");
const firstReviewCode = firstReviewRow.dataset.reviewCode;
const firstReviewItem = [...window.ADMIN_DATA.provinces, ...window.ADMIN_DATA.cities, ...window.ADMIN_DATA.areas].find((item) => item.code === firstReviewCode);
click(window, firstReviewRow);
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u5b9a\u4f4d"), "clicking a review row should report map location");
const activeReviewRow = document.querySelector(`.review-jump.active[data-review-code="${firstReviewCode}"]`);
assert(activeReviewRow, "clicking a review row should keep that row visually active");
assert(activeReviewRow.getAttribute("aria-pressed") === "true", "active review row should expose pressed state");
assert(activeReviewRow.querySelector(".review-current")?.textContent.includes("\u5f53\u524d"), "active review row should show a current badge");
assert(document.getElementById("reviewQueue").textContent.includes(firstReviewItem.name), "active review item should remain pinned in the queue after map scope changes");
assert(document.getElementById("mapResult").textContent.includes("\u4e0b\u4e00\u6b65") && document.getElementById("mapResult").textContent.includes("M") && document.getElementById("mapResult").textContent.includes("W") && document.getElementById("mapResult").textContent.includes("V"), "clicking a review row should show next-step action hints");
assert(document.getElementById("mapResult").textContent.includes("\u5f53\u524d\u64cd\u4f5c\u4f1a\u8bb0\u5f55"), "review action hints should clarify the target item");
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u6570\u636e") && document.getElementById("mapResult").textContent.includes("\u6b63\u786e\u7387"), "review action hints should show study stats");
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u5efa\u8bae"), "review action hints should show next-step advice");
const activeReviewUnit = document.querySelector(".map-unit.active");
assert(activeReviewUnit, "clicking a review row should highlight a map unit");
assert([firstReviewCode, firstReviewItem.cityCode, firstReviewItem.provinceCode].includes(activeReviewUnit.dataset.code), "review row should highlight the item or its parent map unit");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a", bubbles: true }));
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u7b54\u6848"), "A after review location should reveal a review answer");
assert(document.getElementById("mapResult").textContent.includes(firstReviewItem.name), "A after review location should reveal the original review item");
assert(document.getElementById("mapResult").textContent.includes("\u4e0b\u4e00\u6b65") && document.getElementById("mapResult").textContent.includes("\u5f53\u524d\u64cd\u4f5c\u4f1a\u8bb0\u5f55"), "A after review location should keep review action hints visible");
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u6570\u636e"), "A after review location should keep review stats visible");
assert(document.getElementById("mapResult").textContent.includes("\u590d\u76d8\u5efa\u8bae"), "A after review location should keep review advice visible");
click(window, firstReviewRow);
const attemptsBeforeReviewRemember = document.getElementById("studyAttempts").textContent;
click(window, document.getElementById("rememberMapBtn"));
assert(document.getElementById("mapResult").textContent.includes(firstReviewItem.name), "remembering a located review row should keep the original review item");
assert(document.getElementById("studyAttempts").textContent !== attemptsBeforeReviewRemember, "remembering a located review row should create a study record");
const rememberedReviewRow = document.querySelector(`.review-jump.active[data-review-code="${firstReviewCode}"]`);
assert(rememberedReviewRow?.querySelector(".review-current")?.textContent.includes("\u5df2\u8bb0\u4f4f"), "remembering the active review row should update its badge");
click(window, document.getElementById("startReviewBtn"));
assert(document.getElementById("quizModeLabel").textContent.includes("\u590d\u76d8\u961f\u5217"), "review queue should start a review quiz");
assert(document.querySelector(".shortcut-strip").textContent.includes("Shift+R"), "shortcut strip should show copy/export shortcuts");
assert(document.querySelector(".shortcut-strip").textContent.includes("Q/E/T/G"), "shortcut strip should show quiz mode shortcuts");
assert(document.querySelector(".shortcut-strip").textContent.includes("Shift+V"), "shortcut strip should show review queue shortcuts");
assert(document.querySelector(".shortcut-strip").textContent.includes("Enter"), "shortcut strip should show Enter quiz flow");
assert(document.querySelector(".shortcut-strip").textContent.includes("N/F"), "shortcut strip should show quiz flow shortcuts");
click(window, document.getElementById("copyShortcutsBtn"));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u5feb\u6377\u952e"), "shortcut copy button should copy the shortcut guide");
assert(window.navigator.clipboard.value.includes("Enter"), "shortcut guide should include Enter quiz flow");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "q", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("\u901f\u8bb0\u5341\u9898"), "Q shortcut should start quick quiz");
{
  const activeCode = document.getElementById("quizCard").dataset.code;
  const activeItem = [...window.ADMIN_DATA.provinces, ...window.ADMIN_DATA.cities, ...window.ADMIN_DATA.areas].find((item) => item.code === activeCode);
  document.getElementById("quizAnswerInput").value = activeItem.name;
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "n", bubbles: true }));
  assert(document.getElementById("quizModeLabel").textContent.includes("2/"), "N shortcut should move to the next quiz question after an answer");
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "f", bubbles: true }));
  assert(document.getElementById("quizModeLabel").textContent.includes("\u5df2\u7ed3\u7b97"), "F shortcut should finish the current quiz");
}
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "e", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("\u9519\u9898\u590d\u4e60"), "E shortcut should start weak review");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "t", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("\u8fde\u80dc\u6311\u6218"), "T shortcut should start streak challenge");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "g", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("\u56db\u8272\u5f81\u670d"), "G shortcut should start map conquest");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "p", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("1/"), "P shortcut should start the study plan");
document.getElementById("studyFilterSelect").value = "all";
document.getElementById("studyFilterSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "P", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u4eca\u65e5\u8ba1\u5212"), "Shift+P shortcut should copy the study plan");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "W", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u8584\u5f31\u70b9\u6e05\u5355"), "Shift+W shortcut should copy weak points");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "L", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u6e05\u5355"), "Shift+L shortcut should copy the current list");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "R", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u5b66\u4e60\u8bb0\u5f55"), "Shift+R shortcut should export study records");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "K", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u5feb\u6377\u952e"), "Shift+K shortcut should copy the shortcut guide");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "v", bubbles: true }));
assert(document.getElementById("quizModeLabel").textContent.includes("\u590d\u76d8\u961f\u5217"), "V shortcut should start review queue practice");
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "V", shiftKey: true, bubbles: true }));
assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u590d\u76d8\u961f\u5217"), "Shift+V shortcut should copy the review queue");

document.getElementById("levelSelect").value = "province";
document.getElementById("levelSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelectorAll(".map-unit").length === 34, "province map should render 34 province-level units");
click(window, document.querySelector(".map-unit[data-code='510000']"));
assert(document.getElementById("mapHint").textContent.includes("四川省"), "province map click should describe clicked province");

click(window, document.querySelector(".province-button[data-code='440000']"));
document.getElementById("levelSelect").value = "city";
document.getElementById("levelSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.querySelectorAll(".item-row").length === 21, "returning to Guangdong should restore default city list");

input(window, document.getElementById("itemSearch"), "深圳");
assert(document.querySelectorAll(".item-row").length === 1, "search should filter to one row");
assert(document.getElementById("itemList").textContent.includes("深圳市"), "search result should include Shenzhen");

input(window, document.getElementById("itemSearch"), "");
click(window, document.getElementById("checkBtn"));
assert(document.getElementById("resultBox").textContent.includes("先默写"), "blank answer should not be accepted");
assert(document.getElementById("lastScore").textContent === "尚未检测", "blank answer should not change progress");

document.getElementById("answerInput").value = "广州 深圳";
click(window, document.getElementById("checkBtn"));
assert(document.getElementById("lastScore").textContent === "2/21", "partial answer should score 2/21");

document.getElementById("sortSelect").value = "pinyin";
document.getElementById("sortSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("lastScore").textContent === "2/21", "progress should not split by sort order");

document.getElementById("sortSelect").value = "plate";
document.getElementById("sortSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
document.getElementById("levelSelect").value = "province";
document.getElementById("levelSelect").dispatchEvent(new window.Event("change", { bubbles: true }));
assert(document.getElementById("sortSelect").value === "geo", "province level should switch away from plate sort");
assert(document.querySelector('option[value="plate"]').disabled, "plate sort should be disabled outside city level");

click(window, document.getElementById("copyListBtn"));
setTimeout(() => {
  assert(window.navigator.clipboard.value.includes("北京市"), "copy should use clipboard API");
  assert(window.navigator.clipboard.value.includes("星图远征清单"), "copy should include the list title");
  assert(window.navigator.clipboard.value.includes("范围："), "copy should include current scope");
  assert(window.navigator.clipboard.value.includes("训练过滤："), "copy should include the active study filter");
  click(window, document.getElementById("copyPlanBtn"));
  setTimeout(() => {
    assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u4eca\u65e5\u8ba1\u5212"), "plan copy should use the study plan title");
    assert(window.navigator.clipboard.value.includes("\u5f53\u524d\u8303\u56f4\uff1a"), "plan copy should include current scope");
    click(window, document.getElementById("copyWeakBtn"));
    setTimeout(() => {
      assert(window.navigator.clipboard.value.includes("\u661f\u56fe\u8fdc\u5f81\u8584\u5f31\u70b9\u6e05\u5355"), "weak copy should use the focused weak-point title");
      assert(window.navigator.clipboard.value.includes("\u5f53\u524d\u8303\u56f4\uff1a"), "weak copy should include current scope");
      click(window, document.getElementById("exportRecordsBtn"));
      setTimeout(() => {
        assert(window.navigator.clipboard.value.includes("星图远征学习记录"), "export should use the new product name");
        assert(window.navigator.clipboard.value.includes("最近记录"), "export should include recent records");
        assert(window.navigator.clipboard.value.includes("当前范围薄弱点"), "export should include current weak points");
      }, 0);
    }, 0);
  }, 0);
  console.log("Interaction tests passed.");
}, 0);
