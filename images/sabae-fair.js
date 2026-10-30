// 10/25 日本語を文節（意味のまとまり）の切れ目でだけ改行する（「す。」など1〜2文字だけ次の行に落ちるのを防ぐ）
// ブラウザの単語区切り（Intl.Segmenter）で分けて、ひらがな・記号は前の語にくっつけ、切れ目に<wbr>を入れる。CSSは word-break:keep-all
const wrapPhrases=(()=>{
  if(!window.Intl||!Intl.Segmenter)return ()=>{};
  const seg=new Intl.Segmenter('ja',{granularity:'word'});
  const glue=/^[\u3041-\u309F\u30FC、。，．・：！？!?…」』）)〕】％%／〜]+$/; // ひらがな・句読点・閉じかっこ・／〜は前にくっつける
  const kan1=/^[一-鿿]$/, kanEnd=/[一-鿿]$/; // 「分業」＋「制」のような漢字1文字も前にくっつける
  const open=/[「『（(〔【＼]$/; // 開きかっこの後ろでは切らない
  const skip=new Set(['SCRIPT','STYLE','svg','TEXTAREA','INPUT','BUTTON','TITLE']);
  const split=t=>{
    const out=[];
    for(const {segment:s} of seg.segment(t)){
      const prev=out[out.length-1]||'';
      const afterPunct=/[、。！？]$/.test(prev)&&!/^[、。，．・：！？!?…」』）)〕】％%／〜]/.test(s); // 句読点の後ろでは区切れるようにする
      if(out.length&&!afterPunct&&(glue.test(s)||open.test(prev)||(kan1.test(s)&&kanEnd.test(prev))))out[out.length-1]+=s; else out.push(s);
    }
    return out;
  };
  return root=>{
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
      for(let p=n.parentNode;p&&p!==root.parentNode;p=p.parentNode){ if(skip.has(p.nodeName)||p.dataset?.wrapped||p.dataset?.nowrap!==undefined)return NodeFilter.FILTER_REJECT; /* data-nowrap の中は区切らない（<wbr>は nowrap より強いため） */ }
      return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[]; while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(n=>{
      const parts=split(n.nodeValue); if(parts.length<2)return;
      const f=document.createDocumentFragment();
      parts.forEach((s,i)=>{ if(i)f.appendChild(document.createElement('wbr')); f.appendChild(document.createTextNode(s)); });
      n.parentNode.replaceChild(f,n);
    });
  };
})();
wrapPhrases(document.body);

// scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); }});
}, { threshold:.1 });
document.querySelectorAll('.rv,.tk2').forEach(el => obs.observe(el)); // 10/29 .tk2＝技能士の会話（お客さま→スタッフの順にふわっと出す）

// 店舗検索（10/16 ザセールLPと同じ仕組みを移植）
const SHOPS = [
  { name:'アイメガネ本店', page:'https://www.aimegane.com/shop/saitama/539/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/01_honten.webp', zip:'331', addr:'〒331-8760 埼玉県さいたま市北区宮原町1-505-1', web:'https://www.aimegane.com/qualification/6395/', tel:'048-668-0001', lat:35.937226, lng:139.613603, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
  { name:'アイメガネ与野イオン店', page:'https://www.aimegane.com/shop/saitama/622/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/02_yono_aeon.webp', zip:'338', addr:'〒338-0004 埼玉県さいたま市中央区本町西5-2-9', web:'https://www.aimegane.com/qualification/6938/', tel:'048-851-0001', lat:35.890863, lng:139.612513, products:'メガネ・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ与野本町店', page:'https://www.aimegane.com/shop/saitama/662/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/04_yonohonmachi.webp', zip:'338', addr:'〒338-0003 埼玉県さいたま市中央区本町東1-6-3', web:'https://www.aimegane.com/qualification/7355/', tel:'048-852-0001', lat:35.878821, lng:139.622358, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ南浦和店', page:'https://www.aimegane.com/shop/saitama/695/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/1-南浦和外観修正.jpg', zip:'336', addr:'〒336-0017 埼玉県さいたま市南区南浦和3-2-5', web:'https://www.aimegane.com/qualification/6340/', tel:'048-885-0001', lat:35.846721, lng:139.669621, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ岩槻駅前通り店', page:'https://www.aimegane.com/shop/saitama/661/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/岩槻店舗外観写真.jpg', zip:'339', addr:'〒339-0055 埼玉県さいたま市岩槻区東町1-12', web:'https://www.aimegane.com/qualification/7356/', tel:'048-757-0001', lat:35.947905, lng:139.695562, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
  { name:'アイメガネ上尾東口駅前店', page:'https://www.aimegane.com/shop/saitama/666/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/06_ageo.webp', zip:'362', addr:'〒362-0036 埼玉県上尾市宮本町4-18', web:'https://www.aimegane.com/qualification/7153/', tel:'048-773-0001', lat:35.97386, lng:139.587324, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ鴻巣東駅通り店', page:'https://www.aimegane.com/shop/saitama/669/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/IMG_0363.jpg', zip:'365', addr:'〒365-0039 埼玉県鴻巣市東2-6-2', web:'https://www.aimegane.com/qualification/6939/', tel:'048-542-0001', lat:36.0637, lng:139.5241, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定・防音室完備', },
  { name:'アイメガネ鴻巣ウニクス店', page:'https://www.aimegane.com/shop/saitama/690/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/25_kounosu_uniqus.webp', zip:'369', addr:'〒369-0116 埼玉県鴻巣市北新宿225-1', web:'https://www.aimegane.com/qualification/7358/', tel:'048-547-0001', lat:36.112509, lng:139.436912, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ熊谷ティアラ店', page:'https://www.aimegane.com/shop/saitama/670/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/08_kumgaya.webp', zip:'360', addr:'〒360-0037 埼玉県熊谷市筑波3-202', web:'https://www.aimegane.com/qualification/7359/', tel:'048-525-0001', lat:36.139479, lng:139.389063, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ深谷上柴西店', page:'https://www.aimegane.com/shop/saitama/671/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/202506改装深谷上芝.jpg', zip:'366', addr:'〒366-0052 埼玉県深谷市上柴町西3-7-9', web:'https://www.aimegane.com/qualification/6681/', tel:'048-572-0001', lat:36.18414, lng:139.300285, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定・防音室完備', },
  { name:'アイメガネ富士見鶴馬店', page:'https://www.aimegane.com/shop/saitama/678/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/14_fujimi.webp', zip:'354', addr:'〒354-0021 埼玉県富士見市鶴馬1-25-1', web:'https://www.aimegane.com/qualification/7158/', tel:'049-251-0001', lat:35.851697, lng:139.541735, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
  { name:'アイメガネ川越的場店', page:'https://www.aimegane.com/shop/saitama/680/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/kawagoematoba-1.jpg', zip:'350', addr:'〒350-1101 埼玉県川越市的場823-1', web:'https://www.aimegane.com/qualification/7159/', tel:'049-233-0001', lat:35.914154, lng:139.42809, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
  { name:'アイメガネ坂戸にっさい店', page:'https://www.aimegane.com/shop/saitama/682/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/IMG_7521.jpg', zip:'350', addr:'〒350-0269 埼玉県坂戸市にっさい花みず木3-11-2', web:'https://www.aimegane.com/qualification/6940/', tel:'049-280-0001', lat:35.969359, lng:139.368666, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ東松山松本町店', page:'https://www.aimegane.com/shop/saitama/683/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/東松山2026.jpg', zip:'355', addr:'〒355-0014 埼玉県東松山市松本町2-7-1', web:'https://www.aimegane.com/qualification/7361/', tel:'0493-27-0001', lat:36.039377, lng:139.41351, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ嵐山バイパス店', page:'https://www.aimegane.com/shop/saitama/684/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/19_ranzan.webp', zip:'355', addr:'〒355-0215 埼玉県比企郡嵐山町平澤2610', web:'https://www.aimegane.com/qualification/7362/', tel:'0493-61-0001', lat:36.044584, lng:139.314798, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
  { name:'アイメガネ小川大塚店', page:'https://www.aimegane.com/shop/saitama/686/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/21_ogawa.webp', zip:'355', addr:'〒355-0328 埼玉県比企郡小川町大塚541-1', web:'https://www.aimegane.com/qualification/7363/', tel:'0493-73-0001', lat:36.058609, lng:139.254464, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'AIフィッティングミラー', },
  { name:'アイメガネ寄居店', page:'https://www.aimegane.com/shop/saitama/687/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/22_yorii.webp', zip:'369', addr:'〒369-1203 埼玉県大里郡寄居町寄居1615-1', web:'https://www.aimegane.com/qualification/7364/', tel:'048-580-0001', lat:36.120921, lng:139.186708, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ日高店', page:'https://www.aimegane.com/shop/saitama/681/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/16_hidaka.webp', zip:'350', addr:'〒350-1231 埼玉県日高市鹿山301-6', web:'https://www.aimegane.com/qualification/5078/', tel:'042-986-0001', lat:35.896285, lng:139.337031, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネイオンタウン毛呂山店', page:'https://www.aimegane.com/shop/saitama/691/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/26_aeontown_moroyama.webp', zip:'350', addr:'〒350-0436 埼玉県入間郡毛呂山町川角58-3', web:'https://www.aimegane.com/qualification/6941/', tel:'049-293-0001', lat:35.946429, lng:139.311799, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ秩父中宮地店', page:'https://www.aimegane.com/shop/saitama/688/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/23_chichibu.webp', zip:'368', addr:'〒368-0022 埼玉県秩父市中宮地町5-7', web:'https://www.aimegane.com/qualification/6682/', tel:'0494-21-0001', lat:36.0043, lng:139.08865, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定・防音室完備', },
  { name:'アイメガネ川口赤井店', page:'https://www.aimegane.com/shop/saitama/689/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A-3.jpg', zip:'334', addr:'〒334-0073 埼玉県川口市赤井4-16-19', web:'https://www.aimegane.com/qualification/7154/', tel:'048-280-0001', lat:35.829315, lng:139.738067, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネエキア谷塚店', page:'https://www.aimegane.com/shop/saitama/693/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/28_ekiayatuka.webp', zip:'340', addr:'〒340-0028 埼玉県草加市谷塚1-1-23', web:'https://www.aimegane.com/qualification/7156/', tel:'048-924-0001', lat:35.81447, lng:139.799081, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定・防音室完備', },
  { name:'アイメガネ三郷南口駅前通り店', page:'https://www.aimegane.com/shop/saitama/674/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/11_misato_minamiguchi.webp', zip:'341', addr:'〒341-0024 埼玉県三郷市三郷1-27-7', web:'https://www.aimegane.com/qualification/7360/', tel:'048-949-0002', lat:35.841637, lng:139.881253, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ新越谷店', page:'https://www.aimegane.com/shop/saitama/692/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/27_shinkosigaya.webp', zip:'343', addr:'〒343-0857 埼玉県越谷市新越谷1-70-1', web:'https://www.aimegane.com/qualification/6133/', tel:'048-990-0001', lat:35.872129, lng:139.781357, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ蓮田関山店', page:'https://www.aimegane.com/shop/saitama/663/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/05_hasuda.webp', zip:'349', addr:'〒349-0121 埼玉県蓮田市関山2-6-13', web:'https://www.aimegane.com/qualification/7152/', tel:'048-764-0001', lat:35.989131, lng:139.646368, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ幸手エムズタウン店', page:'https://www.aimegane.com/shop/saitama/675/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/12_satte.webp', zip:'340', addr:'〒340-0155 埼玉県幸手市上高野824', web:'https://www.aimegane.com/qualification/7157/', tel:'0480-44-0001', lat:36.066043, lng:139.71615, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ羽生店', page:'https://www.aimegane.com/shop/saitama/677/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/13_hanyu.webp', zip:'348', addr:'〒348-0053 埼玉県羽生市南7-1-1', web:'https://www.aimegane.com/qualification/6937/', tel:'048-563-0001', lat:36.166224, lng:139.537497, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ小平小川町店', page:'https://www.aimegane.com/shop/tokyo/699/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/kodaira.png', zip:'187', addr:'〒187-0032 東京都小平市小川町2-1328', web:'https://www.aimegane.com/qualification/6683/', tel:'042-347-6877', lat:35.73041, lng:139.473441, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネザ・マーケットプレイス東大和店', page:'https://www.aimegane.com/shop/tokyo/3879/', photo:'https://www.aimegane.com/wp-content/uploads/2024/10/IMG_7097-修正.jpg', zip:'207', addr:'〒207-0021 東京都東大和市立野3-1344-1', web:'https://www.aimegane.com/qualification/6684/', tel:'042-843-7011', lat:35.751, lng:139.442, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ町田木曽店', page:'https://www.aimegane.com/shop/tokyo/700/', photo:'https://www.aimegane.com/wp-content/uploads/2025/12/町田木曽外観.jpg', zip:'194', addr:'〒194-0036 東京都町田市木曽東3-8-1', web:'https://www.aimegane.com/qualification/7679/', tel:'042-724-0201', lat:35.561476, lng:139.425796, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネおもちゃのまち西口店', page:'https://www.aimegane.com/shop/tochigi/696/', photo:'https://www.aimegane.com/wp-content/uploads/2025/10/omocha-2-1.jpg', zip:'321', addr:'〒321-0206 栃木県下都賀郡壬生町あけぼの町5-5', web:'https://www.aimegane.com/qualification/7678/', tel:'0282-85-0001', lat:36.47107, lng:139.825802, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ宇都宮錦店', page:'https://www.aimegane.com/shop/tochigi/697/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/31_utunomiyanisiki.webp', zip:'321', addr:'〒321-0967 栃木県宇都宮市錦3-9-11', web:'https://www.aimegane.com/qualification/7433/', tel:'028-627-0001', lat:36.574698, lng:139.89493, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ今市センショープラザ店', page:'https://www.aimegane.com/shop/tochigi/698/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/32_imaichi.webp', zip:'321', addr:'〒321-2405 栃木県日光市芹沼1448-1', web:'https://www.aimegane.com/qualification/6680/', tel:'0288-23-0001', lat:36.741119, lng:139.70774, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ八千代台ユアエルム店', page:'https://www.aimegane.com/shop/chiba/705/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/35_yachiyodai.webp', zip:'276', addr:'〒276-0032 千葉県八千代市八千代台東1-1-10', web:'https://www.aimegane.com/qualification/7365/', tel:'047-485-0001', lat:35.700303, lng:140.073005, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・防音室完備', },
  { name:'アイメガネ古河イオン店', page:'https://www.aimegane.com/shop/ibaraki/706/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/36_kogaaeon.webp', zip:'306', addr:'〒306-0012 茨城県古河市旭町1-2-17', web:'https://www.aimegane.com/qualification/7366/', tel:'0280-33-0001', lat:36.197244, lng:139.716929, products:'メガネ・コンタクト・補聴器', qualifications:'1級眼鏡作製技能士・眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ藤岡店', page:'https://www.aimegane.com/shop/gunma/707/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/fujioka-2.jpg', zip:'375', addr:'〒375-0024 群馬県藤岡市藤岡937-1', web:'https://www.aimegane.com/qualification/7367/', tel:'0274-22-0001', lat:36.253775, lng:139.074382, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー', },
  { name:'アイメガネ焼津石津店', page:'https://www.aimegane.com/shop/shizuoka/708/', photo:'https://www.aimegane.com/wp-content/uploads/2024/03/38_yaizu.webp', zip:'425', addr:'〒425-0041 静岡県焼津市石津3-19-16', web:'https://www.aimegane.com/qualification/7369/', tel:'054-656-0001', lat:34.843318, lng:138.31291, products:'メガネ・コンタクト・補聴器', qualifications:'眼鏡作製技能士・認定補聴器技能者', facilities:'調節機能解析装置(アコモレフ)常設店・AIフィッティングミラー・深視力測定', },
];

// 郵便番号3桁プレフィックス→[緯度,経度]概算マップ(ユーザー入力位置の推定用)
const ZIP_CENTERS = {
  '100':[35.685,139.753],'101':[35.698,139.770],'102':[35.689,139.744],'103':[35.685,139.781],'104':[35.669,139.769],'105':[35.658,139.751],'106':[35.655,139.730],'107':[35.663,139.729],'108':[35.642,139.750],'110':[35.712,139.777],'111':[35.710,139.800],'112':[35.721,139.745],'113':[35.720,139.762],'114':[35.751,139.733],'115':[35.775,139.720],'116':[35.736,139.762],'120':[35.776,139.804],'121':[35.786,139.822],'130':[35.703,139.814],'131':[35.711,139.821],'132':[35.708,139.878],'133':[35.709,139.868],'134':[35.677,139.875],'135':[35.652,139.819],'136':[35.669,139.826],'140':[35.609,139.731],'141':[35.625,139.729],'142':[35.611,139.715],'143':[35.605,139.729],'144':[35.561,139.716],'145':[35.587,139.688],'146':[35.562,139.675],'150':[35.658,139.702],'151':[35.677,139.701],'152':[35.633,139.699],'153':[35.640,139.693],'154':[35.648,139.670],'155':[35.659,139.659],'156':[35.641,139.643],'157':[35.653,139.629],'158':[35.608,139.643],'160':[35.694,139.703],'161':[35.708,139.715],'162':[35.699,139.725],'163':[35.690,139.692],'164':[35.694,139.666],'165':[35.706,139.665],'166':[35.700,139.640],'167':[35.705,139.622],'168':[35.684,139.634],'169':[35.704,139.702],'170':[35.733,139.712],'171':[35.728,139.714],'173':[35.751,139.709],'174':[35.752,139.686],'175':[35.777,139.686],'176':[35.736,139.652],'177':[35.734,139.627],'178':[35.731,139.605],'179':[35.757,139.616],'180':[35.705,139.580],'181':[35.684,139.568],'182':[35.651,139.545],'183':[35.680,139.479],'184':[35.698,139.481],'185':[35.702,139.464],'186':[35.738,139.438],'187':[35.729,139.478],'188':[35.722,139.455],'189':[35.763,139.477],'190':[35.696,139.414],'191':[35.659,139.339],'192':[35.663,139.338],'193':[35.640,139.339],'194':[35.559,139.437],'195':[35.635,139.441],'196':[35.800,139.386],'197':[35.795,139.348],'198':[35.799,139.210],'201':[35.697,139.546],'202':[35.714,139.548],'203':[35.756,139.544],'204':[35.799,139.478],'205':[35.785,139.391],'206':[35.650,139.442],'207':[35.754,139.436],'208':[35.717,139.407],'211':[35.571,139.664],'212':[35.538,139.697],'213':[35.606,139.577],'214':[35.592,139.556],'215':[35.559,139.563],'216':[35.579,139.542],'220':[35.453,139.634],'221':[35.485,139.605],'222':[35.504,139.627],'223':[35.539,139.635],'224':[35.537,139.592],'225':[35.531,139.545],'226':[35.515,139.522],'227':[35.544,139.495],'230':[35.521,139.702],'231':[35.442,139.642],'232':[35.430,139.620],'233':[35.393,139.586],'234':[35.398,139.553],'235':[35.384,139.615],'236':[35.365,139.638],'237':[35.339,139.657],'238':[35.275,139.661],'239':[35.281,139.678],'240':[35.451,139.582],'241':[35.493,139.508],'243':[35.438,139.343],'245':[35.475,139.527],'250':[35.265,139.154],'252':[35.530,139.387],'253':[35.331,139.406],'254':[35.322,139.341],'257':[35.301,139.148],'270':[35.771,139.918],'271':[35.781,139.901],'272':[35.724,139.932],'273':[35.697,139.983],'274':[35.697,140.027],'275':[35.687,140.027],'276':[35.722,140.101],'277':[35.864,139.962],'278':[35.820,139.912],'279':[35.642,139.900],'290':[35.495,140.124],'295':[35.082,140.111],'296':[35.168,140.166],'298':[35.134,140.283],'299':[35.519,140.222],'300':[35.976,140.140],'301':[35.908,140.027],'302':[35.931,139.989],'305':[36.103,140.117],'306':[36.178,139.698],'307':[36.193,139.742],'308':[36.177,139.997],'309':[36.108,140.136],'310':[36.343,140.448],'311':[36.373,140.408],'312':[36.384,140.478],'313':[36.385,140.540],'314':[36.028,140.487],'315':[36.118,140.407],'316':[36.383,140.564],'317':[36.517,140.663],'318':[36.569,140.651],'319':[36.394,140.443],'320':[36.553,139.876],'321':[36.554,139.889],'322':[36.726,139.853],'323':[36.370,139.731],'324':[36.962,139.910],'325':[36.979,139.919],'326':[36.380,139.605],'327':[36.333,139.569],'328':[36.381,139.671],'329':[36.575,139.799],'330':[35.903,139.665],'331':[35.942,139.623],'332':[35.828,139.743],'333':[35.861,139.748],'334':[35.823,139.765],'335':[35.796,139.685],'336':[35.847,139.671],'337':[35.924,139.701],'338':[35.883,139.635],'339':[35.949,139.686],'340':[35.813,139.803],'341':[35.819,139.866],'342':[35.987,139.799],'343':[35.875,139.795],'344':[35.899,139.716],'345':[36.075,139.741],'346':[36.080,139.657],'347':[36.140,139.600],'348':[36.171,139.549],'349':[35.994,139.674],'350':[35.931,139.471],'351':[35.795,139.591],'352':[35.796,139.570],'353':[35.814,139.578],'354':[35.846,139.543],'355':[36.032,139.408],'356':[35.869,139.557],'357':[35.850,139.317],'358':[35.878,139.534],'359':[35.784,139.432],'360':[36.139,139.395],'361':[36.056,139.497],'362':[35.974,139.596],'363':[36.008,139.566],'364':[35.994,139.554],'365':[36.066,139.522],'366':[36.185,139.288],'367':[36.248,139.199],'368':[36.007,139.085],'369':[36.117,139.203],'370':[36.322,139.006],'371':[36.390,139.061],'372':[36.311,139.325],'373':[36.302,139.371],'374':[36.256,139.192],'375':[36.256,139.077],'376':[36.402,139.333],'377':[36.480,138.996],'378':[36.644,139.061],'379':[36.467,138.879],'380':[36.649,138.195],'381':[36.605,138.195],'400':[35.664,138.568],'410':[35.119,138.906],'411':[35.117,138.907],'412':[35.240,138.937],'413':[34.975,138.934],'414':[34.968,139.099],'415':[34.761,138.946],'416':[35.121,138.685],'417':[35.172,138.610],'418':[35.216,138.612],'419':[35.315,138.252],'420':[34.975,138.383],'421':[34.866,138.274],'422':[34.944,138.425],'423':[34.974,138.485],'424':[35.012,138.488],'425':[34.863,138.318],'426':[34.897,138.260],'427':[34.816,138.232],'428':[34.987,138.149],'429':[34.761,137.961],'430':[34.710,137.727],'431':[34.712,137.721],'432':[34.710,137.714],'433':[34.760,137.751],'434':[34.776,137.811],'435':[34.720,137.775],'436':[34.801,137.999],'437':[34.786,138.039],'438':[34.728,137.852],'439':[34.790,138.012],'440':[34.773,137.389]
};

// 都道府県による絞り込み(住所テキストから都道府県名を判定)
const shopState = {
  pref:'', products:new Set(), qualifications:new Set(), facilities:new Set(),
  mode:'initial', lastLat:null, lastLng:null, lastLabel:''
};
const FILTER_LABELS = {
  'コンタクト':'コンタクトレンズ取扱店', '補聴器':'補聴器取扱店',
  'アコモレフ':'調節機能解析装置(アコモレフ)常設店'
};
function getPref(s){
  const m = s.addr.match(/(北海道|東京都|京都府|大阪府|[一-龠]{2,3}県)/);
  return m ? m[0] : '';
}
function filteredShops(){
  return SHOPS.filter(s=>{
    if(shopState.pref && getPref(s)!==shopState.pref) return false;
    if(shopState.products.size && ![...shopState.products].some(v=>s.products.includes(v))) return false;
    if(shopState.qualifications.size && ![...shopState.qualifications].some(v=>s.qualifications.includes(v))) return false;
    if(shopState.facilities.size && ![...shopState.facilities].some(v=>s.facilities.includes(v))) return false;
    return true;
  });
}
function toggleFilterCheck(el){
  const cat=el.dataset.cat;
  if(el.checked) shopState[cat].add(el.value);
  else shopState[cat].delete(el.value);
  refreshResults();
}
function getActiveConditions(){
  const conds=[];
  if(shopState.pref) conds.push({cat:'pref', value:shopState.pref, label:shopState.pref});
  ['products','qualifications','facilities'].forEach(cat=>{
    shopState[cat].forEach(v=>conds.push({cat, value:v, label:FILTER_LABELS[v]||v}));
  });
  return conds;
}
function removeCondition(cat,value){
  if(cat==='pref'){
    shopState.pref='';
    renderPrefTabs();
  } else {
    shopState[cat].delete(value);
    const cb=document.querySelector(`.shop-filter-check input[data-cat="${cat}"][value="${value}"]`);
    if(cb) cb.checked=false;
  }
  refreshResults();
}
function clearAllFilters(){
  shopState.pref='';
  shopState.products.clear();
  shopState.qualifications.clear();
  shopState.facilities.clear();
  renderPrefTabs();
  document.querySelectorAll('.shop-filter-check input[type="checkbox"]').forEach(cb=>cb.checked=false);
  refreshResults();
}
function renderPrefTabs(){
  const wrap=document.getElementById('shopPrefTabs');
  if(!wrap)return;
  const order=[];
  const counts={};
  SHOPS.forEach(s=>{
    const p=getPref(s);
    if(!(p in counts)){ counts[p]=0; order.push(p); }
    counts[p]++;
  });
  let html=`<button type="button" class="shop-pref-tab${shopState.pref===''?' active':''}" onclick="selectPref('')">すべて<span class="shop-pref-count">${SHOPS.length}</span></button>`;
  order.forEach(p=>{
    html+=`<button type="button" class="shop-pref-tab${shopState.pref===p?' active':''}" onclick="selectPref('${p}')">${p}<span class="shop-pref-count">${counts[p]}</span></button>`;
  });
  wrap.innerHTML=html;
}
function selectPref(p){
  shopState.pref=p;
  renderPrefTabs();
  refreshResults();
}
function toggleFilterAccordion(forceOpen){
  const acc=document.getElementById('shopFilterAccordion');
  const btn=document.getElementById('shopFilterToggleBtn');
  if(!acc)return;
  const open = forceOpen===true ? true : !acc.classList.contains('open');
  acc.classList.toggle('open', open);
  if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function toggleFilterPanel(){
  toggleFilterAccordion(true);
  document.getElementById('shopFilterAccordion').scrollIntoView({behavior:'smooth',block:'start'});
}
function refreshResults(){
  if(shopState.mode==='search' && shopState.lastLat!=null){
    renderSearchResult(shopState.lastLat, shopState.lastLng, shopState.lastLabel);
  } else {
    showInitialShops();
  }
}
function updateFloatingBar(){
  const countRow=document.getElementById('shopFilterCountRow');
  const condWrap=document.getElementById('shopFilterCondWrap');
  const applyBtn=document.getElementById('shopFilterApplyBtn');
  const clearBtn=document.getElementById('shopFilterClearBtn');
  const conds=getActiveConditions();
  const matched=filteredShops().length;
  if(countRow){
    countRow.innerHTML = conds.length
      ? `<span class="shop-filter-count-num">${matched}</span><span class="shop-filter-count-label">店舗該当</span><span class="shop-filter-total">/ 全${SHOPS.length}店舗</span>`
      : `<span class="shop-filter-count-num">${SHOPS.length}</span><span class="shop-filter-count-label">店舗</span><span class="shop-filter-total">全${SHOPS.length}店舗を表示中</span>`;
  }
  if(condWrap){
    condWrap.innerHTML = conds.length
      ? `<span class="shop-filter-cond-label">検索条件:</span><div class="shop-filter-pills">${conds.map(c=>`<span class="shop-filter-pill">${c.label}<button type="button" class="shop-filter-pill-x" onclick="removeCondition('${c.cat}','${c.value}')" aria-label="絞り込みを解除">×</button></span>`).join('')}</div>`
      : '<span class="shop-filter-cond-empty">絞り込み条件なし。</span>';
  }
  if(applyBtn) applyBtn.style.display = conds.length ? 'inline-flex' : 'none';
  if(clearBtn) clearBtn.style.display = conds.length ? 'inline-block' : 'none';
}
function setupShopFilterBarVisibility(){
  const bar=document.getElementById('shopFilterBar');
  const shopSection=document.getElementById('shop-search');
  if(!bar||!shopSection)return;
  function check(){
    const r=shopSection.getBoundingClientRect();
    // 10/29 検索フォームに重ならないよう、店舗一覧（都道府県タブ以下）が画面に入ってから表示する
    const list=document.getElementById('shopPrefTabs')||shopSection;
    const visible = list.getBoundingClientRect().top < window.innerHeight*0.7 && r.bottom > window.innerHeight*0.35;
    bar.classList.toggle('visible', visible);
  }
  window.addEventListener('scroll', check, {passive:true});
  window.addEventListener('resize', check);
  // ページ内の画像読み込み完了前は高さが確定しておらず誤判定するため、
  // 読み込み完了後にも必ず再計算する
  window.addEventListener('load', check);
  check();
  setTimeout(check, 800);
}

function haversineKm(lat1,lng1,lat2,lng2){
  const toRad=d=>d*Math.PI/180;
  const R=6371;
  const dLat=toRad(lat2-lat1);
  const dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
// 10/20 住所：郵便番号は1行目、番地（数字の部分）は途中で改行しない
function fmtAddr(a){
  const m=a.match(/^(〒\S+)\s+(.*)$/); if(!m)return a;
  const rest=m[2].replace(/([0-9０-９][0-9０-９\-－ー]*[^\s]*)$/,'<span class="addr-nw">$1</span>');
  return `<span class="addr-zip">${m[1]}</span><br>${rest}`;
}
// 10/23 Googleマップへのリンク（ブラックフライデーLPと同じ。店名＋住所で検索）
function mapLink(s){ const q=encodeURIComponent(s.name+' '+s.addr.replace(/〒\d{3}-\d{4}\s*/,'')); return `<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" class="shop-map" data-cta-location="store_map">地図・営業時間を見る</a>`; }
function renderShops(list){
  return list.map(s=>`
    <div class="shop-card">
      <p class="shop-card-name">${s.page?`<a href="${s.page}" target="_blank" rel="noopener" class="shop-name-link" data-cta-location="store_page">${s.name}</a>`:s.name}</p>
      <p class="shop-card-addr">${fmtAddr(s.addr)}</p>
      ${mapLink(s)}
      ${s.distanceKm!=null?`<p class="shop-card-distance">お住まいから約 <strong>${s.distanceKm.toFixed(1)} km</strong></p>`:''}
      <div class="shop-card-btns">
        <a href="${s.web}" target="_blank" rel="noopener" class="shop-btn-web" data-cta-location="store_web">WEB予約</a>
        <a href="tel:${s.tel.replace(/-/g,'')}" class="shop-btn-tel" data-cta-location="store_tel" aria-label="電話予約"><span class="shop-btn-tel-num">${s.tel}</span></a>
      </div>
    </div>
  `).join('');
}
function renderHeroShop(s){
  return `
    <div class="shop-hero-card">
      <div class="shop-hero-photo">${s.photo?`<img src="${s.photo}" alt="${s.name}" loading="lazy">`:`<div class="shop-hero-photo-ph"><span>📷 店舗写真</span></div>`}</div>
      <div class="shop-hero-body">
        <p class="shop-hero-badge">お客様に最も近い店舗</p>
        <h3 class="shop-hero-name">${s.page?`<a href="${s.page}" target="_blank" rel="noopener" class="shop-name-link" data-cta-location="store_page">${s.name}</a>`:s.name}</h3>
        <p class="shop-hero-addr">${s.addr}</p>
        ${mapLink(s)}
        ${s.distanceKm!=null?`<p class="shop-hero-distance">お住まいから約 <strong>${s.distanceKm.toFixed(1)} km</strong></p>`:''}
        <div class="shop-hero-btns">
          <a href="${s.web}" target="_blank" rel="noopener" class="shop-hero-btn shop-hero-btn-web" data-cta-location="store_web">WEB予約</a>
          <a href="tel:${s.tel.replace(/-/g,'')}" class="shop-hero-btn shop-hero-btn-tel" data-cta-location="store_tel" aria-label="電話予約"><span class="shop-hero-btn-tel-num">${s.tel}</span></a>
        </div>
      </div>
    </div>
  `;
}
function showInitialShops(){
  shopState.mode='initial';
  const resEl=document.getElementById('shop-results');
  const countEl=document.getElementById('shop-count');
  const shops=filteredShops();
  const initial=shops.slice(0,4);
  const rest=shops.slice(4);
  countEl.style.display='none';
  resEl.innerHTML = shops.length===0 ? `
    <p class="shop-empty">選択した都道府県に店舗がありません。</p>
  ` : `
    <div class="shop-initial">${renderShops(initial)}</div>
    ${rest.length>0?`
    <div class="shop-more-wrap">
      <div class="shop-more-list-outer">
        <div class="shop-more-list" id="shopMoreList">${renderShops(rest)}</div>
        <div class="shop-back-rail" id="shopBackRail"><a href="#shop-search" class="shop-back-top" data-cta-location="back_to_search"><span class="shop-back-arrows">«</span>検索に戻る</a></div>
      </div>
      <button type="button" class="shop-more-btn" id="shopMoreBtn" onclick="toggleMoreShops()">
        <span class="shop-more-btn-text">もっと見る</span>
      </button>
    </div>
    `:''}
  `;
  updateFloatingBar(); wrapPhrases(resEl);
}
function toggleMoreShops(){
  const list=document.getElementById('shopMoreList');
  const outer=list.closest('.shop-more-list-outer');
  const btn=document.getElementById('shopMoreBtn');
  const textEl=btn.querySelector('.shop-more-btn-text');
  const isOpen=outer.classList.toggle('open');
  list.classList.toggle('open',isOpen);
  textEl.textContent=isOpen?'閉じる':'もっと見る';
  btn.classList.toggle('open',isOpen);
}
// HeartRails APIで7桁郵便番号→緯度経度を取得(建物レベル精度)
async function fetchZipCoord(zip7){
  try{
    const res=await fetch(`https://geoapi.heartrails.com/api/json?method=searchByPostal&postal=${zip7}`);
    const data=await res.json();
    const loc=data?.response?.location?.[0];
    if(loc && loc.x && loc.y){
      return {lat:parseFloat(loc.y),lng:parseFloat(loc.x),addr:`${loc.prefecture}${loc.city}${loc.town}`};
    }
  }catch(e){}
  return null;
}
function renderSearchResult(userLat,userLng,labelHtml,scrollToResult){
  shopState.mode='search';
  shopState.lastLat=userLat;
  shopState.lastLng=userLng;
  shopState.lastLabel=labelHtml;
  const resEl=document.getElementById('shop-results');
  const countEl=document.getElementById('shop-count');
  const ranked=filteredShops().map(s=>({
    ...s,
    distanceKm:haversineKm(userLat,userLng,s.lat,s.lng)
  })).sort((a,b)=>a.distanceKm-b.distanceKm);
  countEl.style.display='block';
  countEl.innerHTML=`${labelHtml}<br><small class="shop-count-note">※表示される距離は直線距離です。実際の道のりとは異なる場合があります。</small>`;
  if(ranked.length===0){
    resEl.innerHTML='<p class="shop-empty">選択した都道府県に店舗がありません。都道府県の絞り込みを解除するか、別の都道府県をお試しください。</p>';
    updateFloatingBar();
    if(scrollToResult){
      countEl.scrollIntoView({behavior:'smooth',block:'start'});
    }
    return;
  }
  const hero=ranked[0];
  const others=ranked.slice(1,5);
  const rest=ranked.slice(5);
  resEl.innerHTML=`
    ${renderHeroShop(hero)}
    <div class="shop-others-grid">${renderShops(others)}</div>
    ${rest.length>0?`
    <div class="shop-more-wrap">
      <div class="shop-more-list-outer">
        <div class="shop-more-list" id="shopMoreList">${renderShops(rest)}</div>
      </div>
      <button type="button" class="shop-more-btn" id="shopMoreBtn" onclick="toggleMoreShops()">
        <span class="shop-more-btn-text">もっと見る</span>
      </button>
    </div>
    `:''}
  `;
  updateFloatingBar();
  if(scrollToResult){
    countEl.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
function searchByLocation(){
  const btn=document.getElementById('shopGeoBtn');
  const countEl=document.getElementById('shop-count');
  const resEl=document.getElementById('shop-results');
  if(!navigator.geolocation){
    countEl.style.display='block';
    countEl.textContent='お使いの環境では現在地の取得に対応していません。郵便番号で検索してください。';
    return;
  }
  btn.disabled=true;
  countEl.style.display='block';
  countEl.textContent='現在地を取得中…';
  resEl.innerHTML='';
  navigator.geolocation.getCurrentPosition(
    pos=>{
      btn.disabled=false;
      renderSearchResult(pos.coords.latitude,pos.coords.longitude,'現在地から近い順',true);
    },
    ()=>{
      btn.disabled=false;
      countEl.textContent='現在地を取得できませんでした。郵便番号で検索してください。';
    },
    {timeout:10000}
  );
}
async function searchShop(){
  const z1=document.getElementById('zip1').value.trim();
  const z2=document.getElementById('zip2').value.trim();
  const zip=z1+z2;
  const countEl=document.getElementById('shop-count');
  const resEl=document.getElementById('shop-results');
  if(zip.length<3){
    showInitialShops();
    return;
  }
  if(zip.length===7){
    countEl.style.display='block';
    countEl.textContent='位置情報を取得中…';
    resEl.innerHTML='';
    const coord=await fetchZipCoord(zip);
    if(coord){
      renderSearchResult(coord.lat,coord.lng,
        `<span class="shop-count-zip">〒${z1}-${z2}</span>(${coord.addr})から近い順`,true);
      return;
    }
  }
  const center=ZIP_CENTERS[z1];
  if(!center){
    countEl.style.display='block';
    countEl.textContent='この郵便番号の位置情報が見つかりませんでした。';
    resEl.innerHTML='<p class="shop-empty">別の番号を試すか、下の店舗一覧からお近くの店舗をお探しください。</p>';
    return;
  }
  renderSearchResult(center[0],center[1],
    `<span class="shop-count-zip">〒${z1}${z2?'-'+z2:''}</span> から近い順`,true);
}
document.getElementById('zip1').addEventListener('input',function(){if(this.value.length>=3)document.getElementById('zip2').focus();});
document.getElementById('zip1').addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;
  e.preventDefault();
  if(this.value.trim().length>=3)searchShop();
  else document.getElementById('zip2').focus();
});
document.getElementById('zip2').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();searchShop();}});

renderPrefTabs();
showInitialShops();
setupShopFilterBarVisibility();

// フローティングCTA: FV通過後〜最終CTA手前まで表示
const fc=document.getElementById('floatCta');
const hero=document.getElementById('hero');
const fctaEl=document.getElementById('fcta');
const shopSec=document.getElementById('shop-search');
window.addEventListener('scroll',()=>{
  const passedHero=window.scrollY>hero.offsetHeight*0.45; // 10/19 heroはFV＋メッセージの1枚画像なので、FV（上から約半分）を過ぎたら表示
  const beforeFcta=fctaEl.getBoundingClientRect().top>window.innerHeight;
  const r=shopSec?shopSec.getBoundingClientRect():null;
  const nearShop=r?(r.top<window.innerHeight*1.1&&r.bottom>0):false;
  fc.classList.toggle('visible',passedHero&&beforeFcta&&!nearShop);
},{passive:true});

// スマホのハンバーガーメニュー：開閉（リンクを押す・Escで閉じる）
(()=>{
  const btn=document.querySelector('.sp-burger'), menu=document.getElementById('sp-menu');
  if(!btn||!menu)return;
  const set=open=>{
    btn.setAttribute('aria-expanded',open); btn.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
    document.body.classList.toggle('menu-open',open);
    if(open){ menu.hidden=false; requestAnimationFrame(()=>menu.classList.add('is-open')); }
    else{ menu.classList.remove('is-open'); setTimeout(()=>{ if(btn.getAttribute('aria-expanded')==='false')menu.hidden=true; },300); }
  };
  btn.addEventListener('click',()=>set(btn.getAttribute('aria-expanded')!=='true'));
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&btn.getAttribute('aria-expanded')==='true')set(false); });
})();

// 商品ラインナップ：タイルを押すと全画面の詳細を開く（画像は加工せず全体表示）
(()=>{
  const DATA={"lineart": {"name": "Line Art", "kana": "ラインアート", "catch": "細く、しなやかな線のフレーム", "desc": "線のように細いつるが印象的なフレーム。上品なメタルのラウンドから、すっきりしたスクエアまでそろいます。", "imgs": [["sabae_brand-charmant-2_440_167.jpg", 440, 167, true], ["sabae_brand-charmant-1_430_167.jpg", 430, 167, true], ["sabae_brand-charmant-3_362_167.jpg", 362, 167, true], ["sabae_brand-charmant-4_546_167.jpg", 546, 167, true]]}, "tonysame": {"name": "tonysame", "kana": "トニーセイム", "catch": "やわらかな色と丸み", "desc": "透明感のあるピンクやパープル、マーブル模様のセルフレーム。やわらかな丸みのある形で、顔なじみのよい一本が見つかります。", "imgs": [["sabae_brand-tonysame-2_1000_430.jpg", 1000, 430, true], ["sabae_brand-tonysame-3_1000_430.jpg", 1000, 430, true], ["sabae_brand-tonysame-4_1000_430.jpg", 1000, 430, true], ["sabae_brand-tonysame-5_1000_430.jpg", 1000, 430, true], ["sabae_brand-tonysame-1_1000_612.jpg", 1000, 612, false]]}, "yohji": {"name": "Yohji Yamamoto", "kana": "ヨウジヤマモト", "catch": "モードな多角形とスクエア", "desc": "セルとメタルを組み合わせた、多角形やスクエアのフレーム。クリアグレーや、黒とゴールドなど、モードな雰囲気のデザインです。", "imgs": [["sabae_brand-yohji-1_705_1000.jpg", 705, 1000, false], ["sabae_brand-yohji-2_705_1000.jpg", 705, 1000, false]], "logo": ["sabae_logo-yohji_600_221.jpg", 600, 221]}, "husky": {"name": "Farben HUSKY NOISE", "kana": "ファーベン ハスキーノイズ", "catch": "華奢で軽やかな丸メガネ", "desc": "細いメタルの丸メガネに、ゴールドやパープルの色づかい。華奢で軽やかな印象で、顔まわりを明るく見せてくれます。", "imgs": [["sabae_brand-husky-1_1000_705.jpg", 1000, 705, false], ["sabae_brand-husky-2_1000_706.jpg", 1000, 706, false], ["sabae_brand-husky-3_1000_705.jpg", 1000, 705, false]], "logo": ["sabae_logo-husky_600_228.jpg", 600, 228]}, "titanos": {"name": "TITANOS TOKYO", "kana": "チタノス トーキョー", "catch": "チタンで描くクラシック", "desc": "チタンを細く仕上げたフレームに、べっ甲柄やクリアカラーを合わせたデザイン。クラシックな形を、軽やかに掛けられます。", "imgs": [["sabae_brand-titanos-1_1000_667.jpg", 1000, 667, false], ["sabae_brand-titanos-2_1000_667.jpg", 1000, 667, false], ["sabae_brand-titanos-3_1000_667.jpg", 1000, 667, false], ["sabae_brand-titanos-4_1000_667.jpg", 1000, 667, false], ["sabae_brand-titanos-5_1000_706.jpg", 1000, 706, false]]}, "rodenstock": {"name": "RODENSTOCK", "kana": "ローデンストック", "catch": "知的で落ち着いた印象", "desc": "ブローラインやハーフリムなど、知的で落ち着いた印象のデザイン。ゴールドやガンメタルの上品なメタルフレームがそろいます。", "imgs": [["sabae_brand-rodenstock-1_570_250.jpg", 570, 250, true], ["sabae_brand-rodenstock-2_570_250.jpg", 570, 250, true], ["sabae_brand-rodenstock-3_570_250.jpg", 570, 250, true], ["sabae_brand-rodenstock-4_570_250.jpg", 570, 250, true]], "logo": ["sabae_logo-rodenstock_200_160.jpg", 200, 160]}, "ys": {"name": "Y's", "kana": "ワイズ", "catch": "軽やかなラウンドとボストン", "desc": "細いメタルで描いた、軽やかなラウンドやボストン。べっ甲柄やくすみカラーが、装いにさりげない個性を添えます。", "imgs": [["sabae_brand-ys-1_705_1000.jpg", 705, 1000, false], ["sabae_brand-ys-2_705_1000.jpg", 705, 1000, false], ["sabae_brand-ys-3_705_1000.jpg", 705, 1000, false]], "logo": ["sabae_logo-ys_600_467.jpg", 600, 467]}, "oriens": {"name": "ORIENS", "kana": "オリエンス", "catch": "クラシックな佇まい", "desc": "メタルとセルを組み合わせた、クラシックなフレーム。黒・べっ甲柄・グレー・クリアベージュなど、落ち着いた色がそろいます。", "imgs": [["sabae_brand-oriens-f1_341_115.jpg", 341, 115, true], ["sabae_brand-oriens-f2_333_111.jpg", 333, 111, true], ["sabae_brand-oriens-f3_309_106.jpg", 309, 106, true], ["sabae_brand-oriens-f4_313_120.jpg", 313, 120, true], ["sabae_brand-oriens-2_918_1000.jpg", 918, 1000, false], ["sabae_brand-oriens-3_918_1000.jpg", 918, 1000, false], ["sabae_brand-oriens-4_918_1000.jpg", 918, 1000, false]]}, "lanvin": {"name": "LANVIN", "kana": "ランバン", "catch": "曲線が描く上品さ", "desc": "女性らしい曲線のメタルフレームや、黒のセル×ゴールドのデザイン。つるの飾りが、さりげない華やかさに。", "imgs": [["sabae_brand-lanvin-1_570_250.jpg", 570, 250, true], ["sabae_brand-lanvin-2_570_250.jpg", 570, 250, true], ["sabae_brand-lanvin-3_570_250.jpg", 570, 250, true], ["sabae_brand-lanvin-4_570_250.jpg", 570, 250, true]], "logo": ["sabae_logo-lanvin_200_160.jpg", 200, 160]}, "hanaemori": {"name": "HANAE MORI", "kana": "ハナエモリ", "catch": "やわらかなオーバル", "desc": "細いメタルの、やわらかなオーバル型。ゴールドやピンクの色合いが、女性らしい上品さを添えます。", "imgs": [["sabae_brand-hanaemori-1_595_842.jpg", 595, 842, false], ["sabae_brand-hanaemori-2_595_842.jpg", 595, 842, false]]}, "milaschon": {"name": "mila schön", "kana": "ミラ・ショーン", "catch": "細いゴールドの品のよさ", "desc": "細いゴールドのメタルで描いた、軽やかなラウンド型。上品で知的な印象を添えます。", "imgs": [["sabae_brand-milaschon-1_704_1000.jpg", 704, 1000, false]]}, "banerina": {"name": "Banerina", "kana": "バネリーナ", "catch": "明るい表情を引き立てる", "desc": "軽やかなメタルの、丸みのあるフレーム。明るい表情を引き立てる、女性向けのデザインです。", "imgs": [["sabae_brand-banerina-1_1000_704.jpg", 1000, 704, false], ["sabae_brand-banerina-2_1000_704.jpg", 1000, 704, false]]}, "banerino": {"name": "Banerino", "kana": "バネリーノ", "catch": "大人の男性の毎日に", "desc": "男性向けの、すっきりしたメタルやコンビのフレーム。ビジネスにも休日にも合わせやすいデザインです。", "imgs": [["sabae_brand-banerino-1_1000_704.jpg", 1000, 704, false], ["sabae_brand-banerino-2_1000_704.jpg", 1000, 704, false]]}, "dupont": {"name": "S.T. Dupont", "kana": "エス・テー・デュポン", "catch": "品のある大人の装い", "desc": "端正なメタルフレームや、べっ甲柄のサングラスなど。大人の装いに似合う、品のあるデザインです。", "imgs": [["sabae_brand-dupont-1_704_1000.jpg", 704, 1000, false], ["sabae_brand-dupont-2_704_1000.jpg", 704, 1000, false]]}, "johnlennon": {"name": "JOHN LENNON", "kana": "ジョン・レノン", "catch": "細いメタルの丸メガネ", "desc": "ジョン・レノンを思わせる、細いメタルの丸メガネ。ゴールドやブラックで、クラシックな雰囲気に。", "imgs": [["sabae_brand-johnlennon-1_1000_400.jpg", 1000, 400, true], ["sabae_brand-johnlennon-2_1000_400.jpg", 1000, 400, true], ["sabae_brand-johnlennon-3_705_1000.jpg", 705, 1000, false]]}, "stella": {"name": "ステラ", "kana": "", "catch": "やわらかな印象の一本", "desc": "細いメタルで仕上げた、やわらかな印象のフレーム。顔まわりを上品に見せてくれます。", "imgs": [["sabae_brand-stella-1_1000_755.jpg", 1000, 755, false]]}, "majesta": {"name": "マジェスタ", "kana": "", "catch": "すっきり落ち着いた一本", "desc": "落ち着いた印象のメタルフレーム。大人の男性の顔まわりを、すっきり見せてくれます。", "imgs": [["sabae_brand-majesta-1_1000_667.jpg", 1000, 667, false]]}};
  const grid=document.querySelector('.bg-grid'), d=document.getElementById('brand-detail');
  if(!grid||!d)return;
  // 「すべてのブランドを見る」
  const all=document.querySelector('.bg-all');
  if(all)all.addEventListener('click',()=>{
    const open=!grid.classList.contains('is-all');
    grid.classList.toggle('is-all',open);
    all.setAttribute('aria-expanded',open);
    all.firstChild.textContent=open?'閉じる':'ほかのブランドも見る'; // 10/29 Iさん：「すべて」→「ほかのブランドも見る」
    if(!open)document.getElementById('brands').scrollIntoView({behavior:'smooth'});
  });
  const $=s=>d.querySelector(s);
  const track=$('.bd-track'), dots=$('.bd-dots'), thumbs=$('.bd-thumbs'), prev=$('.bd-prev'), next=$('.bd-next');
  const keys=Object.keys(DATA);
  let last=null;
  const idx=()=>Math.round(track.scrollLeft/track.clientWidth);
  const paint=()=>{
    const i=idx(), n=track.children.length;
    [...dots.children].forEach((e,k)=>e.classList.toggle('on',k===i));
    [...thumbs.children].forEach((e,k)=>e.classList.toggle('on',k===i));
    prev.disabled=i<=0; next.disabled=i>=n-1;
  };
  const go=i=>track.scrollTo({left:i*track.clientWidth,behavior:'smooth'});
  const open=k=>{
    const b=DATA[k]; if(!b)return; if(d.hidden)last=document.activeElement;
    const jp=/[^\x00-\x7F]/.test(b.name);
    const nm=$('.bd-name'); nm.textContent=b.name; nm.classList.toggle('jp',jp); nm.classList.toggle('vh',!!b.logo); /* 10/22 ロゴがあるときは文字の名前を隠す（読み上げ用には残す） */
    const lg=$('.bd-logo'); if(b.logo){ lg.src='images/brands/logo/'+b.logo[0]; lg.width=b.logo[1]; lg.height=b.logo[2]; lg.hidden=false; lg.classList.toggle('pad',b.logo[1]===200&&b.logo[2]===160); lg.classList.toggle('tall',b.logo[1]/b.logo[2]<1.5&&!(b.logo[1]===200)); } else { lg.hidden=true; lg.removeAttribute('src'); }
    $('.bd-kana').textContent=b.kana||''; $('.bd-kana').hidden=!b.kana;
    $('.bd-catch').textContent=b.catch;
    $('.bd-desc').textContent=b.desc; wrapPhrases($('.bd-desc')); wrapPhrases($('.bd-catch'));
    track.innerHTML=b.imgs.map(([f,w,h,cut],i)=>'<figure class="'+(cut?'is-cut':'is-photo')+'"><img src="images/brands/modal/'+f+'" width="'+w+'" height="'+h+'" alt="'+b.name+'の商品画像 '+(i+1)+'"></figure>').join('');
    dots.innerHTML=b.imgs.length>1?b.imgs.map(()=>'<i></i>').join(''):'';
    thumbs.innerHTML=b.imgs.length>1?b.imgs.map(([f],i)=>'<button type="button" aria-label="'+(i+1)+'枚目を見る"><img src="images/brands/modal/'+f+'" alt=""></button>').join(''):'';
    [...thumbs.children].forEach((t,i)=>t.addEventListener('click',()=>go(i)));
    // 10/22 下に「前のブランド／次のブランド」（一覧の並び順で）
    const order=[...grid.querySelectorAll('.bg-tile')].map(t=>t.dataset.brand), oi=order.indexOf(k);
    [['.bd-pn-prev',order[oi-1]],['.bd-pn-next',order[oi+1]]].forEach(([s,key])=>{ const el=$(s); el.hidden=!key; if(key){ el.dataset.key=key; el.querySelector('b').textContent=DATA[key].name; } });
    d.hidden=false; d.scrollTop=0; document.body.classList.add('menu-open');
    requestAnimationFrame(()=>{ d.classList.add('is-open'); track.scrollLeft=0; paint(); $('.bd-back').focus(); });
  };
  const close=()=>{ d.classList.remove('is-open'); document.body.classList.remove('menu-open'); setTimeout(()=>{ d.hidden=true; track.innerHTML=''; },350); if(last)last.focus(); };
  grid.querySelectorAll('.bg-tile').forEach(t=>t.addEventListener('click',()=>open(t.dataset.brand)));
  d.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
  d.querySelectorAll('.bd-pn button').forEach(b=>b.addEventListener('click',()=>open(b.dataset.key)));
  d.querySelectorAll('.bd-btns a').forEach(a=>a.addEventListener('click',()=>close()));
  prev.addEventListener('click',()=>go(idx()-1));
  next.addEventListener('click',()=>go(idx()+1));
  track.addEventListener('scroll',()=>requestAnimationFrame(paint),{passive:true});
  document.addEventListener('keydown',e=>{ if(d.hidden)return; if(e.key==='Escape')close(); if(e.key==='ArrowRight')next.click(); if(e.key==='ArrowLeft')prev.click(); });
})();

// 10/30 商品ラインナップのロゴを押すと、ロゴとブランドの説明を出す（#brand-modal）
// ※丹羽雅彦・トニーセイムは公式のコンセプト文から（10/30 Iさん支給）。ほかは仮（公式の紹介文が届いたら差し替え）
// 1行16字以内で改行位置を手で決めている（360px幅でも折り返さない）
(()=>{
  const BM={
    tonysame:{name:'トニーセイム',desc:['2010年、「共感」を','コンセプトに生まれたブランド。','使う人の目線で、ニーズを','超えるメガネを形にしています。','快適なかけ心地に、','顔なじみのよいレンズシェイプと','カラフルな色づかいが特徴です。']},
    intimite:{name:'アンティミテ',desc:['やわらかな雰囲気で、','毎日の装いになじむフレーム。','肌なじみのよい色と、','上品なデザインがそろいます。']},
    orobianco:{name:'オロビアンコ',desc:['イタリア・ミラノ近郊で','生まれたブランド。','大人の男性の装いに合う、','端正なデザインのフレームです。']},
    niwa:{name:'',desc:['昭和初期のヴィンテージフレームを','クラシックフレームの権威である','職人が完全復刻。','最新素材と職人技が見事に','融合した逸品です。','昔ながらの手法で一本一本','作りあげるからこそ、','味のあるレトロな風合いも','生きています。']},
    banerina:{name:'バネリーナ',desc:['軽やかなメタルの、','丸みのあるフレーム。','明るい表情を引き立てる、','女性向けのデザインです。']},
    masaki:{name:'マサキマツシマ',desc:['ファッションデザイナー・','松島正樹のブランド。','シャープで洗練された、','モードなデザインのフレームです。']},
    lineart:{name:'ラインアート',desc:['線のように細いつるが','印象的なフレーム。','上品なメタルのラウンドから、','すっきりしたスクエアまで','そろいます。']}
  };
  const m=document.getElementById('brand-modal'), btns=document.querySelectorAll('.bl-btn');
  if(!m||!btns.length)return;
  const $=s=>m.querySelector(s), lg=$('.bm-logo img');
  let last=null;
  const open=btn=>{
    const b=BM[btn.dataset.brand], src=btn.querySelector('img'); if(!b||!src)return;
    last=btn;
    lg.src=src.src; lg.width=src.width; lg.height=src.height; lg.alt=src.alt;
    $('.bm-name').textContent=b.name;
    $('.bm-desc').innerHTML=b.desc.join('<br>');
    m.hidden=false; document.body.classList.add('menu-open');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ m.classList.add('is-open'); $('.bm-x').focus(); }));
  };
  const close=()=>{ m.classList.remove('is-open'); document.body.classList.remove('menu-open'); setTimeout(()=>{ m.hidden=true; },300); if(last)last.focus({preventScroll:true}); };
  btns.forEach(b=>b.addEventListener('click',()=>open(b)));
  m.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
  $('.bm-btn').addEventListener('click',close);
  document.addEventListener('keydown',e=>{ if(!m.hidden&&e.key==='Escape')close(); });
})();

// PCサイドナビ：いま見ているセクションを朱で表示
(()=>{
  const links=[...document.querySelectorAll(".side-nav a")];
  if(!links.length)return;
  // 10/20 入ったときだけ切り替える方式だと、戻ったときに前のセクションのまま残る→スクロール位置で毎回判定
  const secs=links.map(a=>[a,document.getElementById(a.getAttribute("href").slice(1))]).filter(x=>x[1]);
  let tick=false;
  const update=()=>{
    tick=false;
    const line=innerHeight*0.5; let cur=null;
    secs.forEach(([a,el])=>{ if(el.getBoundingClientRect().top<=line)cur=a; });
    links.forEach(a=>a.classList.toggle("on",a===cur));
  };
  addEventListener("scroll",()=>{ if(!tick){ tick=true; requestAnimationFrame(update); } },{passive:true});
  addEventListener("resize",update); update();
})();

// 10/19 フェアのご案内のイラスト：画面に入ったら右からしゅっと入る
(()=>{
  const el=document.querySelectorAll('.cn-slide'); if(!el.length)return;
  if(!('IntersectionObserver' in window)){ el.forEach(e=>e.classList.add('is-in')); return; }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } }),{threshold:.3});
  el.forEach(e=>io.observe(e));
})();

// 10/19 レンズのタブ（遠近両用／中近／近々／アシスト）
(()=>{
  // 10/23 使うシーンのアイコン（BFLPと同じ線画・viewBox 40）
  const SCENE_ICON={
    car:'<path d="M7,25 L10,15 Q11,12 14,12 H26 Q29,12 30,15 L33,25"/><path d="M5,25 H35 V31 H5 Z"/><circle cx="11" cy="31" r="3"/><circle cx="29" cy="31" r="3"/>',
    walk:'<circle cx="21" cy="7" r="3"/><path d="M20,12 L17,22 L22,26 L20,35 M17,22 L13,34 M19,15 L26,19 M19,15 L12,18"/>',
    phone:'<rect x="13" y="5" width="14" height="30" rx="3"/><path d="M18,30 H22"/>',
    book:'<path d="M20,10 Q13,6 5,8 V32 Q13,30 20,34 Q27,30 35,32 V8 Q27,6 20,10 Z"/><path d="M20,10 V34"/>',
    pot:'<path d="M7,17 H33 V27 Q33,33 27,33 H13 Q7,33 7,27 Z"/><path d="M3,19 H7 M33,19 H37 M15,12 Q17,9 15,6 M21,12 Q23,9 21,6 M27,12 Q29,9 27,6"/>',
    tv:'<rect x="4" y="9" width="32" height="20" rx="2"/><path d="M14,34 H26 M20,29 V34"/>',
    pc:'<rect x="8" y="7" width="24" height="17" rx="2"/><path d="M4,30 H36 L33,25 H7 Z"/>',
    hand:'<path d="M6,32 Q20,24 34,32"/><path d="M14,16 L26,16 L24,26 L16,26 Z"/><path d="M20,8 V12"/>',
    cart:'<path d="M3,8 H8 L12,26 H31 L35,13 H10"/><circle cx="14" cy="32" r="2.5"/><circle cx="29" cy="32" r="2.5"/>'
  };
  // 10/27 ひと言・おすすめ・シーンはBFLPと同じ中身に（Iさん「丸パクリでいい」）
  const LENS={
    enkin:{src:'images/illust/sabae_lens2-enkin_640_360.svg',alt:'遠近両用レンズの見え方',forText:'遠くも手元も、これ1本で',
      chk:['メガネのかけ外しが面倒になってきた','手元用のメガネを持ち歩きたくない','外出先でも手元を見たい'],
      scene:[['car','運転'],['cart','買い物'],['phone','スマホ'],['book','読書']]},
    chukin:{src:'images/illust/sabae_lens2-chukin_640_360.svg',alt:'中近両用レンズの見え方',forText:'お部屋の中で、テレビも手元も',
      chk:['家の中で過ごす時間が長い','職場で会議が多い','遠近両用より、手元を広く見たい'], // 10/29 Iさん：職場でも使えることを入れる・項目は3つ（「料理や家事」は「家の中」と重なるので外した）
      scene:[['pot','料理・家事'],['tv','テレビ'],['pc','デスクワーク'],['phone','スマホ']]},
    kinkin:{src:'images/illust/sabae_lens2-kinkin_640_360.svg',alt:'近々レンズの見え方',forText:'デスクまわりを広く、見やすく',
      chk:['パソコン作業が長い','パソコンの画面がぼやけやすい','手元の細かい作業が多い'],
      scene:[['pc','パソコン'],['book','書類・読書'],['hand','手作業'],['phone','スマホ']]},
    assist:{src:'images/illust/sabae_lens2-assist_640_360.svg',alt:'アシストレンズの見え方',forText:'遠くもスマホも、ゆがみ少なく',
      chk:['スマホをよく見る','手元が少し見えにくくなってきた','遠近両用はまだ早いかなと思う'],
      scene:[['car','運転'],['tv','テレビ'],['phone','スマホ'],['book','読書']]}
  };
  function renderLensRec(d){
    const c=document.getElementById('lensChk'),sc=document.getElementById('lensScene'); if(!c)return;
    c.innerHTML=d.chk.map(x=>'<li>'+x+'</li>').join('');
    if(sc)sc.innerHTML= /* 10/27 使うシーンはHTMLから削除済み（データは残置） */d.scene.map(([k,x])=>'<li><svg viewBox="0 0 40 40" aria-hidden="true">'+SCENE_ICON[k]+'</svg>'+x+'</li>').join('');
  }
  renderLensRec(LENS.enkin);
  const tabs=[...document.querySelectorAll('.ln-tabs button')]; const img=document.getElementById('lnImg'); const fr=document.getElementById('lnFor');
  if(!tabs.length||!img)return;
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));
    const d=LENS[b.dataset.lens]; img.src=d.src; img.alt=d.alt; if(fr)fr.innerHTML=d.forText;
    renderLensRec(d); if(fr)wrapPhrases(fr); wrapPhrases(document.getElementById('lensChk')); // 10/27 ベージュの箱(lnFor)は削除済み
  }));
})();
wrapPhrases(document.getElementById('lensChk'));
