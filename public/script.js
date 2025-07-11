document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-times');
                icon.classList.toggle('fa-bars');
            }
        });

        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('li a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
        });
    }

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle input[type="checkbox"]');
    const themeLabel = document.querySelector('.theme-label');

    if (themeToggle && themeLabel) {
        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        setTheme(savedTheme);

        themeToggle.addEventListener('change', function () {
            setTheme(this.checked ? 'dark' : 'light');
        });

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            themeToggle.checked = (theme === 'dark');
            themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            localStorage.setItem('theme', theme);
        }
    }

    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
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
    }

    // Contact form validation and email sending
    const btn = document.getElementById('button');
    const form = document.getElementById('form');
    if (form && btn) {
        Array.from(form.elements).forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.addEventListener('input', () => {
                    removeCustomValidationMsg(form, el);
                    el.classList.remove('input-error');
                });
            }
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            removeAllCustomValidationMsgs(form);

            const nameInput = form.querySelector('#name');
            const emailInput = form.querySelector('#email');
            const messageInput = form.querySelector('#message');

            let valid = true;

            // Name validation
            if (!nameInput || !nameInput.value.trim()) {
                showCustomValidationMsg(nameInput, "Name is required.");
                valid = false;
            } else if (nameInput.value.trim().length < 2) {
                showCustomValidationMsg(nameInput, "Name must be at least 2 characters.");
                valid = false;
            }

            // Email validation
            if (!emailInput || !emailInput.value.trim()) {
                showCustomValidationMsg(emailInput, "Email is required.");
                valid = false;
            } else if (!validateEmail(emailInput.value.trim())) {
                showCustomValidationMsg(emailInput, "Please enter a valid email address.");
                valid = false;
            }

            // Message validation
            if (!messageInput || !messageInput.value.trim()) {
                showCustomValidationMsg(messageInput, "Message is required.");
                valid = false;
            } else if (messageInput.value.trim().length < 10) {
                showCustomValidationMsg(messageInput, "Message must be at least 10 characters.");
                valid = false;
            }

            if (!valid) return;

            btn.value = 'Sending...';

            const serviceID = 'service_o9c6r3i';
            const templateID = 'template_8m2ef5z';

            if (typeof emailjs !== 'undefined') {
                emailjs.sendForm(serviceID, templateID, this)
                    .then(() => {
                        btn.value = 'Send Email';
                        showAlert('Your message has been sent successfully!', 'success');
                        this.reset();
                        removeAllCustomValidationMsgs(form);
                    }, () => {
                        btn.value = 'Send Email';
                        showAlert('There was an error sending your message. Please try again.', 'error');
                    });
            } else {
                btn.value = 'Send Email';
                showAlert('EmailJS is not loaded. Unable to send your message.', 'error');
            }
        });
    }

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
    if (skillBars.length && skillsSection) {
        const animateSkillBars = () => {
            skillBars.forEach(bar => {
                const width = bar.getAttribute('data-width') || bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        };

        const observer = new IntersectionObserver((entries, observerRef) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observerRef.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(skillsSection);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        
        anchor.addEventListener('click', function (e) {
            event.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// Alert message
function showAlert(message, type = 'info') {
    let alertEl = document.querySelector('.custom-alert');
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = `custom-alert ${type}`;
        document.body.appendChild(alertEl);
    } else {
        alertEl.className = `custom-alert ${type}`;
    }

    alertEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
        <span class="close-alert" style="cursor:pointer;">&times;</span>
    `;

    alertEl.classList.add('show');

    const closeBtn = alertEl.querySelector('.close-alert');
    if (closeBtn) {
        closeBtn.onclick = () => alertEl.classList.remove('show');
    }

    setTimeout(() => {
        if (alertEl.classList.contains('show')) {
            alertEl.classList.remove('show');
        }
    }, 5000);
}

// Show validation under specific input
function showCustomValidationMsg(input, msg) {
    if (!input) return;
    removeCustomValidationMsg(input.form, input);

    const div = document.createElement('div');
    div.className = 'custom-validation-msg';
    div.setAttribute('role', 'alert');
    div.setAttribute('aria-live', 'assertive');
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;

    input.classList.add('input-error');

    if (input.parentNode) {
        if (input.nextElementSibling && input.nextElementSibling.tagName.toLowerCase() === 'label') {
            input.parentNode.insertBefore(div, input.nextElementSibling.nextSibling);
        } else {
            input.parentNode.insertBefore(div, input.nextSibling);
        }
    }
}

function removeCustomValidationMsg(form, input) {
    if (!form || !input) return;
    const group = input.parentNode;
    if (!group) return;
    const msgs = group.querySelectorAll('.custom-validation-msg');
    msgs.forEach(m => m.remove());
    input.classList.remove('input-error');
}

function removeAllCustomValidationMsgs(form) {
    if (!form) return;
    form.querySelectorAll('.custom-validation-msg').forEach(msg => msg.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// PDF Modal Handling
function openPdfModal(pdfUrl) {
    
    const pdfViewer = document.getElementById('pdfViewer');
    const pdfModal = document.getElementById('pdfModal');
    if (pdfViewer && pdfModal) {
        pdfViewer.src = pdfUrl;
        pdfModal.style.display = 'block';
        document.body.classList.add('modal-open');
        showAlert('PDF viewer opened. Click outside or press ESC to close.', 'info');
    }
}


function closePdfModal() {
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    if (pdfModal && pdfViewer) {
        pdfModal.style.display = 'none';
        pdfViewer.src = '';
        document.body.classList.remove('modal-open');
    }
}

// Close PDF modal on click outside or ESC
window.addEventListener('click', function (event) {
    const pdfModal = document.getElementById('pdfModal');
    if (pdfModal && event.target === pdfModal) {
        closePdfModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closePdfModal();
    }
});

// Email validation
function validateEmail(email) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/.test(email);
}

function openCertificateModal(fileUrl) {
    const certificateViewer = document.getElementById('certificateViewer');
    const certificateModal = document.getElementById('certificateModal');
    if (!certificateViewer || !certificateModal) return;

    // Clear previous content
    certificateViewer.innerHTML = '';

    // Check file extension
    const ext = fileUrl.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
        // It's an image
        const img = document.createElement('img');
        img.src = fileUrl;
        img.alt = "Certificate Image";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "70vh";
        img.style.display = "block";
        img.style.margin = "0 auto";
        certificateViewer.appendChild(img);
    } else if (ext === 'pdf') {
        // It's a PDF
        const iframe = document.createElement('iframe');
        iframe.src = fileUrl;
        iframe.frameBorder = "0";
        iframe.style.width = "100%";
        iframe.style.height = "70vh";
        certificateViewer.appendChild(iframe);
    } else {
        // Unknown file type
        certificateViewer.innerHTML = "<p>Unsupported file format.</p>";
    }

    certificateModal.style.display = 'block';
    document.body.classList.add('modal-open');
    // Optionally, use your showAlert if needed:
    // showAlert('Certificate viewer opened. Click outside or press ESC to close.', 'info');
}

function closeCertificateModal() {
    const certificateModal = document.getElementById('certificateModal');
    const certificateViewer = document.getElementById('certificateViewer');
    if (certificateModal && certificateViewer) {
        certificateModal.style.display = 'none';
        certificateViewer.innerHTML = '';
        document.body.classList.remove('modal-open');
    }
}

// Close certificate modal on click outside or ESC
window.addEventListener('click', function (event) {
    const certificateModal = document.getElementById('certificateModal');
    if (certificateModal && event.target === certificateModal) {
        closeCertificateModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeCertificateModal();
    }
});
