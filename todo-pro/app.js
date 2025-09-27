/*
  To-Do App (Pro) - TaskCraft
  Author: Divya Sabale
  Notes: Local-only demo. Next step would be REST API sync.
*/

const STORAGE_KEY = 'todo_pro_v1';

// DOM
const taskForm = document.getElementById('taskForm');
const titleEl = document.getElementById('title');
const dueEl = document.getElementById('dueDate');
const priorityEl = document.getElementById('priority');
const notesEl = document.getElementById('notes');
const clearBtn = document.getElementById('clearBtn');
const taskListEl = document.getElementById('taskList');
const emptyEl = document.getElementById('empty');
const statsEl = document.getElementById('stats');

const filterButtons = document.querySelectorAll('.chip');
const priorityFilter = document.getElementById('priorityFilter');
const searchEl = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// modal elements
const modal = document.getElementById('modal');
const editTitle = document.getElementById('editTitle');
const editDue = document.getElementById('editDue');
const editPriority = document.getElementById('editPriority');
const editNotes = document.getElementById('editNotes');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');

// state
let tasks = [];
let filterState = 'all';
let priorityState = 'all';
let sortAsc = true;
let editingId = null;

// init sample data if empty
function defaultTasks(){
  return [
    {id: Date.now()+1, title:'Prepare CV', notes:'Update projects & contact', due: '', priority:'high', completed:false, created: Date.now()},
    {id: Date.now()+2, title:'Practice React basics', notes:'Components + props', due: '', priority:'medium', completed:false, created: Date.now()},
    {id: Date.now()+3, title:'Read OOP notes', notes:'Encapsulation & inheritance', due: '', priority:'low', completed:true, created: Date.now()}
  ];
}

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { tasks = JSON.parse(raw); } catch(e){ tasks = defaultTasks(); }
  } else {
    tasks = defaultTasks();
    save();
  }
}

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

// helpers
function formatDate(d){
  if(!d) return '';
  try { const dt = new Date(d); return dt.toLocaleDateString(); } catch(e){ return d; }
}
function untilDue(d){
  if(!d) return '';
  const now = new Date(); const due = new Date(d);
  const diff = Math.ceil((due - now)/(1000*60*60*24));
  if(diff > 1) return diff + ' days left';
  if(diff === 1) return 'Tomorrow';
  if(diff === 0) return 'Due today';
  return Math.abs(diff) + ' days ago';
}

// rendering
function render(){
  const q = searchEl.value.trim().toLowerCase();
  let list = tasks.filter(t => {
    if(filterState === 'active' && t.completed) return false;
    if(filterState === 'completed' && !t.completed) return false;
    if(priorityState !== 'all' && t.priority !== priorityState) return false;
    if(q && !(t.title.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q))) return false;
    return true;
  });
  // sort by due (if present) else created date
  list.sort((a,b)=>{
    const da = a.due || a.created; const db = b.due || b.created;
    return sortAsc ? (new Date(da) - new Date(db)) : (new Date(db) - new Date(da));
  });

  taskListEl.innerHTML = '';
  if(list.length === 0){ emptyEl.style.display = 'block'; } else { emptyEl.style.display = 'none'; }

  list.forEach(t => {
    const card = document.createElement('article');
    card.className = 'task-card' + (t.completed ? ' completed' : '');
    card.innerHTML = `
      <div class="task-actions">
        <button class="icon-btn toggle" data-id="${t.id}" title="Toggle complete">✔</button>
        <button class="icon-btn edit" data-id="${t.id}" title="Edit">✎</button>
        <button class="icon-btn del" data-id="${t.id}" title="Delete">✕</button>
      </div>
      <div class="task-body">
        <h3 class="task-title">${escapeHtml(t.title)}</h3>
        <div class="task-meta">
          <div class="badge ${t.priority}">${t.priority.toUpperCase()}</div>
          <div>${t.due ? formatDate(t.due) + (t.due ? ' • ' + untilDue(t.due) : '') : ''}</div>
        </div>
        <p class="task-notes">${escapeHtml(t.notes || '')}</p>
      </div>
    `;
    // events
    card.querySelector('.toggle').addEventListener('click', ()=> toggleComplete(t.id));
    card.querySelector('.del').addEventListener('click', ()=> { if(confirm('Delete this task?')) deleteTask(t.id); });
    card.querySelector('.edit').addEventListener('click', ()=> openEdit(t.id));
    taskListEl.appendChild(card);
  });

  // stats
  const total = tasks.length;
  const dueCount = tasks.filter(x => x.due).length;
  statsEl.textContent = `${total} tasks • ${dueCount} with due date`;
  save();
}

// sanitize
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// actions
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = titleEl.value.trim();
  if(!title){ alert('Please provide a task title'); return; }
  const item = { id: Date.now(), title, notes: notesEl.value.trim(), due: dueEl.value || '', priority: priorityEl.value, completed:false, created: Date.now() };
  tasks.unshift(item);
  save(); render();
  taskForm.reset();
});

clearBtn.addEventListener('click', ()=> taskForm.reset());

filterButtons.forEach(b=> b.addEventListener('click', ()=> {
  document.querySelector('.chip.active')?.classList.remove('active');
  b.classList.add('active');
  filterState = b.dataset.filter;
  render();
}));

priorityFilter.addEventListener('change', ()=> { priorityState = priorityFilter.value; render(); });
searchEl.addEventListener('input', ()=> render());

sortBtn.addEventListener('click', ()=> { sortAsc = !sortAsc; sortBtn.textContent = sortAsc ? 'Sort by due ↑' : 'Sort by due ↓'; render(); });

// toggle complete by id
function toggleComplete(id){
  const i = tasks.findIndex(t => t.id === id);
  if(i>-1){ tasks[i].completed = !tasks[i].completed; render(); }
}

function deleteTask(id){
  tasks = tasks.filter(t => t.id !== id); render();
}

function openEdit(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  editingId = id;
  editTitle.value = t.title; editDue.value = t.due || ''; editPriority.value = t.priority; editNotes.value = t.notes || '';
  modal.style.display = 'flex'; modal.setAttribute('aria-hidden','false');
}

saveEdit.addEventListener('click', ()=> {
  const i = tasks.findIndex(t => t.id === editingId);
  if(i>-1){
    tasks[i].title = editTitle.value.trim();
    tasks[i].due = editDue.value || '';
    tasks[i].priority = editPriority.value;
    tasks[i].notes = editNotes.value.trim();
    editingId = null;
    modal.style.display = 'none'; modal.setAttribute('aria-hidden','true');
    render();
  }
});

cancelEdit.addEventListener('click', ()=> { editingId=null; modal.style.display='none'; modal.setAttribute('aria-hidden','true'); });

// import / export
exportBtn.addEventListener('click', ()=> {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'tasks-export.json'; a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', (e)=> {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try{ const data = JSON.parse(reader.result); if(Array.isArray(data)){ tasks = data; render(); alert('Import successful'); } else alert('Invalid JSON'); } catch(err){ alert('Invalid file'); }
  };
  reader.readAsText(f);
});

// init load + render
load(); render();
