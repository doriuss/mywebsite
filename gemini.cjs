const https=require('https'),fs=require('fs'),path=require('path');
const file=path.join(__dirname,'.env');let key=process.env.GEMINI_API_KEY;
if(!key&&fs.existsSync(file)){const m=fs.readFileSync(file,'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*(.*?)\s*$/m);if(m)key=m[1].replace(/^['"]|['"]$/g,'')}
module.exports=function(text,gender){return new Promise((resolve,reject)=>{
if(!key)return reject(Error('not_configured'));
const body=JSON.stringify({model:'gemini-3.8-flash-tts',input:[{type:'user_input',content:[{type:'text',text}]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice:gender==='male'?'Puck':'Kore'}]}});
const req=https.request('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key}},res=>{let raw='';res.on('data',c=>raw+=c);res.on('end',()=>{if(res.statusCode!==200)return reject(Error(res.statusCode===429?'quota':[400,401,403].includes(res.statusCode)?'credentials':'service_error'));try{const data=JSON.parse(raw);const audio=(data.steps||[]).flatMap(s=>s.content||[]).filter(c=>c.type==='audio'&&c.data).pop();if(!audio)throw Error();resolve(Buffer.from(audio.data,'base64'))}catch{reject(Error('service_error'))}})});req.setTimeout(45000,()=>req.destroy(Error('timeout')));req.on('error',()=>reject(Error('service_error')));req.end(body);
})};
