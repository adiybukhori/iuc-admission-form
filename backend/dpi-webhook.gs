const DPI_ADMIN_EMAIL='adiybukhori@innovative.edu.my';
const DPI_TIMEZONE='Asia/Kuala_Lumpur';
const DPI_APPLICATION_SHEET='Applications';
const DPI_CORPORATE_SHEET='Corporate Leads';

function setupDpiBackend(){
  const props=PropertiesService.getScriptProperties();
  let spreadsheetId=props.getProperty('DPI_SPREADSHEET_ID');
  if(!spreadsheetId){
    const ss=SpreadsheetApp.create('Dana Pendidikan Inovatif - Applications Database');
    spreadsheetId=ss.getId();
    props.setProperty('DPI_SPREADSHEET_ID',spreadsheetId);
    const first=ss.getSheets()[0];
    first.setName(DPI_APPLICATION_SHEET);
    ss.insertSheet(DPI_CORPORATE_SHEET);
  }
  let token=props.getProperty('DPI_WEBHOOK_TOKEN');
  if(!token){token=Utilities.getUuid()+Utilities.getUuid();props.setProperty('DPI_WEBHOOK_TOKEN',token);}
  ensureDpiSheets_();
  const result={spreadsheetUrl:'https://docs.google.com/spreadsheets/d/'+spreadsheetId,webhookToken:token};
  Logger.log(JSON.stringify(result));
  return result;
}

function doGet(){
  return dpiJson_({ok:true,service:'DPI Application API'});
}

function doPost(e){
  try{
    const payload=JSON.parse(e&&e.postData&&e.postData.contents?e.postData.contents:'{}');
    const expected=PropertiesService.getScriptProperties().getProperty('DPI_WEBHOOK_TOKEN');
    if(!expected||payload.token!==expected)throw new Error('Unauthorized request.');
    if(payload.action==='dpiApplication')return dpiJson_(saveDpiApplication_(payload));
    if(payload.action==='dpiCorporate')return dpiJson_(saveDpiCorporate_(payload));
    throw new Error('Unsupported action.');
  }catch(error){
    return dpiJson_({ok:false,message:error&&error.message?error.message:String(error)});
  }
}

function saveDpiApplication_(payload){
  const d=payload.data||{};
  const required=['fullName','phone','email','workStatus','purpose','approvalHope','studyTime','mainChallenge','paymentPreference','startReadiness','shareWillingness'];
  dpiRequire_(d,required);
  const ss=ensureDpiSheets_();
  const sheet=ss.getSheetByName(DPI_APPLICATION_SHEET);
  const now=new Date();
  const reference=dpiReference_('DPI',now);
  sheet.appendRow([
    reference,dpiDate_(now),d.fullName,d.phone,d.email,d.workStatus,d.programme||'Diploma in Business Administration (ODL)',d.purpose,d.approvalHope,d.studyTime,d.mainChallenge,d.paymentPreference,d.startReadiness,d.shareWillingness,d.commitmentAccepted===true?'Yes':'No',d.source||'dpi-campaign','New Application',''
  ]);
  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI] Permohonan Baharu - '+d.fullName,
    body:'Permohonan Dana Pendidikan Inovatif baharu telah diterima.\n\nRujukan: '+reference+'\nNama: '+d.fullName+'\nWhatsApp: '+d.phone+'\nEmail: '+d.email+'\nStatus pekerjaan: '+d.workStatus+'\nProgram: '+(d.programme||'Diploma in Business Administration (ODL)')+'\n\nTujuan / perubahan diharapkan:\n'+d.purpose+'\n\nHarapan jika diluluskan:\n'+d.approvalHope+'\n\nMasa belajar: '+d.studyTime+'\nCabaran utama: '+d.mainChallenge+'\nPilihan bayaran: '+d.paymentPreference+'\nKesediaan bermula: '+d.startReadiness+'\nKesediaan berkongsi: '+d.shareWillingness+'\n\nDatabase: '+ss.getUrl()
  });
  return {ok:true,reference:reference};
}

function saveDpiCorporate_(payload){
  const d=payload.data||{};
  const required=['organization','picName','role','email','phone','staffCount','programmeInterest','partnershipInterest'];
  dpiRequire_(d,required);
  const ss=ensureDpiSheets_();
  const sheet=ss.getSheetByName(DPI_CORPORATE_SHEET);
  const now=new Date();
  const reference=dpiReference_('DPI-CORP',now);
  sheet.appendRow([
    reference,dpiDate_(now),d.organization,d.picName,d.role,d.email,d.phone,d.staffCount,d.programmeInterest,d.partnershipInterest,d.source||'dpi-campaign','Corporate Lead',''
  ]);
  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI Corporate] Lead Baharu - '+d.organization,
    body:'Pertanyaan kerjasama korporat baharu telah diterima.\n\nRujukan: '+reference+'\nOrganisasi: '+d.organization+'\nPIC: '+d.picName+'\nJawatan: '+d.role+'\nEmail: '+d.email+'\nTelefon: '+d.phone+'\nAnggaran staf: '+d.staffCount+'\nProgram / bidang: '+d.programmeInterest+'\n\nBentuk kerjasama:\n'+d.partnershipInterest+'\n\nDatabase: '+ss.getUrl()
  });
  return {ok:true,reference:reference};
}

function ensureDpiSheets_(){
  const id=PropertiesService.getScriptProperties().getProperty('DPI_SPREADSHEET_ID');
  if(!id)throw new Error('Run setupDpiBackend() once before deploying the web app.');
  const ss=SpreadsheetApp.openById(id);
  let app=ss.getSheetByName(DPI_APPLICATION_SHEET);if(!app)app=ss.insertSheet(DPI_APPLICATION_SHEET);
  let corp=ss.getSheetByName(DPI_CORPORATE_SHEET);if(!corp)corp=ss.insertSheet(DPI_CORPORATE_SHEET);
  const appHeaders=['Reference','Submitted At','Full Name','WhatsApp','Email','Work Status','Programme','Purpose / Expected Change','Hope If Approved','Study Time / Week','Main Challenge','Payment Preference','Start Readiness','Share Willingness','Commitment Accepted','Source','Status','Remarks'];
  const corpHeaders=['Reference','Submitted At','Organization','PIC Name','Role','Corporate Email','Phone / WhatsApp','Estimated Staff','Programme Interest','Partnership Interest','Source','Status','Remarks'];
  dpiEnsureHeaders_(app,appHeaders);dpiEnsureHeaders_(corp,corpHeaders);
  app.setFrozenRows(1);corp.setFrozenRows(1);
  return ss;
}

function dpiEnsureHeaders_(sheet,headers){
  if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);
  else if(sheet.getRange(1,1).getValue()!==headers[0])sheet.insertRowBefore(1),sheet.getRange(1,1,1,headers.length).setValues([headers]);
}
function dpiRequire_(data,keys){keys.forEach(function(key){if(data[key]===undefined||data[key]===null||String(data[key]).trim()==='')throw new Error('Missing required field: '+key);});}
function dpiReference_(prefix,date){return prefix+'-'+Utilities.formatDate(date,DPI_TIMEZONE,'yyyyMMdd-HHmmss')+'-'+Math.floor(1000+Math.random()*9000);}
function dpiDate_(date){return Utilities.formatDate(date,DPI_TIMEZONE,'yyyy-MM-dd HH:mm:ss');}
function dpiJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
