let routines = JSON.parse(localStorage.getItem('routines')) || {};

const routineSelect = document.getElementById('routine-select');
const restInput = document.getElementById('rest-time');
const currentExerciseDisplay = document.getElementById('current-exercise');
const nextExerciseDisplay = document.getElementById('next-exercise');
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const saveFeedback = document.getElementById('save-feedback');
const setInfo = document.getElementById('set-info');

const startResumeBtn = document.getElementById('start-resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

let isPaused = false;
let animationId = null;

let currentRoutine = null;
let currentExerciseIndex = 0;
let currentSet = 1;
let totalSets = 1;
let inRest = false;
let restDuration = 0;
let setRestDuration = 0;
let startTime = null;
let durationSeconds = 0;

// Load routines into select
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

// Add new exercise
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

  const delBtn = document.createElement('button');
  delBtn.textContent = '×';
  delBtn.className = 'delete-btn';
  delBtn.onclick = () => container.remove();

  container.appendChild(nameInput);
  container.appendChild(label);
  container.appendChild(durationInput);
  container.appendChild(delBtn);

  document.getElementById('exercise-list').appendChild(container);
}

// Save routine
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

  const sets = parseInt(document.getElementById('set-count').value) || 1;
  const setRest = parseInt(document.getElementById('set-rest').value) || 0;
  const exerciseRest = parseInt(document.getElementById('rest-time').value) || 0;

  routines[name] = { exercises, sets, setRest, exerciseRest };
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();

  saveFeedback.textContent = "Routine saved successfully!";
  setTimeout(() => saveFeedback.textContent = "", 3000);
}

// Format time MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Start or resume routine
function startOrResumeRoutine() {
  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine!");

  if (!currentRoutine) {
    currentRoutine = routines[selected].exercises;
    totalSets = routines[selected].sets;
    setRestDuration = routines[selected].setRest;
    restDuration = routines[selected].exerciseRest;

    currentExerciseIndex = 0;
    currentSet = 1;
    inRest = false;
  }

  isPaused = false;
  startResumeBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  runNextStep();
}

// Run next step
function runNextStep() {
  if (!currentRoutine) return resetRoutine();

  // End of all sets
  if (currentSet > totalSets) {
    currentExerciseDisplay.textContent = "Done!";
    nextExerciseDisplay.textContent = "";
    timerDisplay.textContent = "00:00";
    progressBar.style.width = "100%";
    startResumeBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    currentRoutine = null;
    return;
  }

  // End of current set
  if (currentExerciseIndex >= currentRoutine.length) {
    if (currentSet < totalSets) {
      inRest = true;
      currentExerciseIndex = 0;
      currentSet++;
      startCountdown(setRestDuration, "Rest", "setRest");
    } else {
      currentSet++;
      runNextStep();
    }
    return;
  }

  // Normal exercise
  const ex = currentRoutine[currentExerciseIndex];
  const label = (totalSets > 1 ? `Set ${currentSet} - ` : "") + ex.name;
  startCountdown(ex.duration, label, "exercise");
}

// Countdown
function startCountdown(duration, label, type = "exercise") {
  durationSeconds = duration;
  startTime = performance.now();
  inRest = type !== "exercise";
  currentExerciseDisplay.textContent = label;
  setInfo.textContent = `Set ${currentSet} of ${totalSets}`;

  function update() {
    if (isPaused) {
      animationId = requestAnimationFrame(update);
      return;
    }

    const elapsed = (performance.now() - startTime) / 1000;
    let secondsLeft = Math.max(durationSeconds - elapsed, 0);
    timerDisplay.textContent = formatTime(Math.ceil(secondsLeft));
    const percent = ((durationSeconds - secondsLeft) / durationSeconds) * 100;
    progressBar.style.width = `${percent}%`;

    // Show next exercise during rest
    if (inRest) {
      if (currentExerciseIndex < currentRoutine.length) {
        nextExerciseDisplay.textContent = `Next: ${currentRoutine[currentExerciseIndex].name}`;
      } else {
        nextExerciseDisplay.textContent = "";
      }
    } else {
      if (currentExerciseIndex < currentRoutine.length - 1) {
        nextExerciseDisplay.textContent = `Next: ${currentRoutine[currentExerciseIndex + 1].name}`;
      } else {
        nextExerciseDisplay.textContent = "";
      }
    }

    if (secondsLeft > 0) {
      animationId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationId);
      animationId = null;

      if (type === "exercise") {
        inRest = true;
        currentExerciseIndex++;
        if (restDuration > 0) startCountdown(restDuration, "Rest", "exerciseRest");
        else runNextStep();
      } else {
        inRest = false;
        runNextStep();
      }
    }
  }

  animationId = requestAnimationFrame(update);
}

// Pause
function pauseRoutine() {
  if (!animationId) return;
  isPaused = true;
  pauseBtn.disabled = true;
  startResumeBtn.disabled = false;
}

// Reset
function resetRoutine() {
  cancelAnimationFrame(animationId);
  animationId = null;
  currentRoutine = null;
  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  isPaused = false;

  timerDisplay.textContent = "00:00";
  currentExerciseDisplay.textContent = "";
  nextExerciseDisplay.textContent = "";
  setInfo.textContent = "";
  progressBar.style.width = "0%";
  progressBar.style.backgroundColor = "#28a745";

  startResumeBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

// Delete routine
function deleteRoutine() {
  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine to delete!");
  if (!confirm(`Delete routine "${selected}"?`)) return;

  delete routines[selected];
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  resetRoutine();
}

// Initialize with one exercise if none
if (document.querySelectorAll('.exercise-item').length === 0) addExercise();
