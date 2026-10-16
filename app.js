const SUPABASE_URL = "https://fcebjglductrxtkmcpyx.supabase.co";
const SUPABASE_KEY = "sb_publishable_5gRDb5wC7KWjVUq6X1Vx9w_x9XBOZl";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function toggleModal() {
    document.getElementById('postModal').classList.toggle('hidden');
}

// Fetch Posts
async function fetchPosts() {
    const container = document.getElementById('postsContainer');
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*, mulund_areas(area_name)')
        .order('upvotes_count', { ascending: false });

    if (error || !posts) {
        container.innerHTML = `<p class="text-slate-500 text-center py-10">No issues posted yet!</p>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        const isReady = post.upvotes_count >= 50;
        
        const mailSubject = encodeURIComponent(`[CIVIC ACTION] ${post.upvotes_count} Residents Request Action: ${post.category}`);
        const mailBody = encodeURIComponent(
            `RESPECTED ASSISTANT COMMISSIONER (BMC T-WARD),\n\n` +
            `This issue has been verified and upvoted by ${post.upvotes_count} Mulund residents:\n\n` +
            `• Category: ${post.category}\n` +
            `• Location: ${post.mulund_areas?.area_name || 'Mulund'}\n` +
            `• Details: ${post.description}\n\n` +
            `Please inspect and resolve.\n- Mulund Community Civic Hub`
        );
        const mailLink = `mailto:ac.t@mcgm.gov.in?subject=${mailSubject}&body=${mailBody}`;

        return `
            <div onclick="openIssueModal(${post.post_id})" class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 cursor-pointer active:scale-[0.99] transition">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase">${post.category}</span>
                        <h3 class="font-bold text-slate-800 text-sm mt-1">${post.title}</h3>
                        <p class="text-xs text-slate-500">📍 ${post.mulund_areas?.area_name || 'Mulund'}</p>
                    </div>
                    <button onclick="event.stopPropagation(); upvotePost(${post.post_id}, ${post.upvotes_count})" class="bg-slate-100 p-2 rounded-lg text-center min-w-[40px]">
                        <span class="text-xs font-bold text-blue-600">▲ ${post.upvotes_count}</span>
                    </button>
                </div>
                
                <p class="text-xs text-slate-600">${post.description}</p>
                
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px] text-slate-500">
                        <span>Progress: ${post.upvotes_count}/50 Upvotes</span>
                        <span>${isReady ? 'Escalation Threshold Met' : 'Pending Support'}</span>
                    </div>
                    <div class="w-full bg-slate-100 h-1.5 rounded-full">
                        <div class="bg-emerald-500 h-full rounded-full" style="width: ${Math.min((post.upvotes_count / 50) * 100, 100)}%"></div>
                    </div>
                </div>

                ${isReady ? `
                    <a href="${mailLink}" onclick="event.stopPropagation()" class="block text-center bg-blue-600 text-white font-bold text-xs py-2 rounded-lg shadow">
                        📧 Send Pre-filled Notice to BMC T-Ward
                    </a>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openIssueModal(postId) {
    alert("Card clicked! Post ID: " + postId);
}


// Handle New Post Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const area_id = parseInt(document.getElementById('areaId').value);
    const description = document.getElementById('description').value;

    await supabase.from('posts').insert([{ title, category, area_id, description, upvotes_count: 1 }]);
    
    document.getElementById('issueForm').reset();
    toggleModal();
    fetchPosts();
    { // Handle Card Click (Shows alert so we know it's working)
function openIssueModal(postId) {
    alert("Card clicked! Post ID: " + postId);
}
}

// Upvote Function
async function upvotePost(postId, currentUpvotes) {
    await supabase.from('posts').update({ upvotes_count: currentUpvotes + 1 }).eq('post_id', postId);
    fetchPosts();
}

fetchPosts();
