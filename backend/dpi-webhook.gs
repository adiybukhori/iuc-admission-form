const DPI_ADMIN_EMAIL='adiybukhori@innovative.edu.my';
const DPI_TIMEZONE='Asia/Kuala_Lumpur';
const DPI_SPREADSHEET_ID='15P3fP6v7m3Pq3365mx-VvRrNlTqn5aRjoNr3S1J7-NM';
const DPI_APPLICATION_SHEET='Applications';
const DPI_CORPORATE_SHEET='Corporate Leads';
const DPI_ACTIVITY_SHEET='Activity Log';
const DPI_OFFER_TEMPLATE_ID='1qBs6uxRo74LjAuB5qBQBCrEml4r2NnKDa9KhbRjfHBw';
const DPI_OFFER_FOLDER_ID='1v3eFJXDirmYaolWV_gSBbsI6Y8-sDFsv';
const DPI_FALLBACK_PUBLIC_URL='https://dana-pendidikan-inovatif-adiybukhoris-projects.vercel.app';
const DPI_REGISTRATION_URL='https://forms.gle/TfKHdBuLk4SZZx726';

function setupDpiBackend(){
  const props=PropertiesService.getScriptProperties();
  let token=props.getProperty('DPI_WEBHOOK_TOKEN');
  if(!token){
    token=Utilities.getUuid()+Utilities.getUuid();
    props.setProperty('DPI_WEBHOOK_TOKEN',token);
  }
  if(!props.getProperty('DPI_PUBLIC_BASE_URL')) props.setProperty('DPI_PUBLIC_BASE_URL',DPI_FALLBACK_PUBLIC_URL);
  ensureDpiSheets_();
  installDpiReviewTrigger_();
  const result={
    spreadsheetUrl:'https://docs.google.com/spreadsheets/d/'+DPI_SPREADSHEET_ID+'/edit',
    webhookToken:token,
    publicBaseUrl:getDpiPublicBaseUrl_(),
    reviewTrigger:'ready'
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function upgradeDpiReviewWorkflow(){
  ensureDpiSheets_();
  installDpiReviewTrigger_();
  Logger.log(JSON.stringify({ok:true,message:'DPI review workflow ready',publicBaseUrl:getDpiPublicBaseUrl_()}));
}

function resetDpiWebhookToken(){
  const token=Utilities.getUuid()+Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('DPI_WEBHOOK_TOKEN',token);
  Logger.log('NEW DPI_WEBHOOK_TOKEN: '+token);
}

function setDpiPublicBaseUrl(url){
  if(!/^https:\/\//i.test(String(url||''))) throw new Error('URL mesti bermula dengan https://');
  PropertiesService.getScriptProperties().setProperty('DPI_PUBLIC_BASE_URL',String(url).replace(/\/$/,''));
  Logger.log('DPI_PUBLIC_BASE_URL='+getDpiPublicBaseUrl_());
}

function doGet(){
  return dpiJson_({ok:true,service:'DPI Application API',version:'3.0'});
}

function doPost(e){
  try{
    const payload=JSON.parse(e&&e.postData&&e.postData.contents?e.postData.contents:'{}');
    const expected=PropertiesService.getScriptProperties().getProperty('DPI_WEBHOOK_TOKEN');
    if(!expected||payload.token!==expected)throw new Error('Unauthorized request.');
    if(payload.action==='dpiApplication')return dpiJson_(saveDpiApplication_(payload));
    if(payload.action==='dpiCorporate')return dpiJson_(saveDpiCorporate_(payload));
    if(payload.action==='dpiOfferLookup')return dpiJson_(lookupDpiOffer_(payload));
    if(payload.action==='dpiAcceptOffer')return dpiJson_(acceptDpiOffer_(payload));
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
  const programme=d.programme||'Diploma in Business Administration (ODL)';
  const row=[reference,dpiDate_(now),d.fullName,d.phone,d.email,d.workStatus,programme,d.purpose,d.approvalHope,d.studyTime,d.mainChallenge,d.paymentPreference,d.startReadiness,d.shareWillingness,d.commitmentAccepted===true?'Yes':'No',d.source||'dpi-campaign','New Application',''];
  while(row.length<29)row.push('');
  sheet.appendRow(row);
  logDpiActivity_(reference,'individual','record-saved','SUCCESS','Application saved to Applications sheet');

  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI] Permohonan Baharu - '+d.fullName+' - '+reference,
    body:['Permohonan Dana Pendidikan Inovatif baharu telah diterima.','','Rujukan: '+reference,'Nama: '+d.fullName,'WhatsApp: '+d.phone,'Email: '+d.email,'Status pekerjaan: '+d.workStatus,'Program: '+programme,'','Tujuan / perubahan yang diharapkan:',d.purpose,'','Harapan jika diluluskan:',d.approvalHope,'','Masa belajar seminggu: '+d.studyTime,'Cabaran utama: '+d.mainChallenge,'Pilihan bayaran: '+d.paymentPreference,'Kesediaan bermula: '+d.startReadiness,'Kesediaan berkongsi peluang: '+d.shareWillingness,'','Status awal: New Application','Database: '+ss.getUrl()].join('\n')
  });
  logDpiActivity_(reference,'individual','admin-email','SUCCESS',DPI_ADMIN_EMAIL);

  try{
    MailApp.sendEmail({
      to:d.email,
      subject:'Permohonan Dana Pendidikan Inovatif Telah Diterima - '+reference,
      body:['Salam '+d.fullName+',','','Terima kasih kerana menghantar permohonan Dana Pendidikan Inovatif untuk '+programme+'.','','Permohonan anda telah berjaya diterima dan sedang melalui proses semakan.','No. rujukan: '+reference,'','Pihak kami akan menghubungi anda melalui email atau WhatsApp yang didaftarkan sekiranya terdapat maklumat tambahan yang diperlukan atau untuk memaklumkan langkah seterusnya.','','Penghantaran permohonan ini belum merupakan pengesahan pendaftaran atau tawaran kemasukan.','','Terima kasih.','Dana Pendidikan Inovatif','Innovative University College'].join('\n')
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
  sheet.appendRow([reference,dpiDate_(now),d.organization,d.picName,d.role,d.email,d.phone,d.staffCount,d.programmeInterest,d.partnershipInterest,d.source||'dpi-campaign','Corporate Lead','']);
  logDpiActivity_(reference,'corporate','record-saved','SUCCESS','Lead saved to Corporate Leads sheet');

  MailApp.sendEmail({
    to:DPI_ADMIN_EMAIL,
    subject:'[DPI Corporate] Lead Baharu - '+d.organization+' - '+reference,
    body:['Pertanyaan kerjasama korporat baharu telah diterima.','','Rujukan: '+reference,'Organisasi: '+d.organization,'PIC: '+d.picName,'Jawatan: '+d.role,'Email: '+d.email,'Telefon: '+d.phone,'Anggaran staf: '+d.staffCount,'Program / bidang: '+d.programmeInterest,'','Bentuk kerjasama:',d.partnershipInterest,'','Status awal: Corporate Lead','Database: '+ss.getUrl()].join('\n')
  });
  logDpiActivity_(reference,'corporate','admin-email','SUCCESS',DPI_ADMIN_EMAIL);

  try{
    MailApp.sendEmail({
      to:d.email,
      subject:'Pertanyaan Kerjasama Dana Pendidikan Inovatif Telah Diterima - '+reference,
      body:['Salam '+d.picName+',','','Terima kasih atas minat '+d.organization+' untuk berbincang mengenai kerjasama Dana Pendidikan Inovatif.','','Maklumat organisasi anda telah diterima.','No. rujukan: '+reference,'','Pihak kami akan menghubungi PIC yang didaftarkan untuk perbincangan lanjut.','','Terima kasih.','Dana Pendidikan Inovatif','Innovative University College'].join('\n')
    });
    logDpiActivity_(reference,'corporate','pic-email','SUCCESS',d.email);
  }catch(emailError){
    logDpiActivity_(reference,'corporate','pic-email','FAILED',emailError.message||String(emailError));
  }
  return {ok:true,reference:reference};
}

function installDpiReviewTrigger_(){
  const exists=ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='handleDpiReviewEdit';});
  if(!exists) ScriptApp.newTrigger('handleDpiReviewEdit').forSpreadsheet(DPI_SPREADSHEET_ID).onEdit().create();
}

function handleDpiReviewEdit(e){
  try{
    if(!e||!e.range)return;
    const sheet=e.range.getSheet();
    if(sheet.getName()!==DPI_APPLICATION_SHEET||e.range.getRow()<2||e.range.getColumn()!==17)return;
    const row=e.range.getRow();
    const status=String(e.value||'').trim();
    stampReview_(sheet,row);
    if(status==='Approved') issueDpiConditionalOffer_(sheet,row);
    if(status==='Need More Info') sendDpiNeedMoreInfo_(sheet,row);
    if(status==='Not Approved') sendDpiNotApproved_(sheet,row);
  }catch(error){
    logDpiActivity_('', 'review', 'review-trigger', 'FAILED', error.message||String(error));
    try{MailApp.sendEmail(DPI_ADMIN_EMAIL,'[DPI] Review automation error',error.stack||String(error));}catch(_e){}
  }
}

function stampReview_(sheet,row){
  if(!sheet.getRange(row,19).getValue()){
    let reviewer='Admin';
    try{reviewer=Session.getActiveUser().getEmail()||'Admin';}catch(_e){}
    sheet.getRange(row,19).setValue(reviewer);
  }
  sheet.getRange(row,20).setValue(dpiDate_(new Date()));
}

function issueDpiConditionalOffer_(sheet,row){
  if(sheet.getRange(row,24).getValue()==='Pending Acceptance'||sheet.getRange(row,22).getValue())return;
  const values=sheet.getRange(row,1,1,29).getValues()[0];
  const name=values[2], phone=values[3], email=values[4], programme=values[6]||'Diploma in Business Administration (ODL)';
  const offerRef='STB/DBAODL/DPI/'+Utilities.formatDate(new Date(),DPI_TIMEZONE,'yyyy')+'/WEB-'+String(row-1).padStart(4,'0');
  const offerToken=Utilities.getUuid()+Utilities.getUuid();
  const template=DriveApp.getFileById(DPI_OFFER_TEMPLATE_ID);
  const folder=DriveApp.getFolderById(DPI_OFFER_FOLDER_ID);
  const safeName=String(name||'Applicant').replace(/[^A-Za-z0-9 _-]/g,'').trim();
  const docCopy=template.makeCopy('COL-'+offerRef.replace(/\//g,'-')+' - '+safeName,folder);
  const doc=DocumentApp.openById(docCopy.getId());
  const body=doc.getBody();
  replaceDpiPlaceholder_(body,'{{NO_RUJUKAN}}',offerRef);
  replaceDpiPlaceholder_(body,'{{TARIKH_SURAT}}',Utilities.formatDate(new Date(),DPI_TIMEZONE,'dd/MM/yyyy'));
  replaceDpiPlaceholder_(body,'{{NAMA}}',name);
  replaceDpiPlaceholder_(body,'{{ALAMAT}}','Email: '+email+'\nNo. Telefon: '+phone);
  replaceDpiPlaceholder_(body,'{{PROGRAM}}',programme);
  replaceDpiPlaceholder_(body,'{{INTAKE}}','Akan ditetapkan selepas pendaftaran rasmi');
  replaceDpiPlaceholder_(body,'{{KAEDAH}}','Open and Distance Learning (ODL)');
  replaceDpiPlaceholder_(body,'{{JUMLAH_REBAT}}','27,000');
  replaceDpiPlaceholder_(body,'{{JUMLAH_ANSURAN}}','6,000.00');
  replaceDpiPlaceholder_(body,'{{IC}}','Akan dikemukakan semasa pendaftaran rasmi');
  doc.saveAndClose();
  Utilities.sleep(1200);
  const pdfBlob=docCopy.getAs(MimeType.PDF).setName('COL-'+offerRef.replace(/\//g,'-')+' - '+safeName+'.pdf');
  const pdfFile=folder.createFile(pdfBlob);
  const acceptUrl=getDpiPublicBaseUrl_()+'/accept.html?token='+encodeURIComponent(offerToken);

  sheet.getRange(row,21).setValue(offerRef);
  sheet.getRange(row,22).setValue(pdfFile.getUrl());
  sheet.getRange(row,23).setValue(offerToken);
  sheet.getRange(row,24).setValue('Pending Acceptance');
  sheet.getRange(row,25).setValue(dpiDate_(new Date()));
  sheet.getRange(row,17).setValue('Offer Sent');

  MailApp.sendEmail({
    to:email,
    subject:'Permohonan DPI Diluluskan - Surat Tawaran Bersyarat '+offerRef,
    body:['Salam '+name+',','','Permohonan Dana Pendidikan Inovatif anda telah diluluskan untuk diteruskan ke peringkat tawaran bersyarat.','','Surat Tawaran Bersyarat dilampirkan bersama email ini.','No. rujukan tawaran: '+offerRef,'','Untuk menerima tawaran, sila klik pautan berikut:',''+acceptUrl,'','Selepas penerimaan direkodkan, anda akan dibawa ke langkah pendaftaran rasmi dan bayaran Yuran Pendaftaran RM300.','','Terima kasih.','Dana Pendidikan Inovatif','Innovative University College'].join('\n'),
    attachments:[pdfFile.getBlob()]
  });
  logDpiActivity_(values[0],'individual','conditional-offer','SUCCESS',offerRef+' | '+pdfFile.getUrl());
  try{docCopy.setTrashed(true);}catch(_e){}
}

function sendDpiNeedMoreInfo_(sheet,row){
  const v=sheet.getRange(row,1,1,29).getValues()[0];
  const remarks=String(v[17]||'').trim();
  MailApp.sendEmail({to:v[4],subject:'Maklumat Tambahan Diperlukan - Permohonan DPI '+v[0],body:['Salam '+v[2]+',','','Semakan permohonan Dana Pendidikan Inovatif anda memerlukan maklumat tambahan sebelum keputusan dapat dibuat.','',remarks?('Maklumat diperlukan:\n'+remarks):'Pihak kami akan menghubungi anda untuk mendapatkan maklumat yang diperlukan.','','No. rujukan: '+v[0],'','Terima kasih.','Dana Pendidikan Inovatif'].join('\n')});
  logDpiActivity_(v[0],'individual','need-more-info','SUCCESS',remarks||'Email sent');
}

function sendDpiNotApproved_(sheet,row){
  const v=sheet.getRange(row,1,1,29).getValues()[0];
  const remarks=String(v[17]||'').trim();
  MailApp.sendEmail({to:v[4],subject:'Keputusan Permohonan Dana Pendidikan Inovatif - '+v[0],body:['Salam '+v[2]+',','','Terima kasih atas permohonan anda. Setelah semakan dibuat, permohonan anda tidak dapat diteruskan di bawah Dana Pendidikan Inovatif pada masa ini.',remarks?('\nCatatan:\n'+remarks):'','', 'No. rujukan: '+v[0],'','Terima kasih atas minat anda.','Dana Pendidikan Inovatif'].join('\n')});
  logDpiActivity_(v[0],'individual','not-approved','SUCCESS',remarks||'Email sent');
}

function lookupDpiOffer_(payload){
  const offerToken=String((payload.data||{}).offerToken||'').trim();
  if(!offerToken)throw new Error('Token tawaran tidak sah.');
  const found=findDpiApplicationByOfferToken_(offerToken);
  if(!found)throw new Error('Tawaran tidak ditemui atau pautan tidak sah.');
  const v=found.values;
  return {ok:true,offer:{reference:v[20],fullName:v[2],programme:v[6],offerStatus:v[23]||'',acceptedAt:v[25]||'',registrationUrl:DPI_REGISTRATION_URL}};
}

function acceptDpiOffer_(payload){
  const d=payload.data||{};
  const offerToken=String(d.offerToken||'').trim();
  if(!offerToken||d.accepted!==true)throw new Error('Penerimaan tawaran tidak lengkap.');
  const found=findDpiApplicationByOfferToken_(offerToken);
  if(!found)throw new Error('Tawaran tidak ditemui atau pautan tidak sah.');
  const sheet=found.sheet,row=found.row,v=found.values;
  if(v[23]==='Accepted'||v[25])return {ok:true,alreadyAccepted:true,registrationUrl:DPI_REGISTRATION_URL,reference:v[20]};
  const typedName=String(d.typedName||'').trim();
  if(!typedName)throw new Error('Sila masukkan nama penuh untuk pengesahan.');
  sheet.getRange(row,24).setValue('Accepted');
  sheet.getRange(row,26).setValue(dpiDate_(new Date()));
  sheet.getRange(row,27).setValue('Pending Registration');
  sheet.getRange(row,17).setValue('Offer Accepted');
  const acceptNote='Accepted online by '+typedName+' at '+dpiDate_(new Date());
  sheet.getRange(row,18).setValue((String(v[17]||'')+'\n'+acceptNote).trim());

  MailApp.sendEmail({to:v[4],subject:'Penerimaan Tawaran DPI Berjaya - '+v[20],body:['Salam '+v[2]+',','','Penerimaan Surat Tawaran Bersyarat anda telah berjaya direkodkan.','No. rujukan tawaran: '+v[20],'','Langkah seterusnya ialah melengkapkan pendaftaran rasmi dan menjelaskan Yuran Pendaftaran RM300.','Pautan pendaftaran: '+DPI_REGISTRATION_URL,'','Terima kasih.','Dana Pendidikan Inovatif','Innovative University College'].join('\n')});
  MailApp.sendEmail({to:DPI_ADMIN_EMAIL,subject:'[DPI] Tawaran Diterima - '+v[2]+' - '+v[20],body:'Calon telah menerima tawaran secara dalam talian.\n\nNama: '+v[2]+'\nRujukan: '+v[20]+'\nEmail: '+v[4]+'\nTelefon: '+v[3]+'\n\nStatus seterusnya: Pending Registration'});
  logDpiActivity_(v[0],'individual','offer-accepted','SUCCESS',acceptNote);
  return {ok:true,reference:v[20],registrationUrl:DPI_REGISTRATION_URL};
}

function findDpiApplicationByOfferToken_(offerToken){
  const ss=SpreadsheetApp.openById(DPI_SPREADSHEET_ID);
  const sheet=ss.getSheetByName(DPI_APPLICATION_SHEET);
  const last=sheet.getLastRow();
  if(last<2)return null;
  const finder=sheet.getRange(2,23,last-1,1).createTextFinder(offerToken).matchEntireCell(true).findNext();
  if(!finder)return null;
  const row=finder.getRow();
  return {sheet:sheet,row:row,values:sheet.getRange(row,1,1,29).getValues()[0]};
}

function replaceDpiPlaceholder_(body,placeholder,value){
  body.replaceText(escapeDpiRegex_(placeholder),String(value==null?'':value));
}
function escapeDpiRegex_(text){return String(text).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function getDpiPublicBaseUrl_(){return String(PropertiesService.getScriptProperties().getProperty('DPI_PUBLIC_BASE_URL')||DPI_FALLBACK_PUBLIC_URL).replace(/\/$/,'');}

function ensureDpiSheets_(){
  const ss=SpreadsheetApp.openById(DPI_SPREADSHEET_ID);
  let app=ss.getSheetByName(DPI_APPLICATION_SHEET);if(!app)app=ss.insertSheet(DPI_APPLICATION_SHEET);
  let corp=ss.getSheetByName(DPI_CORPORATE_SHEET);if(!corp)corp=ss.insertSheet(DPI_CORPORATE_SHEET);
  let log=ss.getSheetByName(DPI_ACTIVITY_SHEET);if(!log)log=ss.insertSheet(DPI_ACTIVITY_SHEET);

  const appHeaders=['Reference','Submitted At','Full Name','WhatsApp','Email','Work Status','Programme','Purpose / Expected Change','Hope If Approved','Study Time / Week','Main Challenge','Payment Preference','Start Readiness','Share Willingness','Commitment Accepted','Source','Status','Remarks','Reviewer','Review Date','Offer Reference','Offer Letter URL','Offer Token','Offer Status','Offer Sent At','Accepted At','Registration Status','Payment Status','Sales Status'];
  const corpHeaders=['Reference','Submitted At','Organization','PIC Name','Role','Corporate Email','Phone / WhatsApp','Estimated Staff','Programme Interest','Partnership Interest','Source','Status','Remarks'];
  const logHeaders=['Timestamp','Reference','Type','Action','Result','Details'];
  dpiEnsureHeaders_(app,appHeaders);dpiEnsureHeaders_(corp,corpHeaders);dpiEnsureHeaders_(log,logHeaders);
  app.setFrozenRows(1);corp.setFrozenRows(1);log.setFrozenRows(1);
  const statusRule=SpreadsheetApp.newDataValidation().requireValueInList(['New Application','Under Review','Approved','Need More Info','Not Approved','Offer Sent','Offer Accepted','Registration Submitted','Payment Pending','Payment Verified','Enrolled'],true).setAllowInvalid(false).build();
  app.getRange(2,17,Math.max(app.getMaxRows()-1,1),1).setDataValidation(statusRule);
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
  if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
}
function dpiRequire_(data,keys){keys.forEach(function(key){if(data[key]===undefined||data[key]===null||String(data[key]).trim()==='')throw new Error('Missing required field: '+key);});}
function dpiReference_(prefix,date){return prefix+'-'+Utilities.formatDate(date,DPI_TIMEZONE,'yyyyMMdd-HHmmss')+'-'+Math.floor(1000+Math.random()*9000);}
function dpiDate_(date){return Utilities.formatDate(date,DPI_TIMEZONE,'yyyy-MM-dd HH:mm:ss');}
function dpiJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
