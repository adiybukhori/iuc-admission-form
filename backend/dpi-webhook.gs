const DPI_ADMIN_EMAIL='adiybukhori@innovative.edu.my';
const DPI_TIMEZONE='Asia/Kuala_Lumpur';
const DPI_SPREADSHEET_ID='15P3fP6v7m3Pq3365mx-VvRrNlTqn5aRjoNr3S1J7-NM';
const DPI_APPLICATION_SHEET='Applications';
const DPI_CORPORATE_SHEET='Corporate Leads';
const DPI_ACTIVITY_SHEET='Activity Log';

function setupDpiBackend(){
  const props=PropertiesService.getScriptProperties();
  let token=props.getProperty('DPI_WEBHOOK_TOKEN');
  if(!token){
    token=Utilities.getUuid()+Utilities.getUuid();
    props.setProperty('DPI_WEBHOOK_TOKEN',token);
  }
  ensureDpiSheets_();
  const result={
    spreadsheetUrl:'https://docs.google.com/spreadsheets/d/'+DPI_SPREADSHEET_ID+'/edit',
    webhookToken:token
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function doGet(){
  return dpiJson_({ok:true,service:'DPI Application API',version:'2.0'});
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
    logDpiActivity_('', 'system', 'submission-error', 'FAILED', error&&error.message?error.message:String(error));
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
    reference,dpiDate_(now),d.fullName,d.phone,d.email,d.workStatus,
    d.programme||'Diploma in Business Administration (ODL)',d.purpose,d.approvalHope,
    d.studyTime,d.mainChallenge,d.paymentPreference,d.startReadiness,d.shareWillingness,
    d.commitmentAccepted===true?'Yes':'No',d.source||'dpi-campaign','New Application',''
  ]);
  logDpiActivity_(reference,'individual','record-saved','SUCCESS','Application saved to Applications sheet');

  const programme=d.programme||'Diploma in Business Administration (ODL)';
  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI] Permohonan Baharu - '+d.fullName+' - '+reference,
    body:[
      'Permohonan Dana Pendidikan Inovatif baharu telah diterima.',
      '',
      'Rujukan: '+reference,
      'Nama: '+d.fullName,
      'WhatsApp: '+d.phone,
      'Email: '+d.email,
      'Status pekerjaan: '+d.workStatus,
      'Program: '+programme,
      '',
      'Tujuan / perubahan yang diharapkan:',
      d.purpose,
      '',
      'Harapan jika diluluskan:',
      d.approvalHope,
      '',
      'Masa belajar seminggu: '+d.studyTime,
      'Cabaran utama: '+d.mainChallenge,
      'Pilihan bayaran: '+d.paymentPreference,
      'Kesediaan bermula: '+d.startReadiness,
      'Kesediaan berkongsi peluang: '+d.shareWillingness,
      '',
      'Status awal: New Application',
      'Database: '+ss.getUrl()
    ].join('\n')
  });
  logDpiActivity_(reference,'individual','admin-email','SUCCESS',DPI_ADMIN_EMAIL);

  try{
    MailApp.sendEmail({
      to:d.email,
      subject:'Permohonan Dana Pendidikan Inovatif Telah Diterima - '+reference,
      body:[
        'Salam '+d.fullName+',',
        '',
        'Terima kasih kerana menghantar permohonan Dana Pendidikan Inovatif untuk '+programme+'.',
        '',
        'Permohonan anda telah berjaya diterima dan sedang melalui proses semakan.',
        'No. rujukan: '+reference,
        '',
        'Pihak kami akan menghubungi anda melalui email atau WhatsApp yang didaftarkan sekiranya terdapat maklumat tambahan yang diperlukan atau untuk memaklumkan langkah seterusnya.',
        '',
        'Penghantaran permohonan ini belum merupakan pengesahan pendaftaran atau tawaran kemasukan.',
        '',
        'Terima kasih.',
        'Dana Pendidikan Inovatif',
        'Innovative University College'
      ].join('\n')
    });
    logDpiActivity_(reference,'individual','applicant-email','SUCCESS',d.email);
  }catch(emailError){
    logDpiActivity_(reference,'individual','applicant-email','FAILED',emailError.message||String(emailError));
  }

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
    reference,dpiDate_(now),d.organization,d.picName,d.role,d.email,d.phone,d.staffCount,
    d.programmeInterest,d.partnershipInterest,d.source||'dpi-campaign','Corporate Lead',''
  ]);
  logDpiActivity_(reference,'corporate','record-saved','SUCCESS','Lead saved to Corporate Leads sheet');

  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI Corporate] Lead Baharu - '+d.organization+' - '+reference,
    body:[
      'Pertanyaan kerjasama korporat baharu telah diterima.',
      '',
      'Rujukan: '+reference,
      'Organisasi: '+d.organization,
      'PIC: '+d.picName,
      'Jawatan: '+d.role,
      'Email: '+d.email,
      'Telefon: '+d.phone,
      'Anggaran staf: '+d.staffCount,
      'Program / bidang: '+d.programmeInterest,
      '',
      'Bentuk kerjasama:',
      d.partnershipInterest,
      '',
      'Status awal: Corporate Lead',
      'Database: '+ss.getUrl()
    ].join('\n')
  });
  logDpiActivity_(reference,'corporate','admin-email','SUCCESS',DPI_ADMIN_EMAIL);

  try{
    MailApp.sendEmail({
      to:d.email,
      subject:'Pertanyaan Kerjasama Dana Pendidikan Inovatif Telah Diterima - '+reference,
      body:[
        'Salam '+d.picName+',',
        '',
        'Terima kasih atas minat '+d.organization+' untuk berbincang mengenai kerjasama Dana Pendidikan Inovatif.',
        '',
        'Maklumat organisasi anda telah diterima.',
        'No. rujukan: '+reference,
        '',
        'Pihak kami akan menghubungi PIC yang didaftarkan untuk perbincangan lanjut.',
        '',
        'Terima kasih.',
        'Dana Pendidikan Inovatif',
        'Innovative University College'
      ].join('\n')
    });
    logDpiActivity_(reference,'corporate','pic-email','SUCCESS',d.email);
  }catch(emailError){
    logDpiActivity_(reference,'corporate','pic-email','FAILED',emailError.message||String(emailError));
  }

  return {ok:true,reference:reference};
}

function ensureDpiSheets_(){
  const ss=SpreadsheetApp.openById(DPI_SPREADSHEET_ID);
  let app=ss.getSheetByName(DPI_APPLICATION_SHEET);if(!app)app=ss.insertSheet(DPI_APPLICATION_SHEET);
  let corp=ss.getSheetByName(DPI_CORPORATE_SHEET);if(!corp)corp=ss.insertSheet(DPI_CORPORATE_SHEET);
  let log=ss.getSheetByName(DPI_ACTIVITY_SHEET);if(!log)log=ss.insertSheet(DPI_ACTIVITY_SHEET);

  const appHeaders=['Reference','Submitted At','Full Name','WhatsApp','Email','Work Status','Programme','Purpose / Expected Change','Hope If Approved','Study Time / Week','Main Challenge','Payment Preference','Start Readiness','Share Willingness','Commitment Accepted','Source','Status','Remarks'];
  const corpHeaders=['Reference','Submitted At','Organization','PIC Name','Role','Corporate Email','Phone / WhatsApp','Estimated Staff','Programme Interest','Partnership Interest','Source','Status','Remarks'];
  const logHeaders=['Timestamp','Reference','Type','Action','Result','Details'];
  dpiEnsureHeaders_(app,appHeaders);dpiEnsureHeaders_(corp,corpHeaders);dpiEnsureHeaders_(log,logHeaders);
  app.setFrozenRows(1);corp.setFrozenRows(1);log.setFrozenRows(1);
  return ss;
}

function logDpiActivity_(reference,type,action,result,details){
  try{
    const ss=SpreadsheetApp.openById(DPI_SPREADSHEET_ID);
    let log=ss.getSheetByName(DPI_ACTIVITY_SHEET);if(!log)log=ss.insertSheet(DPI_ACTIVITY_SHEET);
    dpiEnsureHeaders_(log,['Timestamp','Reference','Type','Action','Result','Details']);
    log.appendRow([dpiDate_(new Date()),reference||'',type||'',action||'',result||'',details||'']);
  }catch(_e){}
}

function dpiEnsureHeaders_(sheet,headers){
  if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);
  else if(sheet.getRange(1,1).getValue()!==headers[0]){
    sheet.insertRowBefore(1);
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
  }
}
function dpiRequire_(data,keys){keys.forEach(function(key){if(data[key]===undefined||data[key]===null||String(data[key]).trim()==='')throw new Error('Missing required field: '+key);});}
function dpiReference_(prefix,date){return prefix+'-'+Utilities.formatDate(date,DPI_TIMEZONE,'yyyyMMdd-HHmmss')+'-'+Math.floor(1000+Math.random()*9000);}
function dpiDate_(date){return Utilities.formatDate(date,DPI_TIMEZONE,'yyyy-MM-dd HH:mm:ss');}
function dpiJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
