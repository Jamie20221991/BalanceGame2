// Modern Mobile Balance Game 2 - JavaScript

class MobileBalanceGame {
  constructor() {
    this.balloons = [];
    this.currentDifficulty = 'easy';
    this.gameStarted = false;
    this.gameWon = false;
    this.moves = 0;
    this.weighings = [];
    this.hints = 3;
    this.score = 0;
    this.startTime = null;
    this.isDarkTheme = false;
    this.isVibrationEnabled = true;
    this.isSoundEnabled = true;
    this.selectedBalloons = { left: [], right: [] };
    this.ballWeights = {};
    this.draggedBalloon = null;
    
    this.difficultySettings = {
      easy: { count: 6, oddWeight: 3, normalWeight: 5, reward: 100, showDirection: true },
      medium: { count: 8, oddWeight: 2, normalWeight: 5, reward: 200, showDirection: true },
      hard: { count: 12, oddWeight: null, normalWeight: 5, reward: 300, unknownDirection: true },
      expert: { count: 15, oddWeight: 1, normalWeight: 5, reward: 500, showDirection: true }
    };
    
    this.init();
  }
  
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.setupParticles();
    this.showScreen('difficulty-selection');
    
    // Preload sounds for better mobile performance
    this.loadSounds();
  }
  
  setupEventListeners() {
    // Difficulty selection
    document.querySelectorAll('.difficulty-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const difficulty = e.currentTarget.dataset.difficulty;
        this.selectDifficulty(difficulty);
      });
    });
    
    // Control buttons
    document.getElementById('weigh-btn')?.addEventListener('click', () => this.weighBalloons());
    document.getElementById('guess-btn')?.addEventListener('click', () => this.showGuessModal());
    document.getElementById('hint-btn')?.addEventListener('click', () => this.showHint());
    document.getElementById('reset-btn')?.addEventListener('click', () => this.resetGame());
    
    // Header buttons
    document.getElementById('back-btn')?.addEventListener('click', () => this.goBack());
    document.getElementById('menu-btn')?.addEventListener('click', () => this.showScreen('difficulty-selection'));
    document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
    
    // Settings modal
    document.getElementById('close-settings')?.addEventListener('click', () => this.hideSettings());
    document.getElementById('reset-game-btn')?.addEventListener('click', () => this.resetAllProgress());
    
    // Theme and settings toggles
    document.getElementById('dark-theme-toggle')?.addEventListener('change', (e) => {
      this.toggleTheme(e.target.checked);
    });
    
    document.getElementById('vibration-toggle')?.addEventListener('change', (e) => {
      this.isVibrationEnabled = e.target.checked;
      this.saveSettings();
    });
    
    document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
      this.isSoundEnabled = e.target.checked;
      this.saveSettings();
    });
    
    // Victory modal buttons
    document.getElementById('next-level-btn')?.addEventListener('click', () => this.nextLevel());
    document.getElementById('play-again-btn')?.addEventListener('click', () => this.playAgain());
    document.getElementById('main-menu-btn')?.addEventListener('click', () => this.goToMenu());
    
    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => this.goBack());
    
    // Touch and drag event handlers will be set up per balloon
    this.setupDropZones();
  }
  
  setupDropZones() {
    const leftZone = document.getElementById('left-drop-zone');
    const rightZone = document.getElementById('right-drop-zone');
    
    if (leftZone && rightZone) {
      [leftZone, rightZone].forEach(zone => {
        zone.addEventListener('dragover', this.handleDragOver.bind(this));
        zone.addEventListener('drop', this.handleDrop.bind(this));
        zone.addEventListener('dragleave', this.handleDragLeave.bind(this));
      });
    }
  }
  
  loadSounds() {
    // Placeholder for sound loading - can add Web Audio API sounds later
    this.sounds = {
      place: () => this.playBeep(800, 100),
      weigh: () => this.playBeep(400, 200),
      success: () => this.playBeep(600, 300),
      error: () => this.playBeep(200, 300)
    };
  }
  
  playBeep(frequency, duration) {
    if (!this.isSoundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.log('Audio not supported');
    }
  }
  
  vibrate(pattern = [100]) {
    if (this.isVibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
  
  selectDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    this.vibrate([50]);
    this.sounds.place();
    this.generateGame();
    this.setupDifficultyLayout(difficulty);
    this.showScreen('game-play');
  }
  
  setupDifficultyLayout(difficulty) {
    const scaleContainer = document.getElementById('scale-container');
    const gameControls = document.querySelector('.game-controls');
    const messageEl = document.getElementById('message');
    const gameInstructions = document.querySelector('.game-instructions');
    
    if (difficulty === 'hard') {
      // Move weigh button to middle of scales
      const weighBtn = document.getElementById('weigh-btn');
      if (weighBtn && scaleContainer) {
        // Remove from controls
        weighBtn.remove();
        
        // Create new weigh button for scale
        const scaleWeighBtn = document.createElement('button');
        scaleWeighBtn.id = 'weigh-btn';
        scaleWeighBtn.className = 'control-btn weigh-btn scale-weigh-btn';
        scaleWeighBtn.innerHTML = `
          <span class="btn-icon">⚖️</span>
          <span class="btn-text">Weigh</span>
        `;
        
        // Insert between drop zones
        const pivot = document.getElementById('scale-pivot');
        if (pivot) {
          pivot.style.display = 'none';
          scaleContainer.insertBefore(scaleWeighBtn, document.getElementById('right-drop-zone'));
        }
        
        // Re-attach event listener
        scaleWeighBtn.addEventListener('click', () => this.weighBalloons());
      }
      
      // Update message for hard difficulty
      if (messageEl) {
        messageEl.textContent = 'Find the odd balloon - it could be lighter OR heavier!';
        messageEl.style.order = '-1'; // Move above other elements
      }
      
      // Update instructions
      if (gameInstructions) {
        gameInstructions.innerHTML = `
          <p>🎈 Drag balloons to the scale - any amount on each side!</p>
          <p>🎯 Tap a balloon to select it for guessing</p>
          <p>⚠️ The odd balloon could be lighter OR heavier this time!</p>
        `;
      }
      
      // Style the remaining controls to be more compact
      if (gameControls) {
        gameControls.style.justifyContent = 'flex-end';
        gameControls.style.gap = '10px';
      }
      
    } else {
      // Reset to normal layout for other difficulties
      this.resetToNormalLayout();
    }
  }
  
  resetToNormalLayout() {
    const scaleContainer = document.getElementById('scale-container');
    const gameControls = document.querySelector('.game-controls');
    const messageEl = document.getElementById('message');
    const gameInstructions = document.querySelector('.game-instructions');
    
    // Check if weigh button is in scale container
    const scaleWeighBtn = scaleContainer?.querySelector('.scale-weigh-btn');
    if (scaleWeighBtn) {
      scaleWeighBtn.remove();
    }
    
    // Show pivot again
    const pivot = document.getElementById('scale-pivot');
    if (pivot) {
      pivot.style.display = 'block';
    }
    
    // Ensure weigh button is in controls
    if (gameControls && !document.getElementById('weigh-btn')) {
      const weighBtn = document.createElement('button');
      weighBtn.id = 'weigh-btn';
      weighBtn.className = 'control-btn weigh-btn';
      weighBtn.innerHTML = `
        <span class="btn-icon">⚖️</span>
        <span class="btn-text">Weigh</span>
      `;
      
      // Insert as second button (after hint)
      const hintBtn = document.getElementById('hint-btn');
      if (hintBtn) {
        hintBtn.insertAdjacentElement('afterend', weighBtn);
      } else {
        gameControls.insertBefore(weighBtn, gameControls.firstChild);
      }
      
      // Re-attach event listener
      weighBtn.addEventListener('click', () => this.weighBalloons());
    }
    
    // Reset message
    if (messageEl) {
      messageEl.textContent = 'Select balloons and use the scale to find the odd one!';
      messageEl.style.order = 'initial';
    }
    
    // Reset instructions
    if (gameInstructions) {
      gameInstructions.innerHTML = `
        <p>🎈 Drag balloons to the scale - any amount on each side!</p>
        <p>🎯 Tap a balloon to select it for guessing</p>
      `;
    }
    
    // Reset controls layout
    if (gameControls) {
      gameControls.style.justifyContent = 'center';
      gameControls.style.gap = '15px';
    }
  }
  
  generateGame() {
    const settings = this.difficultySettings[this.currentDifficulty];
    const balloonCount = settings.count;
    
    // Reset game state
    this.balloons = [];
    this.moves = 0;
    this.weighings = [];
    this.gameWon = false;
    this.gameStarted = true;
    this.startTime = Date.now();
    this.selectedBalloons = { left: [], right: [] };
    
    // Generate balloon weights
    this.ballWeights = {};
    const oddBalloonIndex = Math.floor(Math.random() * balloonCount);
    
    // Handle unknown direction for hard mode
    let isOddLighter;
    if (settings.unknownDirection) {
      isOddLighter = Math.random() < 0.5;
      // For hard mode, make the weight difference more subtle
      const weightDifference = Math.random() < 0.5 ? 1 : 2;
      settings.oddWeight = isOddLighter ? (settings.normalWeight - weightDifference) : (settings.normalWeight + weightDifference);
    } else {
      isOddLighter = Math.random() < 0.5;
    }
    
    for (let i = 0; i < balloonCount; i++) {
      const balloonId = `balloon-${i}`;
      if (i === oddBalloonIndex) {
        this.ballWeights[balloonId] = settings.oddWeight || (isOddLighter ? settings.normalWeight - 2 : settings.normalWeight + 2);
      } else {
        this.ballWeights[balloonId] = settings.normalWeight;
      }
      this.balloons.push(balloonId);
    }
    
    // Store the odd balloon info for hard mode
    this.oddBalloonInfo = {
      index: oddBalloonIndex,
      isLighter: isOddLighter,
      showDirection: settings.showDirection
    };
    
    // Debug logging to see what was selected
    console.log('Game Generated:', {
      difficulty: this.currentDifficulty,
      oddBalloonIndex: oddBalloonIndex,
      oddBalloonNumber: oddBalloonIndex + 1, // What player sees
      isOddLighter: isOddLighter,
      oddWeight: this.ballWeights[`balloon-${oddBalloonIndex}`],
      normalWeight: settings.normalWeight,
      allWeights: this.ballWeights
    });
    
    this.renderBalloons();
    this.updateDisplay();
    this.clearWeighingHistory();
  }
  
  renderBalloons() {
    const container = document.getElementById('balloons-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.balloons.forEach((balloonId, index) => {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      balloon.id = balloonId;
      balloon.textContent = index + 1;
      balloon.draggable = true;
      
      // Set random balloon color
      const colors = [
        'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
        'linear-gradient(135deg, #4ecdc4, #44a08d)',
        'linear-gradient(135deg, #45b7d1, #96c93d)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)'
      ];
      balloon.style.background = colors[index % colors.length];
      
      // Drag events
      balloon.addEventListener('dragstart', this.handleDragStart.bind(this));
      balloon.addEventListener('dragend', this.handleDragEnd.bind(this));
      
      // Touch events for mobile
      balloon.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      balloon.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      balloon.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      
      // Click to select/deselect
      balloon.addEventListener('click', this.handleBalloonClick.bind(this));
      
      container.appendChild(balloon);
    });
  }
  
  handleBalloonClick(e) {
    const balloon = e.currentTarget;
    balloon.classList.toggle('selected');
    this.vibrate([25]);
  }
  
  handleDragStart(e) {
    this.draggedBalloon = e.target;
    e.target.classList.add('dragging');
    this.vibrate([50]);
  }
  
  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedBalloon = null;
  }
  
  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }
  
  handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }
  
  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!this.draggedBalloon) return;
    
    const dropZone = e.currentTarget;
    const side = dropZone.id.includes('left') ? 'left' : 'right';
    
    // Move balloon to drop zone
    this.moveBalloonToSide(this.draggedBalloon, side);
    this.vibrate([75]);
    this.sounds.place();
  }
  
  // Touch handling for mobile devices
  handleTouchStart(e) {
    e.preventDefault();
    this.draggedBalloon = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    this.vibrate([50]);
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.draggedBalloon) return;
    
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Remove existing drag-over classes
    document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));
    
    // Add drag-over to current drop zone if over one
    if (elementBelow && elementBelow.classList.contains('drop-zone')) {
      elementBelow.classList.add('drag-over');
    }
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    if (!this.draggedBalloon) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Clean up
    document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));
    this.draggedBalloon.classList.remove('dragging');
    
    // Handle drop
    if (elementBelow && elementBelow.classList.contains('drop-zone')) {
      const side = elementBelow.id.includes('left') ? 'left' : 'right';
      this.moveBalloonToSide(this.draggedBalloon, side);
      this.vibrate([75]);
      this.sounds.place();
    }
    
    this.draggedBalloon = null;
  }
  
  moveBalloonToSide(balloon, side) {
    const balloonId = balloon.id;
    
    // Remove from current position
    Object.keys(this.selectedBalloons).forEach(key => {
      this.selectedBalloons[key] = this.selectedBalloons[key].filter(id => id !== balloonId);
    });
    
    // Add to new side
    this.selectedBalloons[side].push(balloonId);
    
    // Move balloon element to drop zone
    const dropZone = document.getElementById(side === 'left' ? 'left-drop-zone' : 'right-drop-zone');
    if (dropZone) {
      balloon.classList.remove('selected');
      dropZone.appendChild(balloon);
    }
    
    this.updateDropZoneHints();
  }
  
  updateDropZoneHints() {
    const leftZone = document.getElementById('left-drop-zone');
    const rightZone = document.getElementById('right-drop-zone');
    
    const leftHint = leftZone?.querySelector('.drop-hint');
    const rightHint = rightZone?.querySelector('.drop-hint');
    
    if (leftHint) leftHint.style.display = this.selectedBalloons.left.length > 0 ? 'none' : 'block';
    if (rightHint) rightHint.style.display = this.selectedBalloons.right.length > 0 ? 'none' : 'block';
  }
  
  weighBalloons() {
    if (this.selectedBalloons.left.length === 0 || this.selectedBalloons.right.length === 0) {
      this.showMessage('Please place balloons on both sides of the scale!', 'warning');
      this.vibrate([100, 50, 100]);
      return;
    }
    
    this.moves++;
    this.updateDisplay();
    
    // Calculate weights
    const leftWeight = this.selectedBalloons.left.reduce((sum, id) => sum + this.ballWeights[id], 0);
    const rightWeight = this.selectedBalloons.right.reduce((sum, id) => sum + this.ballWeights[id], 0);
    
    let result;
    if (leftWeight > rightWeight) {
      result = 'left';
      this.showMessage('Left side is heavier!', 'info');
    } else if (rightWeight > leftWeight) {
      result = 'right';
      this.showMessage('Right side is heavier!', 'info');
    } else {
      result = 'equal';
      this.showMessage('Both sides are equal!', 'info');
    }
    
    // Debug logging
    console.log('Weighing result:', {
      leftWeight,
      rightWeight,
      result,
      leftBalloons: this.selectedBalloons.left,
      rightBalloons: this.selectedBalloons.right
    });
    
    // Animate scale tilt
    this.animateScale(result);
    
    // Record weighing
    this.weighings.push({
      left: [...this.selectedBalloons.left],
      right: [...this.selectedBalloons.right],
      result: result
    });
    
    this.updateResultsLog();
    this.updateWeighingHistory();
    this.clearScale();
    this.vibrate([100]);
    this.sounds.weigh();
  }
  
  updateWeighingHistory() {
    const weighingList = document.getElementById('weighing-list');
    if (!weighingList) return;
    
    // Clear hint if this is the first weighing
    if (this.weighings.length === 1) {
      weighingList.innerHTML = '';
    }
    
    const latestWeighing = this.weighings[this.weighings.length - 1];
    const weighingItem = document.createElement('div');
    weighingItem.className = 'weighing-item';
    
    weighingItem.innerHTML = `
      <div class="weighing-header">
        <span class="weighing-number">Weighing #${this.weighings.length}</span>
        <span class="weighing-result ${latestWeighing.result}">
          ${this.getWeighingResultText(latestWeighing.result)}
        </span>
      </div>
      <div class="weighing-balloons">
        <span class="weighing-side">${latestWeighing.left.map(id => parseInt(id.split('-')[1]) + 1).join(', ')}</span>
        <span class="weighing-vs">VS</span>
        <span class="weighing-side">${latestWeighing.right.map(id => parseInt(id.split('-')[1]) + 1).join(', ')}</span>
      </div>
    `;
    
    weighingList.appendChild(weighingItem);
    
    // Scroll to latest weighing
    weighingList.scrollTop = weighingList.scrollHeight;
  }
  
  getWeighingResultText(result) {
    switch (result) {
      case 'equal':
        return 'Balanced';
      case 'left':
        return 'Left Heavier';
      case 'right':
        return 'Right Heavier';
      default:
        console.warn('Unknown weighing result:', result);
        return 'Unknown';
    }
  }
  
  getWeighingResultSymbol(result) {
    switch (result) {
      case 'equal':
        return '⚖️';
      case 'left':
        return '←';
      case 'right':
        return '→';
      default:
        console.warn('Unknown weighing result:', result);
        return '?';
    }
  }
  
  clearWeighingHistory() {
    const weighingList = document.getElementById('weighing-list');
    if (!weighingList) return;
    
    weighingList.innerHTML = `
      <div class="weighing-hint">
        <p>🎯 Start weighing balloons to see results here!</p>
        <p>💡 Use this history to track your progress and find clues.</p>
      </div>
    `;
  }
  
  animateScale(result) {
    const beam = document.getElementById('scale-beam');
    if (!beam) return;
    
    beam.classList.remove('tilt-left', 'tilt-right');
    
    setTimeout(() => {
      if (result === 'left') beam.classList.add('tilt-left');
      else if (result === 'right') beam.classList.add('tilt-right');
    }, 100);
    
    setTimeout(() => {
      beam.classList.remove('tilt-left', 'tilt-right');
    }, 2000);
  }
  
  clearScale() {
    const container = document.getElementById('balloons-container');
    if (!container) return;
    
    // Move balloons back to container
    [...this.selectedBalloons.left, ...this.selectedBalloons.right].forEach(balloonId => {
      const balloon = document.getElementById(balloonId);
      if (balloon) {
        container.appendChild(balloon);
      }
    });
    
    this.selectedBalloons = { left: [], right: [] };
    this.updateDropZoneHints();
  }
  
  showHint() {
    if (this.hints <= 0) {
      this.showMessage('No hints remaining!', 'error');
      return;
    }
    
    this.hints--;
    this.updateDisplay();
    
    // Simple hint system
    const settings = this.difficultySettings[this.currentDifficulty];
    let hintMessages;
    
    if (this.currentDifficulty === 'hard') {
      hintMessages = [
        `Try comparing balloons in groups of ${Math.floor(settings.count / 3)}.`,
        'The odd balloon could be lighter OR heavier than the others.',
        'Use weighing results carefully - you don\'t know the direction!',
        'Focus on elimination - rule out groups systematically.',
        'Remember: the unknown weight direction makes this tricky!'
      ];
    } else {
      hintMessages = [
        `Try comparing balloons in groups of ${Math.floor(settings.count / 3)}.`,
        'The odd balloon might be lighter or heavier than the others.',
        'Use the weighing results to eliminate possibilities.',
        'Remember: you can use the process of elimination!'
      ];
    }
    
    const randomHint = hintMessages[Math.floor(Math.random() * hintMessages.length)];
    this.showMessage(`💡 Hint: ${randomHint}`, 'info');
    this.vibrate([50, 50, 50]);
  }
  
  showGuessModal() {
    // Simple guess implementation - in a full version, this would show a modal
    const selectedBalloons = document.querySelectorAll('.balloon.selected');
    if (selectedBalloons.length !== 1) {
      this.showMessage('Please select exactly one balloon to guess!', 'warning');
      return;
    }
    
    const guessedBalloon = selectedBalloons[0].id;
    this.makeGuess(guessedBalloon);
  }
  
  makeGuess(balloonId) {
    const settings = this.difficultySettings[this.currentDifficulty];
    const balloonWeight = this.ballWeights[balloonId];
    const isCorrect = balloonWeight !== settings.normalWeight;
    
    // Debug logging
    console.log('Guess made:', {
      balloonId: balloonId,
      balloonNumber: parseInt(balloonId.split('-')[1]) + 1, // What player sees
      balloonWeight: balloonWeight,
      normalWeight: settings.normalWeight,
      isCorrect: isCorrect,
      actualOddBalloon: this.oddBalloonInfo
    });
    
    if (isCorrect) {
      this.gameWon = true;
      this.showMessage('🎉 Correct! You found the odd balloon!', 'success');
      this.calculateScore();
      this.vibrate([100, 100, 100]);
      this.sounds.success();
      
      // Show victory screen after a brief delay to let them see the success message
      setTimeout(() => {
        this.showVictory();
      }, 1500);
    } else {
      this.showMessage('Wrong guess! Try again.', 'error');
      this.vibrate([200, 100, 200]);
      this.sounds.error();
    }
  }
  
  calculateScore() {
    const settings = this.difficultySettings[this.currentDifficulty];
    const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - this.startTime) / 1000));
    const moveBonus = Math.max(0, (10 - this.moves) * 10);
    
    this.score = settings.reward + timeBonus + moveBonus;
  }
  
  showVictory() {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;
    
    // Update victory stats
    const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('moves-taken').textContent = this.moves;
    document.getElementById('time-taken').textContent = `${timeElapsed}s`;
    
    modal.classList.remove('hidden');
    this.showScreen('victory-screen');
  }
  
  showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    // For success messages, don't auto-clear as quickly
    const clearDelay = type === 'success' ? 6000 : 3000;
    
    // Auto-clear message after delay, but use different default message for hard mode
    setTimeout(() => {
      if (this.currentDifficulty === 'hard') {
        messageEl.textContent = 'Find the odd balloon - it could be lighter OR heavier!';
      } else {
        messageEl.textContent = 'Select balloons and use the scale to find the odd one!';
      }
      messageEl.className = 'message';
    }, clearDelay);
  }
  
  updateDisplay() {
    // Update moves counter
    const movesEl = document.getElementById('moves-count');
    if (movesEl) movesEl.textContent = this.moves;
    
    // Update hints counter
    const hintsEl = document.getElementById('hints-count');
    if (hintsEl) hintsEl.textContent = this.hints;
    
    // Update level badge
    const levelEl = document.getElementById('current-level');
    if (levelEl) levelEl.textContent = this.currentDifficulty.toUpperCase();
    
    // Update progress bar
    const maxMoves = this.difficultySettings[this.currentDifficulty].count;
    const progress = Math.min((this.moves / maxMoves) * 100, 100);
    const progressEl = document.getElementById('progress-fill');
    if (progressEl) progressEl.style.width = `${progress}%`;
  }
  
  updateResultsLog() {
    const resultsList = document.getElementById('results-list');
    if (!resultsList) return;
    
    resultsList.innerHTML = '';
    
    this.weighings.forEach((weighing, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      
      const balloons = document.createElement('div');
      balloons.className = 'result-balloons';
      balloons.textContent = `${weighing.left.map(id => parseInt(id.split('-')[1]) + 1).join(',')} vs ${weighing.right.map(id => parseInt(id.split('-')[1]) + 1).join(',')}`;
      
      const outcome = document.createElement('div');
      outcome.className = `result-outcome ${weighing.result}`;
      outcome.textContent = this.getWeighingResultSymbol(weighing.result);
      
      item.appendChild(balloons);
      item.appendChild(outcome);
      resultsList.appendChild(item);
    });
  }
  
  resetGame() {
    this.generateGame();
    this.setupDifficultyLayout(this.currentDifficulty);
    this.showMessage('Game reset! Find the odd balloon.', 'info');
  }
  
  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
    }
  }
  
  showSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('hidden');
  }
  
  hideSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  }
  
  toggleTheme(isDark) {
    this.isDarkTheme = isDark;
    document.body.classList.toggle('dark-theme', isDark);
    this.saveSettings();
  }
  
  saveSettings() {
    const settings = {
      isDarkTheme: this.isDarkTheme,
      isVibrationEnabled: this.isVibrationEnabled,
      isSoundEnabled: this.isSoundEnabled
    };
    localStorage.setItem('balance-game-settings', JSON.stringify(settings));
  }
  
  loadSettings() {
    const saved = localStorage.getItem('balance-game-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.isDarkTheme = settings.isDarkTheme || false;
      this.isVibrationEnabled = settings.isVibrationEnabled !== false;
      this.isSoundEnabled = settings.isSoundEnabled !== false;
      
      // Apply settings to UI
      document.body.classList.toggle('dark-theme', this.isDarkTheme);
      const darkToggle = document.getElementById('dark-theme-toggle');
      const vibrationToggle = document.getElementById('vibration-toggle');
      const soundToggle = document.getElementById('sound-toggle');
      
      if (darkToggle) darkToggle.checked = this.isDarkTheme;
      if (vibrationToggle) vibrationToggle.checked = this.isVibrationEnabled;
      if (soundToggle) soundToggle.checked = this.isSoundEnabled;
    }
  }
  
  setupParticles() {
    // Simple particle system for background
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
  
  // Victory screen actions
  nextLevel() {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(this.currentDifficulty);
    
    if (currentIndex < difficulties.length - 1) {
      this.currentDifficulty = difficulties[currentIndex + 1];
      this.hideVictory();
      this.generateGame();
      this.showScreen('game-play');
    } else {
      this.showMessage('Congratulations! You completed all levels!', 'success');
    }
  }
  
  playAgain() {
    this.hideVictory();
    this.generateGame();
    this.showScreen('game-play');
  }
  
  goToMenu() {
    this.hideVictory();
    this.showScreen('difficulty-selection');
  }
  
  hideVictory() {
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.add('hidden');
  }
  
  goBack() {
    this.resetToNormalLayout();
    this.showScreen('difficulty-selection');
    this.gameStarted = false;
  }
  
  resetAllProgress() {
    localStorage.clear();
    location.reload();
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.game = new MobileBalanceGame();
});

// Handle visibility change for mobile performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause animations or sounds when app goes to background
  } else {
    // Resume when app comes back to foreground
  }
});

// Background color changing effect
function getRandomColor() {
    let colors = ['#ffebee', '#e8f5e8', '#e3f2fd', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f2f1'];
    let randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

// Enhanced Game state with all features
let gameState = {
    heavyIndex: Math.floor(Math.random() * 6),
    leftSelection: [],
    rightSelection: [],
    weighings: [],
    difficulty: 'easy',
    theme: 'classic',
    balloonCount: 6,
    heavyCount: 1,
    gameStartTime: null,
    moveCount: 0,
    bestScore: localStorage.getItem('bestScore') || '--',
    streak: parseInt(localStorage.getItem('streak')) || 0,
    soundEnabled: true,
    particlesEnabled: false,
    gameHistory: []
};

// Game timer
let gameTimer = null;
let gameTime = 0;

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting game initialization...');
    
    // Add a visible status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'debug-status';
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '10px';
    statusDiv.style.right = '10px';
    statusDiv.style.background = 'rgba(0,0,0,0.8)';
    statusDiv.style.color = 'white';
    statusDiv.style.padding = '10px';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '10000';
    statusDiv.style.fontSize = '12px';
    statusDiv.innerHTML = 'Step 1: DOM loaded ✅<br>';
    document.body.appendChild(statusDiv);
    
    // Show loading screen first
    showLoadingScreen();
    statusDiv.innerHTML += 'Step 2: Loading screen shown ✅<br>';
    
    // Initialize core systems
    console.log('Initializing sounds...');
    initializeMinimalSounds();
    statusDiv.innerHTML += 'Step 3: Sounds initialized ✅<br>';
    
    console.log('Initializing particles...');
    initializeParticles();
    statusDiv.innerHTML += 'Step 4: Particles disabled for performance ✅<br>';
    
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        console.log('Setting up event listeners...');
        setupEventListeners();
        statusDiv.innerHTML += 'Step 5: Event listeners set ✅<br>';
        
        console.log('Initializing game...');
        initializeGame();
        statusDiv.innerHTML += 'Step 6: Game initialized ✅<br>';
        
        // Show welcome message
        setTimeout(() => {
            const messageEl = document.getElementById('message');
            if (messageEl) {
                showMessage("🎈 Welcome! Choose a difficulty to start playing!", 'info');
                console.log('Welcome message shown');
                statusDiv.innerHTML += 'Step 7: Welcome message shown ✅<br>';
            }
            
            // Double-check difficulty system setup
            console.log('Ensuring difficulty system is ready...');
            setupDifficultySystem();
            statusDiv.innerHTML += 'Step 8: Difficulty system ready ✅<br>';
            
            // Initialize drop zone display
            updateDropZoneDisplay();
            statusDiv.innerHTML += 'Step 9: Drop zones initialized ✅<br>';
            console.log('Game initialization complete!');
            statusDiv.innerHTML += 'Step 9: ALL COMPLETE! 🎉<br>';
            
            // Remove status div after 5 seconds
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 5000);
        }, 200);
    }, 100);
});

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        console.log('Loading screen element not found');
        return;
    }
    
    console.log('Loading screen found, showing...');
    
    // Ensure loading screen is visible first
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
    loadingScreen.style.zIndex = '9999';
    
    // Animate loading bar
    const loadingProgress = document.querySelector('.loading-progress');
    if (loadingProgress) {
        loadingProgress.style.width = '0%';
        setTimeout(() => {
            loadingProgress.style.width = '100%';
        }, 100);
    }
    
    // Hide loading screen after everything is loaded
    setTimeout(() => {
        console.log('Hiding loading screen...');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingScreen.classList.add('hidden');
            console.log('Loading complete!');
        }, 500);
    }, 2000);
}

function initializeGame() {
    console.log('Initializing game...');
    
    // Initialize terminal first for cool effect
    initializeTerminal();
    
    // Initialize basic game elements
    updateStatsDisplay();
    
    // Set up systems
    setupThemeSystem();
    setupDifficultySystem();
    setupAchievements();
    
    // Don't create balloons automatically - wait for difficulty selection
    console.log('Game initialized. Select difficulty to start.');
    
    // Start ambient particles (disabled for performance)
    startAmbientParticles();
}

function initializeParticles() {
    // Particles disabled by default for better performance
    // Set gameState.particlesEnabled = true in browser console to re-enable
    gameState.particlesEnabled = false;
    console.log('Particles disabled for performance - set gameState.particlesEnabled = true to enable');
}

// Enhanced Sound System with minimal performance impact
let sounds = {};
let audioContext = null;

function initializeMinimalSounds() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Only essential sounds for better performance
        sounds.hover = createTone(audioContext, 800, 0.05, 0.02);
        sounds.drop = createTone(audioContext, 400, 0.1, 0.05);
        sounds.victory = createSimpleVictorySound(audioContext);
        sounds.weighScale = createTone(audioContext, 200, 0.2, 0.1);
        sounds.error = createTone(audioContext, 300, 0.15, 0.08);
        sounds.success = createTone(audioContext, 440, 0.1, 0.05);
        sounds.select = createTone(audioContext, 660, 0.08, 0.04); // Select sound for guess selection
        
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Initialize terminal with cool startup animation
function initializeTerminal() {
    const terminal = document.querySelector('.code-terminal');
    if (!terminal) return;
    
    // Add startup animation
    terminal.style.opacity = '0';
    terminal.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        terminal.style.transition = 'all 0.8s ease-out';
        terminal.style.opacity = '1';
        terminal.style.transform = 'translateY(0)';
        
        // Simulate terminal startup
        simulateTerminalBoot();
    }, 1000);
}

function simulateTerminalBoot() {
    const logList = document.getElementById('log-list');
    if (!logList) return;
    
    const bootMessages = [
        '> Initializing weighing analysis system...',
        '> Loading quantum scale algorithms...',
        '> Calibrating precision sensors...',
        '> System ready. Awaiting input data...'
    ];
    
    logList.innerHTML = '';
    
    bootMessages.forEach((message, index) => {
        setTimeout(() => {
            const bootLine = document.createElement('div');
            bootLine.style.color = '#7ee787';
            bootLine.style.marginBottom = '5px';
            bootLine.style.fontFamily = 'monospace';
            bootLine.innerHTML = message + '<span class="terminal-cursor">_</span>';
            logList.appendChild(bootLine);
            
            // Remove cursor from previous line
            if (index > 0) {
                const prevLine = logList.children[index - 1];
                if (prevLine) {
                    prevLine.innerHTML = message.replace('> ', '✓ ');
                }
            }
            
            // On last message, clear after a delay
            if (index === bootMessages.length - 1) {
                setTimeout(() => {
                    logList.innerHTML = '';
                }, 2000);
            }
        }, index * 800);
    });
}

function initializeSounds() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Generate enhanced sound effects
        sounds.hover = createTone(audioContext, 800, 0.1, 0.05);
        sounds.grab = createTone(audioContext, 600, 0.2, 0.1);
        sounds.drop = createTone(audioContext, 400, 0.3, 0.15);
        sounds.victory = createVictorySound(audioContext);
        sounds.weighScale = createTone(audioContext, 200, 0.5, 0.2);
        sounds.error = createErrorSound(audioContext);
        sounds.success = createSuccessSound(audioContext);
        sounds.levelUp = createLevelUpSound(audioContext);
        sounds.select = createTone(audioContext, 660, 0.15, 0.08); // Select sound for guess selection
        
    } catch (e) {
        console.log('Audio not supported');
    }
}

function createTone(audioContext, frequency, duration, volume) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {}
    };
}

function createSimpleVictorySound(audioContext) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            [523, 659].forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 200);
            });
        } catch (e) {}
    };
}

function createVictorySound(audioContext) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            [523, 659, 784, 1047, 1319].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.6);
                }, i * 120);
            });
        } catch (e) {}
    };
}

function createErrorSound(audioContext) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            [300, 250].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sawtooth';
                    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.3);
                }, i * 150);
            });
        } catch (e) {}
    };
}

function createSuccessSound(audioContext) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            [440, 554, 659].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.4);
                }, i * 100);
            });
        } catch (e) {}
    };
}

function createLevelUpSound(audioContext) {
    return function() {
        if (!gameState.soundEnabled) return;
        try {
            [220, 277, 330, 440, 554].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'triangle';
                    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.5);
                }, i * 80);
            });
        } catch (e) {}
    };
}

function playSound(soundName) {
    if (sounds[soundName] && gameState.soundEnabled) {
        sounds[soundName]();
    }
}

// Game Timer System
function startGameTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameState.gameStartTime = Date.now();
    gameTime = 0;
    
    gameTimer = setInterval(() => {
        gameTime++;
        updateTimerDisplay();
    }, 1000);
}

function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer').textContent = timeString;
    
    // Also update terminal time
    const terminalTime = document.getElementById('terminal-time');
    if (terminalTime) {
        terminalTime.textContent = timeString;
    }
}

function updateStatsDisplay() {
    const moveCounter = document.getElementById('move-counter');
    const bestScore = document.getElementById('best-score');
    const streak = document.getElementById('streak');
    
    if (moveCounter) moveCounter.textContent = gameState.moveCount;
    if (bestScore) bestScore.textContent = gameState.bestScore;
    if (streak) streak.textContent = gameState.streak;
}

// Enhanced Particle Effects System
function createParticle(x, y, emoji, options = {}) {
    if (!gameState.particlesEnabled) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emoji;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    if (options.size) particle.style.fontSize = options.size + 'px';
    if (options.color) particle.style.color = options.color;
    
    // Add random movement
    if (options.randomMovement) {
        particle.style.setProperty('--random-x', (Math.random() - 0.5) * 200 + 'px');
        particle.style.setProperty('--random-y', (Math.random() - 0.5) * 100 + 'px');
    }
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 3000);
}

function createConfetti(x, y) {
    if (!gameState.particlesEnabled) return;
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3', '#54a0ff'];
    const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '⭐'];
    
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            // Regular confetti
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = (x + Math.random() * 100 - 50) + 'px';
            confetti.style.top = (y + Math.random() * 50 - 25) + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            // Emoji confetti
            if (i % 3 === 0) {
                const emojiConfetti = document.createElement('div');
                emojiConfetti.className = 'particle';
                emojiConfetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emojiConfetti.style.left = (x + Math.random() * 150 - 75) + 'px';
                emojiConfetti.style.top = (y + Math.random() * 75 - 37) + 'px';
                emojiConfetti.style.fontSize = (20 + Math.random() * 10) + 'px';
                
                document.body.appendChild(emojiConfetti);
                
                setTimeout(() => {
                    if (emojiConfetti.parentNode) {
                        emojiConfetti.parentNode.removeChild(emojiConfetti);
                    }
                }, 3000);
            }
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 30);
    }
}

function showCelebration(message) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = message;
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        if (celebration.parentNode) {
            celebration.parentNode.removeChild(celebration);
        }
    }, 2000);
}

function startAmbientParticles() {
    // Disabled for performance - particles can slow down the browser
    console.log('Ambient particles disabled for performance');
    return;
}

// Theme System - Simplified to single theme
function setupThemeSystem() {
    // Keep only the classic theme, no theme switching
    gameState.theme = 'classic';
    console.log('Theme system disabled - using classic theme only');
}

function changeTheme(theme) {
    gameState.theme = theme;
    document.body.className = `theme-${theme}`;
    
    // Update CSS custom properties for theme
    const root = document.documentElement;
    
    const themes = {
        classic: {
            '--primary-color': '#ff6b6b',
            '--secondary-color': '#4ecdc4',
            '--accent-color': '#45b7d1',
            '--bg-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        dark: {
            '--primary-color': '#ff4757',
            '--secondary-color': '#3742fa',
            '--accent-color': '#7bed9f',
            '--bg-gradient': 'linear-gradient(135deg, #2c2c54 0%, #40407a 100%)'
        },
        nature: {
            '--primary-color': '#6ab04c',
            '--secondary-color': '#e58e26',
            '--accent-color': '#fdcb6e',
            '--bg-gradient': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
        },
        space: {
            '--primary-color': '#9c88ff',
            '--secondary-color': '#fbc2eb',
            '--accent-color': '#a8edea',
            '--bg-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        candy: {
            '--primary-color': '#ff9ff3',
            '--secondary-color': '#feca57',
            '--accent-color': '#ff6b6b',
            '--bg-gradient': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
        }
    };
    
    if (themes[theme]) {
        Object.entries(themes[theme]).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }
    
    // Update balloon colors based on theme
    updateBalloonTheme(theme);
}

function updateBalloonTheme(theme) {
    const balloons = document.querySelectorAll('.ball');
    
    const themeColors = {
        classic: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#c44569'],
        dark: ['#ff4757', '#3742fa', '#7bed9f', '#ffa502', '#ff6348', '#70a1ff', '#5352ed', '#7bed9f', '#ffa502', '#ff4757'],
        nature: ['#6ab04c', '#e58e26', '#fdcb6e', '#2ed573', '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#e58e26'],
        space: ['#9c88ff', '#fbc2eb', '#a8edea', '#d1f2eb', '#fad4d4', '#c8d6e5', '#8395a7', '#576574', '#222f3e', '#341f97'],
        candy: ['#ff9ff3', '#feca57', '#ff6b6b', '#4ecdc4', '#45b7d1', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#c44569']
    };
    
    const colors = themeColors[theme] || themeColors.classic;
    
    balloons.forEach((balloon, index) => {
        balloon.style.background = `radial-gradient(circle at 30% 30%, ${colors[index % colors.length]}, ${colors[(index + 1) % colors.length]})`;
    });
}

// Difficulty System - Fixed to work properly
function setupDifficultySystem() {
    console.log('Setting up difficulty system...');
    
    // Wait a moment for DOM to be ready
    setTimeout(() => {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        console.log('Found difficulty buttons:', difficultyButtons.length);
        
        if (difficultyButtons.length > 0) {
            difficultyButtons.forEach((btn, index) => {
                console.log(`Button ${index}:`, btn.dataset.difficulty, btn.textContent.trim());
                
                // Remove any existing listeners
                btn.removeEventListener('click', btn._difficultyHandler);
                
                // Create new handler
                btn._difficultyHandler = function(e) {
                    e.preventDefault();
                    const difficulty = this.dataset.difficulty;
                    console.log('Difficulty button clicked:', difficulty);
                    
                    // Update active button visual feedback
                    difficultyButtons.forEach(b => {
                        b.classList.remove('active');
                        b.style.backgroundColor = '';
                        b.style.color = '';
                    });
                    
                    this.classList.add('active');
                    this.style.backgroundColor = '#4CAF50';
                    this.style.color = 'white';
                    
                    // Change difficulty and create balloons
                    changeDifficulty(difficulty);
                    
                    playSound('success');
                    showMessage(`🎯 Difficulty set to ${difficulty.toUpperCase()}!`, 'success');
                };
                
                // Add the listener
                btn.addEventListener('click', btn._difficultyHandler);
                console.log(`Added listener to ${btn.dataset.difficulty} button`);
            });
            
            // Set default difficulty button as active (Easy)
            const easyBtn = document.querySelector('[data-difficulty="easy"]');
            if (easyBtn) {
                easyBtn.classList.add('active');
                easyBtn.style.backgroundColor = '#4CAF50';
                easyBtn.style.color = 'white';
                console.log('Set Easy as active by default');
                
                // Create balloons for easy mode by default
                changeDifficulty('easy');
            }
        } else {
            console.error('No difficulty buttons found!');
            // Try to create balloons anyway with default settings
            setTimeout(() => createBalloons(), 500);
        }
    }, 200);
}

function changeDifficulty(difficulty) {
    console.log('Changing difficulty to:', difficulty);
    gameState.difficulty = difficulty;
    
    const difficultySettings = {
        easy: { balloonCount: 6, heavyCount: 1 },
        medium: { balloonCount: 10, heavyCount: 1 },
        hard: { balloonCount: 12, heavyCount: 1 },
        expert: { balloonCount: 16, heavyCount: 2 }
    };
    
    const settings = difficultySettings[difficulty] || difficultySettings.easy;
    gameState.balloonCount = settings.balloonCount;
    gameState.heavyCount = settings.heavyCount;
    
    console.log(`Set to ${gameState.balloonCount} balloons, ${gameState.heavyCount} heavy`);
    
    // Clear existing selections
    leftSelection = [];
    rightSelection = [];
    weighings = [];
    gameState.weighings = [];
    gameState.moveCount = 0;
    
    // Create new balloons immediately
    createBalloons();
    
    // Update displays
    updateStatsDisplay();
    const logList = document.getElementById('log-list');
    if (logList) logList.innerHTML = '';
}

// Achievement System
function setupAchievements() {
    const achievements = [
        { id: 'first_win', name: 'First Victory!', description: 'Win your first game', icon: '🏆' },
        { id: 'speed_demon', name: 'Speed Demon', description: 'Win in under 30 seconds', icon: '⚡' },
        { id: 'efficient', name: 'Efficient', description: 'Win with only 2 weighings', icon: '🎯' },
        { id: 'streak_5', name: 'On Fire!', description: 'Win 5 games in a row', icon: '🔥' },
        { id: 'expert_win', name: 'Expert Level', description: 'Win on Expert difficulty', icon: '💎' },
        { id: 'theme_master', name: 'Theme Master', description: 'Try all themes', icon: '🎨' }
    ];
    
    // Load unlocked achievements
    gameState.unlockedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
    
    // Display achievements
    updateAchievementDisplay();
}

function checkAchievements(gameData) {
    const newAchievements = [];
    
    // First win
    if (!gameState.unlockedAchievements.includes('first_win') && gameData.won) {
        unlockAchievement('first_win');
        newAchievements.push('first_win');
    }
    
    // Speed demon
    if (!gameState.unlockedAchievements.includes('speed_demon') && gameData.won && gameData.time < 30) {
        unlockAchievement('speed_demon');
        newAchievements.push('speed_demon');
    }
    
    // Efficient
    if (!gameState.unlockedAchievements.includes('efficient') && gameData.won && gameData.weighings <= 2) {
        unlockAchievement('efficient');
        newAchievements.push('efficient');
    }
    
    // Streak
    if (!gameState.unlockedAchievements.includes('streak_5') && gameState.streak >= 5) {
        unlockAchievement('streak_5');
        newAchievements.push('streak_5');
    }
    
    // Expert win
    if (!gameState.unlockedAchievements.includes('expert_win') && gameData.won && gameState.difficulty === 'expert') {
        unlockAchievement('expert_win');
        newAchievements.push('expert_win');
    }
    
    return newAchievements;
}

function unlockAchievement(achievementId) {
    gameState.unlockedAchievements.push(achievementId);
    localStorage.setItem('achievements', JSON.stringify(gameState.unlockedAchievements));
    
    // Show achievement notification
    showAchievementNotification(achievementId);
    updateAchievementDisplay();
}

function showAchievementNotification(achievementId) {
    const achievements = {
        'first_win': { name: 'First Victory!', icon: '🏆' },
        'speed_demon': { name: 'Speed Demon', icon: '⚡' },
        'efficient': { name: 'Efficient', icon: '🎯' },
        'streak_5': { name: 'On Fire!', icon: '🔥' },
        'expert_win': { name: 'Expert Level', icon: '💎' },
        'theme_master': { name: 'Theme Master', icon: '🎨' }
    };
    
    const achievement = achievements[achievementId];
    if (!achievement) return;
    
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">${achievement.name}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
    
    playSound('levelUp');
}

function updateAchievementDisplay() {
    // This would update an achievements panel if we had one
    // For now, just update the stats
    const achievementCount = gameState.unlockedAchievements ? gameState.unlockedAchievements.length : 0;
    // Could add to stats panel later
}

// Settings System
function setupEventListeners() {
    // Settings toggle
    const settingsBtn = document.getElementById('settings-toggle');
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', () => {
            settingsMenu.classList.toggle('hidden');
            playSound('hover');
        });
    }
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            gameState.soundEnabled = e.target.checked;
            localStorage.setItem('soundEnabled', gameState.soundEnabled);
            if (gameState.soundEnabled) playSound('success');
        });
    }
    
    // Particles toggle
    const particlesToggle = document.getElementById('particles-toggle');
    if (particlesToggle) {
        particlesToggle.addEventListener('change', (e) => {
            gameState.particlesEnabled = e.target.checked;
            localStorage.setItem('particlesEnabled', gameState.particlesEnabled);
            if (gameState.particlesEnabled) playSound('success');
        });
    }
    
    // Load saved settings
    gameState.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    gameState.particlesEnabled = localStorage.getItem('particlesEnabled') !== 'false';
    
    if (soundToggle) soundToggle.checked = gameState.soundEnabled;
    if (particlesToggle) particlesToggle.checked = gameState.particlesEnabled;
    
    // Reset stats button
    const resetStatsBtn = document.getElementById('reset-stats');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                localStorage.clear();
                gameState.bestScore = '--';
                gameState.streak = 0;
                gameState.unlockedAchievements = [];
                updateStatsDisplay();
                playSound('error');
            }
        });
    } else {
        console.log('Reset stats button not found - skipping');
    }
    
    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settings-menu');
        const btn = document.getElementById('settings-toggle');
        
        if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });
    
    // Game control buttons with better error handling
    const weighBtn = document.getElementById('weighBtn');
    const guessBtn = document.getElementById('guessBtn');
    const resetBtn = document.getElementById('resetBtn');
    const hintBtn = document.getElementById('hintBtn');
    const undoBtn = document.getElementById('undoBtn');
    
    console.log('Looking for buttons...');
    console.log('weighBtn found:', !!weighBtn);
    console.log('guessBtn found:', !!guessBtn);
    console.log('resetBtn found:', !!resetBtn);
    console.log('hintBtn found:', !!hintBtn);
    console.log('undoBtn found:', !!undoBtn);
    
    if (weighBtn) {
        weighBtn.addEventListener('click', function(e) {
            console.log('Weigh button clicked!');
            weigh();
        });
        console.log('Weigh button listener added');
    } else {
        console.warn('Weigh button not found!');
    }
    
    if (guessBtn) {
        guessBtn.addEventListener('click', function(e) {
            console.log('Guess button clicked!');
            makeGuess();
        });
        console.log('Guess button listener added');
    } else {
        console.warn('Guess button not found!');
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            console.log('Reset button clicked!');
            resetGame();
        });
        console.log('Reset button listener added');
    } else {
        console.warn('Reset button not found!');
    }
    
    if (hintBtn) {
        hintBtn.addEventListener('click', function(e) {
            console.log('Hint button clicked!');
            showHint();
        });
        console.log('Hint button listener added');
    } else {
        console.warn('Hint button not found!');
    }
    
    if (undoBtn) {
        undoBtn.addEventListener('click', function(e) {
            console.log('Undo button clicked!');
            undoLastMove();
        });
        console.log('Undo button listener added');
    } else {
        console.warn('Undo button not found!');
    }
    
    // Set up drag and drop zones
    const leftDrop = document.getElementById("left-drop");
    const rightDrop = document.getElementById("right-drop");
    const ballsContainer = document.getElementById("balls-container");
    const scaleElement = document.getElementById("scale");
    
    if (leftDrop) {
        leftDrop.addEventListener('dragover', allowDrop);
        leftDrop.addEventListener('dragleave', handleDragLeave);
        leftDrop.addEventListener('drop', drop);
    }
    
    if (rightDrop) {
        rightDrop.addEventListener('dragover', allowDrop);
        rightDrop.addEventListener('dragleave', handleDragLeave);
        rightDrop.addEventListener('drop', drop);
    }
    
    if (ballsContainer) {
        ballsContainer.addEventListener('dragover', allowDrop);
        ballsContainer.addEventListener('dragleave', handleDragLeave);
        ballsContainer.addEventListener('drop', drop);
    }
    
    // Add drag events to the scale itself for visual feedback
    if (scaleElement) {
        scaleElement.addEventListener('dragover', handleScaleDragOver);
        scaleElement.addEventListener('dragleave', handleScaleDragLeave);
    }
}

// Enhanced drag and drop system with improved iPad/touch support
function allowDrop(event) {
    event.preventDefault();
    
    // Immediate visual feedback
    const dropZone = event.currentTarget;
    dropZone.classList.add('drop-hover');
    
    // Add pulsing effect for better feedback
    dropZone.style.transform = 'scale(1.05)';
    dropZone.style.transition = 'all 0.15s ease';
    
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function handleDragLeave(event) {
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drop-hover');
    dropZone.style.transform = 'scale(1)';
}

// Scale-specific drag handling for visual feedback
function handleScaleDragOver(event) {
    event.preventDefault();
    const scaleElement = document.getElementById("scale");
    if (scaleElement) {
        scaleElement.classList.add('drag-over');
        scaleElement.style.transform = 'scale(1.02)';
        scaleElement.style.transition = 'all 0.2s ease';
    }
}

function handleScaleDragLeave(event) {
    const scaleElement = document.getElementById("scale");
    if (scaleElement) {
        scaleElement.classList.remove('drag-over');
        scaleElement.style.transform = 'scale(1)';
    }
}

function drop(event) {
    event.preventDefault();
    
    // Immediate feedback removal
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drop-hover');
    dropZone.style.transform = 'scale(1)';
    
    // Remove scale drag-over effect immediately
    const scaleElement = document.getElementById("scale");
    if (scaleElement) {
        scaleElement.classList.remove('drag-over');
        scaleElement.style.transform = 'scale(1)';
    }
    
    const balloonIndex = parseInt(event.dataTransfer.getData("text/plain"));
    const balloonElement = document.querySelector(`[data-index="${balloonIndex}"]`);
    
    if (!balloonElement) return;
    
    // Instant visual feedback - no delays
    balloonElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Remove from previous location
    if (leftSelection.includes(balloonIndex)) {
        leftSelection = leftSelection.filter(i => i !== balloonIndex);
    }
    if (rightSelection.includes(balloonIndex)) {
        rightSelection = rightSelection.filter(i => i !== balloonIndex);
    }
    
    // Add to new location
    if (dropZone.id === "left-drop") {
        leftSelection.push(balloonIndex);
        
        // Remove placeholder immediately
        const placeholder = dropZone.querySelector('.drop-placeholder');
        if (placeholder) placeholder.remove();
        
    } else if (dropZone.id === "right-drop") {
        rightSelection.push(balloonIndex);
        
        // Remove placeholder immediately
        const placeholder = dropZone.querySelector('.drop-placeholder');
        if (placeholder) placeholder.remove();
        
    } else if (dropZone.id === "balls-container") {
        // Moving back to balloon container
        // Already removed from selections above
    }
    
    // Move the balloon element immediately - no setTimeout
    dropZone.appendChild(balloonElement);
    
    // Immediate sound feedback
    playSound('drop');
    
    // Immediate haptic feedback for mobile
    if (navigator.vibrate) {
        navigator.vibrate(25);
    }
    
    // Quick visual celebration
    balloonElement.style.transform = 'scale(1.15)';
    setTimeout(() => {
        balloonElement.style.transform = 'scale(1)';
    }, 150);
    
    // Add immediate particle effect
    if (gameState.particlesEnabled) {
        const rect = dropZone.getBoundingClientRect();
        createParticle(rect.left + rect.width/2, rect.top + rect.height/2, '💥', { size: 25 });
    }
    
    // Update drop zone display immediately
    updateDropZoneDisplay();
}

function updateDropZoneDisplay() {
    const leftDrop = document.getElementById("left-drop");
    const rightDrop = document.getElementById("right-drop");
    
    // Add placeholders if empty
    if (leftSelection.length === 0 && leftDrop && !leftDrop.querySelector('.drop-placeholder')) {
        leftDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
    }
    
    if (rightSelection.length === 0 && rightDrop && !rightDrop.querySelector('.drop-placeholder')) {
        rightDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
    }
    
    // Update selection count display
    if (leftDrop) leftDrop.setAttribute('data-count', leftSelection.length);
    if (rightDrop) rightDrop.setAttribute('data-count', rightSelection.length);
}

// Enhanced game state management  
function createBalloons() {
    console.log('createBalloons called for difficulty:', gameState.difficulty);
    console.log('Creating', gameState.balloonCount, 'balloons with', gameState.heavyCount, 'heavy');
    
    // Check if balloons container exists
    const balloonsContainer = document.getElementById('balls-container');
    if (!balloonsContainer) {
        console.error('Balloons container not found!');
        showMessage("❌ Game container not found!", 'error');
        return;
    }
    
    // Clear existing balloons and drop zones
    balloonsContainer.innerHTML = '';
    const leftDrop = document.getElementById("left-drop");
    const rightDrop = document.getElementById("right-drop");
    if (leftDrop) leftDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
    if (rightDrop) rightDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
    
    // Generate new heavy balloon index based on difficulty
    if (gameState.heavyCount === 1) {
        heavyIndex = Math.floor(Math.random() * gameState.balloonCount);
        gameState.heavyIndex = heavyIndex;
        console.log('Heavy balloon index:', heavyIndex + 1);
    } else {
        // For multiple heavy balloons, create array
        gameState.heavyIndices = [];
        while (gameState.heavyIndices.length < gameState.heavyCount) {
            const index = Math.floor(Math.random() * gameState.balloonCount);
            if (!gameState.heavyIndices.includes(index)) {
                gameState.heavyIndices.push(index);
            }
        }
        console.log('Heavy balloon indices:', gameState.heavyIndices.map(i => i + 1));
    }
    
    // Create balloons
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#c44569', '#6ab04c', '#e58e26', '#fdcb6e', '#2ed573', '#ff7675'];
    
    for (let i = 0; i < gameState.balloonCount; i++) {
        const balloon = createBalloon(i);
        balloon.style.background = `radial-gradient(circle at 30% 30%, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`;
        balloonsContainer.appendChild(balloon);
    }
    
    console.log('✅ Successfully created', gameState.balloonCount, 'balloons!');
    showMessage(`🎈 ${gameState.balloonCount} balloons created! Find the heavy one(s)!`, 'success');
    
    // Add hover effects after creation
    setTimeout(() => {
        document.querySelectorAll('.ball').forEach(ball => {
            ball.addEventListener('mouseenter', () => playSound('hover'));
        });
    }, 100);
}

function addScreenShake() {
    document.body.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('shake');
    }, 500);
}

// Elements will be accessed directly in functions with null checks

// Create enhanced balloons with variety and theme support
function createBalloon(index) {
    const balloon = document.createElement('div');
    balloon.className = 'ball';
    balloon.draggable = true;
    balloon.dataset.index = index;
    balloon.textContent = `🎈 ${index + 1}`;
    
    // Add click handler for guess selection
    balloon.addEventListener('click', function(e) {
        // Clear previous guess selection
        document.querySelectorAll('.ball').forEach(b => b.classList.remove('guess-selected'));
        
        // Set new guess selection
        guessSelection = parseInt(this.dataset.index);
        this.classList.add('guess-selected');
        
        showMessage(`🎯 Balloon ${index + 1} selected for guess! Click "Guess" to confirm.`, 'info');
        playSound('select');
    });
    
    // Enhanced drag and drop with instant effects and better touch support
    balloon.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.dataset.index);
        this.classList.add('dragging');
        
        // Immediate feedback
        playSound('grab');
        
        // Immediate visual changes
        this.style.boxShadow = '0 0 25px rgba(255, 255, 255, 0.9)';
        this.style.transform = 'scale(1.1) rotate(5deg)';
        this.style.zIndex = '1000';
        this.style.opacity = '0.8';
        
        // Immediate haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
        
        // Create immediate drag trail effect
        if (gameState.particlesEnabled) {
            const rect = this.getBoundingClientRect();
            createParticle(rect.left + rect.width/2, rect.top + rect.height/2, '✨', { size: 20 });
        }
        
        // Add visual cue to valid drop zones
        document.querySelectorAll('.drop-zone, #balls-container').forEach(zone => {
            zone.classList.add('drop-zone-highlight');
        });
    });
    
    balloon.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        this.style.transform = 'scale(1) rotate(0deg)';
        this.style.zIndex = '';
        this.style.opacity = '1';
        
        // Remove drop zone highlights
        document.querySelectorAll('.drop-zone, #balls-container').forEach(zone => {
            zone.classList.remove('drop-zone-highlight');
        });
    });
    
    // Enhanced hover effects with faster response
    balloon.addEventListener('mouseenter', function() {
        if (!this.classList.contains('dragging')) {
            this.style.transform = 'scale(1.1) rotate(3deg)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
            this.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'; // Faster transition
        }
    });
    
    balloon.addEventListener('mouseleave', function() {
        if (!this.classList.contains('dragging')) {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        }
    });
    
    // Enhanced touch support for mobile/iPad
    balloon.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent scrolling
        
        // Immediate visual feedback
        this.style.transform = 'scale(1.15) rotate(5deg)';
        this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.9)';
        this.style.transition = 'all 0.1s ease';
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }
        
        playSound('grab');
    }, { passive: false });
    
    balloon.addEventListener('touchend', function(e) {
        // Reset visual state
        this.style.transform = 'scale(1) rotate(0deg)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    return balloon;
}

// Enhanced weighing function with advanced features - NO RESTRICTIONS!
function weigh() {
    if (leftSelection.length === 0 && rightSelection.length === 0) {
        showMessage("⚠️ Put balloons on at least one side!", 'warning');
        playSound('error');
        addScreenShake();
        return;
    }
    
    // REMOVED: Equal balloon restriction - users now have total control!
    // Players can now weigh any combination of balloons they want
    
    // Increment move counter
    gameState.moveCount++;
    updateStatsDisplay();
    
    // Start timer on first move
    if (gameState.moveCount === 1) {
        startGameTimer();
    }
    
    // Calculate weights with advanced difficulty logic
    let leftWeight = 0;
    let rightWeight = 0;
    
    if (gameState.heavyCount === 1) {
        // Single heavy balloon logic
        leftWeight = leftSelection.includes(heavyIndex) ? leftSelection.length + 1 : leftSelection.length;
        rightWeight = rightSelection.includes(heavyIndex) ? rightSelection.length + 1 : rightSelection.length;
    } else {
        // Multiple heavy balloons logic
        leftWeight = leftSelection.length;
        rightWeight = rightSelection.length;
        
        leftSelection.forEach(index => {
            if (gameState.heavyIndices.includes(index)) leftWeight += 1;
        });
        
        rightSelection.forEach(index => {
            if (gameState.heavyIndices.includes(index)) rightWeight += 1;
        });
    }
    
    // Enhanced visual feedback with animations
    const scaleElement = document.getElementById('scale');
    scaleElement.classList.add('weighing');
    
    // Play weighing sound
    playSound('weighScale');
    
    // Add scale animation and particle effects
    setTimeout(() => {
        let result;
        let message;
        let resultClass;
        
        if (leftWeight > rightWeight) {
            result = '⬅️ Left is heavier!';
            message = '⬅️ LEFT SIDE WINS!';
            resultClass = 'left-heavy';
            
            // Tilt scale left
            scaleElement.style.transform = 'rotate(-10deg)';
            
            if (gameState.particlesEnabled) {
                const leftDropRect = document.getElementById('left-drop').getBoundingClientRect();
                createConfetti(leftDropRect.left + leftDropRect.width/2, leftDropRect.top + leftDropRect.height/2);
            }
            
        } else if (rightWeight > leftWeight) {
            result = '➡️ Right is heavier!';
            message = '➡️ RIGHT SIDE WINS!';
            resultClass = 'right-heavy';
            
            // Tilt scale right
            scaleElement.style.transform = 'rotate(10deg)';
            
            if (gameState.particlesEnabled) {
                const rightDropRect = document.getElementById('right-drop').getBoundingClientRect();
                createConfetti(rightDropRect.left + rightDropRect.width/2, rightDropRect.top + rightDropRect.height/2);
            }
            
        } else {
            result = '⚖️ Both sides are equal!';
            message = '⚖️ PERFECT BALANCE!';
            resultClass = 'balanced';
            
            // Keep scale level
            scaleElement.style.transform = 'rotate(0deg)';
            
            if (gameState.particlesEnabled) {
                const scaleRect = scaleElement.getBoundingClientRect();
                createConfetti(scaleRect.left + scaleRect.width/2, scaleRect.top + scaleRect.height/2);
            }
        }
        
    // Show result with enhanced styling
    showMessage(message, resultClass);
    
    // Enhanced weighing log with icons and styling
    const weighingResult = {
        left: [...leftSelection],
        right: [...rightSelection],
        result: result,
        timestamp: new Date().toLocaleTimeString(),
        leftCount: leftSelection.length,
        rightCount: rightSelection.length
    };
    
    weighings.push(weighingResult);
    gameState.weighings = weighings;        // Update weighing history with enhanced display
        updateWeighingHistory();
        
        // Reset scale animation
        setTimeout(() => {
            scaleElement.classList.remove('weighing');
            scaleElement.style.transform = 'rotate(0deg)';
        }, 2000);
        
    }, 1000);
}

// Enhanced code-style weighing history display
function updateWeighingHistory() {
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    
    weighings.forEach((weighing, index) => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item data-flow';
        
        // Determine result icon and class
        let resultIcon = '⚖️ BALANCED';
        let resultClass = 'balanced';
        
        if (weighing.result.includes('Left')) {
            resultIcon = '⬅️ LEFT_HEAVIER';
            resultClass = 'left-heavy';
        } else if (weighing.result.includes('Right')) {
            resultIcon = '➡️ RIGHT_HEAVIER';
            resultClass = 'right-heavy';
        }
        
        // Format balloon arrays in code style with counts
        const leftArray = weighing.left.length > 0 ? `[${weighing.left.map(i => `${i + 1}`).join(', ')}]` : `[]`;
        const rightArray = weighing.right.length > 0 ? `[${weighing.right.map(i => `${i + 1}`).join(', ')}]` : `[]`;
        const leftCount = weighing.leftCount || weighing.left.length;
        const rightCount = weighing.rightCount || weighing.right.length;
        
        logItem.innerHTML = `
            <div class="weighing-number">${String(index + 1).padStart(3, '0')}</div>
            <div class="weighing-details">
                <div class="weighing-balloons">
                    <span class="left-balloons">${leftArray} (${leftCount})</span>
                    <span class="vs">vs</span>
                    <span class="right-balloons">${rightArray} (${rightCount})</span>
                </div>
                <div class="weighing-result ${resultClass}">
                    ${resultIcon}
                </div>
                <div class="weighing-time">${weighing.timestamp}</div>
            </div>
        `;
        
        // Add with typing effect
        logItem.style.opacity = '0';
        logItem.style.transform = 'translateY(-10px)';
        logList.appendChild(logItem);
        
        setTimeout(() => {
            logItem.style.opacity = '1';
            logItem.style.transform = 'translateY(0)';
        }, index * 100);
        setTimeout(() => {
            logItem.style.opacity = '1';
            logItem.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Enhanced guess function with victory system
function makeGuess() {
    if (guessSelection === null) {
        showMessage("🎯 Click on a balloon to select it, then click Guess!", 'warning');
        playSound('error');
        addScreenShake();
        return;
    }
    
    const guessedIndex = guessSelection;
    let isCorrect = false;
    
    if (gameState.heavyCount === 1) {
        isCorrect = guessedIndex === heavyIndex;
    } else {
        isCorrect = gameState.heavyIndices.includes(guessedIndex);
    }
    
    stopGameTimer();
    
    if (isCorrect) {
        // Victory! 🎉
        const gameData = {
            won: true,
            time: gameTime,
            weighings: weighings.length,
            moves: gameState.moveCount,
            difficulty: gameState.difficulty
        };
        
        // Update statistics
        updateGameStatistics(gameData);
        
        // Check for achievements
        const newAchievements = checkAchievements(gameData);
        
        // Show victory
        showVictory(gameData, newAchievements);
        
    } else {
        // Wrong guess
        gameState.streak = 0;
        localStorage.setItem('streak', gameState.streak);
        updateStatsDisplay();
        
        showMessage(`❌ Wrong! The heavy balloon was #${gameState.heavyCount === 1 ? heavyIndex + 1 : gameState.heavyIndices.map(i => i + 1).join(' and #')}`, 'error');
        playSound('error');
        addScreenShake();
        
        // Show the correct heavy balloon(s)
        if (gameState.heavyCount === 1) {
            highlightBalloon(heavyIndex);
        } else {
            gameState.heavyIndices.forEach(index => highlightBalloon(index));
        }
    }
}

function updateGameStatistics(gameData) {
    // Update best score (lowest moves)
    const currentScore = gameData.moves;
    if (gameState.bestScore === '--' || currentScore < parseInt(gameState.bestScore)) {
        gameState.bestScore = currentScore;
        localStorage.setItem('bestScore', gameState.bestScore);
    }
    
    // Update streak
    gameState.streak++;
    localStorage.setItem('streak', gameState.streak);
    
    // Add to game history
    gameState.gameHistory.push({
        ...gameData,
        date: new Date().toLocaleDateString(),
        theme: gameState.theme
    });
    
    updateStatsDisplay();
}

function showVictory(gameData, newAchievements) {
    // Show victory modal
    const modal = document.getElementById('victory-modal');
    const modalContent = modal.querySelector('.victory-content');
    
    // Update victory stats
    document.getElementById('victory-time').textContent = formatTime(gameData.time);
    document.getElementById('victory-moves').textContent = gameData.moves;
    document.getElementById('victory-weighings').textContent = gameData.weighings;
    document.getElementById('victory-difficulty').textContent = gameData.difficulty.toUpperCase();
    
    // Show achievements if any
    const achievementsDiv = document.getElementById('victory-achievements');
    if (newAchievements.length > 0) {
        achievementsDiv.style.display = 'block';
        achievementsDiv.innerHTML = `
            <h4>🏆 New Achievements!</h4>
            ${newAchievements.map(id => {
                const names = {
                    'first_win': 'First Victory! 🏆',
                    'speed_demon': 'Speed Demon ⚡',
                    'efficient': 'Efficient 🎯',
                    'streak_5': 'On Fire! 🔥',
                    'expert_win': 'Expert Level 💎'
                };
                return `<div class="achievement-item">${names[id] || id}</div>`;
            }).join('')}
        `;
    } else {
        achievementsDiv.style.display = 'none';
    }
    
    modal.classList.add('show');
    
    // Epic victory effects
    playSound('victory');
    
    if (gameState.particlesEnabled) {
        // Create massive celebration
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * window.innerHeight * 0.7;
                    createConfetti(x, y);
                }, i * 100);
            }
        }, 500);
    }
    
    // Add screen flash effect
    document.body.classList.add('victory-flash');
    setTimeout(() => {
        document.body.classList.remove('victory-flash');
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Close victory modal
const playAgainBtn = document.getElementById('play-again-btn');
if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
        const victoryModal = document.getElementById('victory-modal');
        if (victoryModal) {
            victoryModal.classList.remove('show');
        }
        resetGame();
    });
} else {
    console.log('Play again button not found - skipping');
}

function highlightBalloon(index) {
    const balloons = document.querySelectorAll('.ball');
    if (balloons[index]) {
        balloons[index].classList.add('heavy-reveal');
        balloons[index].style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ffd700 50%, #ff6b6b 100%)';
        balloons[index].style.animation = 'heavyPulse 2s infinite';
    }
}

// Enhanced Drop zone logic with effects - moved to setupEventListeners function
// This section is now handled properly in the setupEventListeners function

// Hint system
function showHint() {
    const hints = [
        "💡 Try dividing the balloons into equal groups!",
        "🎯 Use the process of elimination - if both sides are equal, the heavy balloon isn't in either group!",
        "⚖️ Start with 3 balloons on each side for your first weighing!",
        "🧠 Remember which balloons you've already tested!",
        "🎈 The heavy balloon will always make its side tip down!"
    ];
    
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    showMessage(randomHint, 'info');
    playSound('success');
}

// Undo system
function undoLastMove() {
    if (weighings.length === 0) {
        showMessage("❌ No moves to undo!", 'warning');
        playSound('error');
        return;
    }
    
    // Remove last weighing
    weighings.pop();
    gameState.weighings = weighings;
    gameState.moveCount = Math.max(0, gameState.moveCount - 1);
    
    // Update displays
    updateWeighingHistory();
    updateStatsDisplay();
    
    showMessage("↩️ Last move undone!", 'success');
    playSound('success');
}

function resetGame() {
    // Clear selections and weighings
    leftSelection = [];
    rightSelection = [];
    guessSelection = null; // Clear guess selection
    weighings = [];
    gameState.weighings = [];
    gameState.moveCount = 0;
    
    // Stop and reset timer
    stopGameTimer();
    gameTime = 0;
    updateTimerDisplay();
    updateStatsDisplay();
    
    // Clear drop zones with animation
    const leftDrop = document.getElementById("left-drop");
    const rightDrop = document.getElementById("right-drop");
    
    // Animate balloons back to original container
    const balloonsInDrops = [...leftDrop.children, ...rightDrop.children];
    balloonsInDrops.forEach((balloon, index) => {
        setTimeout(() => {
            balloon.style.transition = 'all 0.5s ease';
            balloon.style.transform = 'translateY(-50px)';
            balloon.style.opacity = '0.5';
            
            setTimeout(() => {
                if (balloon.parentNode === leftDrop || balloon.parentNode === rightDrop) {
                    balloon.parentNode.removeChild(balloon);
                }
            }, 500);
        }, index * 100);
    });
    
    // Clear drop zones after animation
    setTimeout(() => {
        leftDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
        rightDrop.innerHTML = '<div class="drop-placeholder">🎈 Drop balloons here 🎈</div>';
    }, 600);
    
    // Recreate balloons with new random heavy balloon(s)
    setTimeout(() => {
        createBalloons();
    }, 700);
    
    // Clear message and reset scale
    showMessage("🎈 New game started! Find the heavy balloon(s)!", 'info');
    
    const scale = document.getElementById("scale");
    scale.classList.remove('weighing');
    scale.style.transform = 'rotate(0deg)';
    
    // Clear weighing history
    const logList = document.getElementById('log-list');
    if (logList) logList.innerHTML = '';
    
    // Play reset sound
    playSound('hover');
    
    // Add reset particle effect
    if (gameState.particlesEnabled) {
        const balloonContainer = document.getElementById('balls-container');
        if (balloonContainer) {
            const rect = balloonContainer.getBoundingClientRect();
            createParticle(rect.left + rect.width/2, rect.top + rect.height/2, '🔄', { size: 30 });
        }
    }
}

// Enhanced message display system
function showMessage(text, type = 'info') {
    const messageElement = document.getElementById("message");
    
    if (!messageElement) {
        console.error('Message element not found!');
        alert(text); // Fallback to alert
        return;
    }
    
    // Clear existing classes and animations
    messageElement.className = 'message';
    
    // Add type-specific styling
    messageElement.classList.add(`message-${type}`);
    
    // Set message with animation
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        messageElement.textContent = text;
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 100);
    
    // Add pulse effect for important messages
    if (type === 'warning' || type === 'error') {
        messageElement.classList.add('pulse');
        setTimeout(() => {
            messageElement.classList.remove('pulse');
        }, 1000);
    }
}

// Initialize external libraries when they load
document.addEventListener('DOMContentLoaded', function() {
    // GSAP animations disabled to prevent errors with missing elements
    console.log('GSAP animations disabled for performance and to prevent errors');
    
    // Initialize Three.js background if available
    if (typeof THREE !== 'undefined') {
        initThreeJSBackground();
    }
});

function initThreeJSBackground() {
    // Three.js background disabled for performance
    console.log('Three.js background disabled for better performance');
    return;
}

// Simple test function - you can call this in browser console
function testButtons() {
    console.log('=== BUTTON TEST ===');
    const buttons = ['weighBtn', 'guessBtn', 'resetBtn', 'hintBtn', 'undoBtn'];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        console.log(`${id}: ${btn ? 'FOUND' : 'NOT FOUND'}`);
        if (btn) {
            console.log(`  - Text: "${btn.textContent}"`);
            console.log(`  - Visible: ${window.getComputedStyle(btn).display !== 'none'}`);
        }
    });
    
    console.log('=== DIFFICULTY BUTTONS TEST ===');
    const diffBtns = document.querySelectorAll('.difficulty-btn');
    console.log(`Found ${diffBtns.length} difficulty buttons`);
    diffBtns.forEach((btn, i) => {
        console.log(`Button ${i}: ${btn.dataset.difficulty} - "${btn.textContent.trim()}"`);
    });
    
    console.log('Try clicking a button and see if this logs anything...');
}

// Force create balloons function
function forceCreateBalloons() {
    console.log('Force creating balloons...');
    gameState.balloonCount = 6;
    gameState.heavyCount = 1;
    createBalloons();
}

// Make test functions globally accessible
window.testButtons = testButtons;
window.forceCreateBalloons = forceCreateBalloons;

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'w':
        case 'W':
            if (e.ctrlKey || e.metaKey) return; // Don't interfere with browser shortcuts
            weigh();
            break;
        case 'g':
        case 'G':
            if (e.ctrlKey || e.metaKey) return;
            makeGuess();
            break;
        case 'r':
        case 'R':
            if (e.ctrlKey || e.metaKey) return;
            resetGame();
            break;
        case 'Escape':
            // Close any open modals or panels
            const victoryModal = document.getElementById('victory-modal');
            const settingsMenu = document.getElementById('settings-menu');
            if (victoryModal) victoryModal.classList.add('hidden');
            if (settingsMenu) settingsMenu.classList.add('hidden');
            break;
        case 't':
        case 'T':
            if (e.ctrlKey || e.metaKey) return;
            testButtons(); // Press T to test buttons
            break;
    }
});
