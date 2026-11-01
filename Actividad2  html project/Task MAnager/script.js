"use strict";

// ============================================
// TASKMANAGER - APLICACION COMPLETA
// JavaScript Vanilla ES6+
// ============================================

// 1. CONFIGURACION Y ELEMENTOS DEL DOM

const STORAGE_KEY = "taskmanager_tasks_v1";

const taskForm = document.getElementById("taskForm");
const taskIdInput = document.getElementById("taskId");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priorityInput = document.getElementById("priority");

const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formMessage = document.getElementById("formMessage");

const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

const loadApiButton = document.getElementById("loadApiButton");
const apiMessage = document.getElementById("apiMessage");

// 2. ESTADO INICIAL Y LOCALSTORAGE

let tasks = loadTasksFromStorage();

function loadTasksFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    // Validar los datos recuperados.
    return parsed.filter((task) => {
      return (
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.description === "string" &&
        ["Alta", "Media", "Baja"].includes(task.priority) &&
        typeof task.completed === "boolean" &&
        typeof task.createdAt === "string" &&
        !Number.isNaN(Date.parse(task.createdAt))
      );
    });
  } catch (error) {
    console.error("No se pudieron cargar las tareas:", error);
    return [];
  }
}

function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar las tareas:", error);

    showFormMessage(
      "No se pudo guardar en el navegador. Revisa el almacenamiento disponible.",
      "error"
    );

    return false;
  }
}

// 3. UTILIDADES

function generateId() {
  if (typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return ${Date.now()}-${Math.random().toString(36).slice(2)};
}

function showFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = message ${type};
}

function showApiMessage(message, type = "") {
  apiMessage.textContent = message;
  apiMessage.className = message ${type};
}

function createTask(title, description, priority) {
  return {
    id: generateId(),
    title,
    description,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

// 4. CREAR O EDITAR TAREAS: CREATE Y UPDATE

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const priority = priorityInput.value;
  const id = taskIdInput.value;

  // Validar el título vacío.
  if (title.length === 0) {
    showFormMessage("El título de la tarea es obligatorio.", "error");
    titleInput.focus();
    return;
  }

  // Validar los límites del formulario.
  if (title.length > 100 || description.length > 500) {
    showFormMessage("Revisa la longitud de los campos.", "error");
    return;
  }

  if (!["Alta", "Media", "Baja"].includes(priority)) {
    showFormMessage("Selecciona una prioridad válida.", "error");
    return;
  }

  if (id) {
    // UPDATE: modificar una tarea existente.
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      showFormMessage("No se encontró la tarea que deseas editar.", "error");
      resetForm();
      return;
    }

    task.title = title;
    task.description = description;
    task.priority = priority;

    saveTasksToStorage();
    resetForm();
    renderTasks();
    showFormMessage("Tarea actualizada correctamente.", "success");
  } else {
    // CREATE: añadir una nueva tarea al arreglo.
    const newTask = createTask(title, description, priority);

    tasks.push(newTask);

    saveTasksToStorage();
    resetForm();
    renderTasks();
    showFormMessage("Tarea creada correctamente.", "success");
  }
});

// 5. EDITAR TAREA

function editTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  taskIdInput.value = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  priorityInput.value = task.priority;

  formTitle.textContent = "Editar tarea";
  saveButton.textContent = "Guardar cambios";
  cancelButton.hidden = false;

  showFormMessage("Modifica los campos y guarda los cambios.");

  document.getElementById("formPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  titleInput.focus({ preventScroll: true });
}

// 6. ELIMINAR TAREA

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  const confirmed = window.confirm(
    ¿Estás seguro de eliminar "${task.title}"?
  );

  if (!confirmed) return;

  // DELETE: conservar las tareas cuyo ID sea diferente.
  tasks = tasks.filter((item) => item.id !== id);

  if (taskIdInput.value === id) {
    resetForm();
  }

  saveTasksToStorage();
  renderTasks();
  showFormMessage("Tarea eliminada correctamente.", "success");
}

// 7. MARCAR COMO COMPLETADA O PENDIENTE

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  task.completed = !task.completed;

  saveTasksToStorage();
  renderTasks();
}

// 8. RESTABLECER EL FORMULARIO

function resetForm() {
  taskForm.reset();
  taskIdInput.value = "";

  formTitle.textContent = "Agregar nueva tarea";
  saveButton.textContent = "+ Agregar tarea";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showFormMessage("Edición cancelada.");
});

// 9. BUSQUEDA, FILTROS Y ORDENAMIENTO

function getVisibleTasks() {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedSort = sortSelect.value;

  // filter(): buscar y filtrar por estado.
  const filteredTasks = tasks.filter((task) => {
    const matchesTitle = task.title
      .toLowerCase()
      .includes(searchText);

    const matchesStatus =
      selectedStatus === "Todas" ||
      (selectedStatus === "Pendientes" && !task.completed) ||
      (selectedStatus === "Completadas" && task.completed);

    return matchesTitle && matchesStatus;
  });

  // sort(): ordenar una copia para no modificar el arreglo original.
  const priorityOrder = {
    Alta: 3,
    Media: 2,
    Baja: 1
  };

  return filteredTasks.sort((a, b) => {
    if (selectedSort === "prioridad") {
      return priorityOrder[b.priority] - priorityOrder[a.priority] ||
        new Date(b.createdAt) - new Date(a.createdAt);
    }

    // Fecha: más recientes primero.
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// 10. CREAR ELEMENTOS DE TAREA DE FORMA SEGURA

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

// 11. RENDERIZAR LAS TAREAS EN EL DOM

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.replaceChildren();

  taskCount.textContent =
    `${visibleTasks.length} ${
      visibleTasks.length === 1 ? "tarea" : "tareas"
    }`;

  if (visibleTasks.length === 0) {
    const emptyState = createElement("div", "empty-state");
    const icon = createElement("div", "empty-icon", "📝");

    const heading = createElement(
      "h3",
      "",
      tasks.length === 0
        ? "Aún no tienes tareas"
        : "No se encontraron tareas"
    );

    const message = createElement(
      "p",
      "",
      tasks.length === 0
        ? "Agrega tu primera tarea usando el formulario."
        : "Prueba con otra búsqueda o cambia los filtros."
    );

    emptyState.append(icon, heading, message);
    taskList.appendChild(emptyState);
  } else {
    visibleTasks.forEach((task) => {
      const card = createElement(
        "article",
        task.completed ? "task-card completed" : "task-card"
      );

      const heading = createElement("h3", "", task.title);

      const description = createElement(
        "p",
        "task-description",
        task.description || "Sin descripción"
      );

      const meta = createElement("div", "task-meta");

      const priority = createElement(
        "span",
        priority priority-${task.priority},
        Prioridad ${task.priority}
      );

      const status = createElement(
        "span",
        "status",
        task.completed ? "Completada" : "Pendiente"
      );

      const date = createElement(
        "small",
        "task-date",
        Creada: ${formatDate(task.createdAt)}
      );

      meta.append(priority, status);

      const actions = createElement("div", "task-actions");

      const completeButton = createElement(
        "button",
        "",
        task.completed ? "Reabrir" : "Completar"
      );

      completeButton.type = "button";
      completeButton.setAttribute(
        "aria-label",
        ${task.completed ? "Reabrir" : "Completar"} tarea ${task.title}
      );

      completeButton.addEventListener("click", () => {
        toggleTask(task.id);
      });

      const editButton = createElement(
        "button",
        "btn-secondary",
        "Editar"
      );

      editButton.type = "button";
      editButton.addEventListener("click", () => {
        editTask(task.id);
      });

      const deleteButton = createElement(
        "button",
        "danger",
        "Eliminar"
      );

      deleteButton.type = "button";
      deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
      });

      actions.append(completeButton, editButton, deleteButton);

      card.append(heading, description, meta, date, actions);
      taskList.appendChild(card);
    });
  }

  updateDashboard();
}

// 12. DASHBOARD REACTIVO

function updateDashboard() {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const pending = tasks.filter(
    (task) => !task.completed
  ).length;

  totalTasks.textContent = total;
  pendingTasks.textContent = pending;
  completedTasks.textContent = completed;
}

// 13. CONSUMO DE API REST CON FETCH Y ASYNC/AWAIT

async function loadTasksFromAPI() {
  loadApiButton.disabled = true;
  loadApiButton.textContent = "Cargando...";
  showApiMessage("Consultando la API externa...");

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/todos?_limit=5"
    );

    if (!response.ok) {
      throw new Error(Error HTTP: ${response.status});
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("La respuesta de la API no es válida.");
    }

    // Importar solo tareas que no estén ya importadas.
    // sourceId evita duplicar la misma tarea de ejemplo.
    const importedIds = new Set(
      tasks
        .filter((task) => task.sourceId)
        .map((task) => task.sourceId)
    );

    const newTasks = data
      .filter((item) => !importedIds.has(item.id))
      .map((item) => ({
        id: generateId(),
        sourceId: item.id,
        title: String(item.title).slice(0, 100),
        description: "Tarea importada desde JSONPlaceholder.",
        priority: "Media",
        completed: Boolean(item.completed),
        createdAt: new Date().toISOString()
      }));

    tasks.push(...newTasks);

    saveTasksToStorage();
    renderTasks();

    if (newTasks.length === 0) {
      showApiMessage(
        "Estas tareas ya habían sido importadas.",
        "success"
      );
    } else {
      showApiMessage(
        Se importaron ${newTasks.length} tareas correctamente.,
        "success"
      );
    }
  } catch (error) {
    console.error("Error al consultar la API:", error);

    showApiMessage(
      "No se pudo consultar la API. Comprueba tu conexión e inténtalo de nuevo.",
      "error"
    );
  } finally {
    loadApiButton.disabled = false;
    loadApiButton.textContent = "Cargar tareas desde la API";
  }
}

loadApiButton.addEventListener("click", loadTasksFromAPI);

// 14. INICIAR LA APLICACION

renderTasks();

console.log("TaskManager iniciado correctamente.");
console.log("CRUD, filtros, búsqueda, ordenamiento y almacenamiento activados.");