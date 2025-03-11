// Main application JavaScript file

// Load family data from JSON file
let familyData = [];

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the JSON file
        const response = await fetch('familyData.json');
        const data = await response.json();
        
        // Set the familyData from the JSON response
        familyData = data.familyData;
        
        // Initialize the table view (default view)
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

// Helper function to extract year from Star Wars date format
function extractYearFromStarWarsDate(dateStr) {
    if (!dateStr) return 'Unknown';
    
    const match = dateStr.match(/(\d+)\s+(BBY|ABY)/);
    if (!match) return dateStr; // Just return original if format doesn't match
    
    const year = match[1];
    const era = match[2];
    
    return `${year} ${era}`;
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

// Track whether tree and timeline views have been initialized
let treeInitialized = false;
let timelineInitialized = false;

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
// Tree View
// ------------------------------

// Initialize the tree view
function initTreeView() {
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.innerHTML = ''; // Clear existing content
    
    // Group people by generation
    const generations = {};
    familyData.forEach(person => {
        if (!generations[person.generation]) {
            generations[person.generation] = [];
        }
        generations[person.generation].push(person);
    });
    
    // Create the tree structure from oldest (4) to youngest (1) generation
    for (let gen = 4; gen >= 1; gen--) {
        if (!generations[gen]) continue;
        
        // Create generation row
        const genRow = document.createElement('div');
        genRow.className = 'generation-row';
        genRow.setAttribute('data-generation', gen);
        
        // Add generation label
        const genLabel = document.createElement('div');
        genLabel.className = 'generation-label';
        genLabel.textContent = getGenerationName(gen);
        genRow.appendChild(genLabel);
        
        // Sort people within this generation alphabetically by last name, then first name
        const sortedGeneration = [...generations[gen]].sort((a, b) => {
            if (a.lastName === b.lastName) {
                return a.firstName.localeCompare(b.firstName);
            }
            return a.lastName.localeCompare(b.lastName);
        });
        
        // Add person cards for this generation
        sortedGeneration.forEach(person => {
            const personCard = createPersonCard(person);
            genRow.appendChild(personCard);
        });
        
        treeContainer.appendChild(genRow);
    }
    
    // Add family connections (after all rows are created)
    drawFamilyConnections();
}

// Create a person card for the tree view
function createPersonCard(person) {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.setAttribute('data-id', person.id);
    
    const nameElem = document.createElement('div');
    nameElem.className = 'person-name';
    nameElem.textContent = getFullName(person);
    
    const datesElem = document.createElement('div');
    datesElem.className = 'person-dates';
    datesElem.textContent = `${person.dateOfBirth || '?'} - ${person.dateOfDeath || 'Present'}`;
    
    const locationElem = document.createElement('div');
    locationElem.className = 'person-location';
    locationElem.textContent = person.location.split(',')[0]; // Just show first part of location
    
    card.appendChild(nameElem);
    card.appendChild(datesElem);
    card.appendChild(locationElem);
    
    // Add click event to show details
    card.addEventListener('click', () => {
        showPersonDetails(person.id);
    });
    
    return card;
}

// Draw connections between family members
function drawFamilyConnections() {
    // This is a simplified approach to visualize connections
    
    // Loop through each person to draw connections to their parents
    familyData.forEach(person => {
        if (person.parentIds.length === 0) return; // Skip if no parents
        
        const personCard = document.querySelector(`.person-card[data-id="${person.id}"]`);
        if (!personCard) return; // Skip if card not found in DOM
        
        // For each parent, draw a connection
        person.parentIds.forEach(parentId => {
            const parentCard = document.querySelector(`.person-card[data-id="${parentId}"]`);
            if (!parentCard) return; // Skip if parent card not found
            
            // Get positions for connection points
            const personRect = personCard.getBoundingClientRect();
            const parentRect = parentCard.getBoundingClientRect();
            const treeRect = document.getElementById('treeContainer').getBoundingClientRect();
            
            // Create connection element
            const connection = document.createElement('div');
            connection.className = 'family-connection';
            
            // Calculate relative positions (adjusted to tree container)
            const startX = (parentRect.left + parentRect.width/2) - treeRect.left;
            const startY = (parentRect.bottom) - treeRect.top;
            const endX = (personRect.left + personRect.width/2) - treeRect.left;
            const endY = personRect.top - treeRect.top;
            
            // Set connection path using a linear path
            // First create a vertical line from parent
            const verticalLine = document.createElement('div');
            verticalLine.className = 'connector vertical-connector';
            verticalLine.style.left = `${startX}px`;
            verticalLine.style.top = `${startY}px`;
            verticalLine.style.height = `${Math.max(15, (endY - startY) / 2)}px`; // At least 15px tall
            
            // Then create a horizontal connector if needed
            if (Math.abs(startX - endX) > 5) { // Only if there's significant horizontal distance
                const horizontalLine = document.createElement('div');
                horizontalLine.className = 'connector horizontal-connector';
                
                // Determine which way to draw the line
                if (startX < endX) {
                    horizontalLine.style.left = `${startX}px`;
                    horizontalLine.style.width = `${endX - startX}px`;
                } else {
                    horizontalLine.style.left = `${endX}px`;
                    horizontalLine.style.width = `${startX - endX}px`;
                }
                
                // Position at midpoint of vertical distance
                horizontalLine.style.top = `${startY + (endY - startY) / 2}px`;
                document.getElementById('treeContainer').appendChild(horizontalLine);
            }
            
            // Finally the vertical line to the child
            const verticalLine2 = document.createElement('div');
            verticalLine2.className = 'connector vertical-connector';
            verticalLine2.style.left = `${endX}px`;
            verticalLine2.style.top = `${startY + (endY - startY) / 2}px`;
            verticalLine2.style.height = `${(endY - startY) / 2}px`;
            
            // Add all connectors to the tree container
            document.getElementById('treeContainer').appendChild(verticalLine);
            document.getElementById('treeContainer').appendChild(verticalLine2);
        });
    });
}

// ------------------------------
// Timeline View
// ------------------------------

// Initialize the timeline view
function initTimelineView() {
    const timelineContainer = document.getElementById('timelineContainer');
    timelineContainer.innerHTML = ''; // Clear existing content
    
    // Add the vertical timeline line
    const timelineLine = document.createElement('div');
    timelineLine.className = 'timeline-line';
    timelineContainer.appendChild(timelineLine);
    
    // Sort people by birth date (oldest first)
    const sortedByBirth = [...familyData].sort((a, b) => {
        return sortStarWarsDate(a.dateOfBirth, b.dateOfBirth, 'asc');
    });
    
    // Create timeline items
    sortedByBirth.forEach(person => {
        // Create timeline item container
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        // Add birth year as the date label
        const birthYear = extractYearFromStarWarsDate(person.dateOfBirth);
        const dateLabel = document.createElement('div');
        dateLabel.className = 'timeline-date';
        dateLabel.textContent = birthYear;
        timelineItem.appendChild(dateLabel);
        
        // Create the card with person details
        const timelineCard = document.createElement('div');
        timelineCard.className = 'timeline-card';
        
        // Add person's name, lifespan, and basic info
        timelineCard.innerHTML = `
            <div class="person-name">${getFullName(person)}</div>
            <div class="person-dates">
                ${formatDate(person.dateOfBirth)} - ${formatDate(person.dateOfDeath)}
            </div>
            <div class="person-location">${person.location}</div>
            <div class="person-generation">${getGenerationName(person.generation)}</div>
        `;
        
        // Add click event to show details
        timelineCard.addEventListener('click', () => {
            showPersonDetails(person.id);
        });
        
        timelineItem.appendChild(timelineCard);
        timelineContainer.appendChild(timelineItem);
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