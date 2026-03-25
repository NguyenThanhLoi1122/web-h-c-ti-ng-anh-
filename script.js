document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileUpload = document.getElementById('file-upload');
    const placeholderMessage = document.getElementById('placeholder-message');
    const codeContainer = document.getElementById('code-container');
    const fileList = document.getElementById('file-list');
    const progressStatus = document.getElementById('progress-status');
    const successOverlay = document.getElementById('success-overlay');
    const resetBtn = document.getElementById('reset-btn');

    // App State
    let vocabularyData = [];
    let currentIndex = 0;

    // Handle File Upload
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            parseVocabulary(content, file.name);
        };
        reader.onerror = () => {
            alert("Lỗi đọc file. Vui lòng thử lại!");
        };
        reader.readAsText(file);
    });

    // Reset game and load new file
    resetBtn.addEventListener('click', () => {
        successOverlay.classList.add('hidden');
        fileUpload.click();
    });

    // Parse Data
    function parseVocabulary(content, filename) {
        vocabularyData = [];
        const lines = content.split(/\r?\n/);
        
        let hasError = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split('|');
            if (parts.length >= 3) {
                const stt = parts[0].trim();
                const word = parts[1].trim();
                const meaning = parts[2].trim();
                
                if (word && meaning) {
                    vocabularyData.push({ stt, word, meaning, originalLine: line });
                }
            } else {
                hasError = true;
            }
        }

        if (vocabularyData.length === 0) {
            alert("Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra định dạng: STT|Từ vựng|Nghĩa");
            return;
        }
        
        if (hasError) {
            console.warn("Một số dòng không đúng định dạng đã bị bỏ qua.");
        }

        // Setup UI
        document.querySelector('.title').textContent = `${filename} - Học Từ Vựng`;
        document.querySelector('.tab').innerHTML = `📄 ${filename} <span class="close-tab">×</span>`;
        document.querySelector('.breadcrumbs').innerHTML = `VOCA-PROJECT > ${filename}`;
        
        fileList.classList.remove('hidden');
        fileList.innerHTML = `<div class="file-item active">📄 ${filename}</div>`;
        
        startLearning();
    }

    // Start UI
    function startLearning() {
        placeholderMessage.classList.add('hidden');
        codeContainer.classList.remove('hidden');
        codeContainer.innerHTML = ''; // Clear previous
        
        currentIndex = 0;
        updateProgress();
        
        renderRow(currentIndex);
    }

    // Render a specific row
    function renderRow(index) {
        if (index >= vocabularyData.length) {
            // Finished
            setTimeout(() => {
                successOverlay.classList.remove('hidden');
            }, 500);
            return;
        }

        const data = vocabularyData[index];
        const row = document.createElement('div');
        row.className = 'code-row active';
        row.id = `row-${index}`;
        
        const displayStt = data.stt || (index + 1);

        row.innerHTML = `
            <div class="line-number">${displayStt}</div>
            <div class="code-content">
                <div class="word-column">
                    <span class="syntax-keyword">const</span>
                    <span class="syntax-func">word${index + 1}</span>
                    <span class="syntax-operator">=</span>
                    <span class="syntax-string">"</span>
                    <input type="text" class="code-input" id="input-${index}" autocomplete="off" spellcheck="false" />
                    <span class="syntax-string">"</span><span class="syntax-punct">;</span>
                    <button class="check-btn" title="Kiểm tra (Enter)">▶ Run</button>
                    <span class="input-feedback"></span>
                </div>
                <div class="meaning-column">
                    // ${data.meaning}
                </div>
            </div>
        `;

        codeContainer.appendChild(row);
        
        // Auto scroll to latest line
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        // Attach events
        const input = row.querySelector('.code-input');
        const checkBtn = row.querySelector('.check-btn');
        
        input.focus();

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                checkAnswer(index, input.value, data.word);
            }
        });

        checkBtn.addEventListener('click', () => {
            checkAnswer(index, input.value, data.word);
        });
    }

    function checkAnswer(index, inputValue, expectedWord) {
        const row = document.getElementById(`row-${index}`);
        const input = row.querySelector('.code-input');
        const feedback = row.querySelector('.input-feedback');
        
        const isCorrect = inputValue.trim().toLowerCase() === expectedWord.toLowerCase();
        
        if (isCorrect) {
            row.classList.remove('active', 'error');
            row.classList.add('success');
            input.disabled = true;
            feedback.textContent = '✓';
            
            currentIndex++;
            updateProgress();
            
            // Move to next after brief pause
            renderRow(currentIndex);
        } else {
            row.classList.remove('error');
            // Trigger reflow for animation
            void row.offsetWidth;
            row.classList.add('error');
            
            feedback.textContent = 'Sai rồi, thử lại!';
            input.focus();
            
            setTimeout(() => {
                if(row.classList.contains('error')) {
                    row.classList.remove('error');
                    feedback.textContent = '';
                }
            }, 1500);
        }
    }

    // Update Status Bar Progress
    function updateProgress() {
        const total = vocabularyData.length;
        progressStatus.textContent = `${currentIndex}/${total} đã học`;
        
        if (total > 0) {
            // Update line col info to match current line
            const lineCol = document.querySelectorAll('.status-item')[1];
            if (lineCol) {
                lineCol.textContent = `Ln ${currentIndex + 1}, Col 1`;
            }
        }
    }
});
