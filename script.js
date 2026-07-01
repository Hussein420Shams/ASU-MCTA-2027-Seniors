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
const lightboxDownload = document.getElementById("lightboxDownload");
let currentLightboxImage = "";

let savedScrollPosition = 0;
let pageScrollLocked = false;
let previousScrollBehavior = "";

function normalizeText(value) {
    return value.toLowerCase().trim();
}

function getImageFileName(imageSource) {
    const cleanSource = imageSource
        .split("?")[0]
        .split("#")[0];

    const fileName = cleanSource.substring(
        cleanSource.lastIndexOf("/") + 1
    );

    return fileName || "image";
}

function lockPageScroll() {
    if (pageScrollLocked) {
        return;
    }

    savedScrollPosition =
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;

    previousScrollBehavior =
        document.documentElement.style.scrollBehavior;

    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");

    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollPosition}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    pageScrollLocked = true;
}

function unlockPageScroll() {
    if (!pageScrollLocked) {
        return;
    }

    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    document.documentElement.style.scrollBehavior = "auto";

    window.scrollTo(0, savedScrollPosition);

    requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior =
            previousScrollBehavior;
    });

    pageScrollLocked = false;
}

function updateScrollLock() {
    const studentModalOpen =
        modal.classList.contains("is-open");

    const imageLightboxOpen =
        lightbox.classList.contains("is-open");

    if (studentModalOpen || imageLightboxOpen) {
        lockPageScroll();
    } else {
        unlockPageScroll();
    }
}

function createStudentCard(student, index) {
    const article = document.createElement("article");

    article.className = "student-card";

    article.style.animationDelay =
        `${Math.min(index * 55, 330)}ms`;

    article.innerHTML = `
        <div class="student-image">
            <img
                src="${student.photo}"
                alt="${student.name}"
                loading="lazy"
            >
        </div>

        <div class="student-card-body">

            <div class="name-slot">
                <h3 title="${student.name}">
                    ${student.name}
                </h3>

                <p>${student.id}</p>
            </div>

            <button class="more-info" type="button">
                More Info
            </button>

        </div>
    `;

    article
        .querySelector(".more-info")
        .addEventListener("click", () => {
            openStudentModal(student);
        });

    return article;
}

function renderStudents(list) {
    studentsGrid.innerHTML = "";

    list.forEach((student, index) => {
        studentsGrid.appendChild(
            createStudentCard(student, index)
        );
    });

    resultCount.textContent =
        `${list.length} ${
            list.length === 1 ? "senior" : "seniors"
        }`;

    emptyState.hidden = list.length !== 0;
}

function filterStudents() {
    const query = normalizeText(searchInput.value);

    const filteredStudents = students.filter((student) => {
        const name = normalizeText(student.name);
        const id = normalizeText(student.id);

        return (
            name.includes(query) ||
            id.includes(query)
        );
    });

    renderStudents(filteredStudents);
}

function openStudentModal(student) {
    modalPhoto.src = student.photo;
    modalPhoto.alt = student.name;
    modalPhoto.title = "Open image";

    modalName.textContent = student.name;
    modalId.textContent = student.id;
    modalQuote.textContent = `“${student.quote}”`;
    modalSpeech.textContent = student.speech;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    updateScrollLock();
}

function closeStudentModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    updateScrollLock();
}

function openLightbox(
    imageSource,
    imageDescription = "Expanded image"
) {
    currentLightboxImage = imageSource;

    lightboxImage.src = imageSource;
    lightboxImage.alt = imageDescription;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");

    updateScrollLock();
}

function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");

    lightboxImage.src = "";
    currentLightboxImage = "";

    updateScrollLock();
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

photoSlider.addEventListener(
    "wheel",
    (event) => {
        if (
            Math.abs(event.deltaY) >
            Math.abs(event.deltaX)
        ) {
            event.preventDefault();

            photoSlider.scrollLeft +=
                event.deltaY;
        }
    },
    {
        passive: false
    }
);

modalPhoto.addEventListener("click", () => {
    const imageSource =
        modalPhoto.getAttribute("src");

    if (imageSource) {
        openLightbox(
            imageSource,
            modalName.textContent
        );
    }
});

document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            closeStudentModal
        );
    });

document
    .querySelectorAll(".group-photo")
    .forEach((button) => {
        button.addEventListener("click", () => {
            const imageSource =
                button.dataset.full;

            const image =
                button.querySelector("img");

            const imageDescription =
                image?.alt || "Group photo";

            openLightbox(
                imageSource,
                imageDescription
            );
        });
    });

document
    .querySelectorAll("[data-close-lightbox]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            closeLightbox
        );
    });

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    if (lightbox.classList.contains("is-open")) {
        closeLightbox();
        return;
    }

    if (modal.classList.contains("is-open")) {
        closeStudentModal();
    }
});

async function downloadCurrentImage() {
    if (!currentLightboxImage) return;

    try {
        const response = await fetch(currentLightboxImage);
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        const downloadLink = document.createElement("a");
        downloadLink.href = imageUrl;
        downloadLink.download = getImageFileName(currentLightboxImage);

        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        URL.revokeObjectURL(imageUrl);
    } catch (error) {
        alert("The image could not be downloaded.");
        console.error(error);
    }
}

lightboxDownload.addEventListener(
    "click",
    downloadCurrentImage
);

renderStudents(students);