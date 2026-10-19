const SUPABASE_URL = "https://fcebjglductrxtkmcpyx.supabase.co";
const SUPABASE_KEY = "sb_publishable_5gRDb5wC7KWjVUq6X1Vx9w_x9XBOZl";

let db = null;
let isSubmitting = false;

// Safely display text returned from the database.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showMessage(message, type = "error") {
    let box = document.getElementById("appMessage");

    if (!box) {
        box = document.createElement("div");
        box.id = "appMessage";
        box.className = "max-w-md mx-auto p-4 text-sm";
        document.querySelector("main")?.prepend(box);
    }

    box.className =
        "max-w-md mx-auto p-4 text-sm " +
        (type === "success" ? "text-green-700" : "text-red-700");

    box.textContent = message;
}

function clearMessage() {
    const box = document.getElementById("appMessage");
    if (box) box.remove();
}

function toggleModal(forceOpen) {
    const modal = document.getElementById("postModal");
    if (!modal) {
        showMessage("The report form could not be found.");
        return;
    }

    const shouldOpen =
        typeof forceOpen === "boolean"
            ? forceOpen
            : modal.classList.contains("hidden");

    modal.classList.toggle("hidden", !shouldOpen);
    modal.setAttribute("aria-hidden", String(!shouldOpen));

    if (shouldOpen) {
        document.getElementById("title")?.focus();
    }
}

function initApp() {
    if (!window.supabase?.createClient) {
        showMessage(
            "Supabase did not load. Check your internet connection and CDN script."
        );
        return;
    }

    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    // Use JavaScript event listeners instead of inline handlers.
    document.getElementById("issueForm")?.addEventListener(
        "submit",
        handleFormSubmit
    );

    document.querySelectorAll(
        'button[onclick="toggleModal()"]'
    ).forEach(button => {
        button.removeAttribute("onclick");
        button.addEventListener("click", () => toggleModal());
    });

    document.getElementById("postsContainer")
        ?.addEventListener("click", handlePostClick);

    fetchPosts();
}

// Load issues.
async function fetchPosts() {
    const container = document.getElementById("postsContainer");
    if (!container || !db) return;

    container.innerHTML =
        '<p class="text-center text-slate-400 py-10">Loading issues...</p>';

    try {
        const { data, error } = await db
            .from("posts")
            .select("*, mulund_areas(area_name)")
            .order("upvotes_count", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML =
                '<p class="text-center text-slate-500 py-10">' +
                "No issues posted yet. Be the first to report one!" +
                "</p>";
            return;
        }

        container.innerHTML = data.map(post => {
            const id = escapeHTML(post.post_id);
            const title = escapeHTML(post.title);
            const category = escapeHTML(post.category);
            const description = escapeHTML(post.description);
            const area = escapeHTML(
                post.mulund_areas?.area_name || "Mulund"
            );

            const count = Number(post.upvotes_count) || 0;
            const ready = count >= 50;
            const progress = Math.min((count / 50) * 100, 100);

            const subject = encodeURIComponent(
                `[CIVIC ACTION] ${count} Residents Request Action: ${post.category}`
            );

            const body = encodeURIComponent(
                "RESPECTED ASSISTANT COMMISSIONER (BMC T-WARD),\n\n" +
                `This issue has received ${count} upvotes:\n\n` +
                `Category: ${post.category}\n` +
                `Location: ${post.mulund_areas?.area_name || "Mulund"}\n` +
                `Details: ${post.description}\n\n` +
                "Please inspect and resolve.\n" +
                "- Mulund Community Civic Hub"
            );

            return `
                <article data-id="${id}"
                    class="issue-card bg-white p-4 rounded-xl border
                    border-slate-200 shadow-sm space-y-3">

                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <span class="text-[10px] font-bold bg-rose-100
                                text-rose-600 px-2 py-0.5 rounded-full uppercase">
                                ${category}
                            </span>
                            <h3 class="font-bold text-slate-800 text-sm mt-2">
                                ${title}
                            </h3>
                            <p class="text-xs text-slate-500">
                                📍 ${area}
                            </p>
                        </div>

                        <button type="button" data-action="upvote"
                            data-id="${id}"
                            class="bg-slate-100 p-2 rounded-lg min-w-[55px]
                            text-xs font-bold text-blue-600">
                            ▲ ${count}
                        </button>
                    </div>

                    <p class="text-xs text-slate-600 whitespace-pre-wrap">
                        ${description}
                    </p>

                    <div class="space-y-1">
                        <div class="flex justify-between text-[10px]
                            text-slate-500 gap-2">
                            <span>Progress: ${count}/50 Upvotes</span>
                            <span>${ready ? "Threshold met" : "Pending support"}</span>
                        </div>
                        <div class="w-full bg-slate-100 h-1.5 rounded-full">
                            <div class="bg-emerald-500 h-full rounded-full"
                                style="width:${progress}%"></div>
                        </div>
                    </div>

                    ${ready ? `
                        <a href="mailto:ac.t@mcgm.gov.in?subject=${subject}&body=${body}"
                            class="block text-center bg-blue-600 text-white
                            font-bold text-xs py-2 rounded-lg">
                            📧 Send notice to BMC T-Ward
                        </a>
                    ` : ""}
                </article>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading issues:", error);
        container.innerHTML =
            '<p class="text-center text-red-600 py-8">' +
            "Could not load issues. Please check your connection and try again." +
            "</p>";

        showMessage("Loading failed: " + (error.message || "Unknown database error"));
    }
}

// Submit a new issue.
async function handleFormSubmit(event) {
    event.preventDefault();
    if (isSubmitting || !db) return;

    const form = document.getElementById("issueForm");
    const submitButton = form.querySelector('[type="submit"]');

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const area_id = Number(document.getElementById("areaId").value);
    const description =
        document.getElementById("description").value.trim();

    if (!title || !description) {
        showMessage("Please enter both a title and a description.");
        return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const { error } = await db
            .from("posts")
            .insert([{
                title,
                category,
                area_id,
                description,
                upvotes_count: 1
            }]);

        if (error) throw error;

        form.reset();
        toggleModal(false);
        clearMessage();
        showMessage("Issue submitted successfully!", "success");
        await fetchPosts();

    } catch (error) {
        console.error("Error submitting issue:", error);
        showMessage(
            "Submission failed: " +
            (error.message || "Please try again.")
        );
    } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = "Submit Issue";
    }
}

// Handle upvote buttons.
async function handlePostClick(event) {
    const button = event.target.closest('button[data-action="upvote"]');
    if (!button || !db) return;

    event.preventDefault();
    event.stopPropagation();

    if (button.disabled) return;

    const postId = button.dataset.id;
    button.disabled = true;

    try {
        // Read the latest count before updating.
        const { data: post, error: readError } = await db
            .from("posts")
            .select("upvotes_count")
            .eq("post_id", postId)
            .single();

        if (readError) throw readError;

        const { error: updateError } = await db
            .from("posts")
            .update({
                upvotes_count: (Number(post.upvotes_count) || 0) + 1
            })
            .eq("post_id", postId);

        if (updateError) throw updateError;

        await fetchPosts();

    } catch (error) {
        console.error("Error upvoting:", error);
        showMessage(
            "Upvote failed: " + (error.message || "Please try again.")
        );
    } finally {
        button.disabled = false;
    }
}

// Run once the HTML has loaded.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
