(function(){
const SPEC_EN={"內科":"Medicine","外科":"Surgery","骨科":"Orthopaedics","兒科":"Paediatrics","婦科":"Gynaecology","眼科":"Ophthalmology","耳鼻喉科":"ENT","精神科":"Psychiatry","急症科":"A&E","復康":"Rehabilitation","腫瘤科":"Oncology","家庭醫學":"Family medicine","心臟科":"Cardiology","胸肺科":"Respiratory","產科":"Obstetrics","紓緩治療":"Palliative care","護養":"Infirmary","小兒外科":"Paediatric surgery","兒童癌症":"Paediatric oncology","日間醫療":"Day services","輸血服務":"Blood service","智障服務":"Intellectual disability service"};
window.SPEC_EN=SPEC_EN;
window.specToEn=function(s){return String(s||"").split("、").map(function(x){return SPEC_EN[x]||x;}).join(", ");};
})();
