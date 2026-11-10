const API_URL = '/api';
let currentPage = 1;
let searchQuery = '';
let searchTimeout = null;

// --- LOGIKA DARK MODE ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const htmlElement = document.documentElement;

if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    if (themeToggleBtn) themeToggleBtn.innerText = '☀️';
} else {
    htmlElement.classList.remove('dark');
    if (themeToggleBtn) themeToggleBtn.innerText = '🌙';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            localStorage.theme = 'dark';
            themeToggleBtn.innerText = '☀️';
        } else {
            localStorage.theme = 'light';
            themeToggleBtn.innerText = '🌙';
        }
    });
}
// -------------------------

// --- LOGIKA PENCARIAN ---
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                fetchTasks();
            }, 300);
        });
    }
});

document.getElementById('taskForm').addEventListener('submit', addTask);
document.getElementById('editForm').addEventListener('submit', submitEditTask);

async function fetchTasks() {
    try {
        // Tampilkan animasi skeleton sebelum request ke server dimulai
        showLoadingState();
        // 2. Jeda buatan 400ms agar animasi loading terlihat (Simulasi jaringan internet)
        await new Promise(resolve => setTimeout(resolve, 400));
        const res = await fetch(`${API_URL}?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Gagal load API");
        const responseData = await res.json();

        renderTasks(responseData.active_data || [], responseData.completed_data || []);
        renderPagination(responseData.pagination || { current_page: 1, total_pages: 1 });
    } catch (err) {
        showToast('Gagal memuat tugas.');
    }
}

// DESAIN TUGAS MODERN MINIMALIS
function createTaskHTML(task, isDone) {
    const safeTitle = (task.title || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
    let dateHtml = '';
    let isOverdue = false;

    if (task.due_date) {
        const dueDateObj = new Date(task.due_date.replace(' ', 'T'));
        if (dueDateObj < new Date() && !isDone) isOverdue = true;

        const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = !isNaN(dueDateObj) ? dueDateObj.toLocaleDateString('id-ID', options).replace(/\./g, ':') : task.due_date;
        dateHtml = `<span class="text-[11px] font-medium tracking-wide ${isOverdue ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'} block mt-1 flex items-center gap-1.5"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${formattedDate} ${isOverdue ? '<span class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] uppercase border border-red-200 dark:border-red-500/20">Overdue</span>' : ''}</span>`;
    }

    // Perbedaan Desain: Aktif menggunakan box putih solid, Selesai menggunakan transparan dengan garis putus-putus
    // Sedikit menaikkan opacity dari 60 menjadi 75 agar item tidak terlalu pudar
    const bgClass = isDone ? 'bg-transparent border-dashed opacity-75 hover:opacity-100' : 'bg-zinc-100 dark:bg-[#18181b] shadow-sm hover:shadow-md border-solid';

    // Menggelapkan border untuk tugas selesai menjadi border-zinc-500
    const borderClass = isDone ? 'border-zinc-500 dark:border-zinc-600' : 'border-zinc-400 dark:border-zinc-800';
    const titleClass = isDone ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200';

    const div = document.createElement('div');
    // Class 'group' ditambahkan agar tombol edit/hapus hanya muncul saat di hover
    div.className = `group flex justify-between items-center p-4 rounded-lg transition-all duration-300 border ${bgClass} ${borderClass}`;
    div.innerHTML = `
        <div class="flex items-center gap-4 w-full overflow-hidden">
            <div class="relative flex items-center justify-center flex-shrink-0">
                <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked, this)" 
                    class="peer w-5 h-5 appearance-none border-2 border-zinc-300 dark:border-zinc-600 rounded-md checked:bg-emerald-500 dark:checked:bg-emerald-500 checked:border-emerald-500 dark:checked:border-emerald-500 cursor-pointer transition-all">
                <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div class="flex-grow min-w-0">
                <p class="truncate text-sm font-medium transition-colors ${titleClass}">${task.title}</p>
                ${dateHtml}
            </div>
        </div>
        <div class="flex items-center flex-shrink-0 gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            ${!isDone ? `<button onclick="editTask(${task.id}, '${safeTitle}', '${task.due_date ? task.due_date.replace(' ', 'T') : ''}')" class="text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-2 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>` : ''}
            <button onclick="deleteTask(${task.id})" class="text-zinc-400 hover:text-red-500 p-2 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
    `;
    return div;
}


// Desain Skeleton Loading (Bayangan animasi saat data dimuat)
function showLoadingState() {
    const skeletonHTML = `
        <div class="animate-pulse flex justify-between items-center p-4 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-[#18181b]/50">
            <div class="flex items-center gap-4 w-full">
                <div class="w-5 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-md"></div>
                <div class="flex-grow">
                    <div class="h-3.5 bg-zinc-300 dark:bg-zinc-700 rounded w-2/3 mb-2.5"></div>
                    <div class="h-2.5 bg-zinc-300/70 dark:bg-zinc-800 rounded w-1/3"></div>
                </div>
            </div>
        </div>
    `;

    // Tampilkan 2 skeleton di kotak aktif, dan 1 skeleton di kotak selesai
    document.getElementById('activeTasks').innerHTML = skeletonHTML + skeletonHTML;
    document.getElementById('completedTasks').innerHTML = skeletonHTML;
}

function renderTasks(activeTasks, completedTasks) {
    const activeContainer = document.getElementById('activeTasks');
    const completedContainer = document.getElementById('completedTasks');

    activeContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    if (activeTasks.length === 0) activeContainer.innerHTML = `<div class="text-center py-8 text-zinc-400 text-sm font-medium">☕ ${searchQuery ? 'Tugas tidak ditemukan.' : 'Belum ada tugas hari ini.'}</div>`;
    else activeTasks.forEach(t => activeContainer.appendChild(createTaskHTML(t, false)));

    if (completedTasks.length === 0) completedContainer.innerHTML = `<div class="text-center py-8 text-zinc-400 text-sm font-medium">${searchQuery ? 'Tugas selesai tidak ditemukan.' : 'Bersih! Belum ada tugas yang selesai.'}</div>`;
    else completedTasks.forEach(t => completedContainer.appendChild(createTaskHTML(t, true)));
}

function renderPagination(pagination) {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const indicator = document.getElementById('pageIndicator');

    if (indicator) indicator.innerText = `Hal. ${pagination.current_page} / ${pagination.total_pages || 1}`;
    if (prevBtn) prevBtn.disabled = pagination.current_page <= 1;
    if (nextBtn) nextBtn.disabled = pagination.current_page >= pagination.total_pages || pagination.total_pages === 0;
}

function changePage(newPage) {
    currentPage = newPage;
    fetchTasks();
}

async function addTask(e) {
    e.preventDefault();
    // Gunakan trim() untuk membuang spasi kosong di awal/akhir
    const title = document.getElementById('title').value.trim();
    const due_date = document.getElementById('due_date').value;

    // Hentikan proses dan beri peringatan jika kosong
    if (!title) {
        showToast('⚠️ Nama tugas tidak boleh kosong!');
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, due_date })
        });
        if (res.ok) {
            document.getElementById('taskForm').reset();
            showToast('Tugas ditambahkan');
            fetchTasks();
        }
    } catch (err) { showToast('Koneksi terputus.'); }
}

async function toggleTask(id, is_completed, checkboxElem) {
    try {
        await fetch(`${API_URL}?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_completed: is_completed ? 1 : 0 }) });
        setTimeout(fetchTasks, 300);
    } catch (err) { showToast('Gagal merubah status.'); fetchTasks(); }
}

async function deleteTask(id) {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    try { await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' }); showToast('Tugas dihapus'); fetchTasks(); } catch (err) { showToast('Gagal menghapus.'); }
}

function editTask(id, currentTitle, currentDueDate) {
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_title').value = currentTitle;
    document.getElementById('edit_due_date').value = currentDueDate || '';
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => content.classList.replace('scale-95', 'scale-100'), 10);
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    content.classList.replace('scale-100', 'scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

async function submitEditTask(e) {
    e.preventDefault();
    const id = document.getElementById('edit_id').value;
    const title = document.getElementById('edit_title').value.trim();
    const due_date = document.getElementById('edit_due_date').value;

    // Hentikan proses dan beri peringatan jika kosong
    if (!title) {
        showToast('⚠️ Judul tugas tidak boleh kosong!');
        return;
    }

    try {
        const res = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, due_date: due_date.trim() || null })
        });

        if (res.ok) {
            showToast('Tugas diperbarui');
            closeEditModal();
            fetchTasks();
        } else {
            showToast('Gagal memperbarui tugas.');
        }
    } catch (err) { showToast('Koneksi terputus.'); }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    // Hapus kelas yang menyembunyikan ke bawah
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => { 
        // Kembalikan kelas untuk menyembunyikan ke bawah
        toast.classList.add('translate-y-20', 'opacity-0'); 
    }, 2500);
}

async function clearCompletedTasks() {
    if(!confirm('Yakin ingin menghapus semua histori tugas yang sudah selesai?')) return;
    
    try {
        const res = await fetch(`${API_URL}?action=clear_completed`, { method: 'DELETE' });
        
        // Membaca respon asli dari PHP (untuk melihat apakah ada error PHP tersembunyi)
        const textResponse = await res.text();
        
        try {
            // Coba terjemahkan sebagai JSON
            const data = JSON.parse(textResponse);
            
            if(res.ok && data.success) {
                showToast('Riwayat tugas selesai dibersihkan! 🧹');
                currentPage = 1;
                fetchTasks();
            } else {
                showToast('Gagal: ' + (data.error || 'Kesalahan server.'));
                console.error("Detail server:", data);
            }
        } catch (parseErr) {
            // Jika PHP error dan bukan JSON, munculkan peringatan dan log text-nya
            showToast('⚠️ PHP Error: Cek Console (F12)');
            console.error("PHP Error Text:", textResponse);
        }

    } catch (err) {
        showToast('Koneksi terputus.');
    }
}