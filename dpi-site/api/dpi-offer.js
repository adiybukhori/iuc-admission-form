function clean(value,max=500){return String(value??'').trim().slice(0,max);}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,message:'Method not allowed.'});
  const webhook=process.env.DPI_WEBHOOK_URL;
  const token=process.env.DPI_WEBHOOK_TOKEN;
  if(!webhook||!token)return res.status(503).json({ok:false,message:'Perkhidmatan tawaran sedang disediakan. Sila cuba semula kemudian.'});

  const action=clean(req.body?.action,30);
  const offerToken=clean(req.body?.offerToken,200);
  if(!offerToken)return res.status(400).json({ok:false,message:'Pautan tawaran tidak sah.'});
  if(!['lookup','accept'].includes(action))return res.status(400).json({ok:false,message:'Permintaan tidak sah.'});

  const data={offerToken};
  if(action==='accept'){
    data.accepted=req.body?.accepted===true;
    data.typedName=clean(req.body?.typedName,160);
  }

  try{
    const upstream=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action==='lookup'?'dpiOfferLookup':'dpiAcceptOffer',token,data})});
    const text=await upstream.text();
    let result={};try{result=JSON.parse(text);}catch(_e){}
    if(!upstream.ok||result.ok!==true)throw new Error(result.message||'Permintaan tidak dapat diproses.');
    return res.status(200).json(result);
  }catch(error){
    console.error('DPI offer error',error);
    return res.status(502).json({ok:false,message:error.message||'Permintaan tidak dapat diproses sekarang.'});
  }
}
