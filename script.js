let routines = JSON.parse(localStorage.getItem('routines')) || {}; 

const routineSelect = document.getElementById('routine-select');
const restInput = document.getElementById('rest-time');
const currentExerciseDisplay = document.getElementById('current-exercise');
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');

const startResumeBtn = document.getElementById('start-resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const beep = document.getElementById('beep-sound');  // Added beep audio element reference

let timerInterval = null;
let isPaused = false;
let secondsLeft = 0;

let currentRoutine = null;
let currentExerciseIndex = 0;
let inRest = false;
let restDuration = 0;

function loadRoutines() {
  routineSelect.innerHTML = "";
  Object.keys(routines).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    routineSelect.appendChild(opt);
  });
}
loadRoutines();

function addExercise() {
  const container = document.createElement('div');
  container.className = 'exercise-item';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'exercise-name';
  nameInput.placeholder = 'Exercise Name';

  const label = document.createElement('label');
  label.textContent = "Duration (seconds):";

  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.className = 'exercise-duration';
  durationInput.value = 30;
  durationInput.min = 1;

  container.appendChild(nameInput);
  container.appendChild(label);
  container.appendChild(durationInput);

  document.getElementById('exercise-list').appendChild(container);
}

function saveRoutine() {
  const name = document.getElementById('routine-name').value.trim();
  if (!name) return alert("Enter a routine name!");

  const items = [...document.querySelectorAll('.exercise-item')];
  const exercises = items.map(item => {
    const exerciseName = item.querySelector('.exercise-name').value.trim();
    const duration = parseInt(item.querySelector('.exercise-duration').value);
    return exerciseName && duration && duration > 0 ? { name: exerciseName, duration } : null;
  }).filter(Boolean);

  if (exercises.length === 0) return alert("Add at least one valid exercise!");

  routines[name] = exercises;
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  alert("Routine saved!");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay(originalDuration) {
  timerDisplay.textContent = formatTime(secondsLeft);
  const percent = ((originalDuration - secondsLeft) / originalDuration) * 100;
  progressBar.style.width = `${percent}%`;
}

function countdownStep(duration, label, callback) {
  secondsLeft = duration;
  updateTimerDisplay(duration);
  currentExerciseDisplay.textContent = label;

  timerInterval = setInterval(() => {
    if (!isPaused) {
      secondsLeft--;

      // Play beep sound for last 3 seconds
      if (secondsLeft > 0 && secondsLeft <= 3) {
        try {
          beep.currentTime = 0;  // Rewind to the start of the sound
          beep.play();           // Play the beep sound
        } catch (e) {
          console.error("Error playing sound:", e); // Error handling for audio issues
        }
      }

      updateTimerDisplay(duration);

      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        callback();  // Execute callback when timer ends
      }
    }
  }, 1000);
}

function startOrResumeRoutine() {
  if (isPaused && currentRoutine) {
    isPaused = false;
    pauseBtn.disabled = false;
    startResumeBtn.disabled = true;
    return;
  }

  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine!");

  currentRoutine = routines[selected];
  if (!currentRoutine || currentRoutine.length === 0) return alert("Routine has no exercises!");

  restDuration = parseInt(restInput.value) || 0;

  currentExerciseIndex = 0;
  inRest = false;
  isPaused = false;

  startResumeBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  runNextStep();
}

function runNextStep() {
  if (!currentRoutine) return resetRoutine();

  if (currentExerciseIndex >= currentRoutine.length) {
    currentExerciseDisplay.textContent = "Done!";
    timerDisplay.textContent = "00:00";
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#28a745';  // Green color when done (exercise completed)

    startResumeBtn.disabled = false;
    startResumeBtn.innerHTML = "&#9654;"; // Reset to Start icon
    pauseBtn.disabled = true;
    resetBtn.disabled = true;

    currentRoutine = null;
    return;
  }

  // When resting
  if (inRest && restDuration > 0) {
    progressBar.style.backgroundColor = '#ffc107';  // Yellow during rest
    countdownStep(restDuration, "Rest", () => {
      inRest = false;
      runNextStep();
    });
  } else {
    // During exercise
    const ex = currentRoutine[currentExerciseIndex];
    progressBar.style.backgroundColor = '#28a745';  // Green during exercise
    countdownStep(ex.duration, ex.name, () => {
      inRest = true;
      currentExerciseIndex++;
      runNextStep();
    });
  }
}

function pauseRoutine() {
  if (!timerInterval) return;
  isPaused = true;
  pauseBtn.disabled = true;
  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;"; // Resume icon
}

function resetRoutine() {
  clearInterval(timerInterval);
  timerInterval = null;
  currentRoutine = null;
  currentExerciseIndex = 0;
  inRest = false;
  isPaused = false;

  timerDisplay.textContent = "00:00";
  currentExerciseDisplay.textContent = "";
  progressBar.style.width = '0%';
  progressBar.style.backgroundColor = '#28a745';  // Reset to green

  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;";
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

function deleteRoutine() {
  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine to delete!");
  if (!confirm(`Delete routine "${selected}"?`)) return;

  delete routines[selected];
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  resetRoutine();
}

if (document.querySelectorAll('.exercise-item').length === 0) addExercise();
