/* ---------- CONSTANTS ---------- */
const UPDATE_ALLOWED_COLUMNS = ['backlog', 'todo'];
const STORAGE_KEY = 'kanban_data';

/* ---------- STATE ---------- */
let draggedCard = null;
let editingCard = null;

/* ---------- ELEMENTS ---------- */
const columns = document.querySelectorAll('.column');
const cards = document.querySelectorAll('.card');
const addTaskBtn = document.querySelector('#add-column-btn');

const modalOverlay = document.querySelector('#modal-overlay');
const addTaskForm = document.querySelector('#add-task-form');
const cancelBtn = document.querySelector('#cancel-btn');
const modalTitle = modalOverlay.querySelector('h2');
const modalSubmitBtn = modalOverlay.querySelector('.btn-submit');

/* ---------- INITIALIZATION ---------- */
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    // If no data was loaded (fresh start), attach events to existing static cards
    // Note: loadData clears columns if data exists, so this only runs for fresh static DOM if we didn't wipe it.
    // However, to ensure consistency, if loadData finds nothing, we stick with static. 
    // If it finds data, it rebuilds.
    // We should re-query cards if we rebuilt the DOM, but event delegation handles clicks.
    // Drag events need to be attached to NEW cards.
    
    // For static cards that might still be there (if no storage):
    document.querySelectorAll('.card').forEach(card => attachDragEvents(card));
});

/* ---------- PERSISTENCE ---------- */
function saveData() {
    const data = {};
    columns.forEach(column => {
        const columnCards = [];
        column.querySelectorAll('.card').forEach(card => {
            columnCards.push({
                title: card.querySelector('h3').textContent,
                desc: card.querySelector('p').textContent
            });
        });
        data[column.id] = columnCards;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return;

    // Refined Load: Clear only cards before rebuilding
    columns.forEach(column => {
        const existingCards = column.querySelectorAll('.card');
        existingCards.forEach(c => c.remove());
    });

    // Actually, simpler to rebuild cleanly.
    // But structure is: 
    // <div class="column">
    //    <div class="column-header">...</div>
    //    <div class="card">...</div>
    // </div>
    
    // Refined Load Logic:
    Object.keys(data).forEach(columnId => {
        const column = document.getElementById(columnId);
        if (!column) return;

        // Clear only cards
        const existingCards = column.querySelectorAll('.card');
        existingCards.forEach(c => c.remove());

        // Rebuild
        data[columnId].forEach(cardData => {
            const card = createCardDOM(cardData.title, cardData.desc);
            column.appendChild(card);
            // Ensure buttons are correct for this column
            updateCardButtons(card, columnId);
        });
        
        // Update count
        updateCount(column);
    });
}

function updateCount(column) {
    const countSpan = column.querySelector('.column-header span');
    if (countSpan) {
        countSpan.textContent = column.querySelectorAll('.card').length;
    }
}

/* ---------- DOM HELPERS ---------- */
function createCardDOM(title, desc) {
    const newCard = document.createElement('div');
    newCard.className = 'card';
    newCard.draggable = true;
    newCard.innerHTML = `
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="card-actions">
        <button class="update">Update</button>
        <button class="delete">Delete</button>
      </div>
    `;
    attachDragEvents(newCard);
    return newCard;
}

/* ---------- DRAG LOGIC ---------- */
function attachDragEvents(card) {
  card.addEventListener('dragstart', () => {
    draggedCard = card;
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
    saveData(); // Save on drop finish
  });
}

/* ---------- COLUMN EVENTS ---------- */
columns.forEach(column => {
  column.addEventListener('dragover', e => {
    e.preventDefault();
    column.classList.add('drag-over');
  });

  column.addEventListener('dragleave', () => {
    column.classList.remove('drag-over');
  });

  column.addEventListener('drop', () => {
    column.classList.remove('drag-over');
    if (!draggedCard) return;

    column.appendChild(draggedCard);
    updateCardButtons(draggedCard, column.id);
    updateCount(column);
    saveData();
  });
});

/* ---------- BUTTON VISIBILITY ---------- */
function updateCardButtons(card, columnId) {
  const actions = card.querySelector('.card-actions');
  if (!actions) return;

  let updateBtn = actions.querySelector('.update');
  const needsUpdate = UPDATE_ALLOWED_COLUMNS.includes(columnId);

  if (needsUpdate && !updateBtn) {
    updateBtn = document.createElement('button');
    updateBtn.className = 'update';
    updateBtn.textContent = 'Update';
    actions.prepend(updateBtn);
  }

  if (!needsUpdate && updateBtn) {
    updateBtn.remove();
  }
}

/* ---------- EVENT DELEGATION (BUTTONS) ---------- */
document.addEventListener('click', e => {
  const updateBtn = e.target.closest('.update');
  const deleteBtn = e.target.closest('.delete');

  if (updateBtn) {
    const card = updateBtn.closest('.card');
    openEditModal(card);
  }

  if (deleteBtn) {
    const card = deleteBtn.closest('.card');
    if (confirm('Are you sure you want to delete this task?')) {
      const column = card.parentElement;
      card.remove();
      updateCount(column);
      saveData();
    }
  }
});

/* ---------- MODAL HELPERS ---------- */
function openEditModal(card) {
  editingCard = card;

  document.querySelector('#task-title').value =
    card.querySelector('h3').textContent;

  document.querySelector('#task-desc').value =
    card.querySelector('p').textContent;

  modalTitle.textContent = 'Edit Task';
  modalSubmitBtn.textContent = 'Save Changes';
  modalOverlay.classList.remove('hidden');
}

function openAddModal() {
  editingCard = null;
  addTaskForm.reset();
  modalTitle.textContent = 'Add New Task';
  modalSubmitBtn.textContent = 'Add Task';
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  addTaskForm.reset();
}

/* ---------- MODAL EVENTS ---------- */
addTaskBtn.addEventListener('click', openAddModal);

cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
});

modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
});

/* ---------- FORM SUBMIT ---------- */
addTaskForm.addEventListener('submit', e => {
  e.preventDefault();

  const title = document.querySelector('#task-title').value.trim();
  const desc = document.querySelector('#task-desc').value.trim();

  if (!title) return;

  if (editingCard) {
    // UPDATE CARD
    editingCard.querySelector('h3').textContent = title;
    editingCard.querySelector('p').textContent = desc;
  } else {
    // CREATE CARD
    const newCard = createCardDOM(title, desc);
    document.querySelector('#todo').appendChild(newCard); // Default to To Do
  }

  // Update counts and Save
  columns.forEach(col => updateCount(col));
  saveData();

  closeModal();
});
