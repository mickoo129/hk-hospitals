/* 香港醫院指南：醫院資料
 * 來源：醫院管理局醫院／機構名單（地址、電話）、醫管局專科門診名單、各醫院網站、新聞報道。
 * 專科只列「主要提供」嘅專科，方便篩選；實際服務、時間以院方公佈為準。
 * 座標係大約位置，只用嚟計「直線距離」排序；地圖以 Google 地圖搜尋為準。
 *
 * 欄位：
 *   id        英文短名（網址 #id 用）
 *   name/en   中英文名
 *   type      public 公立（醫管局）｜private 私家｜cm 中醫醫院
 *   kind      分類標籤：綜合醫院、專科醫院、專科中心、復康／療養、護養院、紓緩治療
 *   region    港島｜九龍｜新界｜離島
 *   district  18 區
 *   cluster   醫管局聯網（私家留空）
 *   ae        true＝有 24 小時急症（公立：急症室；私家：24 小時門診／急症）
 *   aeName    即時急症室等候時間對應醫管局名稱（只限公立急症室）
 *   sopc      true＝有專科門診（公立需轉介信）
 *   opd       門診說明（私家：門診時間；公立：普通科／其他門診）
 *   specs     主要專科（用下面 SPECS 嘅名）
 *   inst      true＝療養／護養院舍（一般人唔可以直接求診，預設隱藏）
 *   mtr       港鐵／輕鐵交通（只寫醫院官方網頁或醫管局公佈嘅；冇就唔顯示，用「路線」交俾 Google 地圖計）
 *   fee       私家醫院門診／急症診金（唔包藥物、檢查；見 FEE_CHECKED）
 *   note      備註
 *   lat/lng   大約座標
 */
window.DATA_CHECKED = "2026 年 10 月 31 日";
window.FEE_CHECKED = "2026 年 10 月（綜合 2026 年 5 至 7 月傳媒整理嘅醫院公佈收費）";
window.SPECS = ["內科","外科","骨科","兒科","婦產科","眼科","耳鼻喉科","精神科","腫瘤科","心臟科","腦神經外科","復康科","紓緩治療","家庭醫學","中醫"];

(function(){
var ACUTE_PUB = ["內科","外科","骨科","兒科","婦產科","耳鼻喉科","精神科","腫瘤科","心臟科","腦神經外科"];
var PRIV_BIG = ["內科","外科","骨科","兒科","婦產科","眼科","耳鼻喉科","腫瘤科","心臟科","腦神經外科"];
function minus(a, b){ return a.filter(function(x){ return b.indexOf(x) < 0; }); }

window.HOSPITALS = [
/* ======================== 港島東聯網 ======================== */
{id:"pyneh",mtr:"港鐵柴灣站轉乘小巴 48M",name:"東區尤德夫人那打素醫院",en:"Pamela Youde Nethersole Eastern Hospital",type:"public",kind:"綜合醫院",region:"港島",district:"東區",cluster:"港島東",
 addr:"香港柴灣樂民道3號",phone:"2595 6111",web:"https://www.ha.org.hk/pyneh/",ae:true,aeName:"東區尤德夫人那打素醫院",sopc:true,
 specs:ACUTE_PUB.concat(["眼科"]),lat:22.2697,lng:114.2365},
{id:"rh",mtr:"港鐵灣仔站 A3 出口",name:"律敦治醫院",en:"Ruttonjee Hospital",type:"public",kind:"綜合醫院",region:"港島",district:"灣仔",cluster:"港島東",
 addr:"香港灣仔皇后大道東266號",phone:"2291 2000",web:"https://www.ha.org.hk/rh/",ae:true,aeName:"律敦治醫院",sopc:true,
 specs:["內科","外科","骨科","復康科","紓緩治療"],note:"胸肺內科為主要服務之一。",lat:22.2759,lng:114.1755},
{id:"tskh",mtr:"港鐵灣仔站 A3 出口",name:"鄧肇堅醫院",en:"Tang Shiu Kin Hospital",type:"public",kind:"專科中心",region:"港島",district:"灣仔",cluster:"港島東",
 addr:"香港灣仔皇后大道東282號",phone:"2291 2000",web:"https://www.ha.org.hk/rh/",ae:false,sopc:false,
 opd:"日間及社區健康服務（已無急症室）",specs:["家庭醫學"],lat:22.2752,lng:114.1768},
{id:"tweh",mtr:"港鐵銅鑼灣站 D2 出口轉乘巴士 5B",name:"東華東院",en:"Tung Wah Eastern Hospital",type:"public",kind:"綜合醫院",region:"港島",district:"灣仔",cluster:"港島東",
 addr:"香港銅鑼灣東院道19號",phone:"2162 6888",web:"https://www.ha.org.hk/tweh/",ae:false,sopc:true,
 specs:["內科","眼科","復康科","中醫"],lat:22.2775,lng:114.1880},
{id:"wchh",inst:true,name:"黃竹坑醫院",en:"Wong Chuk Hang Hospital",type:"public",kind:"復康／療養",region:"港島",district:"南區",cluster:"港島東",
 addr:"香港黃竹坑黃竹坑徑2號",phone:"2873 7222",web:"https://www.ha.org.hk/",ae:false,sopc:false,
 specs:["復康科","紓緩治療"],note:"老人科療養及紓緩服務。",lat:22.2508,lng:114.1658},
{id:"chkch",inst:true,name:"舂磡角慈氏護養院",en:"Cheshire Home, Chung Hom Kok",type:"public",kind:"護養院",region:"港島",district:"南區",cluster:"港島東",
 addr:"香港舂磡角道128號",phone:"2899 1300",web:"https://www.ha.org.hk/",ae:false,sopc:false,
 specs:["復康科"],note:"長期護養服務，需由醫院轉介。",lat:22.2136,lng:114.2025},
{id:"sjh",name:"長洲醫院",en:"St. John Hospital",type:"public",kind:"綜合醫院",region:"離島",district:"離島",cluster:"港島東",
 addr:"長洲東灣長洲醫院路",phone:"2986 2100",web:"https://www.ha.org.hk/",ae:true,aeName:"長洲醫院",sopc:true,
 specs:["內科","家庭醫學"],note:"離島急症室，嚴重個案會轉送市區醫院。",lat:22.2106,lng:114.0308},

/* ======================== 港島西聯網 ======================== */
{id:"qmh",name:"瑪麗醫院",en:"Queen Mary Hospital",type:"public",kind:"綜合醫院",region:"港島",district:"南區",cluster:"港島西",
 addr:"香港薄扶林道102號",phone:"2255 3838",web:"https://www.ha.org.hk/qmh/",ae:true,aeName:"瑪麗醫院",sopc:true,
 specs:ACUTE_PUB.concat(["復康科"]),note:"港島西眼科服務設於葛量洪醫院。",lat:22.2697,lng:114.1309},
{id:"gh",mtr:"港鐵黃竹坑站轉乘小巴 5M",name:"葛量洪醫院",en:"Grantham Hospital",type:"public",kind:"專科醫院",region:"港島",district:"南區",cluster:"港島西",
 addr:"香港香港仔黃竹坑道125號",phone:"2518 2111",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["內科","心臟科","腫瘤科","眼科","紓緩治療"],note:"心臟、胸肺、癌症及眼科專科（港島西眼科中心）。",lat:22.2522,lng:114.1557},
{id:"mmrc",name:"麥理浩復康院",en:"MacLehose Medical Rehabilitation Centre",type:"public",kind:"復康／療養",region:"港島",district:"南區",cluster:"港島西",
 addr:"香港薄扶林沙灣徑7號",phone:"2817 0018",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["復康科"],lat:22.2662,lng:114.1302},
{id:"dkch",name:"大口環根德公爵夫人兒童醫院",en:"The Duchess of Kent Children's Hospital at Sandy Bay",type:"public",kind:"專科醫院",region:"港島",district:"南區",cluster:"港島西",
 addr:"香港薄扶林大口環道12號",phone:"2817 7111",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["兒科","骨科","復康科"],note:"兒童骨科、脊柱及復康服務。",lat:22.2632,lng:114.1288},
{id:"fykh",name:"東華三院馮堯敬醫院",en:"TWGHs Fung Yiu King Hospital",type:"public",kind:"復康／療養",region:"港島",district:"南區",cluster:"港島西",
 addr:"香港薄扶林大口環道9號",phone:"2855 6111",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["復康科","內科"],note:"老人科及老人日間醫院。",lat:22.2643,lng:114.1306},
{id:"tyh",name:"贊育醫院",en:"Tsan Yuk Hospital",type:"public",kind:"專科中心",region:"港島",district:"中西區",cluster:"港島西",
 addr:"香港西營盤醫院道30號",phone:"2589 2100",web:"https://www.ha.org.hk/tyh/",ae:false,sopc:true,
 opd:"婦科及產前產後門診；不設接生（分娩須在瑪麗醫院登記）",specs:["婦產科","家庭醫學"],lat:22.2856,lng:114.1424},
{id:"twh",name:"東華醫院",en:"Tung Wah Hospital",type:"public",kind:"綜合醫院",region:"港島",district:"中西區",cluster:"港島西",
 addr:"香港上環普仁街12號",phone:"2589 8111",web:"https://www.ha.org.hk/twh/",ae:false,sopc:true,
 specs:["內科","外科","復康科","中醫"],lat:22.2858,lng:114.1477},

/* ======================== 九龍中聯網 ======================== */
{id:"qeh",mtr:"港鐵佐敦站 B2 出口",name:"伊利沙伯醫院",en:"Queen Elizabeth Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"油尖旺",cluster:"九龍中",
 addr:"九龍加士居道30號",phone:"3506 8888",web:"https://www3.ha.org.hk/qeh/",ae:true,aeName:"伊利沙伯醫院",sopc:true,
 specs:ACUTE_PUB,note:"2026 年 10 月起，內科、外科、腦神經外科及家庭醫學專科門診已遷往啟德醫院；九龍中眼科服務設於香港眼科醫院。",lat:22.3093,lng:114.1747},
{id:"kwh",name:"廣華醫院",en:"Kwong Wah Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"油尖旺",cluster:"九龍中",
 addr:"九龍窩打老道25號",phone:"2332 2311",web:"https://www.ha.org.hk/kwh/",ae:true,aeName:"廣華醫院",sopc:true,
 specs:["內科","外科","骨科","兒科","婦產科","耳鼻喉科","精神科","中醫"],lat:22.3149,lng:114.1724},
{id:"hkeh",mtr:"港鐵宋皇臺站 B1 出口，步行約 10 分鐘",name:"香港眼科醫院",en:"Hong Kong Eye Hospital",type:"public",kind:"專科醫院",region:"九龍",district:"九龍城",cluster:"九龍中",
 addr:"九龍亞皆老街147K",phone:"2762 3007",web:"https://www3.ha.org.hk/HKEH/",ae:false,sopc:true,
 opd:"眼科專科門診（星期一至五）；緊急眼疾請先致電或到急症室",specs:["眼科"],lat:22.3233,lng:114.1806},
{id:"kh",name:"九龍醫院",en:"Kowloon Hospital",type:"public",kind:"專科醫院",region:"九龍",district:"九龍城",cluster:"九龍中",
 addr:"九龍亞皆老街147A",phone:"3129 7111",web:"https://www3.ha.org.hk/kh/",ae:false,sopc:true,
 specs:["內科","復康科","精神科"],note:"胸肺內科、復康及精神科。",lat:22.3240,lng:114.1790},
{id:"hkch",mtr:"港鐵啟德站、九龍灣站等轉乘巴士或小巴",name:"香港兒童醫院",en:"Hong Kong Children's Hospital",type:"public",kind:"專科醫院",region:"九龍",district:"九龍城",cluster:"九龍中",
 addr:"九龍灣承昌道1號",phone:"3513 3888",web:"https://www31.ha.org.hk/hkch/",ae:false,sopc:true,
 specs:["兒科","腫瘤科","心臟科"],note:"處理兒童複雜、嚴重及罕見病症，需由醫生轉介；不設急症室。",lat:22.3245,lng:114.2093},
{id:"kth",mtr:"港鐵九龍灣站經 MegaBox 有蓋天橋步行約 10–12 分鐘，或轉乘小巴 86",name:"啟德醫院",en:"Kai Tak Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"九龍城",cluster:"九龍中",
 addr:"九龍灣承昌道2至3號",phone:"3506 5188",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["內科","外科","腦神經外科","腫瘤科","婦產科","家庭醫學"],opd:"家庭醫學綜合中心；內科、外科、腦神經外科、家庭醫學專科門診（由伊利沙伯醫院遷入）；腫瘤科覆診、婦產科及腫瘤科日間服務",note:"2026 年 10 月起分階段啟用；急症室、住院及手術服務預計 2028 年投入服務。熱線 3506 5188（星期一至五 10:00–19:00；週末及假期 10:00–14:00）。",lat:22.3270,lng:114.2085},
{id:"hkbh",mtr:"港鐵樂富站 B 出口，步行約 5 分鐘",name:"香港佛教醫院",en:"Hong Kong Buddhist Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"黃大仙",cluster:"九龍中",
 addr:"九龍樂富杏林街10號",phone:"2339 6111",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["內科","復康科"],lat:22.3384,lng:114.1873},
{id:"olmh",mtr:"港鐵黃大仙站 A 或 E 出口轉乘小巴 73",name:"聖母醫院",en:"Our Lady of Maryknoll Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"黃大仙",cluster:"九龍中",
 addr:"九龍黃大仙沙田坳道118號",phone:"2320 2121",web:"https://www.ha.org.hk/olmh/",ae:false,sopc:true,
 specs:["內科","家庭醫學","復康科"],lat:22.3427,lng:114.1960},
{id:"wtsh",inst:true,name:"東華三院黃大仙醫院",en:"TWGHs Wong Tai Sin Hospital",type:"public",kind:"復康／療養",region:"九龍",district:"黃大仙",cluster:"九龍中",
 addr:"九龍黃大仙沙田坳道124號",phone:"2320 0377",web:"https://www.ha.org.hk/",ae:false,sopc:false,
 specs:["復康科","紓緩治療"],lat:22.3437,lng:114.1966},

/* ======================== 九龍東聯網 ======================== */
{id:"uch",mtr:"港鐵觀塘站 A1 出口轉乘小巴 50",name:"基督教聯合醫院",en:"United Christian Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"觀塘",cluster:"九龍東",
 addr:"九龍觀塘協和街130號",phone:"3949 4000",web:"https://www.ha.org.hk/uch/",ae:true,aeName:"基督教聯合醫院",sopc:true,
 specs:minus(ACUTE_PUB,["腦神經外科"]).concat(["眼科"]),lat:22.3224,lng:114.2283},
{id:"tkoh",name:"將軍澳醫院",en:"Tseung Kwan O Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"西貢",cluster:"九龍東",
 addr:"將軍澳坑口寶寧里2號",phone:"2208 0111",web:"https://www.ha.org.hk/tkoh/",ae:true,aeName:"將軍澳醫院",sopc:true,
 specs:["內科","外科","骨科","兒科","婦產科","眼科"],lat:22.3170,lng:114.2700},
{id:"hohh",name:"靈實醫院",en:"Haven of Hope Hospital",type:"public",kind:"復康／療養",region:"新界",district:"西貢",cluster:"九龍東",
 addr:"將軍澳靈實路8號",phone:"2703 8888",web:"https://www.ha.org.hk/hohh/",ae:false,sopc:true,
 specs:["內科","復康科","紓緩治療"],lat:22.3190,lng:114.2620},

/* ======================== 九龍西聯網 ======================== */
{id:"pmh",name:"瑪嘉烈醫院",en:"Princess Margaret Hospital",type:"public",kind:"綜合醫院",region:"九龍",district:"葵青",cluster:"九龍西",
 addr:"九龍荔枝角瑪嘉烈醫院道2-10號",phone:"2990 1111",web:"https://www.ha.org.hk/pmh/",ae:true,aeName:"瑪嘉烈醫院",sopc:true,
 specs:minus(ACUTE_PUB,["精神科"]),note:"九龍西眼科服務設於明愛醫院；精神科設於葵涌醫院。",lat:22.3401,lng:114.1340},
{id:"cmc",name:"明愛醫院",en:"Caritas Medical Centre",type:"public",kind:"綜合醫院",region:"九龍",district:"深水埗",cluster:"九龍西",
 addr:"九龍深水埗永康街111號",phone:"3408 7911",web:"https://www.ha.org.hk/cmc/",ae:true,aeName:"明愛醫院",sopc:true,
 specs:["內科","外科","骨科","兒科","眼科","復康科"],lat:22.3407,lng:114.1530},
{id:"kch",name:"葵涌醫院",en:"Kwai Chung Hospital",type:"public",kind:"專科醫院",region:"新界",district:"葵青",cluster:"九龍西",
 addr:"新界葵涌醫院道3-15號",phone:"2959 8111",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["精神科"],lat:22.3564,lng:114.1307},
{id:"ych",name:"仁濟醫院",en:"Yan Chai Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"荃灣",cluster:"九龍西",
 addr:"新界荃灣仁濟街7-11號",phone:"2417 8383",web:"https://www.ha.org.hk/ych/",ae:true,aeName:"仁濟醫院",sopc:true,
 specs:["內科","外科","骨科","兒科"],lat:22.3695,lng:114.1197},
{id:"nlth",name:"北大嶼山醫院",en:"North Lantau Hospital",type:"public",kind:"綜合醫院",region:"離島",district:"離島",cluster:"九龍西",
 addr:"大嶼山東涌松仁路8號",phone:"3467 7000",web:"https://www.ha.org.hk/nlth/",ae:true,aeName:"北大嶼山醫院",sopc:true,
 specs:["內科","家庭醫學"],lat:22.2826,lng:113.9395},

/* ======================== 新界東聯網 ======================== */
{id:"pwh",mtr:"港鐵第一城站",name:"威爾斯親王醫院",en:"Prince of Wales Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"沙田",cluster:"新界東",
 addr:"新界沙田銀城街30-32號",phone:"3505 2211",web:"https://www3.ha.org.hk/pwh/",ae:true,aeName:"威爾斯親王醫院",sopc:true,
 specs:ACUTE_PUB.concat(["眼科"]),lat:22.3797,lng:114.2015},
{id:"ahnh",name:"雅麗氏何妙齡那打素醫院",en:"Alice Ho Miu Ling Nethersole Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"大埔",cluster:"新界東",
 addr:"新界大埔全安路11號",phone:"2689 2000",web:"https://www.ha.org.hk/ahnh/",ae:true,aeName:"雅麗氏何妙齡那打素醫院",sopc:true,
 specs:["內科","外科","骨科","眼科"],lat:22.4589,lng:114.1747},
{id:"ndh",name:"北區醫院",en:"North District Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"北區",cluster:"新界東",
 addr:"新界上水保健路9號",phone:"2683 8888",web:"https://www.ha.org.hk/ndh/",ae:true,aeName:"北區醫院",sopc:true,
 specs:["內科","外科","骨科","兒科"],lat:22.4970,lng:114.1246},
{id:"tph",name:"大埔醫院",en:"Tai Po Hospital",type:"public",kind:"復康／療養",region:"新界",district:"大埔",cluster:"新界東",
 addr:"新界大埔全安路9號",phone:"2607 6111",web:"https://www.ha.org.hk/tph/",ae:false,sopc:true,
 specs:["內科","復康科","精神科"],lat:22.4580,lng:114.1722},
{id:"sh",name:"沙田醫院",en:"Shatin Hospital",type:"public",kind:"復康／療養",region:"新界",district:"沙田",cluster:"新界東",
 addr:"新界沙田馬鞍山亞公角街33號",phone:"3919 7500",web:"https://www.ha.org.hk/sh/",ae:false,sopc:true,
 specs:["內科","復康科","精神科"],lat:22.4043,lng:114.2160},
{id:"bh",inst:true,name:"白普理寧養中心",en:"Bradbury Hospice",type:"public",kind:"紓緩治療",region:"新界",district:"沙田",cluster:"新界東",
 addr:"新界沙田亞公角山路17號",phone:"2636 0163",web:"https://www.ha.org.hk/",ae:false,sopc:true,
 specs:["紓緩治療"],note:"末期癌症紓緩及寧養服務，需由醫生轉介。",lat:22.4005,lng:114.2118},
{id:"stch",inst:true,name:"沙田慈氏護養院",en:"Cheshire Home, Shatin",type:"public",kind:"護養院",region:"新界",district:"沙田",cluster:"新界東",
 addr:"新界沙田亞公角山路30號",phone:"2636 7288",web:"https://www.ha.org.hk/",ae:false,sopc:false,
 specs:["復康科"],note:"長期護養服務，需由醫院轉介。",lat:22.4012,lng:114.2104},

/* ======================== 新界西聯網 ======================== */
{id:"tmh",name:"屯門醫院",en:"Tuen Mun Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"屯門",cluster:"新界西",
 addr:"新界屯門青松觀路23號",phone:"2468 5111",web:"https://www3.ha.org.hk/tmh/",ae:true,aeName:"屯門醫院",sopc:true,
 specs:ACUTE_PUB.concat(["復康科"]),note:"新界西眼科服務設於屯門眼科中心及博愛醫院。",lat:22.4069,lng:113.9760},
{id:"tmec",name:"屯門眼科中心",en:"Tuen Mun Eye Centre",type:"public",kind:"專科中心",region:"新界",district:"屯門",cluster:"新界西",
 addr:"新界屯門屯利街4號",phone:"2468 5111",web:"https://www3.ha.org.hk/tmh/",ae:false,sopc:true,
 opd:"眼科專科門診（電話為屯門醫院總機）",specs:["眼科"],lat:22.3935,lng:113.9745},
{id:"poh",name:"博愛醫院",en:"Pok Oi Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"元朗",cluster:"新界西",
 addr:"新界元朗坳頭",phone:"2486 8000",web:"https://www.ha.org.hk/poh/",ae:true,aeName:"博愛醫院",sopc:true,
 specs:["內科","外科","骨科","眼科","中醫"],lat:22.4448,lng:114.0446},
{id:"tswh",mtr:"輕鐵頌富站",name:"天水圍醫院",en:"Tin Shui Wai Hospital",type:"public",kind:"綜合醫院",region:"新界",district:"元朗",cluster:"新界西",
 addr:"新界天水圍天壇街11號",phone:"3513 5000",web:"https://www.ha.org.hk/tswh/",ae:true,aeName:"天水圍醫院",sopc:true,
 specs:["內科","家庭醫學"],lat:22.4590,lng:113.9967},
{id:"cph",name:"青山醫院",en:"Castle Peak Hospital",type:"public",kind:"專科醫院",region:"新界",district:"屯門",cluster:"新界西",
 addr:"新界屯門青松觀路15號",phone:"2456 7111",web:"https://www3.ha.org.hk/cph/",ae:false,sopc:true,
 specs:["精神科"],lat:22.4093,lng:113.9781},
{id:"slh",inst:true,name:"小欖醫院",en:"Siu Lam Hospital",type:"public",kind:"專科醫院",region:"新界",district:"屯門",cluster:"新界西",
 addr:"新界屯門青松觀路15號",phone:"2456 7111",web:"https://www.ha.org.hk/",ae:false,sopc:false,
 specs:["精神科"],note:"為嚴重智障人士提供住院及復康服務。",lat:22.4095,lng:113.9784},

/* ======================== 中醫醫院 ======================== */
{id:"hkcmh",name:"香港中醫醫院",en:"Chinese Medicine Hospital of Hong Kong",type:"cm",kind:"中醫醫院",region:"新界",district:"西貢",cluster:"",
 addr:"新界將軍澳百勝角路1號",phone:"3121 3121",web:"https://www.cmhhk.org.hk/",ae:false,sopc:true,
 opd:"中醫門診及日間住院：內科、外科、婦科、兒科、骨傷科、針灸；設政府資助及市場化服務（預約熱線星期一至六 9:00–18:00）",specs:["中醫"],
 note:"香港首間中醫醫院，2025 年 12 月起分階段服務；住院服務預計第二年起提供。",lat:22.3146,lng:114.2733},

/* ======================== 私家醫院 ======================== */
{id:"hksh",fee:"平日日間 $400、晚上 $500、深夜 $700；星期日及假期 $500–700",name:"養和醫院",en:"Hong Kong Sanatorium & Hospital",type:"private",kind:"綜合醫院",region:"港島",district:"灣仔",cluster:"",
 addr:"香港跑馬地山村道2號",phone:"2572 0211",web:"https://www.hksh-hospital.com/",ae:true,sopc:true,
 opd:"24 小時門診",specs:PRIV_BIG.concat(["精神科"]),lat:22.2686,lng:114.1830},
{id:"stpaul",fee:"星期一至六日間 $280、晚上 $430；星期日及假期 $350–470",name:"聖保祿醫院",en:"St. Paul's Hospital",type:"private",kind:"綜合醫院",region:"港島",district:"灣仔",cluster:"",
 addr:"香港銅鑼灣東院道2號",phone:"2890 6008",web:"https://www.stpaul.org.hk/",ae:true,sopc:true,
 opd:"24 小時門診",specs:PRIV_BIG,lat:22.2778,lng:114.1885},
{id:"hkah-sr",fee:"普通科 $450 起（星期日及假期 $550 起）；急症診症 $1,200",name:"香港港安醫院－司徒拔道",en:"Hong Kong Adventist Hospital – Stubbs Road",type:"private",kind:"綜合醫院",region:"港島",district:"灣仔",cluster:"",
 addr:"香港司徒拔道40號",phone:"3651 8888",web:"https://www.hkah.org.hk/",ae:true,sopc:true,
 opd:"24 小時急症",specs:PRIV_BIG,lat:22.2689,lng:114.1849},
{id:"gleneagles",mtr:"港鐵海洋公園站 C 出口步行約 8 分鐘；或黃竹坑站 A 出口轉乘免費穿梭巴士",fee:"平日日間 $400、晚上 $500、深夜 $800；危急個案 $1,500（2026 年 7 月 1 日至 10 月 31 日收費）",name:"港怡醫院",en:"Gleneagles Hospital Hong Kong",type:"private",kind:"綜合醫院",region:"港島",district:"南區",cluster:"",
 addr:"香港黃竹坑南風徑1號",phone:"3153 9000",web:"https://gleneagles.hk/",ae:true,sopc:true,
 opd:"24 小時門診及急症",specs:PRIV_BIG.concat(["精神科"]),lat:22.2486,lng:114.1748},
{id:"canossa",fee:"平日日間 $388、晚上 $500、深夜 $800",name:"嘉諾撒醫院",en:"Canossa Hospital (Caritas)",type:"private",kind:"綜合醫院",region:"港島",district:"中西區",cluster:"",
 addr:"香港舊山頂道1號",phone:"2522 2181",web:"https://www.canossahospital.org.hk/",ae:true,sopc:true,
 opd:"24 小時門診",specs:["內科","外科","骨科","兒科","婦產科","眼科","耳鼻喉科"],lat:22.2764,lng:114.1547},
{id:"matilda",fee:"星期一至六日間 $590、晚上 $900、深夜 $1,000；星期日及假期日間 $800",name:"明德國際醫院",en:"Matilda International Hospital",type:"private",kind:"綜合醫院",region:"港島",district:"中西區",cluster:"",
 addr:"香港山頂加列山道41號",phone:"2849 0111",web:"https://www.matilda.org/",ae:true,sopc:true,
 opd:"24 小時門診",specs:["內科","外科","骨科","兒科","婦產科"],lat:22.2625,lng:114.1519},
{id:"hkbaptist",fee:"平日日間 $400、晚上 $700、深夜 $1,000；星期日及假期 $700–1,000",name:"香港浸信會醫院",en:"Hong Kong Baptist Hospital",type:"private",kind:"綜合醫院",region:"九龍",district:"九龍城",cluster:"",
 addr:"九龍窩打老道222號",phone:"2339 8888",web:"https://www.hkbh.org.hk/",ae:true,sopc:true,
 opd:"24 小時門診",specs:PRIV_BIG,lat:22.3345,lng:114.1792},
{id:"sth",fee:"星期一至六日間 $280、晚上 $430；星期日及假期 $350–470",name:"聖德肋撒醫院（法國醫院）",en:"St. Teresa's Hospital",type:"private",kind:"綜合醫院",region:"九龍",district:"九龍城",cluster:"",
 addr:"九龍太子道西327號",phone:"2200 3434",web:"https://www.sth.org.hk/",ae:true,sopc:true,
 opd:"24 小時普通科門診（須網上預約）",specs:PRIV_BIG,lat:22.3285,lng:114.1840},
{id:"evangel",mtr:"港鐵宋皇臺站 B1 出口",fee:"7:00–21:00：星期一至六 $285，星期日及假期 $395",name:"播道醫院",en:"Evangel Hospital",type:"private",kind:"綜合醫院",region:"九龍",district:"九龍城",cluster:"",
 addr:"九龍亞皆老街222號",phone:"2711 5222",web:"https://www.evangel.org.hk/",ae:false,sopc:true,
 opd:"門診 7:00–21:00（非 24 小時）",specs:["內科","外科","骨科","婦產科","腫瘤科","中醫"],lat:22.3236,lng:114.1864},
{id:"pbh",fee:"8:00–22:00：星期一至六日間 $280，20:00 後及假期 $390",name:"寶血醫院（明愛）",en:"Precious Blood Hospital (Caritas)",type:"private",kind:"綜合醫院",region:"九龍",district:"深水埗",cluster:"",
 addr:"九龍深水埗青山道113號",phone:"3971 9900",web:"https://www.pbh.hk/",ae:false,sopc:true,
 opd:"門診 8:00–22:00（非 24 小時）",specs:["內科","外科","骨科","婦產科"],lat:22.3311,lng:114.1633},
{id:"union",fee:"平日日間 $420、晚上 $900、深夜 $1,100–1,500",name:"仁安醫院",en:"Union Hospital",type:"private",kind:"綜合醫院",region:"新界",district:"沙田",cluster:"",
 addr:"新界沙田大圍富健街18號",phone:"2608 3388",web:"https://www.union.org/",ae:true,sopc:true,
 opd:"24 小時門診",specs:PRIV_BIG,lat:22.3695,lng:114.1788},
{id:"cuhkmc",mtr:"港鐵大學站 B 出口",fee:"平日日間 $400、晚上 $600、深夜 $800",name:"香港中文大學醫院",en:"CUHK Medical Centre",type:"private",kind:"綜合醫院",region:"新界",district:"沙田",cluster:"",
 addr:"新界沙田澤祥街9號",phone:"3946 6888",web:"https://www.cuhkmc.hk/",ae:true,sopc:true,
 opd:"24 小時門診",specs:PRIV_BIG,note:"非牟利私家醫院，部分服務有套餐收費。",lat:22.4146,lng:114.2103},
{id:"hkah-tw",fee:"急症中心：平日日間 $480、晚上 $800、深夜 $950",name:"香港港安醫院－荃灣",en:"Hong Kong Adventist Hospital – Tsuen Wan",type:"private",kind:"綜合醫院",region:"新界",district:"荃灣",cluster:"",
 addr:"新界荃灣荃景圍199號",phone:"2275 6688",web:"https://www.twah.org.hk/",ae:true,sopc:true,
 opd:"24 小時急症中心；普通科門診另有時間",specs:minus(PRIV_BIG,["腦神經外科"]),lat:22.3734,lng:114.1056}
];
})();
