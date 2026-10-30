import { parseFragment } from 'parse5';
import { argumentsOf, bytesOf, isMain, requireFact } from './infrastructure-io.mjs';

function prose(value,format) {
  if(format==='portable-text') {
    requireFact(Array.isArray(value) && value.length<=5000,'Expected bounded Portable Text blocks');
    let spansChecked=0,textSize=0;
    return value.map((block,index)=>({block,index})).filter(({block})=>block?._type==='block').map(({block,index})=>{
      requireFact(Array.isArray(block.children) && block.children.length<=5000,'Malformed native text block');
      const spans=block.children.filter(child=>child?._type==='span');
      requireFact(spans.every(span=>typeof span.text==='string'),'Malformed native text span');
      spansChecked+=spans.length; textSize+=spans.reduce((size,span)=>size+span.text.length,0);
      requireFact(spansChecked<=20000 && textSize<=2*1024*1024,'Native text bound exceeded');
      return {index,text:spans.map(span=>span.text).join(''),paragraph:!block.style || block.style==='normal',boldLead:spans[0]?.marks?.includes('strong')===true,nonText:block.children.some(child=>child?._type!=='span')};
    });
  }
  requireFact(format==='html' && typeof value==='string' && value.length<=2*1024*1024,'Expected bounded HTML or Portable Text');
  const pending=[parseFragment(value)], paragraphs=[];
  let visited=0;
  while(pending.length) {
    const node=pending.pop(); requireFact(++visited<=20000,'HTML node bound exceeded');
    if(node.tagName==='p' || /^h[1-6]$/.test(node.tagName??'')) {
      const queue=[...(node.childNodes??[])], texts=[]; let nonText=false, count=0;
      while(queue.length) {
        const child=queue.shift(); requireFact(++count<=20000,'HTML paragraph bound exceeded');
        if(child.nodeName==='#text') texts.push(child.value);
        else if(child.tagName==='br') texts.push('\n');
        else { if(['img','video','audio','iframe','svg'].includes(child.tagName)) nonText=true; queue.unshift(...(child.childNodes??[])); }
      }
      const first=(node.childNodes??[]).find(child=>child.nodeName!=='#text' || child.value.trim());
      paragraphs.push({index:paragraphs.length,text:texts.join(''),paragraph:node.tagName==='p',boldLead:['strong','b'].includes(first?.tagName),nonText});
    } else pending.push(...[...(node.childNodes??[])].reverse());
  }
  return paragraphs;
}
const normalize = blocks => blocks.map(block=>block.text).join('\n').replace(/\s+/gu,' ').trim();

/** Advisory mechanics only: never infer a heading or rewrite source prose. */
export function checkEditorialContent(input) {
  requireFact(input?.reviewVersion===1 && (input.intentionalLineBreaks===undefined || typeof input.intentionalLineBreaks==='boolean'),'Unsupported editorial review input');
  const blocks=prose(input.value,input.format), findings=[];
  for(const block of blocks) {
    if(!block.text.trim() && !block.nonText) findings.push({index:block.index,code:'empty-text-block'});
    if(!input.intentionalLineBreaks && block.paragraph) {
      if(/\n[\t \r]*\n/.test(block.text)) findings.push({index:block.index,code:'embedded-paragraph-break'});
      if((block.text.match(/\n/g)??[]).length>=3) findings.push({index:block.index,code:'excessive-line-breaks'});
      if(block.boldLead && /\n\s*\S/.test(block.text)) findings.push({index:block.index,code:'possible-flattened-heading'});
    }
  }
  const textPreserved=input.baseline===undefined?null:normalize(blocks)===normalize(prose(input.baseline,input.format));
  if(textPreserved===false) findings.push({code:'text-changed'});
  return {status:findings.length?'review-required':'no-mechanical-findings',blocks:blocks.length,findings,textPreserved,scope:'Advisory text structure only; semantic quality, dates/bylines/media, native save/reload/publication and visual acceptance remain separate'};
}

if(isMain(import.meta.url)) {
  try {
    if(process.argv.length===3 && process.argv[2]==='--help') console.log('Read-only: --input <private JSON> with reviewVersion:1, format:portable-text|html, value, optional baseline and intentionalLineBreaks. Exit 0 means no mechanical findings, not editorial acceptance; 1 review required; 2 invalid input. No prose values printed or rewritten.');
    else {
      const args=argumentsOf(process.argv.slice(2),['--input']); requireFact(args.input,'Input required');
      const result=checkEditorialContent(JSON.parse(bytesOf(args.input,4*1024*1024).toString('utf8')));
      console.log(JSON.stringify(result,null,2)); process.exitCode=result.status==='no-mechanical-findings'?0:1;
    }
  } catch { console.error('Editorial review is unverified. Use --help and a bounded supported native/HTML field; private prose withheld.'); process.exitCode=2; }
}
