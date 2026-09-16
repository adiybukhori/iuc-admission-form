const LIMITS={fullName:120,phone:40,email:160,workStatus:120,purpose:1200,approvalHope:1200,studyTime:80,mainChallenge:1000,paymentPreference:100,startReadiness:120,shareWillingness:80,programme:180,source:80,organization:180,picName:120,role:120,staffCount:80,programmeInterest:220,partnershipInterest:1400};

function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function emailOk(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
function normalize(input){const out={};for(const [key,max] of Object.entries(LIMITS)){if(key in input)out[key]=clean(input[key],max);}return out;}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed.'});
  const type=clean(req.body?.type,20);
  if(!['individual','corporate'].includes(type))return res.status(400).json({ok:false,message:'Jenis permohonan tidak sah.'});
  const data=normalize(req.body?.data||{});
  const required=type==='individual'
    ?['fullName','phone','email','workStatus','purpose','approvalHope','studyTime','mainChallenge','paymentPreference','startReadiness','shareWillingness']
    :['organization','picName','role','email','phone','staffCount','programmeInterest','partnershipInterest'];
  if(required.some(key=>!data[key]))return res.status(400).json({ok:false,message:'Sila lengkapkan semua maklumat wajib.'});
  if(!emailOk(data.email))return res.status(400).json({ok:false,message:'Alamat email tidak sah.'});
  if(type==='individual'&&req.body?.data?.commitmentAccepted!==true)return res.status(400).json({ok:false,message:'Sila sahkan pengakuan permohonan.'});

  const webhook=process.env.DPI_WEBHOOK_URL;
  const token=process.env.DPI_WEBHOOK_TOKEN;
  if(!webhook||!token)return res.status(503).json({ok:false,message:'Perkhidmatan permohonan sedang disediakan. Sila cuba semula kemudian.'});

  try{
    const upstream=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:type==='individual'?'dpiApplication':'dpiCorporate',token,submittedAt:new Date().toISOString(),data:{...data,commitmentAccepted:type==='individual'}})});
    const text=await upstream.text();
    let result={};try{result=JSON.parse(text);}catch(_e){}
    if(!upstream.ok||result.ok!==true)throw new Error(result.message||'Submission backend rejected the request.');
    return res.status(200).json({ok:true,reference:result.reference||null});
  }catch(error){
    console.error('DPI submission error',error);
    return res.status(502).json({ok:false,message:'Permohonan tidak dapat disimpan sekarang. Sila cuba semula sebentar lagi.'});
  }
}
