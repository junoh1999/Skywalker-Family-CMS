// Main application JavaScript file
let familyData = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the JSON file
        const response = await fetch('familyData.json');
        const data = await response.json();
        
        // Set the familyData from the JSON response
        familyData = data.familyData;
        
        // Initialize the table view once data is loaded
        initTableView();
    } catch (error) {
        console.error('Error loading family data:', error);
    }
});


// ------------------------------
// Utility Functions
// ------------------------------

// Format birth/death dates for display
function formatDate(date) {
    if (!date) return 'N/A';
    return date; // Star Wars dates are already in string format (BBY/ABY)
}

// Get generation name based on number
function getGenerationName(genNumber) {
    switch(genNumber) {
        case 1: return 'Current Generation';
        case 2: return 'Parents';
        case 3: return 'Grandparents';
        case 4: return 'Great-grandparents';
        default: return `Generation ${genNumber}`;
    }
}

// Get full name of a person
function getFullName(person) {
    return `${person.firstName} ${person.lastName}`;
}

// Get person object by ID
function getPersonById(id) {
    return familyData.find(person => person.id === id);
}

// ------------------------------
// View Management
// ------------------------------

// Get DOM elements for view navigation
const tableViewBtn = document.getElementById('tableViewBtn');
const treeViewBtn = document.getElementById('treeViewBtn');
const timelineViewBtn = document.getElementById('timelineViewBtn');
const tableView = document.getElementById('tableView');
const treeView = document.getElementById('treeView');
const timelineView = document.getElementById('timelineView');

// View switching function
function switchView(viewName) {
    // Hide all views
    tableView.classList.remove('active');
    treeView.classList.remove('active');
    timelineView.classList.remove('active');
    
    // Remove active class from all buttons
    tableViewBtn.classList.remove('active');
    treeViewBtn.classList.remove('active');
    timelineViewBtn.classList.remove('active');
    
    // Show the selected view and activate its button
    if (viewName === 'table') {
        tableView.classList.add('active');
        tableViewBtn.classList.add('active');
    } else if (viewName === 'tree') {
        treeView.classList.add('active');
        treeViewBtn.classList.add('active');
        if (!treeInitialized) {
            initTreeView();
            treeInitialized = true;
        }
    } else if (viewName === 'timeline') {
        timelineView.classList.add('active');
        timelineViewBtn.classList.add('active');
        if (!timelineInitialized) {
            initTimelineView();
            timelineInitialized = true;
        }
    }
}

// Add event listeners to view buttons
tableViewBtn.addEventListener('click', () => switchView('table'));
treeViewBtn.addEventListener('click', () => switchView('tree'));
timelineViewBtn.addEventListener('click', () => switchView('timeline'));

// Track whether tree and timeline views have been initialized
let treeInitialized = false;
let timelineInitialized = false;

// ------------------------------
// Table View
// ------------------------------

// Variables for sorting
let currentSortColumn = 'firstName';
let sortDirection = 'asc';


// Initialize the table view
function initTableView() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    // Sort the data
    const sortedData = sortData(familyData, currentSortColumn, sortDirection);
    
    // Create table rows
    sortedData.forEach(person => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${person.firstName}</td>
            <td>${person.lastName}</td>
            <td>${person.location}</td>
            <td>${formatDate(person.dateOfBirth)}</td>
            <td>${formatDate(person.dateOfDeath)}</td>
            <td>${getGenerationName(person.generation)}</td>
        `;
        
        // Add click event to show details
        row.addEventListener('click', () => {
            showPersonDetails(person.id);
        });
        
        tableBody.appendChild(row);
    });
    
    // Set up sorting
    setupTableSorting();
}

// Sort data based on column and direction
function sortData(data, column, direction) {
    return [...data].sort((a, b) => {
        // Handle null values
        if (a[column] === null) return direction === 'asc' ? 1 : -1;
        if (b[column] === null) return direction === 'asc' ? -1 : 1;
        
        // Special handling for birth/death dates (BBY/ABY format)
        if (column === 'dateOfBirth' || column === 'dateOfDeath') {
            return sortStarWarsDate(a[column], b[column], direction);
        }
        
        // Default string comparison
        if (direction === 'asc') {
            return a[column] > b[column] ? 1 : -1;
        } else {
            return a[column] < b[column] ? 1 : -1;
        }
    });
}

// Special function to sort Star Wars dates (BBY/ABY)
function sortStarWarsDate(dateA, dateB, direction) {
    if (!dateA) return direction === 'asc' ? 1 : -1;
    if (!dateB) return direction === 'asc' ? -1 : 1;
    
    const getYearValue = (dateStr) => {
        const match = dateStr.match(/(\d+)\s+(BBY|ABY)/);
        if (!match) return 0;
        
        const year = parseInt(match[1]);
        const era = match[2];
        
        // Convert all to a single number timeline where BBY is negative
        return era === 'BBY' ? -year : year;
    };
    
    const yearA = getYearValue(dateA);
    const yearB = getYearValue(dateB);
    
    return direction === 'asc' ? yearA - yearB : yearB - yearA;
}

// Set up table column sorting
function setupTableSorting() {
    const tableHeaders = document.querySelectorAll('#familyTable th[data-sort]');
    
    // Reset all headers
    tableHeaders.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.getAttribute('data-sort') === currentSortColumn) {
            header.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    // Add click handlers
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            
            // If clicking the same column, just toggle direction
            if (column === currentSortColumn) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                currentSortColumn = column;
                sortDirection = 'asc';
            }
            
            // Re-init the table with new sort
            initTableView();
        });
    });
}

// ------------------------------
// Person Details Modal
// ------------------------------

// Get modal elements
const modal = document.getElementById('personModal');
const modalClose = document.querySelector('.close');
const modalName = document.getElementById('modalName');
const modalLocation = document.getElementById('modalLocation');
const modalBirth = document.getElementById('modalBirth');
const modalDeath = document.getElementById('modalDeath');
const modalGeneration = document.getElementById('modalGeneration');
const parentsList = document.getElementById('parentsList');
const siblingsList = document.getElementById('siblingsList');
const childrenList = document.getElementById('childrenList');

// Close modal when clicking X
modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Helper to add a relationship item to a list
function addRelationshipItem(listElement, person) {
    const item = document.createElement('div');
    item.className = 'relationship-item';
    item.textContent = getFullName(person);
    item.addEventListener('click', () => {
        showPersonDetails(person.id);
    });
    listElement.appendChild(item);
}

// Show person details in modal
function showPersonDetails(personId) {
    const person = getPersonById(personId);
    if (!person) return;
    
    // Set basic details
    modalName.textContent = getFullName(person);
    modalLocation.textContent = person.location;
    modalBirth.textContent = formatDate(person.dateOfBirth);
    modalDeath.textContent = formatDate(person.dateOfDeath);
    modalGeneration.textContent = getGenerationName(person.generation);
    
    // Clear relationship lists
    parentsList.innerHTML = '';
    siblingsList.innerHTML = '';
    childrenList.innerHTML = '';
    
    // Add parents
    if (person.parentIds.length > 0) {
        document.getElementById('parentsSection').style.display = 'block';
        person.parentIds.forEach(parentId => {
            const parent = getPersonById(parentId);
            if (parent) {
                addRelationshipItem(parentsList, parent);
            }
        });
    } else {
        document.getElementById('parentsSection').style.display = 'none';
    }
    
    // Add siblings
    if (person.siblingIds.length > 0) {
        document.getElementById('siblingsSection').style.display = 'block';
        person.siblingIds.forEach(siblingId => {
            const sibling = getPersonById(siblingId);
            if (sibling) {
                addRelationshipItem(siblingsList, sibling);
            }
        });
    } else {
        document.getElementById('siblingsSection').style.display = 'none';
    }
    
    // Add children
    if (person.childrenIds.length > 0) {
        document.getElementById('childrenSection').style.display = 'block';
        person.childrenIds.forEach(childId => {
            const child = getPersonById(childId);
            if (child) {
                addRelationshipItem(childrenList, child);
            }
        });
    } else {
        document.getElementById('childrenSection').style.display = 'none';
    }
    
    // Show the modal
    modal.style.display = 'block';
}