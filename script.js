let routines = JSON.parse(localStorage.getItem("routines") || "{}");
let routine = null;
let routineIndex = 0;
let setIndex = 1;
let timer = null;
let timeLeft = 0;
let totalTime = 0;
let state = "idle"; // "idle", "exercise", "restExercise", "restSet"

function saveRoutine() {
  const name = document.getElementById("routine-name").value.trim();
  const sets = parseInt(document.getElementById("set-count").value) || 1;
  const setRest = parseInt(document.getElementById("set-rest").value) || 0;
  const restTime = parseInt(document.getElementById("rest-time").value) || 0;

  if (!name) { alert("Please enter a routine name."); return; }

  const exercises = [];
  document.querySelectorAll("#exercise-list .exercise-item").forEach(item => {
    const exName = item.querySelector(".exercise-name").value.trim();
    const exDuration = parseInt(item.querySelector(".exercise-duration").value);
    if (exName && exDuration > 0) exercises.push({ name: exName, duration: exDuration });
  });

  if (exercises.length === 0) { alert("Please add at least one exercise."); return; }

  routines[name] = { sets, setRest, restTime, exercises };
  localStorage.setItem("routines", JSON.stringify(routines));
  updateRoutineSelect();
  document.getElementById("save-feedback").textContent = "Routine saved!";
}

function updateRoutineSelect() {
  const select = document.getElementById("routine-select");
  select.innerHTML = "";
  for (const name in routines) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
}

function deleteRoutine() {
  const select = document.getElementById("routine-select");
  const name = select.value;
  if (name && confirm(`Delete routine "${name}"?`)) {
    delete routines[name];
    localStorage.setItem("routines", JSON.stringify(routines));
    updateRoutineSelect();
  }
}

function addExercise() {
  const div = document.createElement("div");
  div.className = "exercise-item";
  div.innerHTML = `
    <input type="text" class="exercise-name" placeholder="Exercise Name" />
    <input type="number" class="exercise-duration" value="30" min="1" />
    <button type="button" class="delete-exercise" onclick="deleteExercise(this)">✖</button>
  `;
  document.getElementById("exercise-list").appendChild(div);
}

function deleteExercise(btn) { btn.parentElement.remove(); }

function startOrResumeRoutine() {
  if (!routine) {
    const select = document.getElementById("routine-select");
    const name = select.value;
    if (!name) { alert("Please select a routine."); return; }
    routine = routines[name];
    routineIndex = 0;
    setIndex = 1;
    state = "exercise";
  }

  document.getElementById("start-resume-btn").disabled = true;
  document.getElementById("pause-btn").disabled = false;

  if (timeLeft === 0) startNextInterval();
  else startTimer();
}

function pauseRoutine() {
  clearInterval(timer);
  document.getElementById("start-resume-btn").disabled = false;
  document.getElementById("pause-btn").disabled = true;
}

function resetRoutine() {
  clearInterval(timer);
  routine = null;
  routineIndex = 0;
  setIndex = 1;
  state = "idle";
  timeLeft = 0;
  document.getElementById("timer").textContent = "00:00";
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("progress-bar").className = "";
  document.getElementById("current-exercise").textContent = "";
  document.getElementById("next-exercise").textContent = "";
  document.getElementById("current-set").textContent = "";
  document.getElementById("start-resume-btn").disabled = false;
  document.getElementById("pause-btn").disabled = true;
}

function startNextInterval() {
  if (!routine) return;

  if (state === "exercise") {
    const exercise = routine.exercises[routineIndex];
    timeLeft = exercise.duration;
    totalTime = timeLeft;
    updateDisplay(exercise.name, "exercise");
    startTimer();
  } else if (state === "restExercise") {
    timeLeft = routine.restTime;
    totalTime = timeLeft;
    updateDisplay("Rest", "restExercise");
    startTimer();
  } else if (state === "restSet") {
    timeLeft = routine.setRest;
    totalTime = timeLeft;
    updateDisplay("Rest", "restSet");
    startTimer();
  }
}

function startTimer() {
  clearInterval(timer);
  const startTime = Date.now();
  const endTime = startTime + timeLeft * 1000;
  const progressBar = document.getElementById("progress-bar");

  timer = setInterval(() => {
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    timeLeft = Math.ceil(remainingMs / 1000);
    updateTimer();

    const elapsed = (totalTime * 1000 - remainingMs) / (totalTime * 1000);
    progressBar.style.width = Math.min(elapsed * 100, 100) + "%";

    if (remainingMs <= 0) {
      clearInterval(timer);

      if (state === "exercise") {
        if (routineIndex < routine.exercises.length - 1) state = "restExercise";
        else if (setIndex < routine.sets) state = "restSet";
        else { 
          document.getElementById("current-exercise").textContent = "Routine complete!";
          document.getElementById("next-exercise").textContent = "";
          document.getElementById("timer").textContent = "00:00";
          progressBar.style.width = "100%";
          return; 
        }
      } else if (state === "restExercise") {
        routineIndex++;
        state = "exercise";
      } else if (state === "restSet") {
        routineIndex = 0;
        setIndex++;
        state = "exercise";
      }

      startNextInterval();
    }
  }, 50);
  updateTimer();
}

function updateTimer() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

function updateDisplay(name, type) {
  const progressBar = document.getElementById("progress-bar");

  document.getElementById("current-set").textContent = `Set ${setIndex} of ${routine.sets}`;
  document.getElementById("current-exercise").textContent = name;

  progressBar.className = "";
  if (type === "exercise") progressBar.classList.add("exercise");
  else if (type === "restExercise") progressBar.classList.add("rest-exercise");
  else if (type === "restSet") progressBar.classList.add("rest-set");

  let nextText = "";
  if (type === "exercise") {
    if (routineIndex < routine.exercises.length - 1) nextText = `Next: ${routine.exercises[routineIndex + 1].name}`;
    else if (setIndex < routine.sets) nextText = `Next: Set Rest`;
  } else if (type === "restExercise") {
    nextText = routineIndex + 1 < routine.exercises.length ?
      `Next: ${routine.exercises[routineIndex + 1].name}` :
      setIndex < routine.sets ? `Next: Rest between sets (${routine.setRest}s)` : "";
  } else if (type === "restSet") {
    nextText = `Next: ${routine.exercises[0].name}`;
  }
  document.getElementById("next-exercise").textContent = nextText;
}

updateRoutineSelect();

