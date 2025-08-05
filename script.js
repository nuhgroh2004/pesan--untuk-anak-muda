class EncryptedMessage {
    constructor() {
        this.charTable = [
            "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", "~",
            ".", "/", ":", ";", "<", "=", ">", "?", "[", "\\", "]", "_", "{", "}",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
            "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï",
            "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù",
            "ÿ", "Ö", "Ü", "¢", "£", "¥", "ƒ", "á", "í", "ó", "ú", "ñ",
            "Ñ", "ª", "º", "¿", "¬", "½", "¼", "¡", "«", "»", "α", "ß",
            "Γ", "π", "Σ", "σ", "µ", "τ", "Φ", "Θ", "Ω", "δ", "φ", "ε",
            "±", "÷", "°", "·", "²", "¶", "⌐", "₧", "▒", "▓",
            "│", "┤", "╡", "╢", "╖", "╕", "╣", "║", "╗", "╝", "╜", "╛",
            "┐", "└", "┴", "┬", "├", "─", "┼", "╞", "╟", "╚", "╔", "╩",
            "╦", "╠", "═", "╬", "╧", "╨", "╤", "╥", "╙", "╘", "╒", "╓",
            "╫", "╪", "┘", "┌", "█", "▄", "▌", "▐", "▀"
        ];
        
        this.menuElement = null;
        this.scrollIndicator = null;
        this.originalText = '';
        this.messageText = '';
        this.artText = '';
        this.encryptedDisplayText = '';
        this.promptText = '\n\nHit Enter To Decrypt...';
        this.isDecrypting = false;
        this.intervals = [];
        
        // Audio elements
        this.backgroundMusic = null;
        
        this.init();
        this.handleResize = this.handleResize.bind(this);
        this.preventScroll = this.preventScroll.bind(this);
    }

    handleResize() {
        const mobileEnterBtn = document.getElementById('mobileEnterBtn');
        if (mobileEnterBtn && !this.isDecrypting) {
            if (window.innerWidth <= 768) {
                // Only show if we're in the prompt phase and not decrypting
                if (this.encryptedDisplayText && !mobileEnterBtn.classList.contains('hidden')) {
                    mobileEnterBtn.classList.remove('hidden');
                }
            } else {
                mobileEnterBtn.classList.add('hidden');
            }
        }
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.menuElement = document.getElementById('menu');
        this.scrollIndicator = document.getElementById('scrollIndicator');
        const menuNormalElement = document.getElementById('menuNormal');
        
        if (!this.menuElement || !menuNormalElement) {
            console.error('Required elements not found');
            return;
        }
        
        this.originalText = menuNormalElement.textContent.trim();
        this.separateMessageAndArt();
        this.setupScrollManagement();
        this.setupAudio();
        
        // Add resize event listener
        window.addEventListener('resize', this.handleResize);
        
        // Setup horizontal scroll hint (disabled on mobile ≤768px)
        this.setupHorizontalScrollHint();
        
        // Show intro message first, then start terminal
        this.showIntroMessage();
    }

    setupHorizontalScrollHint() {
        // Disable horizontal scroll hint ONLY for mobile devices (≤768px)
        if (window.innerWidth <= 768) {
            return;
        }
        
        const handleScroll = (element) => {
            const scrollHandler = () => {
                if (element.scrollLeft > 0) {
                    const style = document.createElement('style');
                    style.textContent = `
                        #menu::before, #menuNormal::before {
                            display: none !important;
                        }
                    `;
                    document.head.appendChild(style);
                    element.removeEventListener('scroll', scrollHandler);
                }
            };
            element.addEventListener('scroll', scrollHandler);
        };

        // Apply to both menu elements
        const menuElement = document.getElementById('menu');
        const menuNormalElement = document.getElementById('menuNormal');
        
        if (menuElement) handleScroll(menuElement);
        if (menuNormalElement) handleScroll(menuNormalElement);
    }

    setupScrollManagement() {
        this.checkContentOverflow();
        
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
        
        window.addEventListener('resize', () => {
            this.checkContentOverflow();
        });
        
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardScroll(event);
        });
        
        // Disable scroll on mobile devices with minimal scroll allowed
        if (window.innerWidth <= 768) {
            this.disableMobileScroll();
        }
    }

    checkContentOverflow() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (documentHeight > windowHeight) {
            document.body.classList.add('show-scroll-indicator');
        } else {
            document.body.classList.remove('show-scroll-indicator');
        }
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollTop + windowHeight >= documentHeight - 50) {
            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = '0';
            }
        } else {
            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = '0.8';
            }
        }
    }

    handleKeyboardScroll(event) {
        if (this.isDecrypting || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Disable keyboard scroll on mobile
        if (window.innerWidth <= 768) {
            return;
        }

        const scrollAmount = 100;
        
        switch(event.key) {
            case 'ArrowDown':
                event.preventDefault();
                window.scrollBy(0, scrollAmount);
                break;
            case 'ArrowUp':
                event.preventDefault();
                window.scrollBy(0, -scrollAmount);
                break;
            case 'PageDown':
                event.preventDefault();
                window.scrollBy(0, window.innerHeight * 0.8);
                break;
            case 'PageUp':
                event.preventDefault();
                window.scrollBy(0, -window.innerHeight * 0.8);
                break;
            case 'Home':
                event.preventDefault();
                window.scrollTo(0, 0);
                break;
            case 'End':
                event.preventDefault();
                window.scrollTo(0, document.documentElement.scrollHeight);
                break;
        }
    }

    disableMobileScroll() {
        // Allow minimal scroll for refresh but prevent excessive scrolling
        if (window.innerWidth <= 768) {
            // Store the handler for later removal
            this.preventScrollHandler = (e) => {
                // Allow minimal scroll but prevent large scroll movements
                if (Math.abs(e.touches[0].clientY - (e.touches[0].startY || e.touches[0].clientY)) > 50) {
                    e.preventDefault();
                }
            };
            
            document.addEventListener('touchmove', this.preventScrollHandler, { passive: false });
            document.addEventListener('wheel', this.preventScroll, { passive: false });
        }
    }

    showIntroMessage() {
        const introMessage = document.getElementById('introMessage');
        const lihatPesanBtn = document.getElementById('lihatPesanBtn');
        
        if (introMessage && lihatPesanBtn) {
            // Add click event to "Lihat Pesan" button
            lihatPesanBtn.addEventListener('click', () => {
                // Start background music when user clicks the button
                this.startBackgroundMusicOnUserAction();
                
                introMessage.style.opacity = '0';
                setTimeout(() => {
                    introMessage.style.display = 'none';
                    this.displayTerminal();
                }, 500);
            });
        } else {
            // Fallback if elements not found
            setTimeout(() => this.displayTerminal(), 2000);
        }
    }

    startBackgroundMusicOnUserAction() {
        // This function ensures background music starts on user interaction
        if (this.backgroundMusic) {
            this.backgroundMusic.currentTime = 0; // Reset to start
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Background music started successfully on user interaction');
                    })
                    .catch((error) => {
                        console.log('Error starting background music:', error);
                    });
            }
        }
    }

    showLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    }

    setupAudio() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        
        if (this.backgroundMusic) {
            // Set volume to 50% lower (0.5)
            this.backgroundMusic.volume = 0.5;
            
            // Try to play background music when page loads
            // Modern browsers require user interaction first
            this.playBackgroundMusic();
        }
    }

    playBackgroundMusic() {
        // Don't try to autoplay anymore, wait for user interaction
        // Background music will be triggered by "LIHAT PESAN" button click
        if (this.backgroundMusic) {
            console.log('Background music ready, waiting for user interaction');
        }
    }

    stopAllMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
    }

    preventScroll(e) {
        // Only prevent scroll on mobile devices, but allow button interactions
        if (window.innerWidth <= 768) {
            // Allow interactions with mobile enter button
            if (e.target && e.target.classList.contains('mobile-enter-btn')) {
                return; // Don't prevent button clicks
            }
            
            // Prevent scroll events but not button clicks
            if (e.type === 'touchmove' || e.type === 'wheel') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    separateMessageAndArt() {
        const lines = this.originalText.split('\n');
        const artStartIndex = lines.findIndex(line => line.includes('⠀'));
        
        if (artStartIndex !== -1) {
            this.messageText = lines.slice(0, artStartIndex).join('\n').trim();
            this.artText = lines.slice(artStartIndex).join('\n');
        } else {
            this.messageText = this.originalText;
            this.artText = '';
        }
    }

    getRandomChar() {
        return this.charTable[Math.floor(Math.random() * this.charTable.length)];
    }

    encryptText(text) {
        return text.split('').map(char => {
            if (char === ' ' || char === '\n') {
                return char;
            } else if (char === '⠀' || char.match(/^[\u2800-\u28FF]$/)) {
                return this.getRandomChar();
            } else {
                return this.getRandomChar();
            }
        }).join('');
    }

    showMenu() {
        if (this.menuElement) {
            this.menuElement.classList.remove('hidden');
            this.menuElement.classList.add('visible');
            setTimeout(() => this.checkContentOverflow(), 100);
        }
    }

    hideMenu() {
        if (this.menuElement) {
            this.menuElement.classList.add('hidden');
            this.menuElement.classList.remove('visible');
        }
    }

    displayCharacter(menuText, currentIndex = 0, decryptedText = '') {
        if (currentIndex >= menuText.length) {
            this.showDecryptPrompt(decryptedText);
            return;
        }

        this.menuElement.innerHTML = decryptedText + '<span class="cursor"></span>';
        decryptedText += menuText[currentIndex];
        currentIndex++;

        if (currentIndex % 50 === 0) {
            this.autoScrollIfNeeded();
        }

        setTimeout(() => {
            this.displayCharacter(menuText, currentIndex, decryptedText);
        }, 10);
    }

    autoScrollIfNeeded() {
        // Disable auto scroll ONLY for mobile devices (≤768px)
        if (window.innerWidth <= 768) {
            return;
        }
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop + windowHeight >= documentHeight - 200) {
            window.scrollTo({
                top: documentHeight,
                behavior: 'smooth'
            });
        }
    }

    showDecryptPrompt(encryptedText) {
        this.encryptedDisplayText = encryptedText;
        const promptIndex = 0;
        this.typePrompt(encryptedText, this.promptText, promptIndex);
    }

    typePrompt(baseText, promptText, currentIndex) {
        if (currentIndex >= promptText.length) {
            this.menuElement.innerHTML = baseText + promptText + '<span class="cursor"></span>';
            this.setupDecryptionListener();
            return;
        }

        const currentPrompt = promptText.substring(0, currentIndex + 1);
        this.menuElement.innerHTML = baseText + currentPrompt + '<span class="cursor"></span>';
        
        // Check if we need to show mobile button when prompt is nearly complete
        if (currentIndex === promptText.length - 1 && window.innerWidth <= 768) {
            // No need for special scrolling anymore - button appears naturally after text
        }
        
        setTimeout(() => {
            this.typePrompt(baseText, promptText, currentIndex + 1);
        }, 50);
    }

    setupDecryptionListener() {
        const mobileEnterBtn = document.getElementById('mobileEnterBtn');
        
        const handleDecryption = () => {
            if (!this.isDecrypting) {
                this.isDecrypting = true;
                this.showLoading(); // Show loading indicator
                this.menuElement.textContent = this.encryptedDisplayText;
                this.randomizeText();
                document.removeEventListener('keydown', handleKeyDown);
                if (mobileEnterBtn) {
                    mobileEnterBtn.removeEventListener('click', handleDecryption);
                    mobileEnterBtn.classList.add('hidden');
                }
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                handleDecryption();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Show mobile button and add click listener on mobile devices
        if (mobileEnterBtn && window.innerWidth <= 768) {
            mobileEnterBtn.classList.remove('hidden');
            mobileEnterBtn.addEventListener('click', handleDecryption);
        }
    }

    randomizeText() {
        let randomizeCount = 0;
        const maxRandomizations = 100; // Back to original value
        
        const randomizeInterval = setInterval(() => {
            if (randomizeCount >= maxRandomizations) {
                clearInterval(randomizeInterval);
                this.startDecryption();
                return;
            }
            
            this.menuElement.textContent = this.encryptText(this.originalText);
            randomizeCount++;
        }, 10); // Back to original 10ms

        this.intervals.push(randomizeInterval);

        setTimeout(() => {
            clearInterval(randomizeInterval);
            this.startDecryption();
        }, 1000); // Back to original 1000ms
    }

    startDecryption() {
        let isArtRevealed = false;
        
        const decryptChar = () => {
            const currentText = this.menuElement.textContent;
            
            if (currentText === this.originalText) {
                this.hideLoading(); // Hide loading when decryption is complete
                this.scrollToShowCompleteContent();
                // Start motivation text animation after decryption is complete
                setTimeout(() => {
                    this.showMotivationText();
                }, 1000);
                return;
            }

            const mismatchedIndices = [];
            
            if (!isArtRevealed) {
                for (let i = 0; i < this.messageText.length; i++) {
                    if (currentText[i] !== this.originalText[i]) {
                        mismatchedIndices.push(i);
                    }
                }
                
                if (mismatchedIndices.length === 0) {
                    isArtRevealed = true;
                }
            } else {
                for (let i = this.messageText.length; i < this.originalText.length; i++) {
                    if (currentText[i] !== this.originalText[i]) {
                        mismatchedIndices.push(i);
                    }
                }
            }

            if (mismatchedIndices.length > 0) {
                const randomIndex = mismatchedIndices[Math.floor(Math.random() * mismatchedIndices.length)];
                const newText = currentText.substring(0, randomIndex) +
                    this.originalText[randomIndex] +
                    currentText.substring(randomIndex + 1);
                this.menuElement.textContent = newText;
            }

            if (currentText !== this.originalText) {
                setTimeout(decryptChar, isArtRevealed ? 3 : 2); // Keep ASCII art faster (3ms) but message back to 2ms
            }
        };

        decryptChar();
    }

    showMotivationText() {
        // Create motivation container
        const motivationContainer = document.createElement('div');
        motivationContainer.id = 'motivationContainer';
        motivationContainer.className = 'motivation-container';
        
        // Insert after the menu element (ASCII art)
        const menuElement = document.getElementById('menu');
        menuElement.parentNode.insertBefore(motivationContainer, menuElement.nextSibling);

        // Auto scroll to motivation container with smooth animation
        setTimeout(() => {
            motivationContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 200);

        // Motivation text lines (exactly as requested)
        const motivationLines = [
            "menjadi mahasiswa adalah prifilage",
            "keistimewaan yang tak semua pemuda diberkahi kesempatan",
            "kalian adalah bagain dari 35% anak muda seusia kalian yang bisa merasakan bangku kuliah",
            "itu adalah kenikmatan sekaligus tanggung jawab",
            "karna kalian adalah mahasiswa",
            "MAHA DARI SISWA",
            "KARNA KALIAN ADALAH GADJAH MADA MUDA",
            "GENERASI PENERUS BANGSA"
        ];

        // Encouraging words to show after main text (all at once)
        const encouragingText = `
            Tetap semangat dalam menjalani perkuliahan!
            Setiap tantangan adalah kesempatan untuk berkembang.
            Jadilah mahasiswa yang tidak hanya pintar, tapi juga berkarakter.
            Masa depan bangsa ada di tangan kalian. 
            Belajarlah dengan tekun, berkarya dengan ikhlas.
            Raih prestasi setinggi-tingginya.

            By Nuhgroh Ramadani
        `;

        let currentLineIndex = 0;
        let currentCharIndex = 0;
        let currentElement = null;

        const typeNextCharacter = () => {
            if (currentLineIndex >= motivationLines.length) {
                // Show encouraging text all at once after main motivation text
                setTimeout(() => {
                    const encouragingDiv = document.createElement('div');
                    encouragingDiv.className = 'encouraging-text';
                    encouragingDiv.innerHTML = encouragingText.trim().split('\n').map(line => 
                        `<p>${line.trim()}</p>`
                    ).join('');
                    motivationContainer.appendChild(encouragingDiv);
                    
                    // Auto scroll to encouraging text when it appears
                    setTimeout(() => {
                        encouragingDiv.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 100);
                    
                    // Add fade-in animation
                    setTimeout(() => {
                        encouragingDiv.classList.add('fade-in');
                        
                        // Re-enable scroll after encouraging text appears
                        setTimeout(() => {
                            this.enableScrollBack();
                        }, 2000); // Wait 2 seconds after fade-in completes
                    }, 300);
                }, 1500);
                return;
            }

            const currentLine = motivationLines[currentLineIndex];
            
            // Create new line element if starting a new line
            if (currentCharIndex === 0) {
                currentElement = document.createElement('div');
                currentElement.className = 'motivation-line';
                motivationContainer.appendChild(currentElement);

                // Auto scroll to keep current line visible during typing
                setTimeout(() => {
                    currentElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);
            }

            // Add current character
            if (currentCharIndex < currentLine.length) {
                currentElement.textContent += currentLine[currentCharIndex];
                currentCharIndex++;
                
                // Continue typing current line
                setTimeout(typeNextCharacter, 50); // 50ms per character
            } else {
                // Move to next line
                currentLineIndex++;
                currentCharIndex = 0;
                
                // Pause between lines
                setTimeout(typeNextCharacter, 800);
            }
        };

        // Start typing animation
        typeNextCharacter();
    }

    enableScrollBack() {
        // Re-enable scroll functionality for all devices including mobile
        if (window.innerWidth <= 768) {
            // Remove scroll prevention listeners
            document.removeEventListener('touchmove', this.preventScrollHandler, { passive: false });
            document.removeEventListener('wheel', this.preventScroll, { passive: false });
            
            // Add a visual indicator that scroll is now enabled
            const scrollEnabledIndicator = document.createElement('div');

            scrollEnabledIndicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(137, 230, 237, 0.9);
                color: black;
                padding: 10px 15px;
                border-radius: 20px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 1000;
                animation: fadeInOut 4s ease-in-out;
            `;
            
            // Add fade animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(20px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(scrollEnabledIndicator);
            
            // Remove indicator after animation
            setTimeout(() => {
                if (scrollEnabledIndicator.parentNode) {
                    scrollEnabledIndicator.parentNode.removeChild(scrollEnabledIndicator);
                }
            }, 4000);
        }
        
        console.log('Scroll functionality re-enabled');
    }

    scrollToShowCompleteContent() {
        // Disable auto scroll ONLY for mobile devices (≤768px)
        if (window.innerWidth <= 768) {
            return;
        }
        
        setTimeout(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }, 500);
    }

    displayTerminal() {
        const encryptedText = this.encryptText(this.originalText);
        this.showMenu();
        this.displayCharacter(encryptedText);
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('resize', this.checkContentOverflow);
        
        // Stop all audio when destroying
        this.stopAllMusic();
    }
}

const encryptedMessage = new EncryptedMessage();

window.addEventListener('beforeunload', () => {
    if (encryptedMessage) {
        encryptedMessage.destroy();
    }
});