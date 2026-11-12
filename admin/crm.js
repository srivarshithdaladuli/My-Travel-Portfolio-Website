(function(){
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const config=window.CRM_CONFIG||{};
  const types={
    contacts:{title:"Contacts",description:"People, recruiters, collaborators and clients.",fields:[["name","Name","text",true],["company","Company / organisation","text"],["email","Email","email"],["phone","Phone","tel"],["category","Relationship","select",false,["Professional","Recruiter","Client","Collaborator","Friend","Other"]],["location","Location","text"],["notes","Notes","textarea"]],columns:["name","company","email","category","location"]},
    opportunities:{title:"Opportunities",description:"Track jobs, freelance enquiries, partnerships and collaborations.",fields:[["title","Opportunity","text",true],["organisation","Organisation","text"],["type","Type","select",false,["Job","Freelance","Photography","Collaboration","Other"]],["status","Status","select",false,["New","In progress","Follow-up","Won","Closed"]],["value","Estimated value (₹)","number"],["due_date","Follow-up date","date"],["contact","Contact person","text"],["notes","Notes","textarea"]],columns:["title","organisation","type","status","due_date"]},
    projects:{title:"Projects",description:"Personal, technical, creative and client projects.",fields:[["title","Project name","text",true],["category","Category","select",false,["Development","Photography","Travel","Learning","Personal","Other"]],["status","Status","select",false,["Planning","In progress","On hold","Completed"]],["start_date","Start date","date"],["due_date","Target date","date"],["link","Project link","url"],["notes","Notes","textarea"]],columns:["title","category","status","due_date"]},
    tasks:{title:"Tasks",description:"Capture next steps, deadlines and follow-ups.",fields:[["title","Task","text",true],["status","Status","select",false,["To do","In progress","Done"]],["priority","Priority","select",false,["Low","Medium","High"]],["due_date","Due date","date"],["related_to","Related to","text"],["notes","Notes","textarea"]],columns:["title","status","priority","due_date","related_to"]},
    finance:{title:"Finance",description:"Track income, expenses and payments. Amounts are stored in INR.",fields:[["title","Description","text",true],["kind","Type","select",false,["Income","Expense"]],["amount","Amount (₹)","number",true],["category","Category","text"],["date","Date","date"],["status","Status","select",false,["Planned","Pending","Paid"]],["notes","Notes","textarea"]],columns:["title","kind","amount","category","date","status"]},
    notes:{title:"Notes",description:"A private space for ideas, plans and useful information.",fields:[["title","Title","text",true],["category","Category","select",false,["Idea","Meeting","Learning","Personal","Other"]],["notes","Note","textarea",true]],columns:["title","category","notes"]}
  };
  let supabase=null,user=null,active="overview",records=[],editing=null;
  const toast=msg=>{const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)};
  const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=s=>s?new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—";
  function showLogin(message=""){$("#app").classList.add("hidden");$("#login-screen").classList.remove("hidden");$("#login-error").textContent=message}
  function showApp(){$("#login-screen").classList.add("hidden");$("#app").classList.remove("hidden")}
  function setupMessage(){if(!config.supabaseUrl||!config.supabasePublishableKey){$("#setup-warning").classList.remove("hidden");$("#setup-warning").textContent="Setup required: add your Supabase project URL and publishable key in admin/config.js, then run the SQL in admin/schema.sql. See admin/README.md.";}}
  async function init(){
    setupMessage();
    if(!window.supabase||!config.supabaseUrl||!config.supabasePublishableKey){showLogin("CRM setup is incomplete. Open admin/README.md for setup instructions.");return}
    supabase=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
    const {data:{session}}=await supabase.auth.getSession();
    if(session)await enter(session.user);
    supabase.auth.onAuthStateChange(async(_event,session)=>{if(session&&!user)await enter(session.user);else if(!session){user=null;showLogin()}});
  }
  async function enter(u){
    user=u;
    const {data:admin,error}=await supabase.from("crm_admins").select("user_id").eq("user_id",u.id).maybeSingle();
    if(error||!admin){await supabase.auth.signOut();user=null;showLogin("This account is not authorised for this private workspace.");return}
    showApp();$("#date-label").textContent="PERSONAL WORKSPACE";$("#today-chip").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    await loadRecords();navigate("overview");
  }
  async function loadRecords(){
    const {data,error}=await supabase.from("crm_records").select("*").order("updated_at",{ascending:false});
    if(error){toast("Could not load records: "+error.message);return}
    records=data||[];renderOverview();if(active!=="overview")renderRecords();
  }
  function dataOf(r){return r.data||{}}
  function byType(t){return records.filter(r=>r.type===t)}
  function renderOverview(){
    $("#stat-contacts").textContent=byType("contacts").length;
    $("#stat-opportunities").textContent=byType("opportunities").filter(r=>!["Won","Closed"].includes(dataOf(r).status)).length;
    $("#stat-projects").textContent=byType("projects").filter(r=>dataOf(r).status!=="Completed").length;
    $("#stat-tasks").textContent=byType("tasks").filter(r=>dataOf(r).status!=="Done").length;
    const recent=records.slice(0,5);
    $("#recent-list").className="record-list"+(recent.length?"":" empty-state");
    $("#recent-list").innerHTML=recent.length?recent.map(r=>'<div class="list-row"><div><b>'+escapeHtml(dataOf(r).title||dataOf(r).name||types[r.type]?.title||"Record")+'</b><small>'+escapeHtml(types[r.type]?.title||r.type)+' · Updated '+fmt((r.updated_at||"").slice(0,10))+'</small></div><span class="status">'+escapeHtml(dataOf(r).status||"Saved")+'</span></div>').join(""):"Your recent records will appear here.";
    const tasks=byType("tasks").filter(r=>dataOf(r).status!=="Done").sort((a,b)=>(dataOf(a).due_date||"").localeCompare(dataOf(b).due_date||"")).slice(0,5);
    $("#upcoming-list").className="record-list"+(tasks.length?"":" empty-state");
    $("#upcoming-list").innerHTML=tasks.length?tasks.map(r=>'<div class="list-row"><div><b>'+escapeHtml(dataOf(r).title)+'</b><small>'+escapeHtml(dataOf(r).priority||"Normal")+'</small></div><small>'+fmt(dataOf(r).due_date)+'</small></div>').join(""):"No tasks yet. Add one when you're ready.";
  }
  function navigate(view){
    active=view;$$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    $("#view-overview").classList.toggle("hidden",view!=="overview");$("#view-records").classList.toggle("hidden",view==="overview");
    $("#page-title").textContent=view==="overview"?"Overview":types[view].title;
    if(view!=="overview"){ $("#view-description").textContent=types[view].description;$("#record-search").value="";renderRecords(); }
    $("#sidebar").classList.remove("open");
  }
  function renderRecords(){
    const def=types[active];if(!def)return;
    $("#table-head").innerHTML="<tr>"+def.columns.map(k=>"<th>"+escapeHtml(def.fields.find(f=>f[0]===k)?.[1]||k)+"</th>").join("")+"<th>Actions</th></tr>";
    const q=$("#record-search").value.toLowerCase();
    const list=byType(active).filter(r=>JSON.stringify(r.data).toLowerCase().includes(q));
    $("#empty-records").classList.toggle("hidden",list.length>0);
    $("#table-body").innerHTML=list.map(r=>{const d=dataOf(r);return "<tr>"+def.columns.map(k=>"<td>"+(k==="status"?'<span class="status">'+escapeHtml(d[k]||"—")+"</span>":escapeHtml(k==="due_date"||k==="date"?fmt(d[k]):d[k]??"—"))+"</td>").join("")+'<td><div class="row-actions"><button data-edit="'+r.id+'">Edit</button><button data-delete="'+r.id+'">Delete</button></div></td></tr>'}).join("");
  }
  function openForm(id=null){
    editing=id;const def=types[active],record=id?records.find(r=>r.id===id):null,d=record?dataOf(record):{};
    $("#dialog-title").textContent=(id?"Edit ":"New ")+def.title.toLowerCase().replace(/s$/,"");
    $("#form-error").textContent="";
    $("#form-fields").innerHTML=def.fields.map(([key,label,type,required,options])=>{
      const val=d[key]??"";
      let input=type==="select"?'<select id="f-'+key+'" '+(required?"required":"")+'><option value="">Select…</option>'+options.map(o=>'<option '+(val===o?"selected":"")+'>'+escapeHtml(o)+'</option>').join("")+'</select>':type==="textarea"?'<textarea id="f-'+key+'" '+(required?"required":"")+'>'+escapeHtml(val)+'</textarea>':'<input id="f-'+key+'" type="'+type+'" value="'+escapeHtml(val)+'" '+(required?"required":"")+' '+(type==="number"?'min="0" step="0.01"':"")+'>';
      return '<label class="field '+(type==="textarea"?"full-field":"")+'">'+escapeHtml(label)+input+"</label>";
    }).join("");
    $("#record-dialog").showModal();
  }
  async function saveRecord(e){
    e.preventDefault();const def=types[active],data={};
    for(const [key] of def.fields)data[key]=$("#f-"+key).value.trim();
    const payload={type:active,data,user_id:user.id};
    const result=editing?await supabase.from("crm_records").update({data}).eq("id",editing).select().single():await supabase.from("crm_records").insert(payload).select().single();
    if(result.error){$("#form-error").textContent=result.error.message;return}
    $("#record-dialog").close();toast(editing?"Record updated":"Record saved");await loadRecords();
  }
  async function deleteRecord(id){
    if(!confirm("Delete this record permanently?"))return;
    const {error}=await supabase.from("crm_records").delete().eq("id",id);
    if(error){toast(error.message);return}toast("Record deleted");await loadRecords();
  }
  $("#login-form").addEventListener("submit",async e=>{e.preventDefault();if(!supabase){showLogin("CRM setup is incomplete. See admin/README.md.");return}const {error}=await supabase.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)$("#login-error").textContent=error.message});
  $("#signout").addEventListener("click",()=>supabase?.auth.signOut());
  $("#navigation").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view)});
  document.addEventListener("click",e=>{const go=e.target.closest("[data-go]");if(go)navigate(go.dataset.go);const edit=e.target.closest("[data-edit]");if(edit)openForm(edit.dataset.edit);const del=e.target.closest("[data-delete]");if(del)deleteRecord(del.dataset.delete)});
  $("#quick-add").addEventListener("click",()=>{if(active==="overview")navigate("contacts");openForm()});
  $("#add-record").addEventListener("click",()=>openForm());
  $("#empty-add").addEventListener("click",()=>openForm());
  $("#record-search").addEventListener("input",renderRecords);
  $("#record-form").addEventListener("submit",saveRecord);
  $("#close-dialog").addEventListener("click",()=>$("#record-dialog").close());
  $("#cancel-dialog").addEventListener("click",()=>$("#record-dialog").close());
  $("#menu-toggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  init();
})();