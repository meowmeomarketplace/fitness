let routines = JSON.parse(localStorage.getItem("routines") || "{}");
let routine = null;
let routineIndex = 0;
let setIndex = 1;
let isRest = false;
let timer = null;
let timeLeft = 0;
let totalTime = 0;

function saveRoutine() {
  const name = document.getElementById("routine-name").value.trim();
  const sets = parseInt(document.getElementById("set-count").value) || 1;
  const setRest = parseInt(document.getElementById("set-rest").value) || 0;
  const restTime = parseInt(document.getElementById("rest-time").value) || 0;

  if (!name) {
    alert("Please enter a routine name.");
    return;
  }

  const exercises = [];
  document.querySelectorAll("#exercise-list .exercise-item").forEach(item => {
    const exName = item.querySelector(".exercise-name").value.trim();
    const exDuration = parseInt(item.querySelector(".exercise-duration").value);
    if (exName && exDuration > 0) {
      exercises.push({ name: exName, duration: exDuration });
    }
  });

  if (exercises.length === 0) {
    alert("Please add at least one exercise.");
    return;
  }

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
    <label>Duration (seconds):</label>
    <input type="number" class="exercise-duration" value="30" min="1" />
    <button type="button" class="delete-exercise" onclick="deleteExercise(this)">✖</button>
  `;
  document.getElementById("exercise-list").appendChild(div);
}

function deleteExercise(btn) {
  btn.parentElement.remove();
}

function startOrResumeRoutine() {
  if (!routine) {
    const select = document.getElementById("routine-select");
    const name = select.value;
    if (!name) {
      alert("Please select a routine.");
      return;
    }
    routine = routines[name];
    routineIndex = 0;
    setIndex = 1;
  }

  document.getElementById("start-resume-btn").disabled = true;
  document.getElementById("pause-btn").disabled = false;

  if (timeLeft === 0) {
    loadExercise();
  } else {
    startTimer();
  }
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
  isRest = false;
  timeLeft = 0;
  document.getElementById("timer").textContent = "00:00";
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("current-exercise").textContent = "";
  document.getElementById("next-exercise").textContent = "";
  document.getElementById("current-set").textContent = "";
  document.getElementById("start-resume-btn").disabled = false;
  document.getElementById("pause-btn").disabled = true;
}

function loadExercise() {
  if (routineIndex >= routine.exercises.length) {
    if (setIndex < routine.sets) {
      isRest = true;
      timeLeft = routine.setRest;
      totalTime = timeLeft;
      routineIndex = 0;
      setIndex++;
      updateDisplay("Rest");
      startTimer();
      return;
    } else {
      resetRoutine();
      alert("Routine complete!");
      return;
    }
  }

  const exercise = routine.exercises[routineIndex];
  if (isRest) {
    isRest = false;
    routineIndex++;
    loadExercise();
    return;
  }

  timeLeft = exercise.duration;
  totalTime = timeLeft;
  updateDisplay(exercise.name);
  startTimer();
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      if (isRest) {
        isRest = false;
        loadExercise();
      } else {
        if (routineIndex < routine.exercises.length - 1) {
          isRest = true;
          timeLeft = routine.restTime;
          totalTime = timeLeft;
          updateDisplay("Rest");
          startTimer();
        } else {
          routineIndex++;
          loadExercise();
        }
      }
    }
  }, 1000);
  updateTimer();
}

function updateTimer() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  const percent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  document.getElementById("progress-bar").style.width = percent + "%";
}

function updateDisplay(name) {
  document.getElementById("current-exercise").textContent = name;
  document.getElementById("current-set").textContent = `Set ${setIndex} of ${routine.sets}`;

  // Show next exercise ONLY (skip showing "Rest")
  let nextText = "";
  if (name === "Rest") {
    if (routineIndex < routine.exercises.length) {
      nextText = "Next: " + routine.exercises[routineIndex].name;
    }
  } else {
    if (routineIndex + 1 < routine.exercises.length) {
      nextText = "Next: " + routine.exercises[routineIndex + 1].name;
    }
  }
  document.getElementById("next-exercise").textContent = nextText;
}

updateRoutineSelect();
