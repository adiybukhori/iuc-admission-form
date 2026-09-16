import fs from 'node:fs';

const file='campaigns/dana-pendidikan-inovatif/index.html';
let html=fs.readFileSync(file,'utf8');

// Keep only the first Corporate/HR section if an earlier workflow run duplicated it.
let corporateSeen=false;
html=html.replace(/<section id="korporat"[\s\S]*?<\/section>/g,section=>{
  if(corporateSeen)return '';
  corporateSeen=true;
  return section;
});

// Keep only the final complete DPI submission helper + listeners block.
const helper='const dpiValue=id=>';
const firstHelper=html.indexOf(helper);
const lastHelper=html.lastIndexOf(helper);
if(firstHelper>=0&&lastHelper>firstHelper){
  html=html.slice(0,firstHelper)+html.slice(lastHelper);
}

if(html.includes('mailto:adiybukhori@innovative.edu.my'))throw new Error('Legacy mailto flow is still present.');
for(const required of ['id="application-form"','id="app-hope"','id="app-share"','id="corporate-form"','/api/dpi-submit']){
  if(!html.includes(required))throw new Error('Required DPI element missing: '+required);
}
if((html.match(/const dpiValue=id=>/g)||[]).length!==1)throw new Error('DPI helper JavaScript is still duplicated.');
if((html.match(/id="corporate-form"/g)||[]).length!==1)throw new Error('Corporate form is still duplicated.');

fs.writeFileSync(file,html);
console.log('DPI landing page duplicate cleanup completed successfully.');
