/* Descarte Ideal — Comercial, propostas, prospecção e inteligência de faturamento.
   Carregado como extensão incremental da interface V13. */
(function(){
'use strict';
const segments=[['materials','Materiais'],['services','Serviços'],['transport','Transporte']];
let segmentRows=[],prospects=[],proposals=[],outsourcedOrders=[];
const $g=id=>document.getElementById(id);
const moneyG=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const escG=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusProspect={new:'Novo',contacted:'Contatado',qualified:'Qualificado',proposal:'Proposta enviada',won:'Convertido',lost:'Perdido'};
const statusProposal={draft:'Rascunho',sent:'Enviada',negotiation:'Em negociação',approved:'Aprovada',rejected:'Recusada',expired:'Expirada'};
const statusOrder={scheduled:'Agendado',in_progress:'Em execução',completed:'Concluído',paid:'Pago',cancelled:'Cancelado'};
function notify(msg){if(typeof setSyncIndicator==='function')setSyncIndicator(msg)}
function inject(){
 const sidebar=document.querySelector('.sidebar');
 if(sidebar&&!$g('growthNavTitle')){
  const anchor=[...sidebar.querySelectorAll('.nav-title')].find(x=>x.textContent.includes('Comercial e clientes'));
  if(anchor){anchor.insertAdjacentHTML('afterend',`<nav class="nav" id="growthNav"><button data-growth-page="prospeccao">◎ &nbsp; Prospecção</button><button data-growth-page="propostas">▤ &nbsp; Propostas de serviço</button><button data-growth-page="terceirizados">▱ &nbsp; Serviços terceirizados</button><button data-growth-page="inteligencia">◴ &nbsp; Origem do faturamento</button></nav>`);}
 }
 const main=document.querySelector('main.main');
 if(main&&!$g('prospeccao')){
  main.insertAdjacentHTML('beforeend',`
  <section id="prospeccao" class="page growth-page">
   <div class="section-head"><div><div class="eyebrow">DESENVOLVIMENTO COMERCIAL</div><h2>Prospecção comercial</h2><p class="muted">Organize empresas-alvo, contatos e próximas ações para conquistar novos clientes.</p></div><button class="btn secondary" onclick="growthReload()">↻ Atualizar</button></div>
   <div class="grid"><div class="card metric"><div class="label">Empresas prospectadas</div><div class="value" id="gProspectTotal">0</div></div><div class="card metric"><div class="label">Em qualificação</div><div class="value" id="gProspectQualified">0</div></div><div class="card metric"><div class="label">Propostas em andamento</div><div class="value" id="gProspectProposals">0</div></div><div class="card metric"><div class="label">Convertidos</div><div class="value" id="gProspectWon">0</div></div></div>
   <div class="two section">
    <div class="card"><div class="section-head"><h2 id="gProspectFormTitle">Cadastrar empresa prospectada</h2><button class="smallbtn" onclick="growthResetProspect()">Limpar</button></div>
     <form id="gProspectForm"><input type="hidden" id="gProspectId"><div class="formgrid">
      <div class="field full"><label>Empresa / razão social *</label><input id="gProspectCompany" required maxlength="180"></div>
      <div class="field"><label>CNPJ / CPF</label><input id="gProspectDocument"></div><div class="field"><label>Segmento de atuação</label><input id="gProspectIndustry" placeholder="Indústria, condomínio, logística..."></div>
      <div class="field"><label>Contato responsável</label><input id="gProspectContact"></div><div class="field"><label>Telefone / WhatsApp</label><input id="gProspectPhone"></div>
      <div class="field"><label>E-mail</label><input id="gProspectEmail" type="email"></div><div class="field"><label>Origem do lead</label><select id="gProspectSource"><option value="">Selecione</option><option>Indicação</option><option>Prospecção ativa</option><option>Site</option><option>Redes sociais</option><option>Evento / networking</option><option>Cliente atual</option><option>Outro</option></select></div>
      <div class="field"><label>Status</label><select id="gProspectStatus"><option value="new">Novo</option><option value="contacted">Contatado</option><option value="qualified">Qualificado</option><option value="proposal">Proposta enviada</option><option value="won">Convertido</option><option value="lost">Perdido</option></select></div>
      <div class="field"><label>Próxima ação</label><input id="gProspectNext" type="date"></div>
      <div class="field full"><label>Observações e necessidades identificadas</label><textarea id="gProspectNotes"></textarea></div>
     </div><div class="form-actions"><button class="btn" type="submit">Salvar prospect</button></div></form>
    </div>
    <div class="card"><div class="section-head"><h2>Carteira de prospecção</h2><input class="search" id="gProspectSearch" placeholder="Buscar empresa..."></div><div class="table-wrap"><table class="table"><thead><tr><th>Empresa</th><th>Origem</th><th>Status</th><th>Próxima ação</th><th>Ações</th></tr></thead><tbody id="gProspectsTable"></tbody></table></div></div>
   </div>
  </section>
  <section id="propostas" class="page growth-page">
   <div class="section-head"><div><div class="eyebrow">NEGOCIAÇÃO E VENDAS</div><h2>Propostas comerciais</h2><p class="muted">Elabore, envie e acompanhe propostas de materiais, serviços e transporte.</p></div><button class="btn secondary" onclick="growthPrintProposal()">Imprimir / PDF</button></div>
   <div class="grid"><div class="card metric"><div class="label">Propostas abertas</div><div class="value" id="gProposalOpen">0</div></div><div class="card metric"><div class="label">Valor em negociação</div><div class="value" id="gProposalPipeline">R$ 0,00</div></div><div class="card metric"><div class="label">Aprovadas</div><div class="value" id="gProposalApproved">0</div></div><div class="card metric"><div class="label">Taxa de aprovação</div><div class="value" id="gProposalRate">0%</div></div></div>
   <div class="two section">
    <div class="card"><div class="section-head"><h2 id="gProposalFormTitle">Nova proposta</h2><button class="smallbtn" onclick="growthResetProposal()">Limpar</button></div>
     <form id="gProposalForm"><input type="hidden" id="gProposalId"><div class="formgrid">
      <div class="field"><label>Número *</label><input id="gProposalNumber" required></div><div class="field"><label>Frente de negócio *</label><select id="gProposalUnit"><option value="services">Prestação de serviços</option><option value="materials">Venda de materiais</option><option value="transport">Fretes e transporte</option></select></div>
      <div class="field full"><label>Cliente cadastrado</label><select id="gProposalClient"><option value="">Selecione ou use prospect</option></select></div>
      <div class="field full"><label>Empresa prospectada</label><select id="gProposalProspect"><option value="">Sem prospect vinculado</option></select></div>
      <div class="field full"><label>Serviço / objeto da proposta *</label><input id="gProposalType" required placeholder="Ex.: coleta, transporte, gestão operacional..."></div>
      <div class="field full"><label>Escopo e condições</label><textarea id="gProposalScope" placeholder="Descreva entregas, frequência, equipe, equipamentos e condições."></textarea></div>
      <div class="field"><label>Valor proposto (R$) *</label><input id="gProposalValue" type="number" min="0" step="0.01" required></div><div class="field"><label>Custo estimado (R$)</label><input id="gProposalCost" type="number" min="0" step="0.01" value="0"></div>
      <div class="field"><label>Status</label><select id="gProposalStatus"><option value="draft">Rascunho</option><option value="sent">Enviada</option><option value="negotiation">Em negociação</option><option value="approved">Aprovada</option><option value="rejected">Recusada</option><option value="expired">Expirada</option></select></div><div class="field"><label>Responsável comercial</label><input id="gProposalResponsible"></div>
      <div class="field"><label>Data de envio</label><input id="gProposalSent" type="date"></div><div class="field"><label>Validade</label><input id="gProposalValid" type="date"></div>
      <div class="field full"><label>Observações</label><textarea id="gProposalNotes"></textarea></div>
     </div><div class="form-actions"><button class="btn" type="submit">Salvar proposta</button></div></form>
    </div>
    <div class="card"><div class="section-head"><h2>Pipeline de propostas</h2><input class="search" id="gProposalSearch" placeholder="Buscar proposta..."></div><div class="table-wrap"><table class="table"><thead><tr><th>Proposta</th><th>Empresa</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody id="gProposalsTable"></tbody></table></div></div>
   </div>
  </section>
  <section id="terceirizados" class="page growth-page">
   <div class="section-head"><div><div class="eyebrow">GESTÃO DE FORNECEDORES E OPERAÇÕES</div><h2>Serviços terceirizados contratados</h2><p class="muted">Controle serviços de frota e outros serviços contratados pela Descarte Ideal.</p></div></div>
   <div class="grid"><div class="card metric"><div class="label">Ordens registradas</div><div class="value" id="gOrderCount">0</div></div><div class="card metric"><div class="label">Custos contratados</div><div class="value" id="gOrderCosts">R$ 0,00</div></div><div class="card metric"><div class="label">Valor faturado vinculado</div><div class="value" id="gOrderBilled">R$ 0,00</div></div><div class="card metric"><div class="label">Margem estimada</div><div class="value" id="gOrderMargin">R$ 0,00</div></div></div>
   <div class="two section">
    <div class="card"><h2 id="gOrderFormTitle">Registrar contratação</h2><form id="gOrderForm" class="section"><input type="hidden" id="gOrderId"><div class="formgrid">
     <div class="field"><label>Número da ordem *</label><input id="gOrderNumber" required></div><div class="field"><label>Categoria *</label><select id="gOrderCategory"><option value="fleet">Frota / transporte</option><option value="operations">Serviços operacionais</option><option value="other">Outros</option></select></div>
     <div class="field full"><label>Prestador / empresa contratada *</label><input id="gOrderProvider" required></div><div class="field full"><label>Cliente atendido</label><select id="gOrderClient"><option value="">Sem vínculo</option></select></div>
     <div class="field full"><label>Descrição do serviço *</label><input id="gOrderDescription" required></div>
     <div class="field"><label>Data do serviço *</label><input id="gOrderDate" type="date" required></div><div class="field"><label>Status</label><select id="gOrderStatus"><option value="scheduled">Agendado</option><option value="in_progress">Em execução</option><option value="completed">Concluído</option><option value="paid">Pago</option><option value="cancelled">Cancelado</option></select></div>
     <div class="field"><label>Custo contratado (R$)</label><input id="gOrderCost" type="number" min="0" step="0.01" value="0"></div><div class="field"><label>Valor cobrado do cliente (R$)</label><input id="gOrderBilled" type="number" min="0" step="0.01" value="0"></div>
     <div class="field full"><label>Referência / observações</label><textarea id="gOrderNotes"></textarea></div>
    </div><div class="form-actions"><button class="btn" type="submit">Salvar contratação</button></div></form></div>
    <div class="card"><div class="section-head"><h2>Histórico de contratações</h2><input class="search" id="gOrderSearch" placeholder="Buscar prestador..."></div><div class="table-wrap"><table class="table"><thead><tr><th>Data / ordem</th><th>Prestador</th><th>Custo</th><th>Status</th><th>Ações</th></tr></thead><tbody id="gOrdersTable"></tbody></table></div></div>
   </div>
  </section>
  <section id="inteligencia" class="page growth-page">
   <div class="section-head"><div><div class="eyebrow">CONTROLADORIA E DESEMPENHO</div><h2>Origem do faturamento</h2><p class="muted">Entenda quais frentes de negócio geram receita e compare faturamento, recebimentos e custos terceirizados.</p></div><div class="field"><label>Período</label><select id="gRevenuePeriod"><option value="month">Mês atual</option><option value="year">Ano atual</option><option value="all">Todo o histórico</option></select></div></div>
   <div class="grid"><div class="card metric"><div class="label">Faturamento emitido</div><div class="value" id="gRevenueTotal">R$ 0,00</div></div><div class="card metric"><div class="label">Recebido</div><div class="value" id="gRevenueReceived">R$ 0,00</div></div><div class="card metric"><div class="label">A receber</div><div class="value" id="gRevenueOpen">R$ 0,00</div></div><div class="card metric"><div class="label">Custos terceirizados</div><div class="value" id="gRevenueCosts">R$ 0,00</div></div></div>
   <div class="two section"><div class="card"><h2>Faturamento por frente de negócio</h2><div id="gRevenueBreakdown" class="section"></div></div><div class="card"><h2>Origem dos clientes e oportunidades</h2><div id="gRevenueSources" class="section"></div><p class="muted">A origem é calculada a partir do campo “Origem do lead” cadastrado na prospecção.</p></div></div>
   <div class="notice section">Os valores de faturamento são calculados pelas faturas comerciais cadastradas. Faturas antigas sem classificação são identificadas como “Não classificado” até serem revisadas. Propostas não aprovadas não entram no faturamento.</div>
  </section>`);
 }
 const clientPage=$g('clientes');
 if(clientPage&&!$g('clientSegmentPanel')){
  clientPage.insertAdjacentHTML('beforeend',`<div id="clientSegmentPanel" class="card section"><div class="section-head"><div><h2>Segmentação da carteira</h2><p class="muted">Classifique cada empresa em uma ou mais frentes sem duplicar o cadastro.</p></div></div><div class="formgrid"><div class="field"><label>Empresa cadastrada</label><select id="gSegmentClient"></select></div><div class="field"><label>Frentes em que atua como cliente</label><div class="permission-sector-list" id="gSegmentChecks"></div></div></div><div class="form-actions"><button class="btn" type="button" onclick="growthSaveSegments()">Salvar classificação</button></div><div class="muted" id="gSegmentHint">Uma mesma empresa pode comprar materiais, contratar serviços e contratar transporte.</div></div>`);
  $g('gSegmentChecks').innerHTML=segments.map(([v,l])=>'<label class="permission-sector-option"><input type="checkbox" value="'+v+'"> '+l+'</label>').join('');
  $g('gSegmentClient').addEventListener('change',growthShowSegments);
 }
 document.querySelectorAll('[data-growth-page]').forEach(b=>b.addEventListener('click',()=>{if(typeof go==='function')go(b.dataset.growthPage)}));
 document.querySelectorAll('.growth-page').forEach(p=>{p.style.minHeight='40vh'});
}
async function loadGrowthData(){
 if(typeof demoMode!=='undefined'&&demoMode)return;
 if(!supabaseClient)return;
 try{
  const [sr,pr,or]=await Promise.all([
   supabaseClient.from('client_business_segments').select('*'),
   supabaseClient.from('sales_prospects').select('*').order('created_at',{ascending:false}),
   supabaseClient.from('service_proposals').select('*').order('created_at',{ascending:false}),
  ]);
  if(sr.error)throw sr.error;if(pr.error)throw pr.error;if(or.error)throw or.error;
  const ord=await supabaseClient.from('outsourced_service_orders').select('*').order('service_date',{ascending:false});
  if(ord.error)throw ord.error;
  segmentRows=sr.data||[];prospects=pr.data||[];proposals=or.data||[];outsourcedOrders=ord.data||[];
  renderGrowth();
 }catch(e){notify('Módulos comerciais aguardando a migração do banco: '+(e.message||e));}
}
function clientLabel(id){return (typeof state!=='undefined'&&state.clients?.find(c=>String(c.id)===String(id))?.name)||'Prospect / sem cliente vinculado'}
function fillClientSelect(id,includeEmpty=true){const clients=typeof state!=='undefined'?(state.clients||[]):[];return (includeEmpty?'<option value="">Selecione</option>':'')+clients.filter(c=>c.status!=='Inativo').map(c=>'<option value="'+escG(c.id)+'" '+(String(c.id)===String(id)?'selected':'')+'>'+escG(c.name)+'</option>').join('')}
function renderSegmentEditor(){
 const sel=$g('gSegmentClient');if(!sel)return;const current=sel.value;sel.innerHTML=fillClientSelect(current);if(!sel.value&&current)sel.value=current;growthShowSegments();
}
function growthShowSegments(){
 const id=$g('gSegmentClient')?.value;const set=new Set(segmentRows.filter(x=>String(x.client_id)===String(id)).map(x=>x.segment));
 document.querySelectorAll('#gSegmentChecks input').forEach(x=>x.checked=set.has(x.value));
}
async function growthSaveSegments(){
 const id=$g('gSegmentClient')?.value;if(!id){alert('Selecione uma empresa.');return}
 const selected=[...document.querySelectorAll('#gSegmentChecks input:checked')].map(x=>x.value);
 try{
  const {error:delError}=await supabaseClient.from('client_business_segments').delete().eq('client_id',id);if(delError)throw delError;
  if(selected.length){const {error}=await supabaseClient.from('client_business_segments').insert(selected.map(segment=>({client_id:id,segment})));if(error)throw error}
  segmentRows=segmentRows.filter(x=>String(x.client_id)!==String(id)).concat(selected.map(segment=>({client_id:id,segment})));
  notify('Classificação comercial do cliente salva.');renderGrowth();
 }catch(e){alert('Não foi possível salvar a classificação. Aplique a migração comercial no Supabase. Detalhe: '+(e.message||e))}
}
function growthResetProspect(){const f=$g('gProspectForm');f?.reset();$g('gProspectId').value='';$g('gProspectFormTitle').textContent='Cadastrar empresa prospectada'}
function growthEditProspect(id){const x=prospects.find(p=>p.id===id);if(!x)return;const map={gProspectId:'id',gProspectCompany:'company_name',gProspectDocument:'document',gProspectIndustry:'industry',gProspectContact:'contact_name',gProspectPhone:'phone',gProspectEmail:'email',gProspectSource:'source',gProspectStatus:'status',gProspectNext:'next_action_at',gProspectNotes:'notes'};Object.entries(map).forEach(([el,k])=>$g(el).value=x[k]||'');$g('gProspectFormTitle').textContent='Editar prospect'}
function growthResetProposal(){const f=$g('gProposalForm');f?.reset();$g('gProposalId').value='';$g('gProposalNumber').value='PROP-'+new Date().getFullYear()+'-'+String(proposals.length+1).padStart(4,'0');$g('gProposalStatus').value='draft';$g('gProposalFormTitle').textContent='Nova proposta';growthFillProposalLinks()}
function growthEditProposal(id){const x=proposals.find(p=>p.id===id);if(!x)return;const map={gProposalId:'id',gProposalNumber:'proposal_number',gProposalUnit:'business_unit',gProposalClient:'client_id',gProposalProspect:'prospect_id',gProposalType:'service_type',gProposalScope:'scope',gProposalValue:'proposed_value',gProposalCost:'estimated_cost',gProposalStatus:'status',gProposalResponsible:'responsible',gProposalSent:'sent_at',gProposalValid:'valid_until',gProposalNotes:'notes'};Object.entries(map).forEach(([el,k])=>$g(el).value=x[k]??'');$g('gProposalFormTitle').textContent='Editar proposta';}
function growthFillProposalLinks(){
 const c=$g('gProposalClient'),p=$g('gProposalProspect'),o=$g('gOrderClient');
 if(c){const old=c.value;c.innerHTML=fillClientSelect(old);c.value=old}
 if(o){const old=o.value;o.innerHTML=fillClientSelect(old);o.value=old}
 if(p){const old=p.value;p.innerHTML='<option value="">Sem prospect vinculado</option>'+prospects.map(x=>'<option value="'+x.id+'">'+escG(x.company_name)+'</option>').join('');p.value=old}
}
function renderGrowth(){
 renderSegmentEditor();growthFillProposalLinks();
 const set=(id,v)=>{if($g(id))$g(id).textContent=v};
 set('gProspectTotal',prospects.length);set('gProspectQualified',prospects.filter(x=>x.status==='qualified').length);set('gProspectProposals',prospects.filter(x=>x.status==='proposal').length);set('gProspectWon',prospects.filter(x=>x.status==='won').length);
 const pq=($g('gProspectSearch')?.value||'').toLowerCase(),ps=prospects.filter(x=>(x.company_name+' '+(x.industry||'')+' '+(x.contact_name||'')).toLowerCase().includes(pq));
 if($g('gProspectsTable'))$g('gProspectsTable').innerHTML=ps.length?ps.map(x=>'<tr><td><b>'+escG(x.company_name)+'</b><br><span class="muted">'+escG(x.industry||'')+'</span></td><td>'+escG(x.source||'—')+'</td><td>'+escG(statusProspect[x.status]||x.status)+'</td><td>'+escG(x.next_action_at||'—')+'</td><td><div class="actions"><button class="smallbtn" onclick="growthEditProspect(\''+x.id+'\')">Editar</button><button class="smallbtn" onclick="growthConvertProspect(\''+x.id+'\')">Converter</button></div></td></tr>').join(''):'<tr><td colspan="5" class="empty">Nenhuma empresa prospectada.</td></tr>';
 const open=proposals.filter(x=>['draft','sent','negotiation'].includes(x.status)),approved=proposals.filter(x=>x.status==='approved'),closed=proposals.filter(x=>['approved','rejected','expired'].includes(x.status));
 set('gProposalOpen',open.length);set('gProposalPipeline',moneyG(open.reduce((a,x)=>a+Number(x.proposed_value||0),0)));set('gProposalApproved',approved.length);set('gProposalRate',closed.length?Math.round(approved.length/closed.length*100)+'%':'0%');
 const q=($g('gProposalSearch')?.value||'').toLowerCase(),rows=proposals.filter(x=>(x.proposal_number+' '+x.service_type+' '+clientLabel(x.client_id)).toLowerCase().includes(q));
 if($g('gProposalsTable'))$g('gProposalsTable').innerHTML=rows.length?rows.map(x=>'<tr><td><b>'+escG(x.proposal_number)+'</b><br><span class="muted">'+escG(x.service_type)+'</span></td><td>'+escG(x.client_id?clientLabel(x.client_id):(prospects.find(p=>p.id===x.prospect_id)?.company_name||'—'))+'</td><td>'+moneyG(x.proposed_value)+'</td><td>'+escG(statusProposal[x.status]||x.status)+'</td><td><div class="actions"><button class="smallbtn" onclick="growthEditProposal(\''+x.id+'\')">Editar</button><button class="smallbtn" onclick="growthPrintProposal(\''+x.id+'\')">PDF</button></div></td></tr>').join(''):'<tr><td colspan="5" class="empty">Nenhuma proposta cadastrada.</td></tr>';
 const sum=k=>outsourcedOrders.reduce((a,x)=>a+Number(x[k]||0),0);set('gOrderCount',outsourcedOrders.length);set('gOrderCosts',moneyG(sum('cost_amount')));set('gOrderBilled',moneyG(sum('billed_amount')));set('gOrderMargin',moneyG(sum('billed_amount')-sum('cost_amount')));
 const oq=($g('gOrderSearch')?.value||'').toLowerCase(),ors=outsourcedOrders.filter(x=>(x.order_number+' '+x.provider_name+' '+x.description).toLowerCase().includes(oq));
 if($g('gOrdersTable'))$g('gOrdersTable').innerHTML=ors.length?ors.map(x=>'<tr><td>'+escG(x.service_date)+'<br>'+escG(x.order_number)+'</td><td>'+escG(x.provider_name)+'</td><td><b>'+moneyG(x.cost_amount)+'</b></td><td>'+escG(statusOrder[x.status]||x.status)+'</td><td><button class="smallbtn" onclick="growthEditOrder(\''+x.id+'\')">Editar</button></td></tr>').join(''):'<tr><td colspan="5" class="empty">Nenhuma contratação registrada.</td></tr>';
 renderRevenue();growthApplyClientSegmentFilter();
}
function renderRevenue(){
 const period=$g('gRevenuePeriod')?.value||'month',now=new Date(),inRange=d=>{if(!d)return false;if(period==='all')return true;return period==='month'?String(d).slice(0,7)===now.toISOString().slice(0,7):String(d).slice(0,4)===String(now.getFullYear())};
 const rows=(typeof invoices!=='undefined'?invoices:[]).filter(x=>inRange(x.issueDate));
 const receivedRows=(typeof invoiceReceipts!=='undefined'?invoiceReceipts:[]).filter(x=>inRange(x.date));
 const total=rows.reduce((a,x)=>a+Number(x.total||0),0),received=receivedRows.reduce((a,r)=>a+Number(r.amount||0),0),open=rows.reduce((a,x)=>a+Math.max(0,Number(x.total||0)-(typeof invoicePaid==='function'?invoicePaid(x):0)),0);
 const costs=outsourcedOrders.filter(x=>inRange(x.service_date)).reduce((a,x)=>a+Number(x.cost_amount||0),0)+((typeof fleetFreights!=='undefined'?fleetFreights:[]).filter(x=>inRange(x.date)).reduce((a,x)=>a+Number(x.cost||0),0));
 const labels={materials:'Venda de materiais',services:'Prestação de serviços',transport:'Fretes e transporte',unknown:'Não classificado'};
 const by={materials:0,services:0,transport:0,unknown:0};
 rows.forEach(x=>{const k=['materials','services','transport'].includes(x.businessUnit)?x.businessUnit:'unknown';by[k]+=Number(x.total||0)});
 const set=(id,v)=>{if($g(id))$g(id).textContent=v};set('gRevenueTotal',moneyG(total));set('gRevenueReceived',moneyG(received));set('gRevenueOpen',moneyG(open));set('gRevenueCosts',moneyG(costs));
 const max=Math.max(1,...Object.values(by));if($g('gRevenueBreakdown'))$g('gRevenueBreakdown').innerHTML=Object.entries(by).map(([k,v])=>'<div class="report-stat"><span>'+labels[k]+'</span><b>'+moneyG(v)+'</b></div><div class="report-material-track"><div class="report-material-fill" style="width:'+Math.max(0,v/max*100)+'%"></div></div>').join('');
 const sources={};prospects.forEach(p=>{const k=p.source||'Não informado';sources[k]=(sources[k]||0)+1});if($g('gRevenueSources'))$g('gRevenueSources').innerHTML=Object.entries(sources).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="report-stat"><span>'+escG(k)+'</span><b>'+v+' lead(s)</b></div>').join('')||'<p class="empty">Cadastre a origem dos leads para medir os canais de aquisição.</p>';
}
async function growthSubmit(table,idField,build,rows,reset,success){
 const id=$g(idField).value;const payload=build();if(!id)payload.created_by=currentSession?.user?.id||null;payload.updated_at=new Date().toISOString();
 try{const q=id?supabaseClient.from(table).update(payload).eq('id',id):supabaseClient.from(table).insert(payload);const {error}=await q;if(error)throw error;await loadGrowthData();reset();alert(success)}catch(e){alert('Não foi possível salvar. Verifique se a migração comercial foi aplicada e se sua sessão tem permissão. Detalhe: '+(e.message||e))}
}
function bindForms(){
 $g('gProspectForm')?.addEventListener('submit',e=>{e.preventDefault();growthSubmit('sales_prospects','gProspectId',()=>({company_name:$g('gProspectCompany').value.trim(),document:$g('gProspectDocument').value.trim()||null,industry:$g('gProspectIndustry').value.trim()||null,contact_name:$g('gProspectContact').value.trim()||null,phone:$g('gProspectPhone').value.trim()||null,email:$g('gProspectEmail').value.trim()||null,source:$g('gProspectSource').value||null,status:$g('gProspectStatus').value,next_action_at:$g('gProspectNext').value||null,notes:$g('gProspectNotes').value.trim()||null}),prospects,growthResetProspect,'Prospect salvo.')});
 $g('gProposalForm')?.addEventListener('submit',e=>{e.preventDefault();const client=$g('gProposalClient').value||null,prospect=$g('gProposalProspect').value||null;if(!client&&!prospect){alert('Vincule a proposta a um cliente ou prospect.');return}growthSubmit('service_proposals','gProposalId',()=>({proposal_number:$g('gProposalNumber').value.trim(),client_id:client,prospect_id:prospect,business_unit:$g('gProposalUnit').value,service_type:$g('gProposalType').value.trim(),scope:$g('gProposalScope').value.trim()||null,proposed_value:Number($g('gProposalValue').value)||0,estimated_cost:Number($g('gProposalCost').value)||0,status:$g('gProposalStatus').value,responsible:$g('gProposalResponsible').value.trim()||null,sent_at:$g('gProposalSent').value||null,valid_until:$g('gProposalValid').value||null,notes:$g('gProposalNotes').value.trim()||null}),proposals,growthResetProposal,'Proposta salva.')});
 $g('gOrderForm')?.addEventListener('submit',e=>{e.preventDefault();growthSubmit('outsourced_service_orders','gOrderId',()=>({order_number:$g('gOrderNumber').value.trim(),client_id:$g('gOrderClient').value||null,provider_name:$g('gOrderProvider').value.trim(),service_category:$g('gOrderCategory').value,description:$g('gOrderDescription').value.trim(),service_date:$g('gOrderDate').value,cost_amount:Number($g('gOrderCost').value)||0,billed_amount:Number($g('gOrderBilled').value)||0,status:$g('gOrderStatus').value,notes:$g('gOrderNotes').value.trim()||null}),outsourcedOrders,()=>{$g('gOrderForm').reset();$g('gOrderId').value='';},'Contratação registrada.')});
 ['gProspectSearch','gProposalSearch','gOrderSearch'].forEach(id=>$g(id)?.addEventListener('input',renderGrowth));
 $g('gRevenuePeriod')?.addEventListener('change',renderRevenue);
}
function growthEditOrder(id){const x=outsourcedOrders.find(o=>o.id===id);if(!x)return;const m={gOrderId:'id',gOrderNumber:'order_number',gOrderClient:'client_id',gOrderProvider:'provider_name',gOrderCategory:'service_category',gOrderDescription:'description',gOrderDate:'service_date',gOrderCost:'cost_amount',gOrderBilled:'billed_amount',gOrderStatus:'status',gOrderNotes:'notes'};Object.entries(m).forEach(([el,k])=>$g(el).value=x[k]??'');$g('gOrderFormTitle').textContent='Editar contratação'}
async function growthConvertProspect(id){const p=prospects.find(x=>x.id===id);if(!p)return;if(p.converted_client_id){alert('Este prospect já está vinculado a um cliente.');return}if(!confirm('Criar um cadastro de cliente para '+p.company_name+'?'))return;try{const {data,error}=await supabaseClient.from('clients').insert({name:p.company_name,document:p.document||null,contact:[p.contact_name,p.phone,p.email].filter(Boolean).join(' · ')||null,status:'Ativo'}).select().single();if(error)throw error;const {error:updateError}=await supabaseClient.from('sales_prospects').update({status:'won',converted_client_id:data.id,updated_at:new Date().toISOString()}).eq('id',id);if(updateError)throw updateError;await refresh();await loadGrowthData();alert('Prospect convertido em cliente. O cadastro original foi preservado.')}catch(e){alert('Falha na conversão: '+(e.message||e))}}
function growthPrintProposal(id){const p=proposals.find(x=>x.id===id)||{proposal_number:'',service_type:$g('gProposalType')?.value,scope:$g('gProposalScope')?.value,proposed_value:$g('gProposalValue')?.value,valid_until:$g('gProposalValid')?.value,client_id:$g('gProposalClient')?.value,prospect_id:$g('gProposalProspect')?.value};if(!p.service_type){alert('Selecione ou preencha uma proposta antes de gerar o documento.');return}const company=p.client_id?clientLabel(p.client_id):(prospects.find(x=>x.id===p.prospect_id)?.company_name||'Empresa destinatária');const w=window.open('','_blank');if(!w){alert('Permita a abertura de janelas para gerar o PDF.');return}w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Proposta '+escG(p.proposal_number)+'</title><style>body{font:15px Arial,sans-serif;color:#203329;margin:48px;line-height:1.6}h1{color:#247a43}small{color:#68766e}.total{font-size:26px;font-weight:bold;margin-top:28px}</style></head><body><h1>DESCARTE IDEAL</h1><small>PROPOSTA COMERCIAL '+escG(p.proposal_number)+'</small><h2>'+escG(company)+'</h2><h3>'+escG(p.service_type)+'</h3><p>'+escG(p.scope||'Escopo a definir').replace(/\n/g,'<br>')+'</p><p class="total">'+moneyG(p.proposed_value)+'</p><p>Validade: '+escG(p.valid_until||'A combinar')+'</p><hr><small>Descarte Ideal · Proposta comercial sujeita a aprovação e formalização contratual.</small><script>window.onload=()=>window.print()<\/script></body></html>');w.document.close()}
function growthResetProposalNumber(){if($g('gProposalNumber')&&!$g('gProposalId').value)$g('gProposalNumber').value='PROP-'+new Date().getFullYear()+'-'+String(proposals.length+1).padStart(4,'0')}
const baseLoad=typeof loadFromSupabase==='function'?loadFromSupabase:null;
if(baseLoad){loadFromSupabase=async function(){await baseLoad();await loadGrowthData()}}
const baseGo=typeof go==='function'?go:null;
if(baseGo){go=function(page){baseGo(page);if(['prospeccao','propostas','terceirizados','inteligencia'].includes(page)){renderGrowth();if(!demoMode)loadGrowthData()} }}
window.growthReload=loadGrowthData;window.growthResetProspect=growthResetProspect;window.growthEditProspect=growthEditProspect;window.growthResetProposal=growthResetProposal;window.growthEditProposal=growthEditProposal;window.growthPrintProposal=growthPrintProposal;window.growthEditOrder=growthEditOrder;window.growthConvertProspect=growthConvertProspect;window.growthSaveSegments=growthSaveSegments;

/* Filtro visual da carteira por frente comercial, sem duplicar cadastros. */
function injectClientSegmentFilter(){
 const search=$g('clientSearch');if(!search||$g('gClientSegmentFilter'))return;
 const wrap=search.parentElement;
 wrap.insertAdjacentHTML('beforeend','<select id="gClientSegmentFilter" class="search" style="max-width:190px"><option value="all">Todas as clientelas</option><option value="materials">Clientes de materiais</option><option value="services">Clientes de serviços</option><option value="transport">Clientes de transporte</option><option value="integrated">Clientes integrados</option><option value="unclassified">Sem classificação</option></select>');
 $g('gClientSegmentFilter').addEventListener('change',growthApplyClientSegmentFilter);
}
function growthApplyClientSegmentFilter(){
 const filter=$g('gClientSegmentFilter')?.value||'all',table=$g('clientsTable');if(!table)return;
 [...table.querySelectorAll('tr')].forEach(tr=>{
  const name=tr.querySelector('td')?.querySelector('b')?.textContent?.trim();
  if(!name||filter==='all'){tr.hidden=false;return}
  const c=(state.clients||[]).find(x=>x.name===name);const seg=segmentRows.filter(x=>String(x.client_id)===String(c?.id)).map(x=>x.segment);
  const visible=filter==='integrated'?seg.length>1:filter==='unclassified'?seg.length===0:seg.includes(filter);
  tr.hidden=!visible;
 });
}
const baseRender=typeof render==='function'?render:null;
if(baseRender){render=function(){baseRender();growthApplyClientSegmentFilter()}}

inject();injectClientSegmentFilter();bindForms();growthResetProposalNumber();
if(typeof state!=='undefined'&&state.clients)renderGrowth();
})();
