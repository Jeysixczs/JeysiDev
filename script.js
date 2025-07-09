document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');

    mobileMenuBtn.addEventListener('click', function () {
        navMenu.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
        this.querySelector('i').classList.toggle('fa-bars');
    });

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            }
        });
    });

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle input');
    const themeLabel = document.querySelector('.theme-label');

    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
        themeLabel.textContent = 'Light Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.checked = false;
        themeLabel.textContent = 'Dark Mode';
    }

    themeToggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeLabel.textContent = 'Light Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeLabel.textContent = 'Dark Mode';
        }
    });

    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top');

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });

    backToTopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Form submission
    const btn = document.getElementById('button');
    
    document.getElementById('form')
        .addEventListener('submit', function (event) {
            event.preventDefault();

            btn.value = 'Sending...';

            const serviceID = 'service_o9c6r3i';
            const templateID = 'template_8m2ef5z';

            emailjs.sendForm(serviceID, templateID, this)
                .then(() => {
                    btn.value = 'Send Email';
                    showAlert('Your message has been sent successfully!', 'success');
                    this.reset();
                }, (err) => {
                    btn.value = 'Send Email';
                    showAlert('There was an error sending your message. Please try again.', 'error')
                });
        });

    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput) {
                const email = emailInput.value.trim();
                if (email) {
                    showAlert(`Subscribed! You'll receive updates on my latest projects at ${email}`, 'success');
                    emailInput.value = '';
                } else {
                    showAlert('Please enter your email to subscribe for project updates', 'error');
                }
            }
        });
    }

    // Animate skill bars when they come into view
    const skillBars = document.querySelectorAll('.skill-level');
    const skillsSection = document.querySelector('.skills-section');

    const animateSkillBars = () => {
        skillBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillBars();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    if (skillsSection) {
        observer.observe(skillsSection);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

function showAlert(message, type = 'info') {
    // Create alert element if it doesn't exist
    let alertEl = document.querySelector('.custom-alert');
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = `custom-alert ${type}`;
        document.body.appendChild(alertEl);
    } else {
        alertEl.className = `custom-alert ${type}`;
    }

    // Set alert content
    alertEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
        <span class="close-alert">&times;</span>
    `;

    // Show alert
    alertEl.classList.add('show');

    // Close button functionality
    alertEl.querySelector('.close-alert').addEventListener('click', () => {
        alertEl.classList.remove('show');
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertEl.classList.contains('show')) {
            alertEl.classList.remove('show');
        }
    }, 5000);
}


function openPdfModal(pdfUrl) {
    document.getElementById('pdfViewer').src = pdfUrl;
    document.getElementById('pdfModal').style.display = 'block';
    document.body.classList.add('modal-open');
    showAlert('PDF viewer opened. Click outside or press ESC to close.', 'info');
}

function closePdfModal() {
    document.getElementById('pdfModal').style.display = 'none';
    document.getElementById('pdfViewer').src = '';
    document.body.classList.remove('modal-open');
}

// Close when clicking outside content
window.onclick = function (event) {
    if (event.target == document.getElementById('pdfModal')) {
        closePdfModal();
    }
}

// Close with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closePdfModal();
    }
});

