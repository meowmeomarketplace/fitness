let routines = JSON.parse(localStorage.getItem('routines')) || {}; 

const routineSelect = document.getElementById('routine-select');
const restInput = document.getElementById('rest-time');
const currentExerciseDisplay = document.getElementById('current-exercise');
const nextExerciseDisplay = document.getElementById('next-exercise');
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const saveFeedback = document.getElementById('save-feedback');

const startResumeBtn = document.getElementById('start-resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const beep = document.getElementById('beep-sound');

let isPaused = false;
let animationId = null;

let currentRoutine = null;
let currentExerciseIndex = 0;
let currentSet = 1;
let totalSets = 1;
let inRest = false;
let restType = "";
let restDuration = 0;
let startTime = null;
let durationSeconds = 0;

// Load routines
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

// Add Exercise
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

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-exercise';
  deleteBtn.textContent = "X";
  deleteBtn.onclick = () => container.remove();

  container.appendChild(nameInput);
  container.appendChild(label);
  container.appendChild(durationInput);
  container.appendChild(deleteBtn);

  document.getElementById('exercise-list').appendChild(container);
}

// Delete an exercise row (for existing HTML rows)
function deleteExercise(button) {
  const item = button.parentElement;
  item.remove();
}

// Save Routine
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

  saveFeedback.textContent = "Routine saved successfully!";
  setTimeout(() => saveFeedback.textContent = "", 3000);
}

// Format time
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Start or Resume
function startOrResumeRoutine() {
  if (isPaused && currentRoutine) {
    isPaused = false;
    startResumeBtn.disabled = true;
    pauseBtn.disabled = false;
    startCountdown();
    return;
  }

  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine!");

  const routineData = routines[selected];
  if (!routineData || routineData.exercises.length === 0) return alert("Routine has no exercises!");

  currentRoutine = routineData.exercises;
  totalSets = routineData.sets;
  setRestDuration = routineData.setRest;
  restDuration = parseInt(restInput.value) || 0;

  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;

  startResumeBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  runNextStep();
}

// Run next step
function runNextStep() {
  if (!currentRoutine) return resetRoutine();

  if (currentSet > totalSets) {
    currentExerciseDisplay.textContent = "Done!";
    nextExerciseDisplay.textContent = "";
    timerDisplay.textContent = "00:00";
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "#28a745";
    startResumeBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    currentRoutine = null;
    return;
  }

  if (currentExerciseIndex === 0 && inRest && setRestDuration > 0) {
    startCountdown(setRestDuration, "Rest", "setRest");
    return;
  }

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

  const ex = currentRoutine[currentExerciseIndex];
  const label = (totalSets > 1 ? `Set ${currentSet}\n` : "") + ex.name;

  let nextLabel = "";
  if (inRest && currentExerciseIndex + 1 < currentRoutine.length) {
    nextLabel = currentRoutine[currentExerciseIndex + 1].name;
  }

  nextExerciseDisplay.textContent = nextLabel;

  startCountdown(ex.duration, label, "exercise");
}

// Countdown
function startCountdown(duration, label, type = "exercise") {
  durationSeconds = duration;
  startTime = performance.now();
  inRest = (type !== "exercise") ? true : false;
  restType = type;

  if (type === "exercise") progressBar.style.backgroundColor = "#28a745";
  else if (type === "setRest") progressBar.style.backgroundColor = "#007bff";
  else progressBar.style.backgroundColor = "#ffc107";

  currentExerciseDisplay.textContent = label;

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

    if (secondsLeft <= 3 && secondsLeft > 0) {
      try { beep.currentTime = 0; beep.play(); } catch {}
    }

    if (secondsLeft > 0) {
      animationId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationId);
      animationId = null;
      if (type === "exercise") {
        inRest = true;
        currentExerciseIndex++;
        if (restDuration > 0) startCountdown(restDuration, currentRoutine[currentExerciseIndex]?.name || "", "exerciseRest");
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

if (document.querySelectorAll('.exercise-item').length === 0) addExercise();
