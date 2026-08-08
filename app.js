(function () {
  "use strict";

  /* ---------- 主题（含 theme-color 同步） ---------- */
  var root = document.documentElement;
  var metaTheme = document.getElementById("metaTheme");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (metaTheme) metaTheme.setAttribute("content", t === "dark" ? "#0a0f1a" : "#f6f8fb");
    localStorage.setItem("ui-proto:theme", t);
  }
  var savedTheme = localStorage.getItem("ui-proto:theme");
  if (savedTheme) applyTheme(savedTheme);
  document.getElementById("themeToggle").addEventListener("click", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- 日程数据 ---------- */
  var STORE = "ui-proto:cells";
  var cells = {};
  try { cells = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) {}

  var dayNames = ["周一","周二","周三","周四","周五","周六","周日"];
  var slots = [
    { id:"0830", label:"上午", time:"08:30–09:30" },
    { id:"0930", label:"上午", time:"09:30–10:30" },
    { id:"1030", label:"上午", time:"10:30–11:30" },
    { id:"lunch", label:"午间", time:"11:30–14:30", def:"午饭", cls:"lunch", tag:"🍚" },
    { id:"1430", label:"下午", time:"14:30–15:30" },
    { id:"1530", label:"下午", time:"15:30–16:30" },
    { id:"1630", label:"下午", time:"16:30–17:30" },
    { id:"eve", label:"晚上", time:"17:30 以后", cls:"eve", tag:"🌙" }
  ];

  function pad(n){ return String(n).padStart(2,"0"); }
  function dkey(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function fmt(d){ return (d.getMonth()+1)+"月"+d.getDate()+"日"; }
  function addDays(d,n){ var x=new Date(d); x.setDate(x.getDate()+n); x.setHours(0,0,0,0); return x; }
  function mondayOf(d){ var x=new Date(d); x.setHours(0,0,0,0); var day=x.getDay(); var off=day===0?-6:1-day; return addDays(x,off); }

  var curMonday = mondayOf(new Date());
  var grid = document.getElementById("grid");

  function cellValue(key, slot){
    var v = cells[key+":"+slot.id];
    if (v !== undefined && v !== null) return v;
    return slot.def || "";
  }

  function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function renderGrid(){
    var dates = []; for(var i=0;i<7;i++) dates.push(addDays(curMonday,i));
    var todayKey = dkey(new Date());
    var start=fmt(dates[0]), end=fmt(dates[6]);
    document.getElementById("weekRange").textContent = start+" – "+end;
    document.getElementById("pageSub").textContent = start+" – "+end;

    grid.innerHTML = "";
    var corner = document.createElement("div"); corner.className="corner"; grid.appendChild(corner);
    dates.forEach(function(d,idx){
      var head=document.createElement("div");
      var isToday = dkey(d)===todayKey;
      head.className="day-head"+(isToday?" today":"");
      head.innerHTML='<span class="dn">'+dayNames[idx]+'</span><span class="dd">'+fmt(d)+'</span>';
      grid.appendChild(head);
    });
    slots.forEach(function(slot){
      var th=document.createElement("div"); th.className="time-head";
      th.innerHTML='<span class="tl">'+slot.label+'</span>'+slot.time;
      grid.appendChild(th);
      dates.forEach(function(d,di){
        var key=dkey(d);
        var val=cellValue(key,slot);
        var btn=document.createElement("button");
        btn.type="button";
        btn.className="cell "+(slot.cls||"")+(dkey(d)===todayKey?" today":"");
        var inner='';
        if(slot.tag) inner+='<span class="tag">'+slot.tag+'</span>';
        inner+='<span class="txt'+(val.trim()?"":" empty")+'">'+escapeHtml(val.trim()?val:"添加安排")+'</span>';
        btn.innerHTML=inner;
        btn.addEventListener("click",function(){ openSheet(key,slot,dayNames[di],d); });
        grid.appendChild(btn);
      });
    });
  }

  /* ---------- 周导航 ---------- */
  document.getElementById("prevW").addEventListener("click",function(){ curMonday=addDays(curMonday,-7); renderGrid(); });
  document.getElementById("nextW").addEventListener("click",function(){ curMonday=addDays(curMonday,7); renderGrid(); });
  document.getElementById("todayW").addEventListener("click",function(){ curMonday=mondayOf(new Date()); renderGrid(); });

  /* ---------- 编辑器抽屉 ---------- */
  var overlay=document.getElementById("overlay"), sheet=document.getElementById("sheet");
  var sheetText=document.getElementById("sheetText");
  var activeKey=null, activeSlot=null;
  function openSheet(key,slot,dayName,d){
    activeKey=key; activeSlot=slot;
    document.getElementById("sheetMeta").textContent=dayName+" · "+fmt(d);
    document.getElementById("sheetSlot").textContent=slot.label+" "+slot.time;
    sheetText.value=cellValue(key,slot);
    overlay.classList.add("show"); sheet.classList.add("show");
    setTimeout(function(){ sheetText.focus(); },120);
  }
  function closeSheet(){ overlay.classList.remove("show"); sheet.classList.remove("show"); activeKey=null; }
  document.getElementById("sheetClose").addEventListener("click",closeSheet);
  overlay.addEventListener("click",closeSheet);
  document.getElementById("sheetSave").addEventListener("click",function(){
    if(!activeKey) return;
    var v=sheetText.value.trim();
    if(v) cells[activeKey+":"+activeSlot.id]=v; else delete cells[activeKey+":"+activeSlot.id];
    localStorage.setItem(STORE,JSON.stringify(cells));
    renderGrid(); closeSheet();
  });
  document.getElementById("sheetClear").addEventListener("click",function(){
    if(!activeKey) return;
    delete cells[activeKey+":"+activeSlot.id];
    localStorage.setItem(STORE,JSON.stringify(cells));
    renderGrid(); closeSheet();
  });
  sheetText.addEventListener("keydown",function(e){ if((e.ctrlKey||e.metaKey)&&e.key==="Enter") document.getElementById("sheetSave").click(); });

  /* ---------- 食材库存 ---------- */
  var ING="ui-proto:pantry";
  var pantry = [
    {id:"pork",cat:"meat",emo:"🥩",name:"猪肉",amt:2,unit:"斤"},
    {id:"beef",cat:"meat",emo:"🥩",name:"牛肉",amt:1,unit:"斤"},
    {id:"chicken",cat:"meat",emo:"🍗",name:"鸡肉",amt:3,unit:"个"},
    {id:"fish",cat:"meat",emo:"🐟",name:"鱼",amt:1,unit:"条"},
    {id:"potato",cat:"veg",emo:"🥔",name:"土豆",amt:5,unit:"个"},
    {id:"tomato",cat:"veg",emo:"🍅",name:"西红柿",amt:4,unit:"个"},
    {id:"cucumber",cat:"veg",emo:"🥒",name:"黄瓜",amt:2,unit:"根"},
    {id:"greens",cat:"veg",emo:"🥬",name:"青菜",amt:1,unit:"把"}
  ];
  try { var p=JSON.parse(localStorage.getItem(ING)); if(Array.isArray(p)) pantry=p; } catch(e){}
  var pantryCat="all";

  function savePantry(){ localStorage.setItem(ING,JSON.stringify(pantry)); }
  function catEmo(c){ return c==="meat"?"🥩":"🥬"; }

  function renderPantry(){
    var list=document.getElementById("pantryList");
    list.innerHTML="";
    var items=pantry.filter(function(it){ return pantryCat==="all"||it.cat===pantryCat; });
    var total=pantry.length;
    document.getElementById("pageSub").textContent="家里有什么 · 共 "+total+" 样";

    if(!items.length){
      list.innerHTML='<div class="empty"><span class="e-emo">🧺</span><p>这个分类还是空的，加点食材吧</p></div>';
      return;
    }
    items.forEach(function(it){
      var row=document.createElement("div"); row.className="ing";
      row.innerHTML=
        '<span class="emo">'+it.emo+'</span>'+
        '<span class="name">'+escapeHtml(it.name)+'</span>'+
        '<span class="stepper"><button type="button" data-act="dec" aria-label="减少">−</button>'+
        '<span class="amt">'+it.amt+'</span>'+
        '<button type="button" data-act="inc" aria-label="增加">+</button></span>'+
        '<span class="unit">'+it.unit+'</span>'+
        '<button class="del" type="button" aria-label="删除">🗑</button>';
      row.querySelector('[data-act="dec"]').addEventListener("click",function(){ it.amt=Math.max(0,(+it.amt||0)-1); savePantry(); renderPantry(); });
      row.querySelector('[data-act="inc"]').addEventListener("click",function(){ it.amt=(+it.amt||0)+1; savePantry(); renderPantry(); });
      row.querySelector(".del").addEventListener("click",function(){ pantry=pantry.filter(function(x){return x.id!==it.id;}); savePantry(); renderPantry(); });
      list.appendChild(row);
    });
  }

  document.getElementById("pantryFilters").addEventListener("click",function(e){
    var b=e.target.closest(".chip"); if(!b) return;
    document.querySelectorAll("#pantryFilters .chip").forEach(function(c){c.classList.remove("active");});
    b.classList.add("active"); pantryCat=b.dataset.cat; renderPantry();
  });

  document.getElementById("addForm").addEventListener("submit",function(e){
    e.preventDefault();
    var name=document.getElementById("addName").value.trim();
    var amt=document.getElementById("addAmt").value.trim();
    var unit=document.getElementById("addUnit").value;
    if(!name||amt==="") return;
    var cat=/肉|鸡|鱼|猪|牛|羊|虾|蟹/.test(name)?"meat":"veg";
    pantry.push({id:"x"+Date.now(),cat:cat,emo:catEmo(cat),name:name,amt:amt,unit:unit});
    savePantry(); renderPantry();
    this.reset(); document.getElementById("addName").focus();
  });

  var quick=["鸡蛋","米饭","白菜","豆腐","胡萝卜","洋葱","青椒","牛奶"];
  var quickRow=document.getElementById("quickRow");
  quick.forEach(function(q){
    var b=document.createElement("button"); b.className="q"; b.type="button"; b.textContent="＋ "+q;
    b.addEventListener("click",function(){
      var cat=/肉|鸡|鱼|猪|牛|羊|虾|蟹/.test(q)?"meat":"veg";
      var ex=pantry.find(function(x){return x.name===q;});
      if(ex){ ex.amt=(+ex.amt||0)+1; } else { pantry.push({id:"x"+Date.now(),cat:cat,emo:catEmo(cat),name:q,amt:1,unit:"个"}); }
      savePantry(); renderPantry();
    });
    quickRow.appendChild(b);
  });

  /* ---------- Tab 切换 ---------- */
  var tabbar=document.getElementById("tabbar");
  var views={ schedule:document.getElementById("scheduleView"), pantry:document.getElementById("pantryView") };
  var titles={ schedule:["我的周计划","周日程"], pantry:["我的厨房","食材库存"] };
  tabbar.addEventListener("click",function(e){
    var t=e.target.closest(".tab"); if(!t) return;
    var v=t.dataset.view;
    document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active");});
    t.classList.add("active");
    tabbar.style.setProperty("--tab-x", v==="schedule"?"0%":"100%");
    views.schedule.hidden = v!=="schedule";
    views.pantry.hidden = v!=="pantry";
    document.getElementById("eyebrow").textContent=titles[v][0];
    document.getElementById("pageTitle").textContent=titles[v][1];
    document.getElementById("pageSub").textContent = v==="schedule"
      ? (function(){var d=[];for(var i=0;i<7;i++)d.push(addDays(curMonday,i));return fmt(d[0])+" – "+fmt(d[6]);})()
      : "家里有什么 · 共 "+pantry.length+" 样";
  });

  /* ---------- PWA：安装提示 + Service Worker ---------- */
  var deferredInstall=null;
  var installBtn=document.getElementById("installBtn");
  window.addEventListener("beforeinstallprompt",function(e){
    e.preventDefault(); deferredInstall=e; installBtn.hidden=false;
  });
  installBtn.addEventListener("click",function(){
    if(!deferredInstall) return;
    deferredInstall.prompt();
    deferredInstall.userChoice.finally(function(){ deferredInstall=null; installBtn.hidden=true; });
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load",function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
  }

  /* ---------- 初始化 ---------- */
  renderGrid();
  renderPantry();
})();
