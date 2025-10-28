class FlashCardGame {
    constructor() {
        this.currentMode = null;
        this.timeLimit = null;
        this.score = 0;
        this.streak = 0;
        this.totalQuestions = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.startTime = null;
        this.endTime = null;
        this.timerInterval = null;
        this.currentQuestion = null;
        this.operations = { addition: true, subtraction: true };
        this.sessionHistory = [];

        this.correctIcons = ['⭐', '✨', '🌟', '💫', '⚡', '🎯', '✓', '👍', '🎉', '🏆'];

        this.correctMessages = [
            "Awesome! You're on fire!",
            "Nailed it! Keep crushing it!",
            "Boom! Math genius alert!",
            "Perfect! You're unstoppable!",
            "Yes! That's how it's done!",
            "Incredible! Math wizard in action!",
            "Spectacular! You're amazing!",
            "Outstanding! Keep it rolling!",
            "Brilliant! You've got this!",
            "Fantastic! Math superstar!"
        ];

        this.incorrectIcons = ['📝', '🔄', '💭', '🤔', '📚', '✏️', '💡', '🎓', '🔍', '📖'];

        this.incorrectMessages = [
            "Not quite! But you're getting closer!",
            "Oops! Let's try the next one!",
            "Almost! Every mistake is learning!",
            "Keep going! You're doing great!",
            "That's okay! Practice makes perfect!",
            "Nice try! You'll get the next one!",
            "Don't worry! You're improving!",
            "Good effort! Keep practicing!",
            "That's alright! Learning is progress!",
            "Stay positive! You're getting better!"
        ];

        this.audioContext = null;

        this.initEventListeners();
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    playCorrectSound() {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Duck quack sound - quick descending frequency
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);

        // Add a second "whoo-hoo" note
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.frequency.setValueAtTime(600, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);

            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.1);
        }, 100);
    }

    playIncorrectSound() {
        const ctx = this.getAudioContext();

        // First "womp"
        const oscillator1 = ctx.createOscillator();
        const gainNode1 = ctx.createGain();

        oscillator1.connect(gainNode1);
        gainNode1.connect(ctx.destination);

        oscillator1.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);

        gainNode1.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator1.start(ctx.currentTime);
        oscillator1.stop(ctx.currentTime + 0.3);

        // Second "womp"
        setTimeout(() => {
            const oscillator2 = ctx.createOscillator();
            const gainNode2 = ctx.createGain();

            oscillator2.connect(gainNode2);
            gainNode2.connect(ctx.destination);

            oscillator2.frequency.setValueAtTime(250, ctx.currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

            gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            oscillator2.start(ctx.currentTime);
            oscillator2.stop(ctx.currentTime + 0.3);
        }, 250);
    }

    initEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.startGame(e.target.dataset.mode));
        });

        document.getElementById('submit-btn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });

        document.getElementById('end-session-btn').addEventListener('click', () => this.endSession());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadReport());
        document.getElementById('new-session-btn').addEventListener('click', () => this.resetGame());

        document.getElementById('addition').addEventListener('change', (e) => {
            this.operations.addition = e.target.checked;
        });
        document.getElementById('subtraction').addEventListener('change', (e) => {
            this.operations.subtraction = e.target.checked;
        });
    }

    startGame(mode) {
        if (!this.operations.addition && !this.operations.subtraction) {
            alert('Please select at least one operation type!');
            return;
        }

        this.currentMode = mode;
        this.timeLimit = mode === 'practice' ? null : parseInt(mode) * 60;
        this.resetStats();
        this.startTime = new Date();

        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');

        if (this.timeLimit) {
            this.startTimer();
        } else {
            document.getElementById('timer').textContent = 'Practice Mode';
        }

        this.nextQuestion();
    }

    resetStats() {
        this.score = 0;
        this.streak = 0;
        this.totalQuestions = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.sessionHistory = [];
        this.updateDisplay();
    }

    startTimer() {
        let remainingTime = this.timeLimit;
        this.updateTimerDisplay(remainingTime);

        this.timerInterval = setInterval(() => {
            remainingTime--;
            this.updateTimerDisplay(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(this.timerInterval);
                this.endSession();
            }
        }, 1000);
    }

    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('timer').textContent =
            `Time: ${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    generateQuestion() {
        const operations = [];
        if (this.operations.addition) operations.push('addition');
        if (this.operations.subtraction) operations.push('subtraction');

        const operation = operations[Math.floor(Math.random() * operations.length)];

        if (operation === 'addition') {
            const a = Math.floor(Math.random() * 21);
            const b = Math.floor(Math.random() * (21 - a));
            return {
                num1: a,
                num2: b,
                operator: '+',
                answer: a + b
            };
        } else {
            const answer = Math.floor(Math.random() * 21);
            const num2 = Math.floor(Math.random() * (21 - answer));
            const num1 = answer + num2;
            return {
                num1: num1,
                num2: num2,
                operator: '-',
                answer: answer
            };
        }
    }

    nextQuestion() {
        this.currentQuestion = this.generateQuestion();
        document.getElementById('num1-row').textContent = this.currentQuestion.num1;
        document.getElementById('operator').textContent = this.currentQuestion.operator;
        document.getElementById('num2').textContent = this.currentQuestion.num2;
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('answer-input').focus();
    }

    checkAnswer() {
        const userAnswer = parseInt(document.getElementById('answer-input').value);

        if (isNaN(userAnswer)) {
            return;
        }

        this.totalQuestions++;
        const isCorrect = userAnswer === this.currentQuestion.answer;

        this.sessionHistory.push({
            question: `${this.currentQuestion.num1} ${this.currentQuestion.operator} ${this.currentQuestion.num2}`,
            userAnswer: userAnswer,
            correctAnswer: this.currentQuestion.answer,
            isCorrect: isCorrect,
            timestamp: new Date()
        });

        if (isCorrect) {
            this.correctAnswers++;
            this.score += 10;
            this.streak++;
            this.showFeedback(true);
        } else {
            this.incorrectAnswers++;
            this.streak = 0;
            this.showFeedback(false);
        }

        this.updateDisplay();

        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    showFeedback(isCorrect) {
        const feedbackEl = document.getElementById('feedback');
        if (isCorrect) {
            const iconIndex = Math.floor(Math.random() * this.correctIcons.length);
            const messageIndex = Math.floor(Math.random() * this.correctMessages.length);
            feedbackEl.innerHTML = `<span class="feedback-icon">${this.correctIcons[iconIndex]}</span>${this.correctMessages[messageIndex]}`;
            feedbackEl.style.color = '#2d862d';
            this.playCorrectSound();
        } else {
            const iconIndex = Math.floor(Math.random() * this.incorrectIcons.length);
            const messageIndex = Math.floor(Math.random() * this.incorrectMessages.length);
            feedbackEl.innerHTML = `<span class="feedback-icon">${this.incorrectIcons[iconIndex]}</span>${this.incorrectMessages[messageIndex]} (Answer: ${this.currentQuestion.answer})`;
            feedbackEl.style.color = '#d97706';
            this.playIncorrectSound();
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('streak').textContent = `Streak: ${this.streak}`;
    }

    endSession() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.endTime = new Date();
        const duration = Math.floor((this.endTime - this.startTime) / 1000);

        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('results-area').classList.remove('hidden');

        this.showResults(duration);
        this.showAwards(duration);
    }

    showResults(duration) {
        const accuracy = this.totalQuestions > 0
            ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
            : 0;

        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        const statsHTML = `
            <div class="stat-item">Total Questions: <span class="stat-value">${this.totalQuestions}</span></div>
            <div class="stat-item">Correct Answers: <span class="stat-value">${this.correctAnswers}</span></div>
            <div class="stat-item">Incorrect Answers: <span class="stat-value">${this.incorrectAnswers}</span></div>
            <div class="stat-item">Accuracy: <span class="stat-value">${accuracy}%</span></div>
            <div class="stat-item">Final Score: <span class="stat-value">${this.score}</span></div>
            <div class="stat-item">Best Streak: <span class="stat-value">${this.streak}</span></div>
            <div class="stat-item">Time: <span class="stat-value">${minutes}m ${seconds}s</span></div>
        `;

        document.getElementById('session-stats').innerHTML = statsHTML;
    }

    showAwards(duration) {
        const awards = [];
        const accuracy = this.totalQuestions > 0
            ? (this.correctAnswers / this.totalQuestions) * 100
            : 0;

        if (accuracy === 100 && this.totalQuestions >= 5) {
            awards.push('🏆 Perfect Score!');
        }
        if (accuracy >= 90 && this.totalQuestions >= 10) {
            awards.push('⭐ Math Master!');
        }
        if (this.streak >= 10) {
            awards.push('🔥 Hot Streak!');
        }
        if (this.streak >= 20) {
            awards.push('💫 Unstoppable!');
        }
        if (this.totalQuestions >= 20) {
            awards.push('💪 Marathon Runner!');
        }
        if (this.totalQuestions >= 50) {
            awards.push('🚀 Speed Demon!');
        }
        if (duration >= 300 && this.totalQuestions >= 30) {
            awards.push('⏰ Dedicated Learner!');
        }
        if (this.score >= 500) {
            awards.push('💎 High Scorer!');
        }
        if (this.score >= 1000) {
            awards.push('👑 Math Champion!');
        }

        const awardsHTML = awards.length > 0
            ? `<h3>Awards Earned!</h3>${awards.map(award => `<div class="award">${award}</div>`).join('')}`
            : '<p>Keep practicing to earn awards!</p>';

        document.getElementById('awards').innerHTML = awardsHTML;
    }

    downloadReport() {
        const duration = Math.floor((this.endTime - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const accuracy = this.totalQuestions > 0
            ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
            : 0;

        let report = 'MATH FLASH CARDS - SESSION REPORT\n';
        report += '='.repeat(50) + '\n\n';
        report += `Date: ${this.endTime.toLocaleDateString()}\n`;
        report += `Time: ${this.endTime.toLocaleTimeString()}\n`;
        report += `Mode: ${this.currentMode === 'practice' ? 'Practice' : this.currentMode + ' Minute Test'}\n\n`;
        report += 'SUMMARY\n';
        report += '-'.repeat(50) + '\n';
        report += `Total Questions: ${this.totalQuestions}\n`;
        report += `Correct Answers: ${this.correctAnswers}\n`;
        report += `Incorrect Answers: ${this.incorrectAnswers}\n`;
        report += `Accuracy: ${accuracy}%\n`;
        report += `Final Score: ${this.score}\n`;
        report += `Best Streak: ${this.streak}\n`;
        report += `Duration: ${minutes}m ${seconds}s\n\n`;

        if (this.sessionHistory.length > 0) {
            report += 'QUESTION HISTORY\n';
            report += '-'.repeat(50) + '\n';
            this.sessionHistory.forEach((q, i) => {
                const status = q.isCorrect ? '✓' : '✗';
                report += `${i + 1}. ${q.question} = ${q.userAnswer} ${status} (Correct: ${q.correctAnswer})\n`;
            });
        }

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashcards-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetGame() {
        document.getElementById('results-area').classList.add('hidden');
        document.getElementById('mode-selection').classList.remove('hidden');
        this.currentMode = null;
        this.updateDisplay();
    }
}

const game = new FlashCardGame();
