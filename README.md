# NoteNest — Personal Notebook Management System

> A simple, secure, and responsive web-based notebook application for creating, organising, searching, and managing personal notes.

---

## 📌 Project Overview

**NoteNest** is a web-based Personal Notebook Management System developed as a university web application project.

The system provides users with a central place to create, edit, organise, search, pin, archive, and delete their personal notes. It also includes an **Admin/User authentication system** and server-side **user data isolation**, ensuring that one user cannot access another user's notes.

The project is designed to solve the real-world problem of managing notes that are often scattered across text files, notebooks, messaging applications, and different folders.

---

## 🎯 Objectives

The main objectives of NoteNest are to:

* Provide a simple and responsive digital notebook.
* Allow users to create, read, update, and delete notes.
* Make notes easier to search and organise.
* Support categories and tags.
* Allow users to pin important notes.
* Allow users to archive and restore notes.
* Provide Admin and User login functionality.
* Protect user data through server-side authorisation.
* Ensure every user can access only their own notes.
* Provide lightweight local data persistence without requiring a separate database server.

---

## ✨ Features

### 👤 User Features

* User registration/account management
* Secure login and logout
* Personal dashboard
* Create notes
* View notes
* Edit notes
* Delete notes
* Search notes
* Filter by category
* Use tags
* Pin and unpin notes
* Archive and restore notes
* Sort notes
* Dark/light theme
* Responsive interface

### 🔐 Security & Data Isolation

NoteNest uses user ownership checks to protect personal information.

Each note is associated with a specific user using a `userId`.

When a user performs an operation such as:

* View
* Edit
* Delete
* Pin
* Archive
* Search

the backend verifies that the requested note belongs to the authenticated user.

Therefore:

```text
User A → User A's Notes
User B → User B's Notes
User C → User C's Notes
```

A user cannot access another user's notes by changing an ID or sending a direct API request.

---

### 👨‍💼 Administrator Features

Administrators have access to a protected administration area.

Admin functionality includes:

* Administrator login
* Protected admin routes
* View registered users
* Create normal user accounts
* Delete normal user accounts
* Manage user access

Normal users cannot access administrator-only routes.

---

## 🏗️ System Architecture

The application follows a simple client-server architecture:

```text
┌─────────────────────────────┐
│          USER / ADMIN       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       FRONTEND / CLIENT     │
│                             │
│ HTML5 + CSS3 + JavaScript   │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON API
               ▼
┌─────────────────────────────┐
│       BACKEND / SERVER      │
│                             │
│ Node.js + Express.js        │
│ Authentication              │
│ Authorisation               │
│ Note Ownership Checks       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       LOCAL DATA STORE      │
│                             │
│ users.json                  │
│ notes.json                  │
│ categories.json             │
└─────────────────────────────┘
```

---

## 🛠️ Technologies Used

| Technology              | Purpose                              |
| ----------------------- | ------------------------------------ |
| HTML5                   | Frontend structure                   |
| CSS3                    | Styling and responsive design        |
| Vanilla JavaScript      | Frontend logic and API communication |
| Node.js                 | Backend runtime                      |
| Express.js              | REST API and server routing          |
| JSON                    | Local data persistence               |
| Node.js File System API | Reading and writing application data |
| npm                     | Dependency management                |
| Nodemon                 | Development server                   |
| VS Code                 | Development environment              |
| Windows Batch           | One-click application launcher       |

---

## 📂 Project Structure

The project follows a simple structure similar to:

```text
NoteNest/
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── style.css
│   └── script.js
│
├── data/
│   ├── users.json
│   ├── notes.json
│   └── categories.json
│
├── server.js
├── package.json
├── package-lock.json
├── start-windows.bat
└── README.md
```

> File names may differ slightly depending on the final project version.

---

## 💾 Data Storage

NoteNest uses local JSON files instead of a traditional database server.

### Users

```text
users.json
```

Stores user account information and roles.

### Notes

```text
notes.json
```

Stores notebook data, including the owner of each note.

Example logical structure:

```json
{
  "id": "note-001",
  "userId": "user-001",
  "title": "My First Note",
  "content": "This is my note.",
  "category": "Study",
  "tags": ["exam", "important"],
  "pinned": false,
  "archived": false
}
```

### Categories

```text
categories.json
```

Stores available note categories.

---

## 🔒 User Data Isolation

One of the important security requirements of NoteNest is that users must not share the same notebook data.

The backend therefore uses the authenticated user's identity when processing note operations.

For example:

```text
GET /api/notes
```

returns notes belonging to the currently authenticated user rather than returning every note stored in the system.

Similarly, update and delete operations verify ownership before modifying data.

This prevents a user from accessing another user's information simply by changing a note ID.

---

## 🚀 Installation & Setup

### Prerequisites

Before running NoteNest, install:

* [Node.js](https://nodejs.org/)
* npm
* Visual Studio Code

---

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Then enter the project folder:

```bash
cd NoteNest
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Start the Development Server

```bash
npm run dev
```

If the project uses the normal start command:

```bash
npm start
```

---

### 4. Open the Application

Open the local application in your browser using the port configured in `server.js`.

For example:

```text
http://localhost:3000
```

---

## 🪟 Windows One-Click Start

NoteNest includes a Windows launcher:

```text
start-windows.bat
```

Double-clicking the batch file starts the local server and opens the application in the browser.

This allows the application to be launched without manually entering the server command every time.

---

## 👤 User Workflow

A normal user can follow this workflow:

```text
Login
  ↓
Dashboard
  ↓
Create / View Notes
  ↓
Search / Filter / Sort
  ↓
Edit / Pin / Archive
  ↓
Delete if Required
  ↓
Logout
```

---

## 👨‍💼 Admin Workflow

The administrator workflow is:

```text
Admin Login
     ↓
Admin Dashboard
     ↓
View Users
     ↓
Create / Delete Normal Users
     ↓
Logout
```

Administrator routes are protected from normal users.

---

## 🧪 Testing

The following areas should be tested before submission:

| Test               | Expected Result                              |
| ------------------ | -------------------------------------------- |
| User Login         | Valid user can log in                        |
| Invalid Login      | Invalid credentials are rejected             |
| Admin Login        | Admin enters protected admin area            |
| User → Admin Route | Normal user is denied                        |
| Create Note        | Note is saved successfully                   |
| Edit Note          | Note is updated successfully                 |
| Delete Note        | Correct note is removed                      |
| Search             | Matching notes are displayed                 |
| Pin                | Note becomes pinned                          |
| Archive            | Note moves to archived area                  |
| User Isolation     | User A cannot see User B's notes             |
| Direct API Access  | Ownership checks prevent unauthorised access |
| Restart Server     | Saved data remains available                 |
| Responsive UI      | Interface works on different screen sizes    |
| Windows Launcher   | Application starts correctly                 |

---

## 🐛 Known Development Challenges

During development, several issues were addressed:

### 1. Different users were seeing the same notes

**Problem:**
Notes were not sufficiently separated between accounts.

**Solution:**
Notes were associated with a `userId`, and backend operations verify the authenticated user's ownership before allowing access.

---

### 2. Actions opened another browser window

**Problem:**
Operations such as creating or deleting notes could cause unnecessary page/window behaviour.

**Solution:**
Frontend operations use asynchronous API requests so normal actions remain inside the application interface.

---

### 3. Authentication integration

**Problem:**
Adding authentication had to be done without breaking existing notebook functionality.

**Solution:**
Authentication and protected API routes were integrated while maintaining the existing note-management workflow.

---

### 4. Local data persistence

**Problem:**
The project needed persistent storage without requiring a separate database server.

**Solution:**
JSON files and Node.js file-system APIs were used for lightweight local persistence.

---

## 🤖 AI Tools Used

AI tools were used as development assistants during the project.

### Google AI Studio

Used for:

* Generating application code
* Debugging
* Improving existing features
* Integrating frontend and backend functionality

### Claude

Used for:

* Planning implementation
* Generating development prompts
* Debugging
* Adding and modifying features
* Reviewing project structure

### ChatGPT

Used for:

* Understanding project requirements
* Architecture guidance
* Debugging explanations
* Documentation and report preparation
* Creating development prompts

AI-generated code was reviewed, tested, and modified as necessary during development.

---

## 📝 Sample Development Prompts

### Prompt 1 — Initial Application

```text
Build a complete Personal Notebook Management System called NoteNest using HTML, CSS, Vanilla JavaScript, Node.js, Express.js and local JSON storage.

Create all required files in one project folder so I can open the folder directly in VS Code.

The application should include a professional responsive UI and complete CRUD functionality.
```

### Prompt 2 — Authentication

```text
Add an Admin and User login system to the existing NoteNest project.

Do not remove or break any existing functionality.

Create protected admin routes and normal user authentication.
```

### Prompt 3 — Data Isolation

```text
Fix the issue where different users can see the same notes.

Every note must belong to the authenticated user using userId.

A user must only be able to view, edit, delete, pin, archive and search their own notes.

Enforce this on the backend, not only on the frontend.
```

### Prompt 4 — Same Window

```text
Fix the issue where actions such as create, edit and delete open another browser window.

All normal application actions should happen inside the current NoteNest page using asynchronous API requests.

Do not break existing functionality.
```

### Prompt 5 — Windows Launcher

```text
Create a Windows start-windows.bat file for the existing NoteNest project.

When I double-click the file, it should start the Node.js server and automatically open the web application in the browser.
```

---

## 🔐 Security Notes

For the academic/local version of NoteNest:

* Do not commit real passwords or secrets to GitHub.
* Do not upload private user data.
* Do not expose the `data/` directory directly through the frontend.
* Keep authentication and ownership checks on the backend.
* Test direct API access as well as normal UI actions.

> For production deployment, stronger password hashing, secure sessions/tokens, HTTPS, database security and additional validation should be implemented.

---

## 🔮 Future Improvements

Possible improvements for a future version include:

* Cloud database integration
* Secure password hashing and password reset
* Email verification
* Note attachments
* Image uploads
* Markdown editor
* Rich-text editing
* Cloud synchronization
* Multi-device access
* Automated unit and integration tests
* Production deployment
* Advanced backup and recovery

---

## 📚 Project Documentation

The project documentation includes:

* Project Report
* System Architecture
* Logical Data Model / ER Diagram
* Functional Requirements
* User Manual
* Installation Guide
* Testing Checklist
* Development Timeline
* AI Development Prompts

---

## 👨‍💻 Project Information

**Project Name:** NoteNest
**Project Type:** Web Application
**Purpose:** Personal Notebook Management
**Frontend:** HTML5, CSS3, Vanilla JavaScript
**Backend:** Node.js + Express.js
**Storage:** Local JSON Files
**Development Environment:** Visual Studio Code

---

## 📄 License

This project was developed as an academic university project.

The source code may be used for educational purposes according to the requirements of the course and project team.

---

## 🙏 Acknowledgements

We would like to acknowledge our course instructor and the development tools and AI assistants that supported the planning, implementation, debugging, testing and documentation of this project.

---

**NoteNest — Organise Your Notes. Keep Them Yours.**

