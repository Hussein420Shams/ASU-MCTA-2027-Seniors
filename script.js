const studentsGrid = document.getElementById("studentsGrid");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const randomSeniorButton =
    document.getElementById("randomSeniorButton");

const modal = document.getElementById("studentModal");
const modalPhoto = document.getElementById("modalPhoto");
const modalName = document.getElementById("modalName");
const modalFullName = document.getElementById("modalFullName");
const modalId = document.getElementById("modalId");
const modalQuote = document.getElementById("modalQuote");
const modalSpeech = document.getElementById("modalSpeech");

const photoSlider = document.getElementById("photoSlider");
const previousPhoto = document.getElementById("previousPhoto");
const nextPhoto = document.getElementById("nextPhoto");

const groupPhotoButtons = Array.from(
    document.querySelectorAll(".group-photo")
);

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");

const lightboxIncomingImage = document.getElementById(
    "lightboxIncomingImage"
);

const lightboxDownload = document.getElementById(
    "lightboxDownload"
);

const lightboxPrevious = document.getElementById(
    "lightboxPrevious"
);

const lightboxNext = document.getElementById(
    "lightboxNext"
);

let currentDisplayedStudents = [...students];
let currentStudent = null;

let currentLightboxImage = "";
let currentLightboxType = "";
let currentLightboxIndex = -1;

let lightboxAnimating = false;
let lightboxAnimationTimer = null;

let savedScrollPosition = 0;
let savedDocumentHeight = 0;
let pageScrollLocked = false;
let previousScrollBehavior = "";

let sliderAnimationFrame = null;
let pageAnimationFrame = null;

const LIGHTBOX_ANIMATION_DURATION = 340;

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .trim();
}

function normalizeIndex(index, length) {
    return ((index % length) + length) % length;
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

function easeOutCubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
}

function lockPageScroll() {
    if (pageScrollLocked) {
        return;
    }

    savedScrollPosition =
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;

    savedDocumentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
    );

    previousScrollBehavior =
        document.documentElement.style.scrollBehavior;

    document.documentElement.classList.add(
        "modal-open"
    );

    document.body.classList.add(
        "modal-open"
    );

    document.body.style.position = "fixed";
    document.body.style.top =
        `-${savedScrollPosition}px`;

    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    pageScrollLocked = true;
}

function unlockPageScroll() {
    if (!pageScrollLocked) {
        return;
    }

    if (pageAnimationFrame !== null) {
        cancelAnimationFrame(
            pageAnimationFrame
        );

        pageAnimationFrame = null;
    }

    document.documentElement.classList.remove(
        "modal-open"
    );

    document.body.classList.remove(
        "modal-open"
    );

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    document.documentElement.style.scrollBehavior =
        "auto";

    window.scrollTo(
        0,
        savedScrollPosition
    );

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

    if (
        studentModalOpen ||
        imageLightboxOpen
    ) {
        lockPageScroll();
    } else {
        unlockPageScroll();
    }
}

function animateHorizontalScroll(
    element,
    targetLeft,
    duration = 320
) {
    if (sliderAnimationFrame !== null) {
        cancelAnimationFrame(
            sliderAnimationFrame
        );
    }

    const maximumLeft = Math.max(
        0,
        element.scrollWidth -
        element.clientWidth
    );

    const safeTarget = Math.max(
        0,
        Math.min(
            targetLeft,
            maximumLeft
        )
    );

    const startLeft = element.scrollLeft;
    const distance = safeTarget - startLeft;
    const startTime = performance.now();

    const previousSnapType =
        element.style.scrollSnapType;

    element.style.scrollSnapType = "none";

    function step(currentTime) {
        const progress = Math.min(
            (
                currentTime -
                startTime
            ) / duration,
            1
        );

        element.scrollLeft =
            startLeft +
            distance *
            easeOutCubic(progress);

        if (progress < 1) {
            sliderAnimationFrame =
                requestAnimationFrame(step);

            return;
        }

        element.scrollLeft = safeTarget;

        element.style.scrollSnapType =
            previousSnapType;

        sliderAnimationFrame = null;
    }

    sliderAnimationFrame =
        requestAnimationFrame(step);
}

function getGroupPhotoTargetLeft(button) {
    return (
        button.offsetLeft -
        (
            photoSlider.clientWidth -
            button.offsetWidth
        ) / 2
    );
}

function scrollGroupPhotoIntoView(
    button,
    duration = 320
) {
    animateHorizontalScroll(
        photoSlider,
        getGroupPhotoTargetLeft(button),
        duration
    );
}

function jumpGroupPhotoIntoView(button) {
    if (sliderAnimationFrame !== null) {
        cancelAnimationFrame(
            sliderAnimationFrame
        );

        sliderAnimationFrame = null;
    }

    const previousSnapType =
        photoSlider.style.scrollSnapType;

    const previousBehavior =
        photoSlider.style.scrollBehavior;

    photoSlider.style.scrollSnapType =
        "none";

    photoSlider.style.scrollBehavior =
        "auto";

    photoSlider.scrollLeft =
        getGroupPhotoTargetLeft(button);

    requestAnimationFrame(() => {
        photoSlider.style.scrollSnapType =
            previousSnapType;

        photoSlider.style.scrollBehavior =
            previousBehavior;
    });
}

function getClosestGroupPhotoIndex() {
    if (groupPhotoButtons.length === 0) {
        return -1;
    }

    const sliderBounds =
        photoSlider.getBoundingClientRect();

    const sliderCenter =
        sliderBounds.left +
        sliderBounds.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    groupPhotoButtons.forEach(
        (button, index) => {
            const buttonBounds =
                button.getBoundingClientRect();

            const buttonCenter =
                buttonBounds.left +
                buttonBounds.width / 2;

            const distance = Math.abs(
                buttonCenter -
                sliderCenter
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }
    );

    return closestIndex;
}

function navigateGroupSlider(direction) {
    const itemCount =
        groupPhotoButtons.length;

    if (itemCount === 0) {
        return;
    }

    const currentIndex =
        getClosestGroupPhotoIndex();

    const nextIndex = normalizeIndex(
        currentIndex + direction,
        itemCount
    );

    const wrapped =
        (
            direction > 0 &&
            currentIndex === itemCount - 1
        ) ||
        (
            direction < 0 &&
            currentIndex === 0
        );

    scrollGroupPhotoIntoView(
        groupPhotoButtons[nextIndex],
        wrapped ? 460 : 320
    );
}

function animatePageBackgroundTo(
    targetPosition,
    duration = 280
) {
    const maximumPosition = Math.max(
        0,
        savedDocumentHeight -
        window.innerHeight
    );

    const safeTarget = Math.max(
        0,
        Math.min(
            targetPosition,
            maximumPosition
        )
    );

    if (!pageScrollLocked) {
        window.scrollTo({
            top: safeTarget,
            behavior: "smooth"
        });

        return;
    }

    if (pageAnimationFrame !== null) {
        cancelAnimationFrame(
            pageAnimationFrame
        );
    }

    const startPosition =
        savedScrollPosition;

    const distance =
        safeTarget -
        startPosition;

    const startTime =
        performance.now();

    function step(currentTime) {
        const progress = Math.min(
            (
                currentTime -
                startTime
            ) / duration,
            1
        );

        savedScrollPosition =
            startPosition +
            distance *
            easeOutCubic(progress);

        document.body.style.top =
            `-${savedScrollPosition}px`;

        if (progress < 1) {
            pageAnimationFrame =
                requestAnimationFrame(step);
        } else {
            pageAnimationFrame = null;
        }
    }

    pageAnimationFrame =
        requestAnimationFrame(step);
}

function getStudentCard(student) {
    return Array.from(
        studentsGrid.querySelectorAll(
            ".student-card"
        )
    ).find(
        (card) =>
            card.dataset.studentId ===
            student.id
    );
}

function getStudentCardTargetPosition(
    student
) {
    const card = getStudentCard(student);

    if (!card) {
        return null;
    }

    const cardBounds =
        card.getBoundingClientRect();

    const currentPagePosition =
        pageScrollLocked
            ? savedScrollPosition
            : window.scrollY;

    const cardDocumentTop =
        currentPagePosition +
        cardBounds.top;

    return (
        cardDocumentTop -
        Math.max(
            16,
            (
                window.innerHeight -
                cardBounds.height
            ) / 2
        )
    );
}

function scrollStudentCardIntoView(student) {
    const targetPosition =
        getStudentCardTargetPosition(
            student
        );

    if (targetPosition === null) {
        return;
    }

    animatePageBackgroundTo(
        targetPosition
    );
}

function jumpStudentCardIntoView(student) {
    const targetPosition =
        getStudentCardTargetPosition(
            student
        );

    if (targetPosition === null) {
        return;
    }

    const maximumPosition = Math.max(
        0,
        savedDocumentHeight -
        window.innerHeight
    );

    savedScrollPosition = Math.max(
        0,
        Math.min(
            targetPosition,
            maximumPosition
        )
    );

    if (pageScrollLocked) {
        document.body.style.top =
            `-${savedScrollPosition}px`;
    } else {
        window.scrollTo(
            0,
            savedScrollPosition
        );
    }
}

function createStudentCard(
    student,
    index
) {
    const article =
        document.createElement("article");

    const displayName =
        student.preferredName?.trim() ||
        student.name;

    article.className = "student-card";

    article.dataset.studentId =
        student.id;

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
                    ${displayName}
                </h3>

                <p>${student.id}</p>
            </div>

            <button
                class="more-info"
                type="button">
                More Info
            </button>
        </div>
    `;

    article
        .querySelector(".more-info")
        .addEventListener(
            "click",
            () => {
                openStudentModal(
                    student
                );
            }
        );

    return article;
}

function renderStudents(list) {
    currentDisplayedStudents =
        [...list];

    studentsGrid.innerHTML = "";

    list.forEach(
        (student, index) => {
            studentsGrid.appendChild(
                createStudentCard(
                    student,
                    index
                )
            );
        }
    );

    resultCount.textContent =
        `${list.length} ${
            list.length === 1
                ? "senior"
                : "seniors"
        }`;

    emptyState.hidden =
        list.length !== 0;
}

function filterStudents() {
    const query =
        normalizeText(
            searchInput.value
        );

    const filteredStudents =
        students.filter((student) => {
            const fullName =
                normalizeText(
                    student.name
                );

            const preferredName =
                normalizeText(
                    student.preferredName
                );

            const id =
                normalizeText(
                    student.id
                );

            return (
                fullName.includes(query) ||
                preferredName.includes(query) ||
                id.includes(query)
            );
        });

    renderStudents(
        filteredStudents
    );
}

function populateStudentModal(student) {
    const displayName =
        student.preferredName?.trim() ||
        student.name;

    modalPhoto.src = student.photo;
    modalPhoto.alt = student.name;
    modalPhoto.title = "Open image";

    modalName.textContent =
        displayName;

    modalFullName.textContent =
        student.name;

    modalId.textContent =
        student.id;

    modalQuote.textContent =
        student.quote
            ? `“${student.quote}”`
            : "";

    modalSpeech.textContent =
        student.speech || "";
}

function openStudentModal(student) {
    currentStudent = student;

    populateStudentModal(
        student
    );

    modal.classList.add(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    updateScrollLock();
}

function closeStudentModal() {
    modal.classList.remove(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    currentStudent = null;

    updateScrollLock();
}

function setLightboxImage(
    imageSource,
    imageDescription =
        "Expanded image"
) {
    currentLightboxImage =
        imageSource;

    lightboxImage.src =
        imageSource;

    lightboxImage.alt =
        imageDescription;
}

function getCurrentLightboxItems() {
    if (
        currentLightboxType ===
        "group"
    ) {
        return groupPhotoButtons.map(
            (button) => {
                const image =
                    button.querySelector(
                        "img"
                    );

                return {
                    source:
                        button.dataset.full,

                    description:
                        image?.alt ||
                        "Group photo",

                    element: button
                };
            }
        );
    }

    if (
        currentLightboxType ===
        "student"
    ) {
        return currentDisplayedStudents.map(
            (student) => ({
                source: student.photo,
                description: student.name,
                student
            })
        );
    }

    return [];
}

function updateLightboxNavigationVisibility() {
    const shouldShow =
        getCurrentLightboxItems()
            .length > 1;

    lightboxPrevious.hidden =
        !shouldShow;

    lightboxNext.hidden =
        !shouldShow;
}

function showLightboxItemImmediately(index) {
    const items =
        getCurrentLightboxItems();

    if (items.length === 0) {
        return;
    }

    currentLightboxIndex =
        normalizeIndex(
            index,
            items.length
        );

    const item =
        items[currentLightboxIndex];

    setLightboxImage(
        item.source,
        item.description
    );

    if (
        currentLightboxType ===
        "group"
    ) {
        scrollGroupPhotoIntoView(
            item.element
        );

        return;
    }

    if (
        currentLightboxType ===
        "student"
    ) {
        currentStudent =
            item.student;

        populateStudentModal(
            item.student
        );

        scrollStudentCardIntoView(
            item.student
        );
    }
}

function animateLightboxToItem(
    nextIndex,
    direction,
    wrapped
) {
    if (lightboxAnimating) {
        return;
    }

    const items =
        getCurrentLightboxItems();

    if (items.length < 2) {
        return;
    }

    const safeNextIndex =
        normalizeIndex(
            nextIndex,
            items.length
        );

    const nextItem =
        items[safeNextIndex];

    const outgoingClass =
        direction > 0
            ? "lightbox-slide-out-left"
            : "lightbox-slide-out-right";

    const incomingClass =
        direction > 0
            ? "lightbox-slide-in-right"
            : "lightbox-slide-in-left";

    lightboxAnimating = true;

    let animationStarted =
        false;

    function startAnimation() {
        if (animationStarted) {
            return;
        }

        animationStarted = true;

        currentLightboxIndex =
            safeNextIndex;

        if (
            currentLightboxType ===
            "student"
        ) {
            currentStudent =
                nextItem.student;

            populateStudentModal(
                nextItem.student
            );
        }

        lightboxImage.classList.add(
            outgoingClass
        );

        lightboxIncomingImage.classList.add(
            "is-animating",
            incomingClass
        );

        if (
            currentLightboxType ===
            "group"
        ) {
            if (wrapped) {
                window.setTimeout(
                    () => {
                        jumpGroupPhotoIntoView(
                            nextItem.element
                        );
                    },
                    LIGHTBOX_ANIMATION_DURATION
                );
            } else {
                scrollGroupPhotoIntoView(
                    nextItem.element
                );
            }
        }

        if (
            currentLightboxType ===
            "student"
        ) {
            if (wrapped) {
                window.setTimeout(
                    () => {
                        jumpStudentCardIntoView(
                            nextItem.student
                        );
                    },
                    LIGHTBOX_ANIMATION_DURATION
                );
            } else {
                scrollStudentCardIntoView(
                    nextItem.student
                );
            }
        }

        lightboxAnimationTimer =
            window.setTimeout(
                () => {
                    setLightboxImage(
                        nextItem.source,
                        nextItem.description
                    );

                    lightboxImage.classList.remove(
                        outgoingClass
                    );

                    lightboxIncomingImage.classList.remove(
                        "is-animating",
                        incomingClass
                    );

                    lightboxIncomingImage.src =
                        "";

                    lightboxIncomingImage.alt =
                        "";

                    lightboxIncomingImage.onload =
                        null;

                    lightboxIncomingImage.onerror =
                        null;

                    lightboxAnimationTimer =
                        null;

                    lightboxAnimating =
                        false;
                },
                LIGHTBOX_ANIMATION_DURATION
            );
    }

    lightboxIncomingImage.onload =
        startAnimation;

    lightboxIncomingImage.onerror =
        startAnimation;

    lightboxIncomingImage.src =
        nextItem.source;

    lightboxIncomingImage.alt =
        nextItem.description;

    if (
        lightboxIncomingImage.complete
    ) {
        requestAnimationFrame(
            startAnimation
        );
    }
}

function openLightbox(type, index) {
    currentLightboxType = type;
    currentLightboxIndex = index;

    showLightboxItemImmediately(
        index
    );

    updateLightboxNavigationVisibility();

    lightbox.classList.add(
        "is-open"
    );

    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );

    updateScrollLock();
}

function closeLightbox() {
    if (
        lightboxAnimationTimer !==
        null
    ) {
        clearTimeout(
            lightboxAnimationTimer
        );

        lightboxAnimationTimer =
            null;
    }

    lightboxAnimating = false;

    lightboxImage.classList.remove(
        "lightbox-slide-out-left",
        "lightbox-slide-out-right"
    );

    lightboxIncomingImage.classList.remove(
        "is-animating",
        "lightbox-slide-in-left",
        "lightbox-slide-in-right"
    );

    lightboxIncomingImage.src = "";
    lightboxIncomingImage.alt = "";

    lightboxIncomingImage.onload =
        null;

    lightboxIncomingImage.onerror =
        null;

    lightbox.classList.remove(
        "is-open"
    );

    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );

    lightboxImage.src = "";

    currentLightboxImage = "";
    currentLightboxType = "";
    currentLightboxIndex = -1;

    lightboxPrevious.hidden = true;
    lightboxNext.hidden = true;

    updateScrollLock();
}

function navigateLightbox(direction) {
    if (
        !lightbox.classList.contains(
            "is-open"
        ) ||
        lightboxAnimating
    ) {
        return;
    }

    const items =
        getCurrentLightboxItems();

    if (items.length < 2) {
        return;
    }

    const nextIndex =
        normalizeIndex(
            currentLightboxIndex +
            direction,
            items.length
        );

    const wrapped =
        (
            direction > 0 &&
            currentLightboxIndex ===
                items.length - 1
        ) ||
        (
            direction < 0 &&
            currentLightboxIndex === 0
        );

    animateLightboxToItem(
        nextIndex,
        direction,
        wrapped
    );
}

searchInput.addEventListener(
    "input",
    filterStudents
);

clearSearch.addEventListener(
    "click",
    () => {
        searchInput.value = "";

        filterStudents();
        searchInput.focus();
    }
);

previousPhoto.addEventListener(
    "click",
    () => {
        navigateGroupSlider(-1);
    }
);

nextPhoto.addEventListener(
    "click",
    () => {
        navigateGroupSlider(1);
    }
);

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

modalPhoto.addEventListener(
    "click",
    () => {
        if (!currentStudent) {
            return;
        }

        const studentIndex =
            currentDisplayedStudents.findIndex(
                (student) =>
                    student.id ===
                    currentStudent.id
            );

        if (studentIndex !== -1) {
            openLightbox(
                "student",
                studentIndex
            );
        }
    }
);

document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            closeStudentModal
        );
    });

groupPhotoButtons.forEach(
    (button, index) => {
        button.addEventListener(
            "click",
            () => {
                openLightbox(
                    "group",
                    index
                );
            }
        );
    }
);

document
    .querySelectorAll(
        "[data-close-lightbox]"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            closeLightbox
        );
    });

lightboxPrevious.addEventListener(
    "click",
    () => {
        navigateLightbox(-1);
    }
);

lightboxNext.addEventListener(
    "click",
    () => {
        navigateLightbox(1);
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (
            lightbox.classList.contains(
                "is-open"
            )
        ) {
            if (
                event.key ===
                "Escape"
            ) {
                closeLightbox();
                return;
            }

            if (
                event.key ===
                "ArrowLeft"
            ) {
                event.preventDefault();

                navigateLightbox(-1);
                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {
                event.preventDefault();

                navigateLightbox(1);
            }

            return;
        }

        if (
            event.key === "Escape" &&
            modal.classList.contains(
                "is-open"
            )
        ) {
            closeStudentModal();
        }
    }
);

async function downloadCurrentImage() {
    if (!currentLightboxImage) {
        return;
    }

    try {
        const response =
            await fetch(
                currentLightboxImage
            );

        if (!response.ok) {
            throw new Error(
                "Image request failed."
            );
        }

        const imageBlob =
            await response.blob();

        const imageUrl =
            URL.createObjectURL(
                imageBlob
            );

        const downloadLink =
            document.createElement("a");

        downloadLink.href =
            imageUrl;

        downloadLink.download =
            getImageFileName(
                currentLightboxImage
            );

        document.body.appendChild(
            downloadLink
        );

        downloadLink.click();
        downloadLink.remove();

        URL.revokeObjectURL(
            imageUrl
        );
    } catch (error) {
        alert(
            "The image could not be downloaded."
        );

        console.error(error);
    }
}

lightboxDownload.addEventListener(
    "click",
    downloadCurrentImage
);

randomSeniorButton.addEventListener(
    "click",
    () => {
        if (
            currentDisplayedStudents.length === 0
        ) {
            return;
        }

        const randomIndex =
            Math.floor(
                Math.random() *
                currentDisplayedStudents.length
            );

        const randomStudent =
            currentDisplayedStudents[randomIndex];

        openStudentModal(randomStudent);
    }
);

const backToTopButton =
    document.getElementById("backToTop");

function updateBackToTopButton() {
    const scrollPosition =
        window.scrollY ||
        document.documentElement.scrollTop;

    const scrollableHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

    const progress =
        scrollableHeight > 0
            ? scrollPosition /
              scrollableHeight
            : 0;

    const safeProgress = Math.min(
        Math.max(progress, 0),
        1
    );

    backToTopButton.style.setProperty(
        "--scroll-progress",
        `${safeProgress * 100}%`
    );

    backToTopButton.classList.toggle(
        "is-visible",
        scrollPosition > 400
    );

    backToTopButton.classList.toggle(
        "is-complete",
        safeProgress >= 0.995
    );
}

window.addEventListener(
    "scroll",
    updateBackToTopButton,
    {
        passive: true
    }
);

window.addEventListener(
    "resize",
    updateBackToTopButton
);

backToTopButton.addEventListener(
    "click",
    () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);

updateBackToTopButton();

renderStudents(students);