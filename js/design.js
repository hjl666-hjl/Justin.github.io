// design.js - Interaction logic for the main design page

// Helper to get scroll container (body)
const getScrollContainer = () => document.body;

// Update Nav on Scroll
const scrollContainer = document.body;
scrollContainer.addEventListener('scroll', function() {
    if (scrollContainer.scrollTop > 50) {
        $('.globalnav').addClass('scrolled');
    } else {
        $('.globalnav').removeClass('scrolled');
    }
});

// Fallback for window scroll (some browsers might still fire this)
window.addEventListener('scroll', function() {
   if (document.documentElement.scrollTop > 50 || document.body.scrollTop > 50) {
       $('.globalnav').addClass('scrolled');
   } else {
       $('.globalnav').removeClass('scrolled');
   }
});

document.addEventListener('DOMContentLoaded', function() {
    // Intersection Observer for Reveal Animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.bento-card, .feature-section').forEach((el) => revealObserver.observe(el));

    // Logic for Revolver Indicator and Active State
    const sections = document.querySelectorAll('.page-section');
    const chambers = document.querySelectorAll('.chamber');
    const wheel = document.querySelector('.revolver-wheel');
    const indicatorContainer = document.querySelector('.scroll-indicator-container');
    let isScrollingTimer;

    // 1. Update Active Chamber based on scroll
    const activeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.getAttribute('data-index');
                if (index !== null) {
                    updateRevolver(index);
                }
            }
        });
    }, { threshold: 0.5 }); // 50% visible to trigger

    sections.forEach(section => activeObserver.observe(section));

    function updateRevolver(index) {
        chambers.forEach(c => c.classList.remove('active'));
        if(chambers[index]) chambers[index].classList.add('active');
        
        // Optional: Rotate wheel effect logic here if needed
    }

    // 2. Expand/Shrink on Scroll (Damping visualization)
    // Listen on body because body is the scroll container now
    document.body.addEventListener('scroll', handleScrollVisuals);
    window.addEventListener('scroll', handleScrollVisuals); // Fallback

    function handleScrollVisuals() {
        if (indicatorContainer) {
            indicatorContainer.classList.add('is-scrolling');
            
            clearTimeout(isScrollingTimer);
            isScrollingTimer = setTimeout(() => {
                indicatorContainer.classList.remove('is-scrolling');
            }, 800); 
        }
    }

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
