document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded ✅");

  const form = document.getElementById("addForm");
  const list = document.getElementById("peopleList");

  const dashFocus = document.getElementById("dashFocus");
  const dashPause = document.getElementById("dashPause");
  const dashAction = document.getElementById("dashAction");

  const nameInput = document.getElementById("name");
  const notesInput = document.getElementById("notes");
  const reminderInput = document.getElementById("reminder");

  const focusMinus = document.getElementById("focusMinus");
  const focusPlus = document.getElementById("focusPlus");
  const focusValue = document.getElementById("focusValue");

  const statusBtns = document.querySelectorAll(".status-btn");

  let people = JSON.parse(localStorage.getItem("rizzPeople")) || [];
  let focus = 0;
  let status = null;

  function save() {
    localStorage.setItem("rizzPeople", JSON.stringify(people));
  }

  function render() {
    list.innerHTML = "";

    if (!people.length) {
      dashFocus.textContent = "—";
      dashPause.textContent = "—";
      dashAction.textContent = "Add someone to begin.";
      return;
    }

    const focusPerson = people.reduce((a, b) => a.focus > b.focus ? a : b);
    const pausePerson = people.find(p => p.status === "pause");

    dashFocus.textContent = focusPerson.name;
    dashPause.textContent = pausePerson ? pausePerson.name : "—";
    dashAction.textContent =
      focusPerson.focus >= 70
        ? "High priority. Call or see them soon."
        : "Maintain balance.";

    people.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "person";
      div.innerHTML = `
        <strong>${p.name}</strong> (${p.status})
        <div class="bar"><span style="width:${p.focus}%"></span></div>
        <small>${p.focus}% focus</small>
        ${p.reminder ? `<p>⏰ ${p.reminder}</p>` : ""}
        <button class="remove">Remove</button>
      `;
      div.querySelector(".remove").onclick = () => {
        people.splice(i, 1);
        save();
        render();
      };
      list.appendChild(div);
    });
  }

  statusBtns.forEach(btn => {
    btn.onclick = () => {
      statusBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      status = btn.dataset.status;
    };
  });

  focusPlus.onclick = () => {
    focus = Math.min(100, focus + 10);
    focusValue.textContent = focus + "%";
  };

  focusMinus.onclick = () => {
    focus = Math.max(0, focus - 10);
    focusValue.textContent = focus + "%";
  };

  form.onsubmit = e => {
    e.preventDefault();
    if (!nameInput.value || !status) return;

    people.push({
      name: nameInput.value.trim(),
      status,
      focus,
      notes: notesInput.value.trim(),
      reminder: reminderInput.value.trim()
    });

    save();
    render();

    form.reset();
    focus = 0;
    focusValue.textContent = "0%";
    status = null;
    statusBtns.forEach(b => b.classList.remove("active"));
  };

  render();
});
