document.addEventListener('DOMContentLoaded', () => {
    // Global Error Handler for non-programmers
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        const errorMsg = `❌ Error: ${msg}\n📂 File: ${url}\n📍 Line: ${lineNo}`;
        console.error('%c' + errorMsg, 'color: red; font-weight: bold; font-size: 14px; background: #ffe6e6; padding: 10px; border: 1px solid red; border-radius: 5px;');
        showUserError(`System Error: ${msg}`);
        return false;
    };

    window.onunhandledrejection = function (event) {
        console.error('%c❌ Unhandled Promise Rejection: ' + event.reason, 'color: red; font-weight: bold; font-size: 14px; background: #ffe6e6; padding: 10px; border: 1px solid red; border-radius: 5px;');
        showUserError(`Data Error: ${event.reason}`);
    };

    function showUserError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background: #ef4444; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
            z-index: 9999; 
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
        `;
        errorDiv.textContent = `⚠️ ${message} (Click to dismiss)`;
        errorDiv.onclick = () => errorDiv.remove();
        document.body.appendChild(errorDiv);

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) errorDiv.remove();
        }, 10000);
    }

    // State
    const state = {
        originalCards: [], // Store original order
        cards: [], // Current working set
        currentIndex: 0,
        isFlipped: false,
        isRandom: false,
        isChoiceRandom: false,
        currentFilename: 'PEC3.json', // Track filename for updates
        selectedAnswerForEdit: null,

        // Test Mode State
        isTestMode: false,
        testModeType: 'recycle', // 'recycle' (default) or 'continuous'
        score: 0,
        answeredCount: 0,
        hasAnsweredCurrent: false // To lock navigation
    };

    // DOM Elements
    const els = {
        navDashboard: document.getElementById('nav-dashboard'),
        navStudy: document.getElementById('nav-study'),
        viewDashboard: document.getElementById('view-dashboard'),
        viewStudy: document.getElementById('view-study'),
        totalCardsCount: document.getElementById('total-cards-count'),
        btnStartStudy: document.getElementById('btn-start-study'),
        btnBack: document.getElementById('btn-back'),
        fileSelect: document.getElementById('file-select'),
        fileListContainer: document.getElementById('file-list-container'), // New
        maxQuestionsInput: document.getElementById('max-questions'), // New
        startIdContainer: document.getElementById('start-id-container'), // New
        startFromIdInput: document.getElementById('start-from-id'), // New
        shuffleToggle: document.getElementById('shuffle-cards-toggle'),
        shuffleChoicesToggle: document.getElementById('shuffle-choices-toggle'),
        mobileToggle: document.getElementById('mobile-mode-toggle'),
        testModeToggle: document.getElementById('test-mode-toggle'), // New

        // Study View
        currentIndex: document.getElementById('current-index'),
        totalIndex: document.getElementById('total-index'),
        scoreContainer: document.getElementById('score-container'), // New
        currentScore: document.getElementById('current-score'), // New
        flashcard: document.getElementById('flashcard'),
        cardQuestion: document.getElementById('card-question'),
        cardOptions: document.getElementById('card-options'),
        cardAnswerText: document.getElementById('card-answer-text'),
        cardAnswerKey: document.getElementById('card-answer-key'),

        // Controls
        controlsContainer: document.querySelector('.controls'), // New
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnFlip: document.getElementById('btn-flip'),
        btnEditAnswer: document.getElementById('btn-edit-answer'), // New

        // Modal Elements
        editModal: document.getElementById('edit-modal'),
        editOptionsList: document.getElementById('edit-options-list'),
        btnCancelEdit: document.getElementById('btn-cancel-edit'),
        btnSaveEdit: document.getElementById('btn-save-edit'),

        // Recycle Modal
        recycleModal: document.getElementById('recycle-modal'),
        btnNoRecycle: document.getElementById('btn-no-recycle'),
        btnYesRecycle: document.getElementById('btn-yes-recycle'),

        // Test Mode Options Modal
        testModeOptionsModal: document.getElementById('test-mode-options-modal'),
        btnModeContinuous: document.getElementById('btn-mode-continuous'),
        btnModeRecycle: document.getElementById('btn-mode-recycle'),
        btnCancelTestMode: document.getElementById('btn-cancel-test-mode')
    };

    // Initialization
    init();

    async function init() {
        try {
            await loadFileList();
            setupEventListeners();
        } catch (error) {
            console.error('Initialization failed:', error);
            showUserError('Init failed: ' + error.message);
        }
    }

    async function loadFileList() {
        try {
            // Static File List for GitHub Pages compatibility
            // Since we can't scan directories with JS in browser, we hardcode the known files.
            const fileNames = ['PEC1.json', 'PEC2.json', 'PEC3.json', 'PEC4.json', 'PEC5.json'];

            els.fileListContainer.innerHTML = '';

            // We'll fetch each file to get its correct count dynamically
            const fileDataPromises = fileNames.map(async (name) => {
                try {
                    const res = await fetch(name);
                    if (!res.ok) return { name, count: '?' };
                    const json = await res.json();
                    return { name, count: json.length };
                } catch (e) {
                    console.error(`Error loading info for ${name}`, e);
                    return { name, count: 'Err' };
                }
            });

            const files = await Promise.all(fileDataPromises);

            if (files.length === 0) {
                els.fileListContainer.innerHTML = '<div class="loading-text">No JSON files found</div>';
                return;
            }

            files.forEach(fileData => {
                const fileName = fileData.name;
                const fileCount = fileData.count;

                const label = document.createElement('label');
                label.className = 'file-checkbox-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = fileName;
                checkbox.dataset.count = fileCount; // Store count
                checkbox.checked = false; // Default select none

                const span = document.createElement('span');
                span.textContent = `${fileName} (${fileCount} cards)`;

                label.appendChild(checkbox);
                label.appendChild(span);
                els.fileListContainer.appendChild(label);
            });

            updateStartButtonState(); // Set initial button state
            updateDashboardGenericStats(); // Update stats based on selection

        } catch (error) {
            console.error('Static list load failed:', error);
            showUserError('Failed to load file list.');
        }
    }

    // Update Dashboard Stats (Total Cards) based on selection
    function updateDashboardGenericStats() {
        const checkedBoxes = els.fileListContainer.querySelectorAll('input[type="checkbox"]:checked');
        let totalCount = 0;
        checkedBoxes.forEach(cb => {
            totalCount += parseInt(cb.dataset.count) || 0;
        });
        els.totalCardsCount.textContent = totalCount;
    }

    function updateStartButtonState() {
        const checkedCount = els.fileListContainer.querySelectorAll('input[type="checkbox"]:checked').length;
        if (checkedCount === 0) {
            els.btnStartStudy.disabled = true;
            els.btnStartStudy.style.opacity = '0.5';
            els.btnStartStudy.style.cursor = 'not-allowed';
            els.btnStartStudy.title = "Please select at least one set to start";
        } else {
            els.btnStartStudy.disabled = false;
            els.btnStartStudy.style.opacity = '1';
            els.btnStartStudy.style.cursor = 'pointer';
            els.btnStartStudy.title = "";
        }

        // Show "Start from ID" only if exactly 1 set is selected
        els.startIdContainer.classList.toggle('hidden', checkedCount !== 1);
        if (checkedCount !== 1) {
            els.startFromIdInput.value = ''; // Clear when hidden
        }

        // Also update stats whenever button state might change (i.e. selection changed)
        updateDashboardGenericStats();
    }

    async function loadData(filename) {
        try {
            els.btnStartStudy.textContent = 'Loading...';
            els.btnStartStudy.disabled = true;

            const response = await fetch(filename);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            state.originalCards = data;
            state.currentFilename = filename; // Update filename tracking

            // Apply Shuffle if toggle is active
            if (state.isRandom) {
                state.cards = shuffleArray([...state.originalCards]);
            } else {
                state.cards = [...state.originalCards];
            }

            state.currentIndex = 0;

            updateDashboard();

            els.btnStartStudy.textContent = 'Start Studying';
            els.btnStartStudy.disabled = false;
        } catch (error) {
            els.btnStartStudy.textContent = 'Error Loading';
            throw error; // Global handler will catch
        }
    }

    async function loadMultipleFiles(filenames, maxCount) {
        try {
            els.btnStartStudy.textContent = 'Loading...';
            els.btnStartStudy.disabled = true;

            const promises = filenames.map(async (filename) => {
                const response = await fetch(filename);
                if (!response.ok) throw new Error(`Failed to load ${filename}`);
                const data = await response.json();
                // Tag each card with source
                return data.map(card => ({ ...card, _sourceFile: filename }));
            });

            const results = await Promise.all(promises);
            let combinedCards = results.flat();

            // Handle "Start from ID" if only 1 file is selected
            const startFromId = parseInt(els.startFromIdInput.value) || 0;
            if (filenames.length === 1 && startFromId > 0) {
                // Find index of first card with ID >= startFromId
                const startIndex = combinedCards.findIndex(card => card.id >= startFromId);
                if (startIndex !== -1) {
                    combinedCards = combinedCards.slice(startIndex);
                } else if (combinedCards.length > 0 && startFromId > combinedCards[combinedCards.length - 1].id) {
                    // If ID is beyond all cards, clear the list
                    combinedCards = [];
                }
            }

            // Do NOT shuffle combined pool by default (User Request)
            // combinedCards = shuffleArray(combinedCards);

            // Limit if maxCount is specified
            if (maxCount && maxCount > 0 && maxCount < combinedCards.length) {
                combinedCards = combinedCards.slice(0, maxCount);
            }

            state.originalCards = combinedCards; // Store this specific session set
            state.currentFilename = filenames[0]; // Fallback for single file edits (though we use _sourceFile now)

            // Apply Random Toggle (if it was already checked, though we just shuffled above)
            // If the user UNCHECKS shuffle, we revert to originalCards, which is the randomized session set.
            // This is slightly different from before where "original" was file order.
            // But for a mixed random set, "original" order IS the random selection order.

            state.cards = [...state.originalCards];
            state.currentIndex = 0;

            updateDashboard();

            els.btnStartStudy.textContent = 'Start Studying';
            els.btnStartStudy.disabled = false;

            // Switch view after loading
            switchView('study');

        } catch (error) {
            console.error('Loader error:', error);
            els.btnStartStudy.textContent = 'Error Loading';
            showUserError('Failed to load sets: ' + error.message);
            els.btnStartStudy.disabled = false;
        }
    }

    // Fisher-Yates Shuffle
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function setupEventListeners() {
        // Start Study Button
        els.btnStartStudy.addEventListener('click', () => {
            const checkboxes = els.fileListContainer.querySelectorAll('input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                // Should be disabled, but double check
                return;
            }

            const filenames = Array.from(checkboxes).map(cb => cb.value);
            const maxCount = parseInt(els.maxQuestionsInput.value) || 0;

            loadMultipleFiles(filenames, maxCount);
        });

        // File Selection Change Listener for Button State
        els.fileListContainer.addEventListener('change', () => {
            updateStartButtonState();
        });

        // Shuffle Toggle
        if (els.shuffleToggle) {
            els.shuffleToggle.addEventListener('change', (e) => {
                state.isRandom = e.target.checked;
                if (state.isRandom) {
                    if (state.isTestMode) {
                        // Mid-test Shuffle: Remove finished cards
                        let startIndex = state.currentIndex;
                        if (state.hasAnsweredCurrent) {
                            startIndex++;
                        }

                        // Take only the remaining cards
                        const remaining = state.cards.slice(startIndex);
                        state.cards = shuffleArray(remaining);
                    } else {
                        state.cards = shuffleArray([...state.originalCards]);
                    }
                } else {
                    state.cards = [...state.originalCards];
                }
                state.currentIndex = 0; // Reset to start
                updateDashboard();
                renderCard(); // Re-render immediately if in study view
            });
        }

        // Shuffle Choices Toggle
        if (els.shuffleChoicesToggle) {
            els.shuffleChoicesToggle.addEventListener('change', (e) => {
                state.isChoiceRandom = e.target.checked;
                renderCard(); // Re-render current card to shuffle/unshuffle options
            });
        }

        // Mobile Mode Toggle
        if (els.mobileToggle) {
            els.mobileToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('mobile-mode');
                } else {
                    document.body.classList.remove('mobile-mode');
                }
            });
        }

        /* --- Test Mode Logic --- */
        /* --- Test Mode Logic --- */
        if (els.testModeToggle) {
            els.testModeToggle.addEventListener('click', (e) => {
                // Prevent default toggling, we want to control it via modal
                e.preventDefault();

                if (state.isTestMode) {
                    // Turn OFF
                    disableTestMode();
                    els.testModeToggle.checked = false;
                } else {
                    // Turn ON -> Show options
                    els.testModeOptionsModal.classList.remove('hidden');
                }
            });
        }

        // Test Mode Options Buttons
        if (els.btnModeContinuous) {
            els.btnModeContinuous.addEventListener('click', () => {
                enableTestMode('continuous');
                els.testModeOptionsModal.classList.add('hidden');
                els.testModeToggle.checked = true;
            });
        }

        if (els.btnModeRecycle) {
            els.btnModeRecycle.addEventListener('click', () => {
                enableTestMode('recycle');
                els.testModeOptionsModal.classList.add('hidden');
                els.testModeToggle.checked = true;
            });
        }

        if (els.btnCancelTestMode) {
            els.btnCancelTestMode.addEventListener('click', () => {
                els.testModeOptionsModal.classList.add('hidden');
                els.testModeToggle.checked = false;
            });
        }

        function enableTestMode(type) {
            state.isTestMode = true;
            state.testModeType = type;
            state.score = 0;
            state.answeredCount = 0;
            els.currentScore.textContent = '0';

            els.scoreContainer.classList.remove('hidden');
            if (els.controlsContainer) els.controlsContainer.classList.add('hidden');

            els.btnFlip.disabled = true;
            els.btnFlip.textContent = 'Flip Disabled in Test Mode';

            state.hasAnsweredCurrent = false;

            // Reset view
            state.isFlipped = false;
            els.flashcard.classList.remove('flipped');
            renderCard();
        }

        function disableTestMode() {
            state.isTestMode = false;
            els.scoreContainer.classList.add('hidden');
            if (els.controlsContainer) els.controlsContainer.classList.remove('hidden');

            els.btnFlip.disabled = false;
            els.btnFlip.textContent = 'Flip Card';
            els.btnNext.disabled = false;
            els.btnPrev.disabled = false;

            state.hasAnsweredCurrent = false;
            renderCard();
        }

        // Recycle Modal Buttons
        if (els.btnNoRecycle) {
            els.btnNoRecycle.addEventListener('click', () => {
                els.recycleModal.classList.add('hidden');
                state.hasAnsweredCurrent = true;
                updateNavigationButtons(); // Unlock Next

                // Auto Advance after 1 second
                setTimeout(() => {
                    if (state.isTestMode && state.cards[state.currentIndex]) {
                        nextCard();
                    }
                }, 1000);
            });
        }

        if (els.btnYesRecycle) {
            els.btnYesRecycle.addEventListener('click', () => {
                recycleCurrentCard();
                els.recycleModal.classList.add('hidden');
                state.hasAnsweredCurrent = true;
                updateNavigationButtons();

                // Auto Advance after 1 second
                setTimeout(() => {
                    if (state.isTestMode && state.cards[state.currentIndex]) {
                        nextCard();
                    }
                }, 1000);
            });
        }

        /* --- Navigation --- */
        els.navDashboard.addEventListener('click', () => switchView('dashboard'));
        els.navStudy.addEventListener('click', () => switchView('study'));
        els.btnStartStudy.addEventListener('click', () => switchView('study'));
        els.btnBack.addEventListener('click', () => switchView('dashboard'));

        // Flashcard interaction
        els.flashcard.addEventListener('click', toggleFlip);
        els.btnFlip.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent double toggling if button is inside card area (it's not, but good practice)
            toggleFlip();
        });

        // Pagination
        els.btnPrev.addEventListener('click', prevCard);
        els.btnNext.addEventListener('click', nextCard);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (els.viewStudy.classList.contains('hidden')) return;
            if (!els.editModal.classList.contains('hidden')) return; // Disable shortcuts if modal is open

            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === ' ' || e.key === 'Enter') toggleFlip();
        });

        /* --- Edit Modal Events --- */
        if (els.btnEditAnswer) {
            els.btnEditAnswer.addEventListener('click', openEditModal);
        }

        if (els.btnCancelEdit) {
            els.btnCancelEdit.addEventListener('click', closeEditModal);
        }

        if (els.editModal) {
            els.editModal.addEventListener('click', (e) => {
                if (e.target === els.editModal) closeEditModal();
            });
        }

        if (els.btnSaveEdit) {
            els.btnSaveEdit.addEventListener('click', saveCorrectAnswer);
        }

        /* --- Mobile Swipe Logic --- */
        let touchStartX = 0;
        let touchEndX = 0;

        // Add listener to the view or container to catch swipes
        const swipeTarget = els.viewStudy;

        swipeTarget.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        swipeTarget.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            // Only active in Mobile Mode
            if (!document.body.classList.contains('mobile-mode')) return;

            // Only active in Study View
            if (els.viewStudy.classList.contains('hidden')) return;

            // Prevent Swipe in Test Mode
            if (state.isTestMode) return;

            const threshold = 50; // Min distance
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > threshold) {
                if (swipeDistance > 0) {
                    // Swiped Right -> Previous Card
                    prevCard();
                } else {
                    // Swiped Left -> Next Card
                    nextCard();
                }
            }
        }
    }

    /* --- Edit Modal Logic --- */
    function openEditModal() {
        const card = state.cards[state.currentIndex];
        if (!card) return;

        state.selectedAnswerForEdit = card.answer; // Default to current answer

        els.editOptionsList.innerHTML = '';

        // Show options in original order (A, B, C...) to avoid confusion
        // We use state.originalCards logic or just the raw options from the current card object
        // NOTE: If Choice Shuffle is ON, card.options is shuffled in render but the object keys remain A, B, C...
        // Wait, Object.entries order might be shuffled. We should sort by key to be safe.
        const sortedOptions = Object.entries(card.options).sort((a, b) => a[0].localeCompare(b[0]));

        sortedOptions.forEach(([key, value]) => {
            const div = document.createElement('div');
            div.className = 'edit-option-item';
            if (key.toLowerCase() === card.answer.toLowerCase()) {
                div.classList.add('selected');
            }
            div.innerHTML = `<strong>${key.toUpperCase()}.</strong> ${value}`;

            div.onclick = () => {
                // Deselect all
                document.querySelectorAll('.edit-option-item').forEach(el => el.classList.remove('selected'));
                // Select clicked
                div.classList.add('selected');
                state.selectedAnswerForEdit = key;
            };

            els.editOptionsList.appendChild(div);
        });

        els.editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        els.editModal.classList.add('hidden');
    }

    async function saveCorrectAnswer() {
        alert("Saving is disabled in this static version (GitHub Pages Demo).");
        return;
    }

    /* --- View Management --- */
    function switchView(viewName) {
        if (viewName === 'dashboard') {
            els.viewDashboard.classList.add('active');
            els.viewDashboard.classList.remove('hidden');
            els.viewStudy.classList.remove('active');
            els.viewStudy.classList.add('hidden');

            els.navDashboard.classList.add('active');
            els.navStudy.classList.remove('active');
        } else if (viewName === 'study') {
            els.viewStudy.classList.add('active');
            els.viewStudy.classList.remove('hidden');
            els.viewDashboard.classList.remove('active');
            els.viewDashboard.classList.add('hidden');

            els.navStudy.classList.add('active');
            els.navDashboard.classList.remove('active');

            renderCard(); // Render current card when entering study mode
        }
    }

    function updateDashboard() {
        els.totalCardsCount.textContent = state.cards.length;
        els.totalIndex.textContent = state.cards.length;
    }

    function recycleCurrentCard() {
        const currentCard = state.cards[state.currentIndex];
        // Create deep copy to avoid reference issues if we modify it later
        const cardCopy = JSON.parse(JSON.stringify(currentCard));
        state.cards.push(cardCopy);

        // Update Total Count Display
        els.totalIndex.textContent = state.cards.length;
    }

    function updateNavigationButtons() {
        els.btnPrev.disabled = state.currentIndex === 0;

        if (state.isTestMode && !state.hasAnsweredCurrent) {
            els.btnNext.disabled = true; // Lock Next until answered
        } else {
            els.btnNext.disabled = state.currentIndex === state.cards.length - 1;
        }

        // Style disabled buttons
        els.btnPrev.style.opacity = els.btnPrev.disabled ? '0.5' : '1';
        els.btnPrev.style.cursor = els.btnPrev.disabled ? 'not-allowed' : 'pointer';

        els.btnNext.style.opacity = els.btnNext.disabled ? '0.5' : '1';
        els.btnNext.style.cursor = els.btnNext.disabled ? 'not-allowed' : 'pointer';
    }

    /* --- Card Logic --- */
    function renderCard() {
        if (state.cards.length === 0) return;

        const card = state.cards[state.currentIndex];

        // Reset Flip
        state.isFlipped = false;
        els.flashcard.classList.remove('flipped');

        // Test Mode: Hide back content initially? 
        // Actually CSS handles the flip check. If we don't flip, they can't see the back.
        // But we disabled the button.

        state.hasAnsweredCurrent = false; // Reset answer state for new card

        // Update Content
        els.cardQuestion.textContent = card.question;
        els.cardAnswerText.textContent = card.correct_answer_text;
        els.cardAnswerKey.textContent = card.answer.toUpperCase();

        // Render Options
        els.cardOptions.innerHTML = '';
        if (card.options) {
            let optionsEntries = Object.entries(card.options);

            if (state.isChoiceRandom) {
                optionsEntries = shuffleArray([...optionsEntries]);
            }

            // To make it less confusing if keys are randomized (e.g. A, C, B, D), 
            // we should probably re-assign the keys (A, B, C, D) to the new order of content 
            // OR just display them as is. 
            // Let's just display them as is for now to avoid breaking "Answer" logic if the answer relies on the key 'a'.
            // If answer is 'a', it refers to the option with key 'a'. 
            // So if we shuffle, we can't re-label 'a' to 'b' or the answer will be wrong.
            // We'll display them in random order but keep their original keys (e.g. "C. Option C", "A. Option A")

            optionsEntries.forEach(([key, value]) => {
                const div = document.createElement('div');
                div.className = 'option-item';
                div.textContent = `${key.toUpperCase()}. ${value}`;

                // Add data attribute
                div.dataset.key = key.toLowerCase();

                // Interactive Answer Check
                div.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card flip

                    if (state.isTestMode && state.hasAnsweredCurrent) return; // Prevent changing answer in Test Mode

                    const isCorrect = key.toLowerCase() === card.answer.toLowerCase();

                    if (isCorrect) {
                        div.classList.add('correct');
                        div.classList.remove('wrong');

                        if (state.isTestMode) {
                            state.score++;
                            state.answeredCount++;
                            els.currentScore.textContent = state.score;
                            state.hasAnsweredCurrent = true;
                            updateNavigationButtons();

                            // Auto Advance after 1 second (User Request)
                            setTimeout(() => {
                                // Check if we are still on the same card and in test mode
                                // To prevent jumping if they manually clicked next or switched view
                                if (state.isTestMode && state.cards[state.currentIndex].id === card.id) {
                                    nextCard();
                                }
                            }, 1000);
                        }
                    } else {
                        div.classList.add('wrong');
                        div.classList.remove('correct');

                        // Highlight the correct one
                        const correctKey = card.answer.toLowerCase();
                        const options = els.cardOptions.querySelectorAll('.option-item');
                        options.forEach(o => {
                            if (o.dataset.key === correctKey) {
                                o.classList.add('correct');
                            }
                        });

                        if (state.isTestMode) {
                            state.answeredCount++;

                            if (state.testModeType === 'recycle') {
                                // Trigger Recycle Modal
                                // Small delay to let them see the red color
                                setTimeout(() => {
                                    els.recycleModal.classList.remove('hidden');
                                }, 500);
                            } else {
                                // CONTINUOUS MODE
                                // Just mark as answered and let them proceed
                                state.hasAnsweredCurrent = true;
                                updateNavigationButtons();

                                // Optional: Auto Advance for continuous flow?
                                setTimeout(() => {
                                    if (state.isTestMode && state.cards[state.currentIndex]) {
                                        nextCard();
                                    }
                                }, 1000);
                            }
                        }
                    }
                });

                els.cardOptions.appendChild(div);
            });
        }

        // Update Progress
        els.currentIndex.textContent = state.currentIndex + 1;
        els.totalIndex.textContent = state.cards.length; // Ensure total is updated (recycle adds cards)

        // Update Buttons State
        updateNavigationButtons();
    }

    function toggleFlip() {
        state.isFlipped = !state.isFlipped;
        if (state.isFlipped) {
            els.flashcard.classList.add('flipped');
        } else {
            els.flashcard.classList.remove('flipped');
        }
    }

    function nextCard() {
        if (state.currentIndex < state.cards.length - 1) {
            state.currentIndex++;
            renderCard();
        }
    }

    function prevCard() {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            renderCard();
        }
    }
});
