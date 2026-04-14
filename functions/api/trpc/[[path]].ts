/**
 * Cloudflare Pages Functions - tRPC Handler
 * Self-contained implementation of all club-toolkit routes
 * No imports from server/ directory - everything is inline
 */

import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ===== 品牌行銷方法論 (Brand Marketing Methodology) =====
const MARKETING_METHODOLOGY = `品牌行銷方法論（品牌通用版）

本方法論源自內訓教材「品牌行銷策略地圖」，以恩師林明樟（超級業務力）體系為核心，融合峰值體驗理論、經典行銷模型與現代趨勢。

包含：策略五問、冷→鐵六階漏斗、行銷4有、需求6問、馬斯洛7情、AIDA/PAS/FABE 廣告模型、吸睛破圈（有梗有料）與六種風、定位六把刀、十大購買障礙與信任元素、客戶經營（關鍵5問、十個值了、4種互動）、STP市場定位、飛輪模型、Byron Sharp雙可得性、社群導向成長、Founder IP 策略、文案撰寫模組（含去AI味12條守則、銷售文案六層架構、標題五技法、Hook法則、五感寫作法）。

行銷的本質：廣告是宣傳產品解決問題、滿足需求的能力；行銷是放大我們的美、排除購買障礙。目標是「選對人、說對話、做對事」，連續做對，加速、持續、複利增長。

核心心法：「買產品、傳美名、留信物——能招喚、能漲價、能回購」。方法：拆解→重組→建模。

═══════════════════════════════════════════════════════════════════════════
一、策略五問
═══════════════════════════════════════════════════════════════════════════

每一個行銷決策都要回頭檢視——決策、策略能不能夠：

1. 加速增長？
2. 價值轉型？（從電商產品→品牌思維，從規格價格→價值信任，從活動檔期→回購推薦加持）
3. 改變競爭狀態？
4. 燙平景氣週期？
5. 累積長期競爭力？（深耕鐵粉客戶、品牌價值）

這是戰略層的檢驗——確保不只在「做行銷」，而是在「做對的行銷」。

═══════════════════════════════════════════════════════════════════════════
二、STP 市場定位（Philip Kotler）
═══════════════════════════════════════════════════════════════════════════

在執行任何行銷動作前，先回答「賣給誰、怎麼定位」：

S — 市場區隔
├─ 用人口、心理、行為、地理等變數切分市場
└─ 搭配需求6問挖掘真實需求

T — 目標市場
├─ 評估各區隔吸引力，選擇最適合的客群
└─ 搭配冷→鐵漏斗判斷客群階段

P — 定位
├─ 在目標客群心中建立獨特的品牌位置
└─ 搭配定位六把刀找到切點

STP 是分析流程，定位六把刀是定位切點——兩者互補，不是替代。

═══════════════════════════════════════════════════════════════════════════
三、冷→鐵 六階漏斗
═══════════════════════════════════════════════════════════════════════════

完整行銷旅程分為上半部（獲客）和下半部（養客）：

─── 上漏斗（獲客）— 產品信任 → 相對優勢 → 量變 ───

冷：完全不認識品牌
├─ 定義：完全不認識品牌
└─ 核心策略：有梗有料吸睛、跟風破圈、廣告投放、SEO/AIO

溫：聽過但還沒買
├─ 定義：聽過但還沒買
└─ 核心策略：十大障礙排除、信任元素累積

熱：首次購買
├─ 定義：首次購買
└─ 核心策略：AIDA 轉換、PAS 痛點放大、FABE 價值說服

─── 下漏斗（養客）— 品牌信任 + 情緒價值 → 人品信任 → 絕對優勢 → 質變 ───

熟：回購客（買>3次）
├─ 定義：回購客（買>3次）
└─ 核心策略：關鍵5問、十個值了、複購推薦

團：單品數量高於自用
├─ 定義：單品數量高於自用
└─ 核心策略：問答讚、人貨場、分潤機制

鐵：全產品購買率 50%+
├─ 定義：全產品購買率 50%+
└─ 核心策略：4種互動、VIP 深耕、不公平競爭

最終目標：野生代言人——積極主動推薦、分享，不用你請他就幫你傳美名。

核心理念：成交是服務的開始。不管問題或驚喜，對公司可能只是 1%，對客戶來說是 100%。

═══════════════════════════════════════════════════════════════════════════
四、飛輪模型（Flywheel）
═══════════════════════════════════════════════════════════════════════════

傳統漏斗的問題：客戶到底端就「結束」了。飛輪思維不同——滿意客戶成為推動下一輪成長的動力：

吸引（Attract）→ 參與（Engage）→ 愉悅（Delight）→ 回到吸引

與冷→鐵漏斗的關係：漏斗告訴你每個階段「做什麼」，飛輪提醒你「鐵粉的能量要回饋到冷流量的獲取」。野生代言人就是飛輪最強的動力源。

減少摩擦力（客訴、體驗差、溝通斷層）= 讓飛輪轉更快。

═══════════════════════════════════════════════════════════════════════════
五、Byron Sharp 雙可得性
═══════════════════════════════════════════════════════════════════════════

來自《品牌如何成長》（Ehrenberg-Bass Institute），提醒我們別只顧養客：

心智可得性（Mental Availability）：消費者在購買情境中能不能想到你

實體可得性（Physical Availability）：消費者能不能方便買到你

核心觀點：品牌成長主要靠「獲取新客」，而非只靠「加深忠誠」。品牌靠「獨特辨識度」（Logo、色彩、角色）而非靠「有意義的差異化」。

與本體系的對話：上漏斗（冷→熱）偏 Byron Sharp 的「拉新客 + 心智佔有」，下漏斗（熟→鐵）偏本體系的「深耕忠誠」。兩者不矛盾，品牌不同階段側重不同。

═══════════════════════════════════════════════════════════════════════════
六、團隊文化 DNA（價值三角）
═══════════════════════════════════════════════════════════════════════════

行銷策略的根基是團隊文化：

卓越價值：追求卓越、累積長期價值

智慧行動：有手有腳，更要有眼有腦。智慧佈局、聰明協作、確實執行

正直共好：善良正直、友善溝通、互信互敬互助。以「公司、夥伴、客戶」三贏為基準

═══════════════════════════════════════════════════════════════════════════
七、需求洞察工具
═══════════════════════════════════════════════════════════════════════════

需求 6 問（核心邏輯：動機來自「趨吉避凶」，追求快樂 < 逃避痛苦）

行銷前要同時想清楚「我方」和「對方」的六個問題，挖掘客戶真實需求。

─── 馬斯洛 7 層需求（5層→7層，加入認知、美的需求）───

層級 7 - 自我實現：成就感
└─ 行銷切角：使用產品實現理想生活方式

層級 6 - 美好：美感
└─ 行銷切角：設計質感、感官愉悅

層級 5 - 認知：知識感
└─ 行銷切角：了解產品差異、獲得新知

層級 4 - 自尊：優越感
└─ 行銷切角：聰明選擇，有品味的象徵

層級 3 - 社交：歸屬感
└─ 行銷切角：為家人/朋友選擇，愛的表現

層級 2 - 安全：安心感
└─ 行銷切角：認證、安全成分、專業背書

層級 1 - 生理：舒適感
└─ 行銷切角：滿足基本功能需求

痛點 = 反馬斯洛 = 需求不被滿足。越暗的地方你越亮，聚焦痛點，放大價值。

─── 焦糖布丁理論 ───

表面說想要的（布丁）vs 真正渴望的（焦糖）。洞察真需求，才能提煉出真正的買點。

═══════════════════════════════════════════════════════════════════════════
八、行銷 4 有
═══════════════════════════════════════════════════════════════════════════

每一則行銷內容都要達成這四個目標：

有哏：吸睛、破圈、被記住
└─ 對應工具：有梗有料、六種風

有關：跟 TA 有關，場景共鳴
└─ 對應工具：需求6問、馬斯洛7情

有感：引起情感共鳴
└─ 對應工具：AIDA、PAS、FABE

有想要：排除障礙、建立信任
└─ 對應工具：十大障礙、信任元素

═══════════════════════════════════════════════════════════════════════════
九、廣告三大模型
═══════════════════════════════════════════════════════════════════════════

─── AIDA（1898，行銷漏斗始祖）───

Attention - 抓住注意力
└─ 手法：有梗有料、跟風破圈、秒懂、推翻認知、五感衝擊

Interest - 從「干我屁事」到「跟我有關」
└─ 手法：場景共鳴、痛點亮點、感同身受

Desire - 理性感性都想要
└─ 手法：情緒價值、爽點、信任證據

Action - 我現在就要
└─ 手法：限時稀缺、排除障礙、明確呼籲

─── PAS 痛點公式 ───

Problem - 描述痛點，讓 TA 感同身受：「這就是我ㄚ」

Agitate - 放大不解決的後果＆情緒

Solution - 秒懂價值、降低猶豫、行動呼籲

─── FABE 價值法則 ───

Features - 產品有什麼特徵？

Advantages - 比業界標準有什麼優勢？

Benefits - 帶來什麼好處？

Evidence - 客戶憑什麼相信？

核心公式：價值 > 價格 = 成交。

═══════════════════════════════════════════════════════════════════════════
十、吸睛破圈工具
═══════════════════════════════════════════════════════════════════════════

─── 有梗、有料 ───

要吸睛、抓眼球、被記住，內容要同時做到「有梗」（讓人想停下來看）和「有料」（看完覺得有收穫）。

常見的破圈手法：
• 打破認知
• 製造好奇
• 搭上社會熱點
• 提供不同視角
• 跨界合作
• 五感衝擊
• 製造神秘和稀缺感

─── 六種風 ───

跟風：朋友最強

颱風：四大平台

龍捲風：超級大V

人造風：大數據銷量評分

妖風：競爭對手

熱點風：事件

─── 定位六把刀 ───

商戰進程：產品初創→產能競賽→通路戰→媒體戰→行銷戰→定位戰（有心智佔有，才會賣得久）。

定位金三角：根據核心出發，找到優勢切點、心智佔有、自貼標籤。

═══════════════════════════════════════════════════════════════════════════
十一、排除購買障礙 × 建立信任
═══════════════════════════════════════════════════════════════════════════

─── 十大購買障礙 ───

冷流量：沒看懂、沒法選、沒預算、沒興趣、沒人推

溫流量：不用換、不信你、不專業、不高級、不合適

─── 信任元素 ───

BA實測/產品比較

成功案例/認證

行業標竿/代言人

專家推薦

試用體驗

SEO/AIO 內容

═══════════════════════════════════════════════════════════════════════════
十二、客戶經營（下漏斗）
═══════════════════════════════════════════════════════════════════════════

─── 關鍵 5 問 ───

掌握關鍵五問才能了解客戶、了解自己。方法：拆解→關鍵字→重組→建模。

─── 十個「值了」───

維度 - 七情：越多即越值

維度 - 即時：馬上即享受

維度 - 符合：所見即所得

維度 - 逆轉：低谷變峰值

維度 - 打破：預期被打破

維度 - 交付：問題被解決

維度 - 先知：省心被安排

維度 - 高頻：穩定才有感

維度 - 低頻：剛需才加值

維度 - 雙頻：百搭才超值

─── 4 種互動 ───

差異化：限定限時、分級深耕

WOW：專屬設計、情緒價值

交朋友：驚喜互動、拉近距離

給方便：懂你需要、服務系統化

═══════════════════════════════════════════════════════════════════════════
十三、社群導向成長 × 創作者經濟
═══════════════════════════════════════════════════════════════════════════

2024-2026 年最重要的行銷趨勢轉變：

從注意力經濟 → 連結經濟：品牌成長的引擎從廣告轉向社群。小而深的社群 > 大而淺的粉絲數。

創作者經濟 2.0：創作者從「接業配的網紅」進化為品牌共創者。長期夥伴關係取代單次業配，創作者成為品牌的「文化錨點」。

UGC 真實內容：80% 消費者更偏好真實客戶照片而非精美商業攝影。Z世代主導的「去影響力化」——真實 > 精美。

與本體系的關係：Founder IP 策略 + 鐵粉經營 + 野生代言人 = 社群導向成長的最佳實踐。

═══════════════════════════════════════════════════════════════════════════
十四、品牌宗教學（衛哲）× 黃金圈（Simon Sinek）
═══════════════════════════════════════════════════════════════════════════

做好品牌，要向宗教學習：你有神祇和經文嗎？有教堂嗎？有傳教士嗎？有信徒嗎？有固定儀式嗎？有信物嗎？

溝通永遠從 Why 開始，不要只講 What。

═══════════════════════════════════════════════════════════════════════════
十五、Founder IP 行銷策略
═══════════════════════════════════════════════════════════════════════════

創辦人的個人品牌是品牌行銷的核心引擎：

人設：真誠、接地氣、用個人故事拉近距離

內容方向：創辦人 IP 短影片、生活知識、趣味創意

效果：建立深度信任，讓消費者覺得「這是有溫度的品牌」

與代言人關係：Founder IP 是日常信任基礎，代言人是品牌高度的加乘

═══════════════════════════════════════════════════════════════════════════
十六、品牌行銷 9 大目標
═══════════════════════════════════════════════════════════════════════════

每次出手都應對應一個目標：

1. 曝光
2. 導流
3. 互動
4. 名單蒐集
5. 轉換
6. 客單提升
7. 回購
8. 轉介紹
9. 品牌好感

規劃前先確認「這次打哪個目標」。

═══════════════════════════════════════════════════════════════════════════
十七、定價與促銷邏輯
═══════════════════════════════════════════════════════════════════════════

原則：平時不輕易打折（維護品牌價值），大促時給出有感折扣拉新客。把握年度節點節奏。

═══════════════════════════════════════════════════════════════════════════
十八、使用此方法論的原則
═══════════════════════════════════════════════════════════════════════════

1. 任何行銷決策先過「策略五問」
2. 用 STP 確認目標市場和定位
3. 判斷目標受眾在冷→鐵的哪個階段，選擇對應溝通方式
4. 用「行銷4有」（有哏、有關、有感、有想要）檢查每一則內容
5. 上漏斗用 AIDA/PAS/FABE 做轉換；有梗有料＋六種風做破圈
6. 下漏斗用關鍵5問、十個值了、4種互動深耕關係
7. 用飛輪思維讓鐵粉能量回饋到冷流量獲取
8. 定期檢視 Byron Sharp 雙可得性——心智可得 + 實體可得有沒有做到？
9. 所有文案產出必須通過「去 AI 味 12 條守則」（見下方文案模組）
10. 終極目標：買產品、傳美名、留信物——能招喚、能漲價、能回購

═══════════════════════════════════════════════════════════════════════════
文案撰寫模組
═══════════════════════════════════════════════════════════════════════════

本模組深度整合文案方法論，以及經典文案技法。涵蓋修辭技法、五感寫作法範例、潛意識說服結構。

─── 文案核心哲學 ───

方法 > 才華：靈感是禮物，方法是實務。文案有架構、有邏輯、有系統可循。

精準 > 華麗：不是把文字寫得多好看，而是依照需求寫出適合的文字。

解決問題 > 文字優美：能解決愈多人問題的文字，就愈有價值。

驅動想像 > 羅列資訊：文案不是一串字，是能在讀者腦中產生畫面的內容。

理解 80% → 下筆 20%：多數功夫在「搞懂受眾、產品、場景」，不是在「寫」。

─── 文案人的兩層功夫 ───

體力（底蘊）：閱讀累積、社會體察、生活感受，只有時間能養成

技術（架構）：邏輯、模型、系統化方法，好學好複製

→ 技術讓你寫得快，體力讓你寫得深。

═══════════════════════════════════════════════════════════════════════════
銷售文案六層架構
═══════════════════════════════════════════════════════════════════════════

層次 ① - 提問題：描述目標受眾的痛點
└─ 對應模型：PAS - Problem

層次 ② - 形容有多嚴重：放大痛點的情緒和後果
└─ 對應模型：PAS - Agitate

層次 ③ - 不解決的壞事 / 解決的好事：製造對比和急迫感
└─ 對應模型：反馬斯洛

層次 ④ - 解決問題：帶出產品/方案
└─ 對應模型：PAS - Solution

層次 ⑤ - 形容解決後的感受：情緒價值、畫面感
└─ 對應模型：AIDA - Desire

層次 ⑥ - 為什麼你能解決：信任證據
└─ 對應模型：FABE - Evidence

簡版：利益 → 困擾 → 解決 → 特色 → 證明 → 行動

═══════════════════════════════════════════════════════════════════════════
去 AI 味寫作守則（12 條）
═══════════════════════════════════════════════════════════════════════════

以下準則適用於所有文案、公告、發文、傳訊、社群貼文。目的是讓輸出讀起來像「一個真人寫的」。這些規則優先級很高，每次產出文字內容時都要逐條檢查。

為什麼這很重要：
讀者一旦覺得「這是 AI 寫的」，信任感馬上歸零。寧可粗糙一點、不完美一點，也不要工整到像模板。數據佐證：69% 的讀者能感覺出缺乏人味的文字；人寫的文案比 AI 的互動率高 63%、轉換率高 41%——差別就在「同理心」。

① 不用 emoji 當分類標題
└─ 「✨ 1樓｜餐廳」這種排版方式非常 AI。也避免「🔥爆款」「💡小撇步」等 AI 愛用的開頭模式。如果要列點，用最簡單的方式講就好。

② 段落長短要參差不齊
└─ 真人寫文段落長短差很多，有的一句話就一段，有的寫比較長。不要每段都差不多字數。

③ 少用萬用填充詞
└─ 禁用清單：「整體」「氛圍」「超級」「真心覺得」「非常推薦」「不僅…更…」「無論…都…」「值得一提的是」。換成更具體的描述或口語說法。「整體氛圍很好」→「坐下來就不太想走」。

④ 推薦要有具體細節 + 五感寫作
└─ 不要只說「效果不錯」，講一個具體例子、一個數字、一個畫面。至少用到一種感官描寫（看到、聞到、摸到、聽到、嚐到），讓讀者在腦中「看到畫面」而不是「讀到形容詞」。

⑤ 語氣要全篇統一
└─ 如果本人講話比較隨性，就全篇隨性。不要前面很口語後面突然變成正式用語。

⑥ 結尾不要太完美
└─ 不用每篇都正面收尾。三種收尾範式可用：吐槽式（留一個小吐槽）、懸念式（留一個疑問）、突然結束式（講一句很隨便的話就停了）。完美收尾 = AI 味。

⑦ 帶一個具體數字
└─ 價格、人數、幾分鐘車程、幾道菜。數字要有記憶點，不要是圓整數——「127 位」比「100 多位」更可信。

⑧ 分析或推測要加語氣緩衝
└─ 不要太肯定地下結論。事實要準確，觀點才需要緩衝。加上「可能」「我猜」「應該是」，像朋友聊天一樣。

⑨ 一句話段落製造節奏
└─ 在關鍵處用極短的一句話獨立成段，製造停頓感和力道。長段落之間插入一句短句，讀起來才有呼吸。

⑩ 開頭 3 秒法則
└─ 前兩句決定生死。第一句要讓人停下來，不能平鋪直敘。用提問、反常識、具體數字、或直接說出讀者心聲開頭。

⑪ 禁止 AI 高頻句型
└─ 這些句型一出現就暴露 AI：「在這個…的時代」「讓我們一起…」「不僅…更…還…」「相信你一定會…」「話不多說」「廢話不多說」。直接刪掉或用口語改寫。

⑫ 拿掉品牌名還像一個人在說話
└─ 最終檢驗：把品牌名遮住，讀起來像不像一個有血有肉的人寫的？如果像公關稿或說明書，重寫。

自我檢查清單（產出前必過）：
□ 有沒有用 emoji 當標題或分類？→ 拿掉
□ 每段字數是不是都差不多？→ 故意讓某段只有一句話
□ 有沒有禁用清單裡的詞？→ 換掉
□ 推薦有沒有具體細節？有沒有畫面感？→ 補一個數字或感官描寫
□ 語氣前後一致嗎？→ 結尾不要突然變正式
□ 結尾是不是太正面太完美？→ 加個吐槽或疑問
□ 有沒有至少一個具體數字？→ 補上，用非圓整數
□ 有沒有太肯定的推測？→ 加語氣緩衝
□ 有沒有一句話段落製造節奏？→ 在關鍵處加入
□ 開頭 3 秒能不能抓住人？→ 不能就重寫第一句
□ 有沒有 AI 高頻句型？→ 刪掉或改寫
□ 拿掉品牌名，像不像一個人在說話？→ 不像就重寫

═══════════════════════════════════════════════════════════════════════════
標題 / Hook 工具箱
═══════════════════════════════════════════════════════════════════════════

─── 標題五大技法 ───

技法 - 痛點：說出讀者的困擾
└─ 適用：銷售、問題導向

技法 - 賣點：強調獨特好處
└─ 適用：產品介紹

技法 - 驚點：打破認知、製造意外
└─ 適用：社群吸睛

技法 - 懸點：勾起好奇心
└─ 適用：長文、影片 Hook

技法 - 暖點：情感共鳴、說出心聲
└─ 適用：品牌形象、Founder IP

─── Hook 黃金法則 ───

短、狠、具體。8 字以內。包含數字或「我如何…」類型開頭。說出心聲型最強——寫出多數人經歷過的情境，幫大家說出不敢說的話，讓人「這就是我」。

═══════════════════════════════════════════════════════════════════════════
修辭與節奏工具箱
═══════════════════════════════════════════════════════════════════════════

好文案的「力道」來自節奏。中文博大精深，幾個字就能有力量，關鍵在修辭和節奏的運用：

技法 - 排比：效果是氣勢、一氣呵成
└─ 適用：品牌宣言、價值觀表述

技法 - 對比：效果是突顯差異、製造張力
└─ 適用：使用前/後、競品比較

技法 - 設問：效果是引發思考、拉近距離
└─ 適用：社群開頭、痛點觸發

技法 - 譬喻：效果是讓抽象變具體
└─ 適用：產品說明、技術翻譯

技法 - 重複：效果是強調、洗腦、記憶
└─ 適用：品牌標語、核心訊息

技法 - 留白：效果是讓讀者自己填入想像
└─ 適用：高級感文案、品牌形象

技法 - 轉折：效果是製造意外、打破期待
└─ 適用：Hook、吸睛開頭

技法 - 對偶：效果是整齊對稱、富音樂美
└─ 適用：標語、金句

節奏的核心：長短交錯。三個長句後接一個短句，像音樂有拍子。一句話段落就是「重音」。

═══════════════════════════════════════════════════════════════════════════
五感寫作法
═══════════════════════════════════════════════════════════════════════════

好文案要有「畫面感」。方法是用感官描寫取代抽象形容，讓讀者在腦中「看到畫面」而不是「讀到形容詞」。每段文案至少出現一種感官描寫。

五感對照：

視覺
❌ 效果很好
✅ 三下就把卡了兩年的油漬搓掉了

嗅覺
❌ 洗完很香
✅ 晾在陽台上，路過的鄰居都問你用什麼洗的

觸覺
❌ 質感很好
✅ 摸起來像剛從烘衣機拿出來的毛巾

聽覺
❌ 很安靜
✅ 安靜到你能聽見自己的呼吸

味覺
❌ 很好吃
✅ 咬下去湯汁直接噴出來，燙嘴但捨不得放下

進階：場景粒度
從宏觀到微觀注重細節——不要寫「在家裡」，寫「在客廳沙發上」；不要寫「用了產品」，寫「擠了一泵在手心搓開」。細節越具體，畫面越真。

═══════════════════════════════════════════════════════════════════════════
潛意識說服三層結構
═══════════════════════════════════════════════════════════════════════════

文案說服的底層邏輯：

層次 - 本我（慾望）：快樂、安全、被看見
└─ 文案做法：觸動情感
└─ 範例：「你值得更好的」

層次 - 超我（合理化）：健康、責任、品味
└─ 文案做法：給理由
└─ 範例：「為家人選最好的」

層次 - 自我（行動）：理性藉口
└─ 文案做法：降低門檻
└─ 範例：「現在試用只要 \$99」

好的銷售文案會依序觸動這三層：先讓人「想要」，再給「應該要」的理由，最後提供「可以要」的行動路徑。

═══════════════════════════════════════════════════════════════════════════
文案六大類型 × 對應架構
═══════════════════════════════════════════════════════════════════════════

類型 - 品牌故事
├─ 核心架構：黃金圈（Why→How→What）
└─ 重點：情感、使命、價值觀

類型 - 銷售文案
├─ 核心架構：PAS / 六層架構 / AIDA
└─ 重點：痛點→解決→信任→行動

類型 - 產品文案
├─ 核心架構：FABE + 五感寫作
└─ 重點：特色→優勢→好處→證明

類型 - 社群文案
├─ 核心架構：Hook + 標題五技法
└─ 重點：3 秒抓住、平台語氣適配

類型 - 廣告文案
├─ 核心架構：AIDA + 馬斯洛7情
└─ 重點：注意→興趣→慾望→行動

類型 - 內容文案（SEO / 部落格 / 長文）
├─ 核心架構：洞察 + 故事 + 價值
└─ 重點：提供價值、建立信任

═══════════════════════════════════════════════════════════════════════════
AI 寫文案的最佳定位
═══════════════════════════════════════════════════════════════════════════

AI 在文案工作中的最佳角色不是「寫手」，而是「有品牌記憶的文案助理」——它記得所有產品資訊、品牌調性、方法論框架，但每次產出都需要：

1. 通過「去 AI 味 12 條守則」的逐條檢查
2. 鼓勵使用者加入自己的觀察和細節
3. 產出後自問：「拿掉品牌名，讀起來像不像一個有血有肉的人寫的？」

AI 能做好的：
• 大量產出初稿
• 格式轉換
• 關鍵字優化
• 資料整理

AI 需要人為補足的：
• 洞察：真實消費者的生活 → 靠品牌知識庫 + 客戶回饋
• 同理心：感受過的痛點 → 靠場景範例和情境模板
• 語感：節奏變化和個性 → 靠去 AI 味守則 + 節奏規則
• 文化脈絡：在地語境的微妙差異 → 靠本地化詞彙庫
• 品牌人格：一致的聲音 → 靠品牌調性準則 + 語氣模式
`;

// Helper: Append marketing methodology to system prompts
const withMarketing = (prompt: string) => {
  return prompt + "\n\n═══ 品牌行銷方法論參考 ═══\n請在撰寫文案時參考以下行銷方法論框架，運用其中的模型和技法提升文案品質：\n\n" + MARKETING_METHODOLOGY;
};


// ===== Types & Interfaces =====
interface Env {
  GEMINI_API_KEY: string;
}

interface Context {
  env: Env;
  requestUrl: string;
}

interface PagesFunction<Env = unknown> {
  (context: { request: Request; env: Env; next?: () => Promise<Response> }): Response | Promise<Response>;
}

// ===== tRPC Setup =====
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

// ===== Gemini Helpers =====

function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"];

async function geminiGenerateText(
  apiKey: string,
  {
    systemPrompt,
    userPrompt,
  }: {
    systemPrompt: string;
    userPrompt: string;
  }
): Promise<string> {
  const client = getGeminiClient(apiKey);
  let lastError: unknown;
  for (const modelName of TEXT_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("503") || msg.includes("404") || msg.includes("overloaded") || msg.includes("high demand") || msg.includes("no longer available")) {
        console.log(`Model ${modelName} overloaded, trying next fallback...`);
        continue;
      }
      throw err; // non-503 errors should not be retried
    }
  }
  throw lastError;
}

async function tryImagen4(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "3:4",
            safetyFilterLevel: "block_only_high",
            personGeneration: "allow_adult",
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Imagen4] API error:", response.status, errText.substring(0, 300));
      return null;
    }

    const data = (await response.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };

    const prediction = data.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      console.error("[Imagen4] No image returned:", JSON.stringify(data).substring(0, 200));
      return null;
    }

    const mimeType = prediction.mimeType ?? "image/png";
    return `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
  } catch (e) {
    console.error("[Imagen4] Exception:", e);
    return null;
  }
}

type RefImage = { mimeType: string; data: string; label: string };

function parseDataUrl(dataUrl: string, label: string): RefImage | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mimeType: m[1], data: m[2], label };
}

// 台灣女性地面真相參考池 — 每次生成隨機抽 2 張當 multimodal 參考
const TAIWAN_REF_POOL = Array.from({ length: 14 }, (_, i) => `/refs/taiwan/tw-ref-${String(i + 1).padStart(2, "0")}.jpg`);

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchTaiwanRefs(requestUrl: string, count = 2): Promise<RefImage[]> {
  try {
    const origin = new URL(requestUrl).origin;
    const shuffled = [...TAIWAN_REF_POOL].sort(() => Math.random() - 0.5).slice(0, count);
    const results = await Promise.all(
      shuffled.map(async (path) => {
        try {
          const res = await fetch(`${origin}${path}`, { cf: { cacheTtl: 86400 } } as RequestInit);
          if (!res.ok) return null;
          const buf = await res.arrayBuffer();
          return {
            mimeType: res.headers.get("content-type") ?? "image/jpeg",
            data: bufferToBase64(buf),
            label: "Taiwanese woman ground-truth appearance reference — use this only as ethnic/age/skin/makeup/vibe ground truth; DO NOT copy any face, generate a completely different individual",
          } as RefImage;
        } catch {
          return null;
        }
      })
    );
    return results.filter((r): r is RefImage => r !== null);
  } catch (e) {
    console.error("[taiwan-refs] failed to fetch:", e);
    return [];
  }
}

async function tryGeminiImageModel(
  apiKey: string,
  prompt: string,
  refs: RefImage[] = []
): Promise<string | null> {
  try {
    const client = getGeminiClient(apiKey);
    // @ts-expect-error - responseModalities is experimental API
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const textPart = {
      text: `Generate a professional vertical marketing poster (3:4 / 2:3 classic poster ratio, NOT phone-story 9:16) for a luxury nightclub in Taiwan.${
        refs.length ? `\n\nThe user has attached ${refs.length} reference image(s): ${refs.map(r => r.label).join("; ")}. Study them carefully and incorporate their style/composition/mood as instructed in the detailed prompt below.\n` : ""
      }\n${prompt}`,
    };
    const imageParts = refs.map((r) => ({
      inlineData: { mimeType: r.mimeType, data: r.data },
    }));

    const result = await model.generateContent([textPart, ...imageParts]);

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const p = part as { inlineData?: { data: string; mimeType: string } };
      if (p.inlineData?.data) {
        return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
      }
    }

    console.error("[gemini-2.5-flash-image] No inline image in response, parts:", parts.length);
    return null;
  } catch (e) {
    console.error("[gemini-2.5-flash-image] Error:", e);
    return null;
  }
}

async function tryGemini20ImageModel(
  apiKey: string,
  prompt: string,
  refs: RefImage[] = []
): Promise<string | null> {
  try {
    const textPart: { text: string } = {
      text: `Generate a professional vertical marketing poster (3:4 / 2:3 classic poster ratio, NOT phone-story 9:16) for a luxury nightclub in Taiwan.${
        refs.length ? `\n\nThe user has attached ${refs.length} reference image(s): ${refs.map(r => r.label).join("; ")}.\n` : ""
      }\n${prompt}`,
    };
    const imageParts = refs.map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } }));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [textPart, ...imageParts] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Gemini20Image] API error:", response.status, errText.substring(0, 300));
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.error("[Gemini20Image] No inline image in response");
    return null;
  } catch (e) {
    console.error("[Gemini20Image] Exception:", e);
    return null;
  }
}

async function geminiGenerateImage(
  apiKey: string,
  prompt: string,
  refs: RefImage[] = []
): Promise<string | null> {
  if (refs.length > 0) {
    console.log(`[Image] ${refs.length} reference image(s) attached, using multimodal`);
    const r = await tryGeminiImageModel(apiKey, prompt, refs);
    if (r) return r;
    console.log("[Image] gemini-2.5-flash-image failed, trying gemini-2.0-flash-lite multimodal");
    const r2 = await tryGemini20ImageModel(apiKey, prompt, refs);
    if (r2) return r2;
    console.error("[Image] All multimodal models failed");
    return null;
  }

  console.log("[Image] Trying Imagen 4 (text-to-image)");
  const imagen4Result = await tryImagen4(apiKey, prompt);
  if (imagen4Result) return imagen4Result;

  console.log("[Image] Imagen 4 failed, trying gemini-2.5-flash-image");
  const geminiImageResult = await tryGeminiImageModel(apiKey, prompt);
  if (geminiImageResult) return geminiImageResult;

  console.log("[Image] Trying gemini-2.0-flash-lite fallback");
  const gemini20Result = await tryGemini20ImageModel(apiKey, prompt);
  if (gemini20Result) return gemini20Result;

  console.error("[Image] All image generation methods failed");
  return null;
}

// ===== Router: Copywriter =====
const copywriterRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(["recruitment", "social", "event", "lady_recruitment", "call_client"]),
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        platform: z.enum(["ig_post", "ig_story", "fb_post", "line_msg", "sms"]).default("ig_post"),
        elements: z.array(z.string()).default([]),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const typeLabels = {
        recruitment: "徵員文案",
        social: "社群貼文",
        event: "活動宣傳文案",
        lady_recruitment: "小姐招募文案",
        call_client: "Call客文宣",
      };
      const hotelInfo = {
        chinatown: "中國城經典酒店（桃園市桃園區復興路99號8樓，電話 03-339-2188）",
        dihao: "帝豪酒店（桃園市桃園區復興路99號6樓，電話 03-339-3666）",
        both: "中國城經典酒店（8樓，03-339-2188）× 帝豪酒店（6樓，03-339-3666）",
      };
      const typePrompts = {
        recruitment: `你是在桃園八大行業幹了十幾年的老鳥，現在幫店裡寫徵員文案。
架構用 PAS：先講這行的痛點（一般工作薪水低、看不到未來），再放大（每天朝九晚五賺那點錢值得嗎），最後帶出解方（來這裡，收入翻倍、彈性自由）。
職缺包含：外場服務生、控台、服裝部助理、巡管、總監助理、水電師傅。
語氣：講人話、直接、像學長在跟你說真心話。不要官腔，不要像人力銀行貼的。
必須帶一個具體數字（薪資範圍或上手天數），讓人覺得「這是真的」。`,
        social: `你是很懂夜店酒店氛圍的社群操盤手，幫中國城/帝豪寫 IG/FB 貼文。
架構用 AIDA：Attention 用一句 Hook 抓眼球 → Interest 用畫面感讓人好奇 → Desire 製造想去的衝動 → Action 暗示今晚來。
語氣：帶點曖昧、帶點神秘，像在說一個只有懂的人才懂的故事。
用五感寫作：燈光的顏色、音樂的節奏、酒杯碰撞的聲音、空氣裡的香水味——讓人「看到畫面」。
不要寫得像廣告，要像在分享一個值得去的秘密基地。`,
        event: `你是酒店業的活動行銷高手，幫店裡寫活動宣傳文案。
架構用 AIDA：Attention 用衝擊力的標題 → Interest 活動亮點 → Desire 製造 FOMO（錯過等明年）→ Action 訂位資訊。
活動類型：電音派對、試管調酒、摩天輪調酒、節日主題派對、VIP之夜等。
語氣：有氣勢、有節奏感，像在預告一場你不能缺席的事件。
開頭要有 Hook——用提問、反常識、或直接喊出一個讓人停下來的句子。`,
        lady_recruitment: `你是在八大行業帶過很多新人的資深姐姐，幫店裡寫公關小姐招募文案。
架構用 PAS：先講現在工作的痛（薪水少、被壓榨、看人臉色），再放大（這樣的日子要過多久），最後帶出這裡的好（收入高、姐妹互挺、時間自由）。
強調：底薪保障、抽成透明、自由排班、安全環境、專業帶領。
語氣：真誠、溫暖但直接，像姐姐在跟你說實話。不要太夢幻，要讓人覺得靠譜。
帶一個具體數字（收入範圍或到職人數），增加可信度。`,
        call_client: `你是酒店的王牌業務，幫店裡寫傳給老客人的回店邀約訊息。
架構用 AIDA：Attention 用一句讓人想回的話開頭 → Interest 提新的亮點 → Desire 專屬感加回憶殺 → Action 今晚或這週來。
語氣：像老朋友傳 LINE，親切、有點撩、讓人嘴角上揚就想回。
不要太正式、不要像群發，要讓人覺得「這是專門傳給我的」。
可以提：新來的妹、新活動、老客人才有的待遇、好久不見想你了。`,
      };
      const platformMap = {
        ig_post: {
          label: "Instagram 貼文",
          length: "80-150 字",
          format: "適合 IG 閱讀節奏：短段落、有留白、可加 hashtag。語氣輕鬆帶感。",
        },
        ig_story: {
          label: "Instagram 限時動態",
          length: "30-60 字",
          format: "極短、一句話抓住眼球。像在對朋友喊話，要有衝擊力。可以用一個問句或一句狠話。",
        },
        fb_post: {
          label: "Facebook 貼文",
          length: "120-200 字",
          format: "比 IG 可以稍長，但段落要分明。適合說故事或帶情境。",
        },
        line_msg: {
          label: "LINE 訊息",
          length: "50-100 字",
          format: "像私訊朋友，簡短親切。不要有標題感，直接講重點。適合 Call 客或通知。",
        },
        sms: {
          label: "簡訊",
          length: "30-50 字",
          format: "極精簡，一句話講完重點加行動呼籲。像傳簡訊給熟人。",
        },
      };
      const platformInfo = platformMap[input.platform];
      const elementsText = input.elements.length > 0
        ? "\n\n使用者特別要求包含以下元素：" + input.elements.join("、")
        : "";
      const customText = input.customNote
        ? "\n\n使用者補充說明：" + input.customNote
        : "";

      const systemPrompt = typePrompts[input.type] + `

酒店資訊：${hotelInfo[input.hotel]}
發布平台：${platformInfo.label}
字數要求：${platformInfo.length}
排版要求：${platformInfo.format}

══ 文案鐵律 ══

【Hook 開頭 3 秒法則】
前兩句決定生死。五選一：痛點提問、反常識、具體數字、說出心聲、製造懸念。開頭絕對不能平鋪直敘。

【去 AI 味】
1. 不用 emoji 當標題或段落開頭
2. 段落長短參差不齊，有的一句話就一段，有的三四行
3. 禁用詞：「不僅如此」「值得一提」「總而言之」「此外」「更重要的是」「在這個…的時代」「讓我們一起」「相信你一定會」「話不多說」「氛圍」「整體」「超級」「真心覺得」「非常推薦」
4. 語氣全篇統一，開頭什麼調性結尾就什麼調性
5. 結尾不要太完美：用吐槽式、懸念式、或突然結束式收尾
6. 帶至少一個具體數字（非圓整數更好）
7. 加語氣緩衝（「可能」「我猜」「應該是」），別太肯定地下結論
8. 關鍵處用一句話獨立成段，製造節奏停頓
9. 拿掉酒店名讀起來要像一個有血有肉的人寫的

【五感寫作】
至少用一種感官描寫（燈光畫面、音樂節拍、酒香、皮沙發觸感、冰塊碰杯聲），讓人看到場景不是讀到形容詞。

【行銷 4 有自檢】
有哏：讓人想停下來看 / 有關：跟目標受眾的生活有關 / 有感：引起情緒共鳴 / 有想要：看完想行動
` + elementsText + customText;
      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, { systemPrompt: withMarketing(systemPrompt), userPrompt: "請幫我寫一篇" + typeLabels[input.type] + "，發布在" + platformInfo.label + "。字數控制在" + platformInfo.length + "。精簡有力，每個字都要有用。直接輸出文案，不要任何前言、說明、或「以下是文案」之類的開場。",
      });

      return { content };
    }),
});

// ===== Router: Recruit (增員助手) =====
const recruitRouter = router({
  generateCopy: publicProcedure
    .input(
      z.object({
        channel: z.enum(["dcard", "ig_story", "ig_post", "threads", "line_group"]).default("dcard"),
        position: z.enum(["hostess", "foh", "control", "wardrobe"]).default("hostess"),
        painPoints: z.array(z.enum(["secret", "no_photo", "base_salary", "flexible", "referral", "safe", "sister"])).default([]),
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const channelMap = {
        dcard: { label: "Dcard 徵才區", tone: "Dcard 用戶偏年輕、懷疑心重、討厭業配感。用『學姊來爆料』的口氣，像在匿名八卦。開頭要有一句 Hook 讓人願意點進來。避免過度官腔或華麗詞彙。長度 300-500 字，可分段但不要用一堆 emoji。" },
        ig_story: { label: "Instagram 限時動態", tone: "極短、口語、直接。像閨蜜私訊喊話。一句 Hook + 一句條件 + 聯絡方式。20-40 字。" },
        ig_post: { label: "Instagram 貼文", tone: "生活感、鏡頭感。像分享一個好工作機會給朋友。短段落、有留白、1-2 個 hashtag。80-150 字。" },
        threads: { label: "Threads 短文", tone: "Threads 更隨性、更敢講。可以帶點自嘲或酸感。一則 150-300 字，開頭狠一點。" },
        line_group: { label: "LINE 群組分享", tone: "傳給現職小姐的群組，拜託她們幫分享。親切直接、提獎金、附分享素材。100-200 字。" },
      };
      const positionMap = {
        hostess: "公關小姐（包廂公關、檯面工作）",
        foh: "外場服務生（不用坐檯、純服務）",
        control: "控台人員（操控燈光音響、不需外場）",
        wardrobe: "服裝部助理（協助小姐更衣、整理服裝）",
      };
      const painPointSolutions: Record<string, string> = {
        secret: "強調【絕對保密】：不會讓家人朋友知道、隱私絕對保護、店名不會出現在任何家人看得到的地方",
        no_photo: "強調【零曝光】：不拍宣傳照、不上網、不會被熟人認出、個資完全保密",
        base_salary: "強調【試坐底薪保障】：新人前 N 天有底薪，不怕沒客人白做工、沒業績也有錢拿",
        flexible: "強調【彈性排班】：想上幾天上幾天、臨時有事可以調班、不綁死",
        referral: "強調【介紹獎金】：朋友一起來有額外獎金、組團來有加給",
        safe: "強調【安全環境】：有幹部駐場、有 SOP 處理奧客、被騷擾可立刻喊停",
        sister: "強調【姐妹帶領】：有資深姐姐教、不怕自己傻傻被欺負、像家人一樣互挺",
      };
      const hotelInfo = {
        chinatown: "中國城經典酒店（桃園市桃園區復興路99號8樓，03-339-2188）",
        dihao: "帝豪酒店（桃園市桃園區復興路99號6樓，03-339-3666）",
        both: "中國城經典酒店（8F）＋ 帝豪酒店（6F），桃園市桃園區復興路99號",
      };
      const ch = channelMap[input.channel];
      const painClauses = input.painPoints.map(k => painPointSolutions[k]).filter(Boolean);

      const systemPrompt = `你是在桃園八大行業徵員多年、懂台妹心態的資深人資。現在要幫店裡寫一篇徵${positionMap[input.position]}的文案。

通路：${ch.label}
語氣與長度：${ch.tone}

【痛點反轉心法 — 必須寫入文案】
求職小姐最怕的 3 件事是「家人知道」「被拍照上網」「被騙沒領到錢」。你的文案不能只講待遇多好，必須主動把這些疑慮逐一化解：
${painClauses.length > 0 ? painClauses.map((s, i) => `${i + 1}. ${s}`).join("\n") : "（使用者未勾選痛點解法，請你自己判斷加入最關鍵的 2-3 個安全感訴求）"}

【介紹制思維】
如果是公關職，結尾帶一句「朋友一起來面試有雙倍獎金／拉人進來坐滿 30 節領 1.5 萬」之類的具體介紹激勵（如果使用者勾選 referral 痛點）。

【真實感鐵律】
- 不用「加入我們」「溫馨大家庭」「年輕有活力團隊」這種人資模板官腔
- 不裝夢幻、不用『姐姐帶著妳飛』之類的肉麻句
- 帶至少一個具體數字（底薪範圍 / 介紹獎金 / 上手天數），讓人覺得這是真的不是話術
- Hook 開頭：痛點提問／具體數字／反常識／直球說心聲，四選一
- 結尾 CTA：留 LINE ID 或聯絡窗口，動作明確

酒店：${hotelInfo[input.hotel]}

${input.customNote ? "使用者補充說明：" + input.customNote : ""}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt: withMarketing(systemPrompt),
        userPrompt: `請幫我寫一篇${positionMap[input.position]}徵才文案，發布在${ch.label}。嚴格遵守上述痛點反轉心法。直接輸出文案，不要任何前言或說明。`,
      });

      return { content };
    }),

  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const systemPrompt = `你是桃園八大行業『中國城經典酒店』與『帝豪酒店』的增員顧問助手，專門協助酒店老闆／經理／小編處理徵才、增員、招募小姐、留才、舊客回流等問題。

你的知識範圍（本工具內建的方法論）：
1. 痛點反轉：台妹求職怕『家人知道』『被拍上網』『被騙沒領到錢』——文案要主動化解這 3 個疑慮
2. 通路選擇：Dcard 徵才區最有效（年輕族群）、IG 限動與 Threads 次之、104/1111 效益很低
3. 介紹制（最強增員手段）：現職介紹 1 人坐滿 30 節 → 領 1.5 萬左右；預算一次到位比每週小獎勵有效
4. 分眾文案：Dcard 用學姊爆料口吻、IG 用鏡頭感、Threads 用敢講風格、LINE 群用傳給現職拜託她轉發
5. 工具對應：本網站有四大功能 — 文案產生器（/copywriter）、女神海報生成器（/poster）、活動企劃師（/planner）、徵才助手（/recruit 含三個 Tab）
6. 本站『徵才助手』頁有 3 個 Tab：Tab 1 痛點反轉徵才文案（選通路、職位、痛點自動勾選）、Tab 2 徵才海報（溫馨工作環境／高薪直白／派對氣氛 3 種模式）、Tab 3 介紹制計算（輸入人數與獎金算出建議方案＋群組激勵訊息）

你的任務：
- 用對話方式引導使用者，協助他釐清自己要徵誰、多少人、預算多少、目標通路是哪裡
- 具體推薦本網站哪個 Tab／頁面最適合他的需求（例如：『你目前想先衝 Dcard 文案 → 去徵才助手 Tab 1，職位選公關小姐、通路選 Dcard、痛點全勾』）
- 根據他的店內狀況給具體建議（薪資區間、獎金金額、文案語氣、發佈時段）
- 回答時語氣要親切、簡潔、直接，像懂行的朋友，不要官腔不要客套
- 回答長度：簡單問題 2-3 句，複雜建議分點列 3-5 點，每點一行不長篇大論
- 不確定時主動問清楚（例如：『你目前現職幾位？本月想補幾位？』）
- 如果使用者問的事情不在增員／徵才範圍，仍可回答但提醒他本頁是徵才助手

禁忌：
- 不要講『歡迎使用』『我是 AI 助手』之類的官腔開場
- 不要過度肉麻或用 emoji
- 不要過度保守（例如一直叫人『請遵守法規』『建議洽詢律師』），這是行業內對話，直接回業務問題
- 不要長篇大論，控制字數`;

      const convoText = input.messages
        .filter(m => m.role !== "system")
        .map(m => (m.role === "user" ? "老闆" : "助手") + "：" + m.content)
        .join("\n\n");

      const lastUser = input.messages.filter(m => m.role === "user").pop()?.content ?? "";

      const userPrompt = input.messages.length > 1
        ? `以下是到目前的對話紀錄：\n\n${convoText}\n\n請你以『助手』的身份繼續回應老闆最新的這一則訊息。直接輸出回答，不要重複對話紀錄。`
        : lastUser;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt,
        userPrompt,
      });

      return { content };
    }),

  generateReferralMessage: publicProcedure
    .input(
      z.object({
        currentCount: z.number().min(1).default(10),
        targetCount: z.number().min(1).default(5),
        bonusPerHead: z.number().min(0).default(15000),
        customNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const systemPrompt = `你是桃園八大資深幹部，要在店內群組發一則激勵現職小姐介紹新人來的訊息。

情境：
- 目前現職小姐 ${input.currentCount} 人
- 這個月目標再補 ${input.targetCount} 人
- 介紹 1 人進來坐滿 30 節 → 介紹人領 ${input.bonusPerHead.toLocaleString()} 元

語氣要求：
- 像姐姐在群組講話，親切但有推進感，不裝模作樣
- 不用官腔詞（如：親愛的夥伴、團隊榮耀、共創佳績）
- 要點出「現在缺人，生意太好坐不過來」的真實感
- 具體講獎金怎麼算、坐滿 30 節大概多久（約 1 個月內）
- 結尾 CTA：把她想推薦的朋友 LINE 丟進群組／直接傳給幹部
- 長度 100-180 字，分 2-3 段

${input.customNote ? "使用者補充：" + input.customNote : ""}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, {
        systemPrompt: withMarketing(systemPrompt),
        userPrompt: "請幫我寫這則群組激勵訊息。直接輸出，不要前言說明。",
      });

      return { content };
    }),
});

// ===== Router: Planner =====
const plannerRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("both"),
        eventType: z.string(),
        duration: z.string().optional(),
        budget: z.string().optional(),
        targetAudience: z.string().optional(),
        specialRequirements: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hotelInfo: Record<string, string> = {
        chinatown: "ä¸­ååç¶å¸éåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è8æ¨ï¼é»è©± 03-339-2188ï¼",
        dihao: "å¸è±ªéåºï¼æ¡åå¸æ¡ååå¾©èè·¯99è6æ¨ï¼é»è©± 03-339-3666ï¼",
        both: "ä¸­ååç¶å¸éåºï¼8æ¨ï¼03-339-2188ï¼Ã å¸è±ªéåºï¼6æ¨ï¼03-339-3666ï¼",
      };

      const systemPrompt = `ä½ æ¯ä¸åå¨å°ç£å«å¤§è¡æ¥­éåºæ¥­å·¥ä½è¶éåå¹´çèæï¼å°éè² è²¬æ´»åä¼ååè¡é·ã
ä½ éå¸¸äºè§£éåºæ¥­ççæãå®¢äººçå¿çãä»¥åä»éº¼æ¨£çæ´»åæè½å¸¶åæ¥­ç¸¾ã

éåºè³è¨ï¼${hotelInfo[input.hotel]}

è«å¹«æè¦åä¸åå®æ´çæ´»åä¼åï¼åå«ä»¥ä¸å§å®¹ï¼
1. æ´»åä¸»é¡èåç¨±
2. æ´»åæ ¸å¿è³£é»ï¼3-5åï¼
3. å·è¡æç¨ï¼æ´»ååãæ´»åä¸­ãæ´»åå¾ï¼
4. å®£å³ææ¡ï¼å¯ä»¥æäººåï¼ç¬¦åéåºæ¥­é¢¨æ ¼ï¼
5. Callå®¢ç­ç¥ï¼æéº¼è®èå®¢äººåä¾ï¼
6. é ç®å»ºè­°ï¼å¦æææä¾é ç®ç¯åï¼
7. æ³¨æäºé 

èªæ°£è¦å°æ¥­ä½æ¥å°æ°£ï¼åæ¯èæå¨è·æ°äººåäº«ç¶é©ã
å§å®¹å¯ä»¥æäººåï¼ç¬¦åå«å¤§è¡æ¥­éåºçå¯¦ééæ±ã`;

      const userPrompt = `æ´»åé¡åï¼${input.eventType}
${input.duration ? `æ´»åæéï¼${input.duration}` : ""}
${input.budget ? `é ç®ç¯åï¼${input.budget}` : ""}
${input.targetAudience ? `ç®æ¨å®¢ç¾¤ï¼${input.targetAudience}` : ""}
${input.specialRequirements ? `ç¹æ®éæ±ï¼${input.specialRequirements}` : ""}

è«çµ¦æä¸ä»½å®æ´çæ´»åä¼åã`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, { systemPrompt: withMarketing(systemPrompt), userPrompt,
      });

      return { content };
    }),
});

// ===== Router: Poster =====
const posterRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("chinatown"),
        style: z.enum(["neon_electronic", "luxury_gold", "festival_red", "modern_minimal"]),
        theme: z.string(),
        features: z.array(z.string()).default([]),
        hasUploadedPhoto: z.boolean().default(false),
        uploadedPhotoUrl: z.string().optional(),
        referencePosterUrl: z.string().optional(),
        personCount: z.number().min(1).max(6).default(1),
        customPrompt: z.string().optional(),
        effects: z.array(z.string()).default([]),
        personStyle: z.enum(["elegant", "sweet", "fashionable", "graceful", "cool", "sexy"]).optional(),
        outfitStyle: z.enum(["silver_sequin", "gold_gown", "sweet_cutie", "black_slip", "red_tight", "lace_sheer", "pastel_princess", "crystal_mini", "velvet_bodycon", "bikini_cover", "cheongsam", "white_angel"]).optional(),
        scene: z.enum(["vip_room", "dance_floor", "bar_counter", "red_carpet", "stage_show", "lounge_sofa", "champagne_tower", "edm_party", "birthday_vip", "starlight_corridor"]).optional(),
        excludeText: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const styleDescriptions: Record<string, string> = {
        neon_electronic: "neon electronic music night club style, purple and blue neon lights, dark background, futuristic cyberpunk aesthetic, glowing neon signs",
        luxury_gold: "luxury gold and black style, elegant golden decorations, dark background with golden accents, high-end nightclub atmosphere, sophisticated and glamorous",
        festival_red: "festive red and gold Chinese style, red background with golden decorations, auspicious Chinese patterns, celebration atmosphere",
        modern_minimal: "modern minimalist luxury style, dark background, clean typography, subtle gold accents, contemporary high-end design",
      };

      const hotelNames: Record<string, string> = {
        chinatown: "China Town Club",
        dihao: "Empire Royal Club",
        both: "China Town Club x Empire Royal Club",
      };

      const personStyleMap: Record<string, string> = {
        elegant: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, elegant 氣質網美 (Taiwan elegant influencer) aesthetic, long straight black or dark brown hair with subtle highlights, fair to light olive skin, refined almond-shaped eyes, groomed brows, defined fluttery lashes, glossy nude-pink lips, soft contouring, wearing a sophisticated evening gown, mature and refined Taiwan nightlife hostess look, genuine warm smile",
        sweet: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, sweet 甜美網美 (Taiwan sweet girl-next-door influencer) aesthetic, shoulder-length wavy black or dark brown hair, bangs or side-swept fringe, fair skin with healthy glow, large almond eyes, puppy-dog eyeliner style popular in Taiwan, natural pink cheeks, glossy pink lips, wearing a chic cocktail dress, youthful approachable Taiwanese girl look, bright radiant smile",
        fashionable: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, trendy 時尚網美 (Taiwan fashion influencer) aesthetic, styled wavy or sleek hair in dark brown or black with subtle caramel highlights (NEVER blonde or platinum), fair skin, sharp defined eye makeup following current Taiwan beauty trends, matte or glossy bold lips, wearing contemporary designer outfit, modern and chic Taiwanese influencer look, confident expression",
        graceful: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, graceful 氣質女神 (Taiwan goddess) aesthetic, long flowing straight black hair, pale porcelain skin, delicate refined facial features typical of classic Taiwanese beauty, soft shimmer eyeshadow, natural flushed cheeks, gentle pink lips, wearing a classic evening dress, cultured refined Taiwanese hostess look, gentle warm smile",
        cool: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, bold 辣妹 (Taiwan hot-girl / 八大辣妹) nightlife aesthetic, long dyed hair in dark chocolate brown or deep chestnut with subtle caramel highlights (NEVER platinum or blonde) styled in Taiwan hot-girl fashion, fair-light skin, dramatic smoky eye makeup, feather lashes, nose contour, bold matte or glossy lips, wearing a figure-hugging sleek evening outfit, confident sultry Taiwanese 辣妹 nightlife look, captivating gaze",
        sexy: "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, sexy 性感火辣 (Taiwan seductive hot-girl) aesthetic, long wavy hair in glossy black / dark brown / caramel tones, toned curvy feminine figure with alluring silhouette, fair to light olive skin with healthy sheen, sultry eye makeup with defined lashes, plump glossy lips, subtle cleavage or backless design, wearing a figure-flattering low-cut or body-con evening dress (tasteful elegant sexy, not vulgar), confident flirty expression, mature Taiwanese 八大 nightlife sex-appeal look, commercial fashion editorial quality",
      };

      const sceneMap: Record<string, string> = {
        vip_room: "luxurious VIP private lounge with plush seating, ambient lighting, and exclusive decor",
        dance_floor: "vibrant nightclub dance floor with dynamic lighting effects and energetic atmosphere",
        bar_counter: "elegant bar counter with premium spirits display, professional bar setup, and sophisticated ambiance",
        red_carpet: "glamorous red carpet event setting with spotlights, velvet ropes, and VIP atmosphere",
        stage_show: "nightclub stage performance setting with spotlights, laser beams, LED walls, and dramatic stage lighting",
        lounge_sofa: "upscale velvet sofa booth seating area with warm ambient lighting, low tables, bottle service, and intimate lounge atmosphere",
        champagne_tower: "glamorous champagne tower ceremony with sparkling crystal glasses, golden champagne flowing, sparklers, and celebratory mood",
        edm_party: "high-energy EDM electronic music party with fog machines, laser lights, LED screens, raised hands, confetti, and euphoric crowd atmosphere",
        birthday_vip: "exclusive VIP birthday celebration setup with custom LED signage, balloon arch, cake, sparklers, and premium bottle service",
        starlight_corridor: "glamorous starlight entrance corridor with illuminated walkway, twinkling bokeh lights, mirrored walls, and red-carpet arrival mood",
      };

      const outfitMap: Record<string, string> = {
        silver_sequin: "wearing a shimmering silver sequin gown (rhinestone-studded, sparkling mini or midi dress suitable for stage/runway)",
        gold_gown: "wearing an elegant gold-toned evening gown (long luxurious gold-colored dress, VIP nightclub ready)",
        sweet_cutie: "wearing a sweet cute short dress (甜心小可愛 style, playful mini dress with ruffles or bow, youthful and flirty)",
        black_slip: "wearing a classic black slip evening dress (low-cut spaghetti strap, refined and sultry)",
        red_tight: "wearing a fiery red figure-hugging bodycon dress (tight-fitting, seductive)",
        lace_sheer: "wearing a delicate lace sheer dress (intricate lace detailing with tasteful sheer panels)",
        pastel_princess: "wearing a pastel princess-style tulle gown (pink or lavender dreamy princess dress with layered tulle)",
        crystal_mini: "wearing a crystal-embellished mini skirt outfit (rhinestone crystals, sparkling short skirt set)",
        velvet_bodycon: "wearing a luxurious velvet deep-V bodycon dress (rich velvet fabric, low-cut V-neck)",
        bikini_cover: "wearing a stylish bikini with sheer cover-up (pool-party ready with elegant mesh cover-up)",
        cheongsam: "wearing a modernized qipao / cheongsam with high slit (improved Taiwanese cheongsam, satin fabric, traditional collar with thigh slit)",
        white_angel: "wearing a pure white ethereal angel-style gown (dreamy flowing white dress with airy feel)",
      };
      const outfitDesc = input.outfitStyle ? outfitMap[input.outfitStyle] : "";

      const personDesc = input.personStyle ? personStyleMap[input.personStyle] : "a Taiwanese female hostess, East Asian (Han Chinese / Taiwanese) ethnicity, elegant 網美 (Taiwanese influencer) aesthetic, long black or dark brown hair, fair to light olive skin, almond-shaped eyes, defined lashes, glossy lips, wearing a sophisticated evening gown, Taiwan nightlife hostess look, genuine warm smile";
      const personDescFinal = outfitDesc ? `${personDesc}, specifically ${outfitDesc}` : personDesc;

      const ethnicLock = `STRICT REQUIREMENT — ALL women in this image MUST be Taiwanese (East Asian / Han Chinese), age 21-25, fair to light skin. NO EXCEPTIONS for any person in the frame.

CRITICAL — this rule applies INDIVIDUALLY to EVERY single woman. Check each face before finalizing: if ANY face could be mistaken for Western, European, Caucasian, Eurasian mixed-race, Russian, Eastern European, Southeast Asian (Thai/Filipino/Vietnamese), African, Indian, or any non-Han-Chinese ethnicity — REJECT and regenerate that face. Zero foreign faces allowed.

EAST ASIAN FACIAL FEATURES REQUIRED for every woman:
- Flatter facial profile (NOT high European nose bridge, NOT deep-set Caucasian eyes)
- Typical East Asian eye shape: almond with mild epicanthic fold, NOT deep-set round Western eyes
- Softer, rounder facial bone structure (NOT sharp angular Western cheekbones/jawline)
- Nose: gentle low-to-medium bridge with soft tip, NOT high sharp Western nose
- Lip shape: Asian lip proportions, NOT overly plump Western lips

HAIR: only black / dark brown / dark chocolate / warm brown / subtle caramel highlights on dark base. STRICTLY FORBIDDEN: blonde, platinum, silver, white, grey, ash, red-orange, or any obviously bleached Western hair color. Even one blonde/platinum person ruins the entire image.

Skin: porcelain or light ivory tone, NOT tanned, NOT dark, NOT olive-dark.

This is non-negotiable. Think real Taiwanese influencers like 愛瑞絲、吳宜樺、邵庭, real 八大 hostesses in Taipei/Taoyuan clubs — NOT Victoria's Secret models, NOT K-pop idols, NOT Japanese gravure models. Pure Taiwanese face.`;

      const referenceVariationClause = (input.hasUploadedPhoto && input.uploadedPhotoUrl)
        ? "IMPORTANT — use the uploaded reference photo only as STYLE / VIBE / POSE inspiration. Generate a DIFFERENT Taiwanese woman who looks similar to the reference but is clearly a different individual (different face, slightly different hairstyle, similar overall mood and aesthetic). Do NOT copy the reference face exactly. The new person still must follow all ethnic and age rules above."
        : "";

      const personCountClause = input.personCount > 1
        ? `CRITICAL GROUP COUNT — Generate EXACTLY ${input.personCount} Taiwanese women standing together in the same frame (group shot, ensemble poster style). All ${input.personCount} women must follow the ethnicity/age/skin rules above. Arrange them in a visually balanced composition typical of Taiwanese nightclub marketing posters — e.g. standing in a row, slightly offset in depth, or grouped in a V-formation. DO NOT generate a different number of people. Exactly ${input.personCount}.

CRITICAL FACIAL DIVERSITY — all ${input.personCount} women MUST have clearly DIFFERENT faces and appearances. They must look like ${input.personCount} distinct real individuals, NOT sisters, NOT twins, NOT the same face copy-pasted. Vary significantly:
- FACE SHAPE: mix of oval, heart-shaped, V-line, softly angular, slim almond — each person gets a different shape. NEVER round / chubby / puffy faces.
- EYE shape & size: some with larger almond eyes, some narrower, some with double eyelid, some monolid, different brow shapes
- NOSE: different nose bridges (some higher, some softer), different nose tip shapes
- LIPS: some fuller, some thinner, some with cupid's bow, different lip color tones
- FACIAL STRUCTURE: different cheekbone prominence, different chin shapes
- HAIRSTYLE: each person gets a distinct hairstyle — long straight black, long wavy with caramel highlights, medium wavy bob, shoulder-length with bangs, half-up, sleek ponytail, etc. NO two women share the same hairstyle
- OUTFIT: each wears a DIFFERENT color and style of dress (do not dress them identically)
- HEIGHT & BUILD: slight variation in height and frame
- SKIN TONE: all fair-to-light, but subtle micro-variation (some slightly more porcelain, some slightly warmer ivory)
- EXPRESSION: vary the smiles and expressions — some with open smile, some smirk, some gentle closed smile, some playful

The goal: each woman looks like a separate real Taiwanese individual you could recognize by her unique face, NOT an AI-generated clone family.`
        : "";

      const framingClause = "CRITICAL FRAMING RULE — ALL faces must be FULLY VISIBLE within the frame. NEVER crop, cut off, or partially hide any face at the edges of the poster. Every person's complete face (forehead, eyes, nose, mouth, chin) must be entirely inside the composition. Leave adequate margin between each face and the edge of the image. If necessary, zoom out or rearrange the composition to include everyone's full face. Face cropping is strictly forbidden.";

      const naturalismClause = `#1 TOP PRIORITY RULE — ANTI-PERFECTION / NON-NEGOTIABLE

The generated image MUST NOT look like an AI-generated beauty ad. Every woman's face must look like a REAL photographed human from a candid phone snapshot — NOT a glamour render, NOT a CGI avatar, NOT a polished magazine shot, NOT Instagram-filtered.

HARD REJECT any of these 'AI tells':
- Symmetrical doll faces
- Airbrushed porcelain skin with no pores or texture
- Perfectly aligned teeth, perfectly plucked brows, perfectly even makeup
- Identical beauty-level across all faces
- Glowing 'beauty mode' lighting with no real shadows
- Hair that looks like a shiny helmet with zero stray strands

MANDATORY imperfection budget (must be visible in the final image):
- At least one girl's skin shows actual pores, slight oiliness, mild unevenness, or faint blemishes
- At least one girl has visible facial asymmetry (eyes not identical, eyebrows slightly different, mouth slightly tilted)
- At least one girl has a small realistic 'flaw': tired under-eye, slight acne mark, slightly chapped lips, a baby hair sticking out, a stray eyelash
- Lighting has REAL shadow gradation on faces — one side slightly shadowed like real studio photography

The target aesthetic is 'candid real-life Taiwan hostess group photo taken on iPhone', NOT 'AI beauty generator'.

---

Real humans have:
- VISIBLE skin texture: pores, fine lines, subtle acne scars, faint freckles, peach fuzz, slight redness around nose/cheeks, minor blemishes. NO plastic/CGI smooth skin allowed.
- NATURAL asymmetry: eyes slightly uneven size, eyebrows not identical shape, smile slightly tilted, one side of face different from the other. Real faces are never symmetrical.
- REAL teeth: not Photoshop-white; slight natural off-white, tiny gaps or overlap, slight imperfections. No 'toothpaste ad' teeth.
- REAL hair: individual strands visible, flyaways, slightly messy edges, roots showing if dyed, not a 'helmet of perfection'.
- REAL lighting: visible shadow gradation, catchlights in eyes from actual light sources, specular highlights on skin from sweat/oil, NOT flat beauty-mode glow.

${input.personCount > 1 ? `CHARACTER DIVERSITY OF BEAUTY — with ${input.personCount} people in frame, DO NOT make all of them supermodel-perfect. MANDATORY: at least 1-2 of the ${input.personCount} must be clearly ORDINARY-LOOKING (普通), NOT stunning. These ordinary ones have:
- Plain girl-next-door features, 6-7/10 attractiveness (NOT 9-10/10)
- Smaller or narrower eyes, wider/flatter nose, less defined cheekbones
- Thinner or less plump lips
- Visible skin texture: mild acne, dark under-eye circles, dull patches, enlarged pores
- More relaxed/casual/awkward body posture (not a model-like pose)

CRITICAL — the ORDINARY ones MUST STILL have FULL nightclub 八大 風塵 makeup (they are working hostesses, not off-duty girls):
- Heavy defined eye makeup (smoky eyeshadow, thick eyeliner, false lashes or strong feather lashes)
- Bold lip color (deep red / mauve / glossy pink — NOT bare natural lips)
- Full contour, nose shadow, blush
- Styled hair (not plain / loose)
- Their face may be ordinary but their MAKEUP is full-on 八大 nightlife level
The look: 'ordinary-featured girl with heavy nightclub makeup on' — this is the authentic Taiwanese 八大 vibe. Plain face + full hostess glam = real hostess energy.

A frame full of only 10/10 beauties screams 'AI-generated fake'. Real 八大 team photos ALWAYS have variety in looks — but ALL with heavy makeup. Do not skip this rule.` : `Include real human imperfections — small flaws (tiny blemish, slight asymmetry, relatable expression) increase believability. Keep full 八大 nightclub makeup regardless.`}

BODY STANDARD — ALL women in this shot, however imperfect their face, must have a SLIM / SLENDER body. Nightclub hostesses MUST be slim. NO:
- No chubby, fat, or overweight women
- No round puffy faces, no double chin, no full/wide jaw
- No thick arms, no thick waist, no wide torso
- Faces should be oval, V-line, heart-shaped, or softly angular — NEVER round or chubby
All must have slim waist, slender arms, defined collarbone, good posture. This is a non-negotiable body requirement even when varying beauty levels.

OUTFIT EXPOSURE — outfits should be a bit more revealing and seductive (nightclub hostess style): slightly lower necklines showing collarbone and upper chest, figure-hugging silhouettes that emphasize the waist and hips, shorter hem lengths showing legs, tasteful cleavage or backless details, small cut-outs or sheer panels where appropriate. Tasteful and alluring, NOT vulgar or pornographic — think upscale 八大 nightlife fashion (sexy but classy).

The target is: people viewing the poster should think 'these are real Taiwanese hostesses photographed at the venue', NOT 'this is AI-generated'. Think real Taiwan IG candid shots and real team group photos — 70% polished, 30% raw reality.`;

      const referencePosterClause = input.referencePosterUrl
        ? "REFERENCE POSTER — the user has uploaded an existing poster as reference. Study its overall composition, color palette, mood, lighting style, decorative elements, and layout. Generate the new poster with a strong visual resemblance to the reference poster's design language (same typography vibe, similar background treatment, similar dressing style and pose energy), while keeping ALL the Taiwan ethnicity/age/skin rules."
        : "";
      const sceneDesc = input.scene ? sceneMap[input.scene] : "upscale nightclub venue with premium lighting and luxurious interior";

      const featureKeywords = input.features.length > 0
        ? `Special features: ${input.features.join(", ")}.`
        : "";

      const effectKeywords = input.effects.length > 0
        ? `Marketing objectives: ${input.effects.join(", ")}.`
        : "";

      const qualityTerms = "High quality commercial photography, professional studio lighting, magazine editorial style, sharp focus, vibrant colors, premium production value.";
      const personPhotographyTerms = "Photograph the person with natural, candid expression. Capture a genuine, relaxed moment - not a posed studio shot. The smile should look real and warm, with natural eye crinkle (Duchenne smile). Avoid stiff, robotic, or overly perfect expressions.";

      const typographyLine = input.excludeText
        ? "Design: clean background-focused composition, NO text, NO typography, NO words, NO letters on the image. Leave space for text overlay."
        : "Design: elegant bilingual (Chinese and English) typography, hotel name prominently featured, professional layout with decorative elements.";

      let imagePrompt = "";

      if (input.hasUploadedPhoto && input.uploadedPhotoUrl) {
        imagePrompt = `${ethnicLock}

${referenceVariationClause}
${naturalismClause}

${personCountClause}
${framingClause}
${referencePosterClause}

Professional nightclub marketing poster for ${hotelNames[input.hotel]}, a premium luxury entertainment venue in Taiwan.
Event theme: ${input.theme}.
Featuring: ${personDescFinal}.
Setting: ${sceneDesc}.
Style: ${styleDescriptions[input.style]}.
${featureKeywords}
${effectKeywords}
${typographyLine}
${input.customPrompt ? `Additional details: ${input.customPrompt}.` : ""}
${qualityTerms}
Vertical portrait format, classic poster aspect ratio 3:4 or 2:3 (same proportion as the Taiwan reference posters provided — traditional printable poster format, NOT phone-story 9:16). Compose the image to fit this wider-than-phone vertical rectangle.`;
      } else {
        imagePrompt = `${ethnicLock}

${naturalismClause}

${personCountClause}
${framingClause}
${referencePosterClause}

Professional nightclub marketing poster for ${hotelNames[input.hotel]}, a premium luxury entertainment venue in Taiwan.
Event theme: ${input.theme}.
Featuring: ${personDescFinal}.
Setting: ${sceneDesc}.
Style: ${styleDescriptions[input.style]}.
${featureKeywords}
${effectKeywords}
${typographyLine}
${personPhotographyTerms}
${input.customPrompt ? `Additional details: ${input.customPrompt}.` : ""}
${qualityTerms}
Vertical portrait format, classic poster aspect ratio 3:4 or 2:3 (same proportion as the Taiwan reference posters provided — traditional printable poster format, NOT phone-story 9:16). Compose the image to fit this wider-than-phone vertical rectangle.

FINAL REMINDERS (non-negotiable):
1. Persons MUST be Taiwanese (East Asian / Han Chinese / Taiwanese) — no Western, blonde, platinum, or mixed-race looks
2. ${input.personCount > 1 ? `EXACTLY ${input.personCount} women in the shot, EACH with clearly different face / hair / outfit / beauty level. 1-2 MUST look ordinary (6-7/10), not supermodels.` : "Face must look like a real photographed human, NOT AI-perfect."}
3. Visible skin texture, pores, asymmetry, and small imperfections are REQUIRED. Reject doll-like airbrushed faces.
4. Aesthetic target: candid iPhone-shot Taiwan nightclub team photo, NOT AI beauty render.`;
      }

      const refs: RefImage[] = [];
      if (input.hasUploadedPhoto && input.uploadedPhotoUrl) {
        const r = parseDataUrl(input.uploadedPhotoUrl, "character reference photo (use as style/pose inspiration for a DIFFERENT Taiwanese woman — do NOT clone the face)");
        if (r) refs.push(r);
      }
      if (input.referencePosterUrl) {
        const r = parseDataUrl(input.referencePosterUrl, "reference poster (match its composition, color palette, lighting, mood, typography placement, and overall design language)");
        if (r) refs.push(r);
      }
      // 若使用者沒上傳人物參考，從台灣地面真相池隨機抽 2 張當族裔參考
      if (!input.hasUploadedPhoto) {
        const autoRefs = await fetchTaiwanRefs(ctx.requestUrl, 2);
        refs.push(...autoRefs);
      }

      const imageDataUrl = await geminiGenerateImage(ctx.env.GEMINI_API_KEY, imagePrompt, refs);

      if (!imageDataUrl) {
        throw new Error("åççæå¤±æãImagen 4 éè¦ Google AI ä»è²»æ¹æ¡ï¼è«å° https://ai.dev/projects åç´å¾åè©¦ã");
      }

      return { imageBase64: imageDataUrl };
    }),

  suggestCopy: publicProcedure
    .input(
      z.object({
        hotel: z.enum(["chinatown", "dihao", "both"]).default("chinatown"),
        style: z.enum(["neon_electronic", "luxury_gold", "festival_red", "modern_minimal"]),
        theme: z.string(),
        features: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hotelLabels: Record<string, string> = {
        chinatown: "中國城經典酒店",
        dihao: "帝豪酒店",
        both: "中國城經典酒店 × 帝豪酒店",
      };

      const styleLabels: Record<string, string> = {
        neon_electronic: "霓虹電子風",
        luxury_gold: "奢華金色風",
        festival_red: "節慶紅金風",
        modern_minimal: "現代極簡風",
      };

      const systemPrompt = `你是一個在台灣八大行業酒店業工作多年的資深行銷，擅長寫吸睛的海報文案。
你要根據活動主題和風格，生成適合放在海報上的文字。

規則：
1. 標題要簡短有力，最多15個字，要有衝擊力
2. 副標題補充說明，最多20個字
3. 資訊行放日期/地點等細節，最多30個字
4. CTA按鈕文字要有行動力，最多10個字
5. 語氣要符合酒店業：有點性感、有點神秘、讓人想來
6. 文字要適合放在海報上，不是寫文章

請用 JSON 格式回覆，格式如下：
{"title": "主標題", "subtitle": "副標題", "info": "資訊行", "cta": "CTA按鈕"}
只回覆 JSON，不要有其他文字。`;

      const userPrompt = `酒店：${hotelLabels[input.hotel]}
風格：${styleLabels[input.style]}
活動主題：${input.theme}
${input.features.length > 0 ? `內容特色：${input.features.join("、")}` : ""}`;

      const content = await geminiGenerateText(ctx.env.GEMINI_API_KEY, { systemPrompt: withMarketing(systemPrompt), userPrompt,
      });

      try {
        const cleanJson = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleanJson) as { title: string; subtitle: string; info: string; cta: string };
        return {
          title: (parsed.title || "").slice(0, 15),
          subtitle: (parsed.subtitle || "").slice(0, 20),
          info: (parsed.info || "").slice(0, 30),
          cta: (parsed.cta || "").slice(0, 10),
        };
      } catch {
        return {
          title: "今夜不醉不歸",
          subtitle: "最頂級的夜生活體驗",
          info: "每晚 9:00 PM 起",
          cta: "立即預約",
        };
      }
    }),

  uploadPhoto: publicProcedure
    .input(
      z.object({
        base64Data: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      })
    )
    .mutation(async ({ input }) => {
      const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, "");
      return { base64, mimeType: input.mimeType, fileName: input.fileName };
    }),
});

// ===== Router: Suggestions =====
const suggestionsRouter = router({
  list: publicProcedure.query(async () => {
    return [];
  }),

  create: publicProcedure
    .input(
      z.object({
        nickname: z.string().min(1, "è«è¼¸å¥æ±ç¨±").max(100),
        category: z.enum(["feature", "bug", "design", "content", "other"]).default("other"),
        content: z.string().min(1, "è«è¼¸å¥å»ºè­°å§å®¹").max(2000),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Suggestions] Created:", { ...input });
      return { success: true };
    }),
});

// ===== Main App Router =====
const appRouter = router({
  copywriter: copywriterRouter,
  planner: plannerRouter,
  poster: posterRouter,
  suggestions: suggestionsRouter,
  recruit: recruitRouter,
});

export type AppRouter = typeof appRouter;

// ===== Cloudflare Pages Handler =====
export const onRequest: PagesFunction<Env> = async (context) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: context.request,
    router: appRouter,
    createContext: () => ({ env: context.env as unknown as Env, requestUrl: context.request.url }),
  });
};
