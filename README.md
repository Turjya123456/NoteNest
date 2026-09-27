# NoteNest — Personal Notebook Management System

## Project Overview
NoteNest is a simple, fast, and modern personal notebook application. Built purely with Vanilla JavaScript, Node.js, and Express, it provides a lightweight solution for students and professionals to manage their notes effectively.

## Problem Statement
Traditional note-taking apps are often cluttered with unnecessary features, rely heavily on internet connections to cloud databases, and are overly complex to self-host. Students need a fast, local-first solution to organize study materials, programming concepts, and project ideas.

## Proposed Solution
NoteNest provides a straightforward, file-based notebook system. By using local JSON files for storage, it avoids the overhead of a traditional database while delivering a snappy user experience with standard CRUD operations, categorization, pinning, and archiving capabilities.

## Features
- **Dashboard**: Quick overview of note statistics and recent activity.
- **CRUD Operations**: Create, Read, Update, and Delete notes.
- **Organization**: Categorize tags, pin important notes, and archive old ones.
- **Search & Filtering**: Instantly search across titles, content, categories, and tags.
- **Sorting**: Sort by newest, oldest, recently updated, or alphabetically.
- **Responsive UI**: Works perfectly on desktop, tablet, and mobile.
- **Dark Mode**: Built-in light and dark themes saved to local storage.

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: Local File System (`fs/promises`, JSON)
- **Tooling**: Nodemon

## Project Structure
```text
NoteNest/
├── data/
│   ├── notes.json
│   └── categories.json
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── assets/
│       ├── logo.svg
│       └── favicon.svg
├── server.js
├── package.json
└── README.md
```

## Installation & How to Run
1. Clone the repository or extract the project folder.
2. Open the terminal and navigate to the `NoteNest` folder.
3. Run the following command to install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

## API Endpoints
- `GET /api/categories` - Fetch all categories
- `GET /api/notes` - Fetch all notes
- `GET /api/notes/:id` - Fetch a single note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/search/:keyword` - Search notes
- `PATCH /api/notes/:id/pin` - Toggle note pin status
- `PATCH /api/notes/:id/archive` - Toggle note archive status

## Future Improvements
- Markdown support for note content.
- Image attachments.
- Data export/import functionality.
