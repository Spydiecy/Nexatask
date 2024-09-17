// Initialize users and tasks if they don't exist in localStorage
if (!localStorage.getItem('users')) {
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'employee1', password: 'emp123', role: 'employee' },
        { username: 'employee2', password: 'emp123', role: 'employee' }
    ];
    localStorage.setItem('users', JSON.stringify(users));
}

if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify([]));
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'employee-dashboard.html';
            }
        } else {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.style.opacity = '1';
            setTimeout(() => {
                errorMessage.style.opacity = '0';
            }, 3000);
        }
    });
}

// Dashboard functionality
const sidebarLinks = document.querySelectorAll('.sidebar a');
const sections = document.querySelectorAll('section');
const sectionTitle = document.getElementById('sectionTitle');

if (sidebarLinks.length > 0) {
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            sectionTitle.textContent = this.textContent.trim();
            sections.forEach(section => {
                section.classList.remove('active-section');
                section.classList.add('hidden-section');
            });
            document.getElementById(`${sectionId}Section`).classList.remove('hidden-section');
            document.getElementById(`${sectionId}Section`).classList.add('active-section');
            sidebarLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');

            if (sectionId === 'analytics') {
                updateAnalytics();
            }
        });
    });
}

// Admin Dashboard functionality
const assignTaskForm = document.getElementById('assignTaskForm');
const employeeSelect = document.getElementById('employeeSelect');
const allTasksDiv = document.getElementById('allTasks');
const adminInfoDiv = document.getElementById('adminInfo');
const addEmployeeForm = document.getElementById('addEmployeeForm');
const employeeListDiv = document.getElementById('employeeList');

if (assignTaskForm) {
    // Populate employee select
    function populateEmployeeSelect() {
        const users = JSON.parse(localStorage.getItem('users'));
        const employees = users.filter(u => u.role === 'employee');
        employeeSelect.innerHTML = '<option value="">Select Employee</option>';
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.username;
            option.textContent = emp.username;
            employeeSelect.appendChild(option);
        });
    }

    populateEmployeeSelect();

    // Display admin info
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    adminInfoDiv.textContent = `Logged in as: ${currentUser.username}`;

    // Assign task
    assignTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const employee = employeeSelect.value;
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        tasks.push({ employee, title, description, dueDate, status: 'Pending' });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        assignTaskForm.reset();
        displayAllTasks();
        updateDashboardSummary();
        showNotification('Task assigned successfully');
    });

    // Display all tasks
    function displayAllTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        allTasksDiv.innerHTML = '';
        tasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-card');
            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p><strong>Assigned to:</strong> ${task.employee}</p>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Due Date:</strong> ${task.dueDate}</p>
                <p><strong>Status:</strong> ${task.status}</p>
                <div class="task-actions">
                    <button onclick="updateTaskStatus(${index}, 'Completed')">Mark Completed</button>
                    <button onclick="deleteTask(${index})">Delete</button>
                </div>
            `;
            allTasksDiv.appendChild(taskElement);
        });
    }

    displayAllTasks();

    // Add new employee
    addEmployeeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('newEmployeeUsername').value;
        const password = document.getElementById('newEmployeePassword').value;
        const users = JSON.parse(localStorage.getItem('users'));
        if (users.some(u => u.username === username)) {
            showNotification('Username already exists', 'error');
            return;
        }
        users.push({ username, password, role: 'employee' });
        localStorage.setItem('users', JSON.stringify(users));
        addEmployeeForm.reset();
        displayEmployeeList();
        populateEmployeeSelect();
        updateDashboardSummary();
        showNotification('Employee added successfully');
    });

    // Display employee list
    function displayEmployeeList() {
        const users = JSON.parse(localStorage.getItem('users'));
        const employees = users.filter(u => u.role === 'employee');
        employeeListDiv.innerHTML = '<h4>Employee List</h4>';
        employees.forEach(emp => {
            const empElement = document.createElement('div');
            empElement.textContent = emp.username;
            employeeListDiv.appendChild(empElement);
        });
    }

    displayEmployeeList();

    // Update dashboard summary
    function updateDashboardSummary() {
        const users = JSON.parse(localStorage.getItem('users'));
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        const employees = users.filter(u => u.role === 'employee');
        const completedTasks = tasks.filter(t => t.status === 'Completed');
        const pendingTasks = tasks.filter(t => t.status === 'Pending');

        document.getElementById('totalEmployees').textContent = employees.length;
        document.getElementById('totalTasks').textContent = tasks.length;
        document.getElementById('completedTasks').textContent = completedTasks.length;
        document.getElementById('pendingTasks').textContent = pendingTasks.length;

        // Update analytics
        updateAnalytics();
    }

    updateDashboardSummary();
}

// Employee Dashboard functionality
const employeeTasksDiv = document.getElementById('employeeTasks');
const employeeInfoDiv = document.getElementById('employeeInfo');

if (employeeTasksDiv) {
    // Display employee info
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    employeeInfoDiv.textContent = `Logged in as: ${currentUser.username}`;

    // Display employee tasks
    function displayEmployeeTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const employeeTasks = tasks.filter(task => task.employee === currentUser.username);
        employeeTasksDiv.innerHTML = '';
        employeeTasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-card');
            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Due Date:</strong> ${task.dueDate}</p>
                <p><strong>Status:</strong> ${task.status}</p>
                <div class="task-actions">
                    ${task.status === 'Pending' ? `<button onclick="updateTaskStatus(${index}, 'Completed')">Mark Completed</button>` : ''}
                </div>
            `;
            employeeTasksDiv.appendChild(taskElement);
        });
        updateEmployeeDashboardSummary();
    }

    displayEmployeeTasks();

    // Update employee dashboard summary
    function updateEmployeeDashboardSummary() {
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const employeeTasks = tasks.filter(task => task.employee === currentUser.username);
        const completedTasks = employeeTasks.filter(t => t.status === 'Completed');
        const pendingTasks = employeeTasks.filter(t => t.status === 'Pending');

        document.getElementById('totalTasks').textContent = employeeTasks.length;
        document.getElementById('completedTasks').textContent = completedTasks.length;
        document.getElementById('pendingTasks').textContent = pendingTasks.length;
    }
}

// Shared functionality
function updateTaskStatus(index, newStatus) {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks[index].status = newStatus;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    if (employeeTasksDiv) {
        displayEmployeeTasks();
    } else {
        displayAllTasks();
        updateDashboardSummary();
    }
    showNotification(`Task marked as ${newStatus}`);
}

function deleteTask(index) {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    displayAllTasks();
    updateDashboardSummary();
    showNotification('Task deleted successfully');
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// Analytics functions
function updateAnalytics() {
    updateTaskStatusChart();
    updateTasksByEmployeeChart();
    updateCompletionRate();
    updateRecentActivity();
}

function updateTaskStatusChart() {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

    const ctx = document.getElementById('taskStatusChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completedTasks, pendingTasks],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                position: 'bottom'
            }
        }
    });
}

function updateTasksByEmployeeChart() {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const tasksByEmployee = {};

    tasks.forEach(task => {
        if (tasksByEmployee[task.employee]) {
            tasksByEmployee[task.employee]++;
        } else {
            tasksByEmployee[task.employee] = 1;
        }
    });

    const ctx = document.getElementById('tasksByEmployeeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tasksByEmployee),
            datasets: [{
                label: 'Tasks',
                data: Object.values(tasksByEmployee),
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 90,
                        minRotation: 90
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 0,
                    bottom: 0
                }
            }
        }
    });
}

function updateCompletionRate() {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    document.getElementById('completionRate').textContent = `${completionRate.toFixed(1)}%`;

    const ctx = document.getElementById('completionRateChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [completionRate, 100 - completionRate],
                backgroundColor: ['#2ecc71', '#ecf0f1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

function updateRecentActivity() {
    const tasks = JSON.parse(localStorage.getItem('tasks'));
    const recentActivityList = document.getElementById('recentActivityList');
    recentActivityList.innerHTML = '';

    const recentTasks = tasks.slice(-5).reverse();

    recentTasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fas ${task.status === 'Completed' ? 'fa-check-circle' : 'fa-clock'}"></i>
            ${task.title} - ${task.employee} (${task.status})
        `;
        recentActivityList.appendChild(li);
    });
}

// Utility functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }, 100);
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-container')) {
        updateDashboardSummary();
    }
});