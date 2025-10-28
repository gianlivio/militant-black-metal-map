// ================================
// MILITANT BLACK METAL MAP - SCRIPT
// ================================

(function() {
    'use strict';

    // === ELEMENTI DOM ===
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const filterActive = document.getElementById('filterActive');
    const filterCore = document.getElementById('filterCore');
    const filterExternal = document.getElementById('filterExternal');
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');
    const nodes = document.querySelectorAll('.node');
    const memberTags = document.querySelectorAll('.member-tag');

    // === STATE ===
    let activeMember = null;

    // === INIZIALIZZAZIONE ===
    function init() {
        loadTheme();
        loadFilters();
        attachEventListeners();
        updateFilterState();
    }

    // === EVENT LISTENERS ===
    function attachEventListeners() {
        // Ricerca
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        clearSearch.addEventListener('click', clearSearchInput);

        // Filtri
        filterActive.addEventListener('change', handleFilters);
        filterCore.addEventListener('change', handleFilters);
        filterExternal.addEventListener('change', handleFilters);

        // Tema
        themeToggle.addEventListener('click', toggleTheme);

        // Back to top
        window.addEventListener('scroll', handleScroll);
        backToTop.addEventListener('click', scrollToTop);

        // Member tags (highlight progetti)
        memberTags.forEach(tag => {
            tag.addEventListener('click', handleMemberClick);
        });

        // Click fuori per deselezionare
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('member-tag')) {
                clearMemberHighlight();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }

    // === RICERCA ===
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (!query) {
            nodes.forEach(node => {
                node.classList.remove('highlighted');
            });
            updateFilterState(); // Ripristina filtri
            return;
        }

        nodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            const matches = text.includes(query);
            
            if (matches) {
                node.classList.remove('hidden');
                node.classList.add('highlighted');
            } else {
                node.classList.add('hidden');
                node.classList.remove('highlighted');
            }
        });
    }

    function clearSearchInput() {
        searchInput.value = '';
        searchInput.focus();
        handleSearch();
    }

    // === FILTRI ===
    function handleFilters() {
        saveFilters();
        updateFilterState();
    }

    function updateFilterState() {
        const showActive = filterActive.checked;
        const showCore = filterCore.checked;
        const hideExternal = filterExternal.checked;

        nodes.forEach(node => {
            let shouldShow = true;

            // Filtro "solo attivi"
            if (showActive) {
                const isActive = node.dataset.active === 'true';
                if (!isActive) shouldShow = false;
            }

            // Filtro "solo core"
            if (showCore) {
                const isCore = node.classList.contains('core') || node.classList.contains('primary');
                if (!isCore) shouldShow = false;
            }

            // Filtro "nascondi esterni"
            if (hideExternal) {
                const isExternal = node.classList.contains('external');
                if (isExternal) shouldShow = false;
            }

            // Applica visibilità
            if (shouldShow) {
                node.classList.remove('hidden');
            } else {
                node.classList.add('hidden');
            }
        });

        // Se c'è ricerca attiva, rispetta gli highlight
        if (searchInput.value) {
            handleSearch();
        }
    }

    function saveFilters() {
        const filters = {
            active: filterActive.checked,
            core: filterCore.checked,
            external: filterExternal.checked
        };
        localStorage.setItem('bm-map-filters', JSON.stringify(filters));
    }

    function loadFilters() {
        const saved = localStorage.getItem('bm-map-filters');
        if (saved) {
            try {
                const filters = JSON.parse(saved);
                filterActive.checked = filters.active;
                filterCore.checked = filters.core;
                filterExternal.checked = filters.external;
            } catch (e) {
                console.warn('Could not load saved filters');
            }
        }
    }

    // === MEMBER HIGHLIGHT ===
    function handleMemberClick(e) {
        e.stopPropagation();
        const tag = e.currentTarget;
        const member = tag.dataset.member;

        // Se clicco stesso membro, deseleziona
        if (activeMember === member) {
            clearMemberHighlight();
            return;
        }

        // Seleziona nuovo membro
        activeMember = member;
        
        // Rimuovi highlight precedenti
        memberTags.forEach(t => t.classList.remove('active'));
        nodes.forEach(n => n.classList.remove('highlighted'));

        // Aggiungi nuovi highlight
        memberTags.forEach(t => {
            if (t.dataset.member === member) {
                t.classList.add('active');
            }
        });

        // Highlight nodi che contengono questo membro
        nodes.forEach(node => {
            const members = node.dataset.members;
            if (members && members.includes(member)) {
                node.classList.add('highlighted');
                node.classList.remove('hidden');
            } else {
                node.classList.add('hidden');
            }
        });

        // Scroll al primo nodo evidenziato
        const firstHighlighted = document.querySelector('.node.highlighted');
        if (firstHighlighted) {
            firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearMemberHighlight() {
        activeMember = null;
        memberTags.forEach(t => t.classList.remove('active'));
        nodes.forEach(n => n.classList.remove('highlighted'));
        updateFilterState();
    }

    // === TEMA ===
    function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('bm-map-theme', newTheme);
        
        // Animazione bottone
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('bm-map-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }

    // === SCROLL ===
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Mostra/nascondi back to top
        if (scrollTop > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // === KEYBOARD SHORTCUTS ===
    function handleKeyboard(e) {
        // Ctrl/Cmd + K = focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Escape = clear search + deselect member
        if (e.key === 'Escape') {
            if (searchInput.value) {
                clearSearchInput();
            } else if (activeMember) {
                clearMemberHighlight();
            }
        }

        // Ctrl/Cmd + T = toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    }

    // === UTILITIES ===
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // === EASTER EGG: KONAMI CODE ===
    (function() {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiPosition = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key === konamiCode[konamiPosition]) {
                konamiPosition++;
                if (konamiPosition === konamiCode.length) {
                    activateEasterEgg();
                    konamiPosition = 0;
                }
            } else {
                konamiPosition = 0;
            }
        });

        function activateEasterEgg() {
            // Inverte tema
            toggleTheme();
            
            // Animazione nodi
            nodes.forEach((node, index) => {
                setTimeout(() => {
                    node.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        node.style.animation = '';
                    }, 500);
                }, index * 50);
            });

            // Messaggio console
            console.log('%c🗡️ MILITANT BLACK METAL MAP 🗡️', 'font-size: 20px; color: #8b0000; font-weight: bold;');
            console.log('%cKonami Code activated! The dark forces are pleased.', 'font-size: 14px; color: #cc3333;');
        }
    })();

    // === ANALYTICS (opzionale) ===
    function trackEvent(category, action, label) {
        // Placeholder per Google Analytics o Plausible
        // gtag('event', action, { event_category: category, event_label: label });
        console.log(`Event: ${category} - ${action} - ${label}`);
    }

    // === INIT ON DOM READY ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // === CONSOLE WELCOME ===
    console.log('%c🗡️ MILITANT BLACK METAL MAP', 'font-size: 24px; color: #8b0000; font-weight: bold; text-shadow: 2px 2px 4px #000;');
    console.log('%cUnderground Network Genealogy', 'font-size: 12px; color: #666;');
    console.log('%c\nKeyboard shortcuts:', 'font-size: 14px; color: #cc3333; font-weight: bold;');
    console.log('%c  Ctrl/Cmd + K  → Focus search', 'font-size: 12px; color: #888;');
    console.log('%c  Ctrl/Cmd + T  → Toggle theme', 'font-size: 12px; color: #888;');
    console.log('%c  Escape        → Clear search/selection', 'font-size: 12px; color: #888;');
    console.log('%c\nClick on member tags to highlight all their projects!', 'font-size: 12px; color: #888; font-style: italic;');
    console.log('%c\nGitHub: https://github.com/yourusername/militant-black-metal-map', 'font-size: 10px; color: #666;');

})();
