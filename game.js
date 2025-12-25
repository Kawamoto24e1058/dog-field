class MatchingGame {
    constructor() {
        this.cards = ['🐕', '🐶', '🦴', '🎾', '🏠', '🍖', '🐾', '⭐'];
        this.gameBoard = document.getElementById('game-board');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.movesDisplay = document.getElementById('moves');
        this.timeDisplay = document.getElementById('time');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalTimeDisplay = document.getElementById('final-time');
        this.finalMovesDisplay = document.getElementById('final-moves');
        
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.timer = null;
        this.canFlip = true;
        
        this.init();
    }
    
    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.startBtn.style.display = 'none';
        this.gameOverScreen.classList.add('hidden');
        this.resetGame();
        this.createBoard();
        this.startTimer();
    }
    
    resetGame() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.canFlip = true;
        this.movesDisplay.textContent = '0';
        this.timeDisplay.textContent = '0:00';
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    createBoard() {
        this.gameBoard.innerHTML = '';
        const cardPairs = [...this.cards, ...this.cards];
        const shuffledCards = this.shuffle(cardPairs);
        
        shuffledCards.forEach((emoji, index) => {
            const card = this.createCard(emoji, index);
            this.gameBoard.appendChild(card);
        });
    }
    
    createCard(emoji, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = '?';
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = emoji;
        
        card.appendChild(cardFront);
        card.appendChild(cardBack);
        
        card.addEventListener('click', () => this.flipCard(card));
        
        return card;
    }
    
    flipCard(card) {
        if (!this.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            this.moves++;
            this.movesDisplay.textContent = this.moves;
            
            setTimeout(() => this.checkMatch(), 800);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const emoji1 = card1.dataset.emoji;
        const emoji2 = card2.dataset.emoji;
        
        if (emoji1 === emoji2) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            
            if (this.matchedPairs === this.cards.length) {
                this.endGame();
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }, 400);
        }
        
        this.flippedCards = [];
        this.canFlip = true;
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            const minutes = Math.floor(this.seconds / 60);
            const secs = this.seconds % 60;
            this.timeDisplay.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    endGame() {
        clearInterval(this.timer);
        this.finalTimeDisplay.textContent = this.timeDisplay.textContent;
        this.finalMovesDisplay.textContent = this.moves;
        
        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
        }, 500);
    }
    
    restartGame() {
        this.startGame();
    }
    
    shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MatchingGame();
});
