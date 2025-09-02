let routines = JSON.parse(localStorage.getItem('routines')) || {}; 

const routineSelect = document.getElementById('routine-select');
const restInput = document.getElementById('rest-time');
const currentExerciseDisplay = document.getElementById('current-exercise');
const timerDisplay = document.getElementById('timer');
const nextExerciseDisplay = document.getElementById('next-exercise');
const progressBar = document.getElementById('progress-bar');

const startResumeBtn = document.getElementById('start-resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const beep = document.getElementById('beep-sound');

let timerInterval = null;
let isPaused = false;
let secondsLeft = 0;

let currentRoutine = null;
let currentExerciseIndex = 0;
let currentSet = 1;
let totalSets = 1;
let inRest = false;
let restType = ""; // "exercise" or "set"
let restDuration = 0;
let setRestDuration = 0;

// Load routines from localStorage
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

// Add exercise input
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

  routines[name] = { exercises, sets, setRest };
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  alert("Routine saved!");
}

// Format seconds to MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Start or resume routine
function startOrResumeRoutine() {
  if (isPaused && currentRoutine) {
    isPaused = false;
    pauseBtn.disabled = false;
    startResumeBtn.disabled = true;
    return;
  }

  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine!");

  const routineObj = routines[selected];
  if (!routineObj || !routineObj.exercises.length) return alert("Routine has no exercises!");

  currentRoutine = routineObj;
  totalSets = routineObj.sets || 1;
  setRestDuration = routineObj.setRest || 0;
  restDuration = parseInt(restInput.value) || 0;

  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  restType = "";
  isPaused = false;

  startResumeBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  runNextStep();
}

// Run next step (exercise/rest/set)
function runNextStep() {
  if (!currentRoutine) return resetRoutine();

  const exercises = currentRoutine.exercises;

  // Finished all exercises in current set
  if (currentExerciseIndex >= exercises.length) {
    if (currentSet < totalSets) {
      if (setRestDuration > 0) {
        inRest = true;
        restType = "set";
        nextExerciseDisplay.textContent = "";
        countdown(setRestDuration, "Rest Between Sets", "#007bff", () => {
          inRest = false;
          restType = "";
          currentExerciseIndex = 0;
          currentSet++;
          runNextStep();
        });
        return;
      } else {
        currentSet++;
        currentExerciseIndex = 0;
        inRest = false;
        runNextStep();
        return;
      }
    } else {
      currentExerciseDisplay.textContent = "Done!";
      timerDisplay.textContent = "00:00";
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = '#28a745';
      nextExerciseDisplay.textContent = "";
      startResumeBtn.disabled = false;
      startResumeBtn.innerHTML = "&#9654;";
      pauseBtn.disabled = true;
      resetBtn.disabled = true;
      currentRoutine = null;
      return;
    }
  }

  const exercise = exercises[currentExerciseIndex];

  if (inRest && restType === "exercise" && restDuration > 0) {
    nextExerciseDisplay.textContent = "Next: " + exercise.name;
    countdown(restDuration, "Rest", "#ffc107", () => {
      inRest = false;
      restType = "";
      runNextStep();
    });
  } else {
    let label = "";
    if (totalSets > 1) label += `Set ${currentSet}\n`;
    label += exercise.name;
    currentExerciseDisplay.textContent = label;
    nextExerciseDisplay.textContent = "";

    countdown(exercise.duration, exercise.name, "#28a745", () => {
      currentExerciseIndex++;
      if (currentExerciseIndex < exercises.length && restDuration > 0) {
        inRest = true;
        restType = "exercise";
      }
      runNextStep();
    });
  }
}

// Countdown function with smooth progress
function countdown(duration, label, color, callback) {
  clearInterval(timerInterval);
  let start = Date.now();
  let end = start + duration * 1000;
  progressBar.style.backgroundColor = color;

  timerInterval = setInterval(() => {
    if (isPaused) return;
    let now = Date.now();
    let remaining = Math.max(0, Math.round((end - now) / 1000));
    let percent = Math.min(100, ((duration - remaining) / duration) * 100);

    timerDisplay.textContent = formatTime(remaining);
    progressBar.style.width = percent + "%";

    if (remaining <= 3 && remaining > 0) {
      try { beep.currentTime = 0; beep.play(); } catch {}
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      callback();
    }
  }, 100);
}

// Pause routine
function pauseRoutine() {
  isPaused = true;
  pauseBtn.disabled = true;
  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;";
}

// Reset routine
function resetRoutine() {
  clearInterval(timerInterval);
  timerInterval = null;
  isPaused = false;
  currentRoutine = null;
  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  restType = "";
  timerDisplay.textContent = "00:00";
  currentExerciseDisplay.textContent = "";
  nextExerciseDisplay.textContent = "";
  progressBar.style.width = '0%';
  progressBar.style.backgroundColor = '#28a745';
  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;";
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

// Add initial exercise if none exists
if (document.querySelectorAll('.exercise-item').length === 0) addExercise();
