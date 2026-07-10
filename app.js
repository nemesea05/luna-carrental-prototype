// ==========================================
// 1. Mobile menu toggle
// ==========================================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if(menuToggle && navLinks){
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        });
    });
}

// ==========================================
// 2. Scroll reveal animations
// ==========================================
const revealEls = document.querySelectorAll('.reveal');
if(revealEls.length){
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
}

// ==========================================
// 3. Dynamic Sticky Booking Bar & Secondary Nav
// ==========================================
const header = document.getElementById('siteHeader');
const bookingWrapper = document.getElementById('bookingWrapper');
const bookingCard = document.getElementById('bookingCard');
const secondaryNav = document.getElementById('secondaryNav');
const fleetSection = document.getElementById('fleet');

// Store dynamic offsets
let stickyOffset = 0;
let fleetOffset = 0;

function calculateOffsets() {
    if(!bookingWrapper || !fleetSection) return;
    // Calculate the absolute top position of elements relative to the document
    const scrollPos = window.scrollY || window.pageYOffset;
    stickyOffset = bookingWrapper.getBoundingClientRect().top + scrollPos - 20; 
    fleetOffset = fleetSection.getBoundingClientRect().top + scrollPos - 150; // offset for the sticky header heights
}

// Run once immediately so offsets are correct even if the user scrolls
// before all assets (images/fonts) finish loading, then refine on load/resize.
calculateOffsets();
window.addEventListener('load', calculateOffsets);
window.addEventListener('resize', calculateOffsets);

window.addEventListener('scroll', () => {
    // If we are in results view, the bar is permanently sticky via CSS
    if (document.body.classList.contains('show-results')) return;

    const scrollY = window.scrollY;

    // 1. Hide main header and make Booking card sticky
    if (scrollY >= stickyOffset) {
        document.body.classList.add('header-hidden');
        bookingCard.classList.add('is-sticky');
    } else {
        document.body.classList.remove('header-hidden');
        bookingCard.classList.remove('is-sticky');
    }

    // 2. Show Secondary Nav when hitting Fleet section
    if (scrollY >= fleetOffset && scrollY >= stickyOffset) {
        secondaryNav.classList.add('is-visible');
    } else {
        secondaryNav.classList.remove('is-visible');
    }
    
    // 3. ScrollSpy for Secondary Nav
    handleScrollSpy();
}, { passive: true });

// ==========================================
// 4. ScrollSpy Logic for Secondary Nav
// ==========================================
const sections = [
    { id: 'fleet', link: 'link-fleet' },
    { id: 'testimonials', link: 'link-testimonials' },
    { id: 'faq', link: 'link-faq' },
    { id: 'how-it-works', link: 'link-how-it-works' }
];

function handleScrollSpy() {
    let currentId = '';
    const scrollY = window.scrollY + 160; // offset account for sticky elements

    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
            const elTop = el.offsetTop;
            const elHeight = el.offsetHeight;
            if (scrollY >= elTop && scrollY < elTop + elHeight) {
                currentId = sec.id;
            }
        }
    });

    if (currentId) {
        document.querySelectorAll('.sec-nav-item').forEach(a => a.classList.remove('active'));
        const activeLink = document.getElementById(`link-${currentId}`);
        if(activeLink) activeLink.classList.add('active');
    }
}

// Smooth scrolling for secondary links to offset sticky bars
document.querySelectorAll('.scroll-link, .sec-nav-item').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            window.scrollTo({
                top: targetSection.offsetTop - 120, // Offset for sticky headers
                behavior: 'smooth'
            });
        }
    });
});

// ==========================================
// 5. Booking Widget Time Gen & Toggle
// ==========================================
const pickupTime = document.getElementById('pickupTime');
const dropoffTime = document.getElementById('dropoffTime');
const pickupDate = document.getElementById('pickupDate');
const dropoffDate = document.getElementById('dropoffDate');
const pickupGroup = document.getElementById('pickupGroup');
const pickupLocation = document.getElementById('pickupLocation');
const rtButtons = document.querySelectorAll('.rt-option');

const driverProvidedMessage = document.getElementById('driverProvidedMessage');
const selfDriveOptions = document.getElementById('selfDriveOptions');

const to12Hour = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if(hour12 === 0) hour12 = 12;
    const mm = String(m).padStart(2, '0');
    return `${hour12}:${mm} ${period}`;
};

const buildTimeOptions = (select, defaultValue) => {
    if(!select) return;
    select.innerHTML = '';
    for(let h = 6; h <= 23; h++){
        for(let m of [0, 30]){
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            const value = `${hh}:${mm}`; // kept in 24h format internally for easy sorting/processing
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = to12Hour(h, m); // displayed as 12h e.g. "11:00 PM"
            if(value === defaultValue) opt.selected = true;
            select.appendChild(opt);
        }
    }
};

buildTimeOptions(pickupTime, '10:00');
buildTimeOptions(dropoffTime, '10:00');

// Dates setup
const toInputDate = (d) => d.toISOString().split('T')[0];
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 3); // default 3 days as per reference

if(pickupDate && dropoffDate) {
    pickupDate.value = toInputDate(today);
    dropoffDate.value = toInputDate(tomorrow);
    pickupDate.min = toInputDate(today);
    
    pickupDate.addEventListener('change', () => {
        dropoffDate.min = pickupDate.value;
        if(dropoffDate.value < pickupDate.value){
            dropoffDate.value = pickupDate.value;
        }
    });
}

// ==========================================
// 5b. Rental Type Toggle: "Rent a Car" vs "Rent a Car with Driver"
// Self-drive rentals never ask for pick-up location in this design.
// ==========================================
function setRentalType(type){
    const isDriver = type === 'driver';

    rtButtons.forEach(btn => {
        const active = btn.dataset.type === type;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if(isDriver){
        pickupGroup.classList.remove('is-hidden');
        pickupLocation.required = true;
        driverProvidedMessage.classList.remove('is-hidden');
        selfDriveOptions.classList.add('is-hidden');
    } else {
        pickupGroup.classList.add('is-hidden');
        pickupLocation.required = false;
        pickupLocation.value = '';
        driverProvidedMessage.classList.add('is-hidden');
        selfDriveOptions.classList.remove('is-hidden');
    }

    calculateOffsets();
}

if(rtButtons.length){
    rtButtons.forEach(btn => {
        btn.addEventListener('click', () => setRentalType(btn.dataset.type));
    });
    setRentalType('self'); // default: self-drive, no location needed
}

// ==========================================
// 6. Search Submit -> Show Results Interface
// ==========================================
const mainSearchForm = document.getElementById('mainSearchForm');
const searchResultsView = document.getElementById('searchResultsView');

if(mainSearchForm) {
    mainSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if(!mainSearchForm.checkValidity()){
            mainSearchForm.reportValidity();
            return;
        }
        
        // Clear any leftover scroll-triggered sticky state from the landing page.
        bookingCard.classList.remove('is-sticky');
        document.body.classList.remove('header-hidden');
        secondaryNav.classList.remove('is-visible');

        // Transition to Results Page Interface
        document.body.classList.add('show-results');
        searchResultsView.style.display = 'block';
        
        // Scroll back to top to view layout properly
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
}

// Logo click returns to the landing view from search results
document.querySelectorAll('.clickable-logo').forEach(logo => {
    logo.addEventListener('click', () => {
        if(!document.body.classList.contains('show-results')) return;
        document.body.classList.remove('show-results');
        searchResultsView.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'instant' });
        calculateOffsets();
    });
});

// Triggers from the fleet section to also open results
document.querySelectorAll('.select-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
        // Mock a location value so form is valid
        document.getElementById('pickupLocation').value = "Quezon City Branch";
        mainSearchForm.dispatchEvent(new Event('submit'));
    });
});

// ==========================================
// 7. FAQ accordion
// ==========================================
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(other => {
            other.classList.remove('open');
            other.querySelector('.faq-answer').style.maxHeight = null;
        });

        if(!isOpen){
            item.classList.add('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
});