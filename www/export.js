(function(root){
var MES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function fd(s){if(!s)return"";var a=s.split("-");return(+a[2])+" de "+MES[a[1]-1]+" de "+a[0]}
function px(S){return S.prox||(S.proxf?fd(S.proxf)+(S.proxh?" a las "+S.proxh:""):"")}
function num(v){return parseFloat(v)||0}
function eur(n){return n.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" \u20AC"}
function pc(n){return n.toLocaleString("es-ES",{minimumFractionDigits:1,maximumFractionDigits:1})+" %"}
function econ(S){var p=num(S.pres),c=num(S.cert),r=p>0?c/p*100:0;return{pres:p,cert:c,raw:r,pct:Math.max(0,Math.min(100,r)),has:p>0||c>0}}
function secs(S){return[["Planificación de las obras",S.plan],["Control de calidad",S.cc],["Seguridad y salud",S.ss]]}
function head(S){return[["Obra",S.obra],["Nº de proyecto",S.proy],["Ubicación",S.ubi],["Propiedad",S.prop],["Dirección facultativa",S.dir],["Fecha",fd(S.fecha)]]}
function who(a){return(a.r?a.r+": ":"")+a.n+(a.e?" - "+a.e:"")}
function pl(p){return"["+p.est+"] "+p.t+(p.from?" (acta nº "+p.from+")":"")}
function b64(d){return d.split(",")[1]}
function fit(m,mw,mh){var w=mw,h=w*(m.h||3)/(m.w||4);if(h>mh){h=mh;w=h*(m.w||4)/(m.h||3)}return{w:w,h:h}}

/* ---------- PDF ---------- */
function pdf(S,logo){
 var D=new root.jspdf.jsPDF({unit:"mm",format:"a4"}),M=15,TOP=24,BOT=18,PW=210,PH=297,W=PW-2*M,y=TOP;
 function need(h){if(y+h>PH-BOT){D.addPage();y=TOP}}
 function h2(t,after){need(10+(after||16));y+=4;D.setFont("helvetica","bold");D.setFontSize(11);D.text(t,M,y+4);D.setLineWidth(.4);D.line(M,y+6,PW-M,y+6);y+=10}
 function para(t,b,ind){D.setFont("helvetica",b?"bold":"normal");D.setFontSize(10);D.splitTextToSize(String(t||""),W-(ind||0)).forEach(function(l){need(5);D.text(l,M+(ind||0),y+4);y+=5});y+=1}
 function imgs(list,full){
  if(full){list.forEach(function(m){var f=fit(m,W,120);need(f.h+3);D.addImage(m.d,"JPEG",M,y,f.w,f.h);y+=f.h+4});return}
  var cw=(W-4)/2;
  for(var i=0;i<list.length;i+=2){
   var row=[list[i],list[i+1]].filter(Boolean).map(function(m){var f=fit(m,cw,75);return{m:m,w:f.w,h:f.h}});
   var rh=Math.max.apply(null,row.map(function(r){return r.h}))+(row.some(function(r){return r.m.c})?6:0)+3;
   need(rh);
   row.forEach(function(r,k){var x=M+k*(cw+4);D.addImage(r.m.d,"JPEG",x,y,r.w,r.h);if(r.m.c){D.setFont("helvetica","normal");D.setFontSize(8);D.text(String(r.m.c).slice(0,70),x,y+r.h+4)}});
   y+=rh;
  }
 }
 D.setFont("helvetica","bold");D.setFontSize(16);D.text("Acta de visita de obra nº "+S.num,M,y+6);y+=12;
 head(S).forEach(function(h){if(h[1])para(h[0]+": "+h[1])});
 h2("Asistentes");S.att.forEach(function(a){if(a.n||a.r)para(who(a)+"   "+(a.ok?"[X] asiste":"[ ] no asiste"))});
 h2("Revisión del acta anterior");para("Aprobación acta anterior: "+S.aprob);
 (S.pend||[]).forEach(function(p){para("- "+pl(p),0,0);if(p.nota)para("Comentario: "+p.nota,0,6)});
 h2("Temas tratados");
 S.temas.forEach(function(t){if(!t.t&&!t.img.length)return;if(t.t)para("- "+t.t);t.img.forEach(function(m){if(m.as==="txt"&&m.txt)para(m.txt,0,6);else imgs([m],true)})});
 secs(S).forEach(function(s){h2(s[0]);para(s[1])});
 h2("Información económica",34);var e=econ(S);
 if(e.has){para("Presupuesto de la obra: "+eur(e.pres));para("Importe certificado acumulado: "+eur(e.cert));
  if(e.pres>0){para("Obra realizada: "+pc(e.raw),1);need(9);var gw=W*e.pct/100;
   D.setFillColor(214,60,50);D.rect(M,y,W,5.5,"F");if(gw>0){D.setFillColor(46,160,67);D.rect(M,y,gw,5.5,"F")}
   D.setFont("helvetica","bold");D.setFontSize(8);D.setTextColor(255,255,255);D.text(pc(e.raw)+" realizado",M+2,y+3.9);D.setTextColor(0,0,0);y+=9}}
 para(S.eco);
 h2("Próxima visita");para(px(S));
 if(S.fotos.length){h2("Fotos",80);imgs(S.fotos)}
 var docs=S.docs||[];
 if(docs.length){h2("Documentos anexos",20);docs.forEach(function(d,k){para("Anexo "+(k+1)+": "+d.name+(d.type==="pdf"?" (PDF adjunto al final)":""))})}
 docs.forEach(function(d,k){if(d.type!=="img")return;D.addPage();D.setFont("helvetica","bold");D.setFontSize(10);D.setTextColor(0,0,0);D.text(D.splitTextToSize("Anexo "+(k+1)+": "+d.name,W)[0],M,TOP);var f=fit(d,W,PH-TOP-BOT-8);D.addImage(d.d,"JPEG",M,TOP+4,f.w,f.h)});
 var n=D.getNumberOfPages();
 for(var i=1;i<=n;i++){D.setPage(i);
  if(logo){var f=fit(logo,50,22);D.addImage(logo.d,/image\/png/.test(logo.d)?"PNG":"JPEG",PW-M-f.w,6,f.w,f.h)}
  D.setFont("helvetica","normal");D.setFontSize(8);D.setTextColor(110,110,110);
  D.text(D.splitTextToSize("Acta nº "+S.num+(S.obra?" - "+S.obra:"")+(S.ubi?" - "+S.ubi:""),W-30)[0],M,PH-8);D.text("Página "+i+" de "+n,PW-M,PH-8,{align:"right"});D.setTextColor(0,0,0)}
 var base=D.output("datauristring").split(",").pop(),pdfs=docs.filter(function(d){return d.type==="pdf"});
 if(!pdfs.length)return Promise.resolve(base);
 var L=root.PDFLib;
 return L.PDFDocument.load(base).then(function(out){var ch=Promise.resolve();
  pdfs.forEach(function(d){ch=ch.then(function(){return L.PDFDocument.load(d.d,{ignoreEncryption:true})}).then(function(src){return out.copyPages(src,src.getPageIndices())}).then(function(pgs){pgs.forEach(function(pg){out.addPage(pg)})})});
  return ch.then(function(){return out.saveAsBase64()})});
}

/* ---------- WORD (.docx) ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
function run(t,o){o=o||{};var rp=(o.b?"<w:b/>":"")+(o.col?'<w:color w:val="'+o.col+'"/>':"")+(o.sz?'<w:sz w:val="'+o.sz+'"/>':"");
 return"<w:r>"+(rp?"<w:rPr>"+rp+"</w:rPr>":"")+String(t).split("\n").map(function(x,i){return(i?"<w:br/>":"")+'<w:t xml:space="preserve">'+esc(x)+"</w:t>"}).join("")+"</w:r>"}
function P(t,o){o=o||{};return"<w:p><w:pPr>"+(o.kn?"<w:keepNext/>":"")+(o.bd?'<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="000000"/></w:pBdr>':"")+'<w:spacing w:before="'+(o.before||0)+'" w:after="'+(o.after==null?80:o.after)+'"/>'+(o.jc?'<w:jc w:val="'+o.jc+'"/>':"")+"</w:pPr>"+run(t,o)+"</w:p>"}
function TBL(widths,rows){
 var bd=["top","left","bottom","right","insideH","insideV"].map(function(k){return"<w:"+k+' w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>'}).join("");
 return'<w:tbl><w:tblPr><w:tblW w:w="'+widths.reduce(function(a,b){return a+b},0)+'" w:type="dxa"/><w:tblBorders>'+bd+"</w:tblBorders></w:tblPr><w:tblGrid>"+widths.map(function(w){return'<w:gridCol w:w="'+w+'"/>'}).join("")+"</w:tblGrid>"+
 rows.map(function(r){return"<w:tr><w:trPr><w:cantSplit/></w:trPr>"+r.map(function(c,i){return'<w:tc><w:tcPr><w:tcW w:w="'+widths[i]+'" w:type="dxa"/></w:tcPr>'+c+"</w:tc>"}).join("")+"</w:tr>"}).join("")+"</w:tbl>"+P("",{after:0});
}
function docx(S,logo){
 var media=[],body="";
 function imgXml(m,mw,mh,ext){
  var n=media.length+1,id="rId"+(10+n),f=fit(m,mw,mh),w=Math.round(f.w),h=Math.round(f.h);
  media.push({n:n,d:b64(m.d),ext:ext||"jpeg"});
  return'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+w+'" cy="'+h+'"/><wp:docPr id="'+n+'" name="Imagen '+n+'"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="'+n+'" name="img'+n+'"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+id+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
 }
 function imgs(list,full){
  if(full)return list.map(function(m){return"<w:p><w:pPr><w:spacing w:before=\"0\" w:after=\"100\"/></w:pPr>"+imgXml(m,5040000,3600000)+"</w:p>"}).join("");
  var rows=[];
  for(var i=0;i<list.length;i+=2){rows.push([list[i],list[i+1]].map(function(m){return m?"<w:p>"+imgXml(m,2880000,2520000)+"</w:p>"+(m.c?P(m.c,{sz:16}):""):"<w:p/>"}))}
  return rows.length?TBL([4819,4819],rows):"";
 }
 function H(t){return P(t,{b:1,sz:24,bd:1,before:240,after:100,kn:1})}
 function cell(w,fill,txt){return'<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="'+fill+'"/></w:tcPr>'+P(txt||"",{b:1,col:"FFFFFF",sz:16,after:0,before:0})+"</w:tc>"}
 function bar(e){var T=9638,g=Math.round(T*e.pct/100),ws=[],cs=[],lab=pc(e.raw)+" realizado";
  if(g>0){ws.push(g);cs.push(cell(g,"2EA043",lab))}
  if(T-g>0){ws.push(T-g);cs.push(cell(T-g,"D63C32",g>0?"":lab))}
  return'<w:tbl><w:tblPr><w:tblW w:w="'+T+'" w:type="dxa"/></w:tblPr><w:tblGrid>'+ws.map(function(w){return'<w:gridCol w:w="'+w+'"/>'}).join("")+'</w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="300"/></w:trPr>'+cs.join("")+"</w:tr></w:tbl>"+P("",{after:0});
 }
  body+=P("Acta de visita de obra nº "+S.num,{b:1,sz:34,after:160});
 head(S).forEach(function(h){if(h[1])body+=P(h[0]+": "+h[1],{after:20})});
 body+=H("Asistentes");
 var at=S.att.filter(function(a){return a.n||a.r});
 if(at.length)body+=TBL([2600,5638,1400],at.map(function(a){return[P(a.r,{after:0}),P(a.n+(a.e?" - "+a.e:""),{after:0}),P(a.ok?"X":"",{after:0})]}));
 body+=H("Revisión del acta anterior")+P("Aprobación acta anterior: "+S.aprob);
 (S.pend||[]).forEach(function(p){body+=P("• "+pl(p),{after:p.nota?20:80})+(p.nota?P("Comentario: "+p.nota,{sz:18}):"")});
 body+=H("Temas tratados");
 S.temas.forEach(function(t){if(!t.t&&!t.img.length)return;body+=(t.t?P("• "+t.t,{after:60}):"")+t.img.map(function(m){return m.as==="txt"&&m.txt?P(m.txt,{after:80}):imgs([m],true)}).join("")});
 secs(S).forEach(function(s){body+=H(s[0])+P(s[1])});
 body+=H("Información económica");var e=econ(S);
 if(e.has){body+=P("Presupuesto de la obra: "+eur(e.pres),{after:20})+P("Importe certificado acumulado: "+eur(e.cert),{after:60});if(e.pres>0)body+=P("Obra realizada: "+pc(e.raw),{b:1,after:40,kn:1})+bar(e)}
 body+=P(S.eco);
 body+=H("Próxima visita")+P(px(S));
 if(S.fotos.length)body+=H("Fotos")+imgs(S.fotos);
 var dcs=S.docs||[];
 if(dcs.length){body+=H("Documentos anexos");dcs.forEach(function(d,k){body+=P("Anexo "+(k+1)+": "+d.name+(d.type==="pdf"?" (PDF: se adjunta completo en el PDF del acta)":""),{after:60,kn:d.type==="img"});if(d.type==="img")body+="<w:p>"+imgXml(d,5400000,7200000)+"</w:p>"})}
 var W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
 var NS=W+' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
 var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document '+NS+'><w:body>'+body+'<w:sectPr>'+(logo?'<w:headerReference w:type="default" r:id="rId8"/>':'')+'<w:footerReference w:type="default" r:id="rId9"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
 var ftxt="Acta nº "+S.num+(S.obra?" - "+S.obra:"")+(S.ubi?" - "+S.ubi:"");
 var ftr='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr '+W+'><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">'+esc(ftxt)+'</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">Página </w:t></w:r><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve"> de </w:t></w:r><w:fldSimple w:instr=" NUMPAGES "><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>';
 var hdrX="",hrels="";
 if(logo){var ext=/image\/png/.test(logo.d)?"png":"jpeg",lx=imgXml(logo,1800000,792000,ext),mm=media[media.length-1];
  hdrX='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr '+NS+'><w:p><w:pPr><w:jc w:val="right"/></w:pPr>'+lx+'</w:p></w:hdr>';
  hrels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId'+(10+mm.n)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/img'+mm.n+'.'+ext+'"/></Relationships>'}
 var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'+(logo?'<Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>':'')+media.map(function(m){return'<Relationship Id="rId'+(10+m.n)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/img'+m.n+"."+m.ext+'"/>'}).join("")+"</Relationships>";
 var Z=new root.JSZip();
 Z.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+(logo?'<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>':'')+'<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
 Z.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 Z.file("word/document.xml",doc);Z.file("word/footer1.xml",ftr);if(logo){Z.file("word/header1.xml",hdrX);Z.file("word/_rels/header1.xml.rels",hrels)}Z.file("word/_rels/document.xml.rels",rels);
 media.forEach(function(m){Z.file("word/media/img"+m.n+"."+m.ext,m.d,{base64:true})});
 return Z.generateAsync({type:"base64",compression:"DEFLATE"});
}

/* ---------- Guardar / compartir ---------- */
function isNative(){var C=root.Capacitor;return!!(C&&C.isNativePlatform&&C.isNativePlatform())}
function saveFile(name,data,mime,text){
 var P=root.Capacitor&&root.Capacitor.Plugins;
 if(isNative()&&P&&P.Filesystem&&P.Share){
  return P.Filesystem.writeFile({path:name,data:data,directory:"CACHE"}).then(function(r){return P.Share.share({title:name,text:text||"",url:r.uri,dialogTitle:"Guardar o enviar el acta"})});
 }
 var a=document.createElement("a");a.href="data:"+mime+";base64,"+data;a.download=name;document.body.appendChild(a);a.click();a.remove();return Promise.resolve();
}
root.Exp={fd:fd,px:px,econ:econ,eur:eur,pc:pc,pdf:pdf,docx:docx,saveFile:saveFile,isNative:isNative};
})(typeof window!=="undefined"?window:globalThis);
