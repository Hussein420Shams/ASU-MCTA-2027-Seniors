const studentsGrid = document.getElementById("studentsGrid");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

const modal = document.getElementById("studentModal");
const modalPhoto = document.getElementById("modalPhoto");
const modalName = document.getElementById("modalName");
const modalId = document.getElementById("modalId");
const modalQuote = document.getElementById("modalQuote");
const modalSpeech = document.getElementById("modalSpeech");

const photoSlider = document.getElementById("photoSlider");
const previousPhoto = document.getElementById("previousPhoto");
const nextPhoto = document.getElementById("nextPhoto");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");

function normalizeText(value) {
    return value.toLowerCase().trim();
}

function createStudentCard(student, index) {
    const article = document.createElement("article");
    article.className = "student-card";
    article.style.animationDelay = `${Math.min(index * 55, 330)}ms`;

    article.innerHTML = `
        <div class="student-image">
            <img src="${student.photo}" alt="${student.name}" loading="lazy">
        </div>

        <div class="student-card-body">
            <div class="name-slot">
                <h3 title="${student.name}">${student.name}</h3>
                <p>${student.id}</p>
            </div>

            <button class="more-info" type="button">More Info</button>
        </div>
    `;

    article.querySelector(".more-info").addEventListener("click", () => {
        openStudentModal(student);
    });

    return article;
}

function renderStudents(list) {
    studentsGrid.innerHTML = "";

    list.forEach((student, index) => {
        studentsGrid.appendChild(createStudentCard(student, index));
    });

    resultCount.textContent = `${list.length} ${list.length === 1 ? "senior" : "seniors"}`;
    emptyState.hidden = list.length !== 0;
}

function filterStudents() {
    const query = normalizeText(searchInput.value);

    const filteredStudents = students.filter((student) => {
        const name = normalizeText(student.name);
        const id = normalizeText(student.id);

        return name.includes(query) || id.includes(query);
    });

    renderStudents(filteredStudents);
}

function openStudentModal(student) {
    modalPhoto.src = student.photo;
    modalPhoto.alt = student.name;
    modalName.textContent = student.name;
    modalId.textContent = student.id;
    modalQuote.textContent = `“${student.quote}”`;
    modalSpeech.textContent = student.speech;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeStudentModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function openLightbox(imageSource) {
    lightboxImage.src = imageSource;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

searchInput.addEventListener("input", filterStudents);

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    filterStudents();
    searchInput.focus();
});

previousPhoto.addEventListener("click", () => {
    photoSlider.scrollBy({
        left: -photoSlider.clientWidth * 0.82,
        behavior: "smooth"
    });
});

nextPhoto.addEventListener("click", () => {
    photoSlider.scrollBy({
        left: photoSlider.clientWidth * 0.82,
        behavior: "smooth"
    });
});

photoSlider.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        photoSlider.scrollLeft += event.deltaY;
    }
}, { passive: false });

document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeStudentModal);
});

document.querySelectorAll(".group-photo").forEach((button) => {
    button.addEventListener("click", () => {
        openLightbox(button.dataset.full);
    });
});

document.querySelectorAll("[data-close-lightbox]").forEach((button) => {
    button.addEventListener("click", closeLightbox);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeStudentModal();
        closeLightbox();
    }
});

renderStudents(students);
