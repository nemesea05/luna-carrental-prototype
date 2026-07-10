// Mobile menu toggle
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

// Header shrink on scroll
const header = document.getElementById('siteHeader');

if(header){
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
}

// Scroll reveal animations
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

// Hero "Book Now" scrolls to the booking widget and focuses the first field
const openBooking = document.getElementById('openBooking');
const bookingSection = document.getElementById('booking');
const pickupLocationInput = document.getElementById('pickupLocation');

if(openBooking && bookingSection){
    openBooking.addEventListener('click', () => {
        bookingSection.scrollIntoView({ behavior:'smooth', block:'center' });
        setTimeout(() => pickupLocationInput && pickupLocationInput.focus(), 500);
    });
}

// ===================== Booking widget =====================

const bookingForm = document.getElementById('bookingForm');

if(bookingForm){

    const sameLocation = document.getElementById('sameLocation');
    const dropoffGroup = document.getElementById('dropoffGroup');
    const dropoffLocationInput = document.getElementById('dropoffLocation');

    const pickupDate = document.getElementById('pickupDate');
    const pickupTime = document.getElementById('pickupTime');
    const dropoffDate = document.getElementById('dropoffDate');
    const dropoffTime = document.getElementById('dropoffTime');

    const bookingError = document.getElementById('bookingError');
    const bookingSuccess = document.getElementById('bookingSuccess');
    const bookingReset = document.getElementById('bookingReset');
    const bookingCard = document.querySelector('.booking-card');

    // Build half-hour time options (24hr display, matches date-input style)
    const buildTimeOptions = (select, defaultValue) => {
        select.innerHTML = '';
        for(let h = 6; h <= 22; h++){
            for(let m of [0, 30]){
                if(h === 22 && m === 30) continue;
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                const value = `${hh}:${mm}`;
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = value;
                if(value === defaultValue) opt.selected = true;
                select.appendChild(opt);
            }
        }
    };

    buildTimeOptions(pickupTime, '13:00');
    buildTimeOptions(dropoffTime, '13:00');

    // Default dates: today for pick-up, tomorrow for drop-off
    const toInputDate = (d) => d.toISOString().split('T')[0];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    pickupDate.value = toInputDate(today);
    dropoffDate.value = toInputDate(tomorrow);
    pickupDate.min = toInputDate(today);
    dropoffDate.min = toInputDate(today);

    pickupDate.addEventListener('change', () => {
        dropoffDate.min = pickupDate.value;
        if(dropoffDate.value < pickupDate.value){
            dropoffDate.value = pickupDate.value;
        }
    });

    // Toggle drop-off location field
    const syncLocationField = () => {
        if(sameLocation.checked){
            dropoffGroup.classList.add('is-hidden');
            dropoffLocationInput.required = false;
        }else{
            dropoffGroup.classList.remove('is-hidden');
            dropoffLocationInput.required = true;
        }
    };

    sameLocation.addEventListener('change', syncLocationField);
    syncLocationField();

    // Submit handling
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        bookingError.classList.remove('show');

        const pickup = new Date(`${pickupDate.value}T${pickupTime.value}`);
        const dropoff = new Date(`${dropoffDate.value}T${dropoffTime.value}`);

        if(!bookingForm.checkValidity()){
            bookingForm.reportValidity();
            return;
        }

        if(dropoff <= pickup){
            bookingError.classList.add('show');
            return;
        }

        bookingCard.classList.add('is-locked');
        bookingSuccess.classList.add('show');
    });

    bookingReset.addEventListener('click', () => {
        bookingCard.classList.remove('is-locked');
        bookingSuccess.classList.remove('show');
        bookingError.classList.remove('show');
    });

}

// ===================== Fleet -> booking widget =====================

const vehicleButtons = document.querySelectorAll('.vehicle-btn');
const vehiclePill = document.getElementById('vehiclePill');
const vehiclePillText = document.getElementById('vehiclePillText');
const vehiclePillClear = document.getElementById('vehiclePillClear');

vehicleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const name = btn.dataset.vehicle;
        if(vehiclePillText) vehiclePillText.textContent = name;
        if(vehiclePill) vehiclePill.classList.add('show');

        if(bookingSection){
            bookingSection.scrollIntoView({ behavior:'smooth', block:'center' });
            setTimeout(() => pickupLocationInput && pickupLocationInput.focus(), 500);
        }
    });
});

if(vehiclePillClear){
    vehiclePillClear.addEventListener('click', () => {
        vehiclePill.classList.remove('show');
    });
}

// ===================== FAQ accordion =====================

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