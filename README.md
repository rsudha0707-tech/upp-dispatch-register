# Digital Daak Register and File Tracking System

A secure, role-based web application for managing and tracking official correspondence (Daak) and files within an organization.

## Features

- **Role-Based Access Control**: Secure login for different roles (e.g., Clerk, Section Officer, Deputy Commissioner).
- **Daak Registration**: Register incoming correspondence with details like sender, subject, and priority.
- **File Tracking**: Track the movement of files across different departments and officials.
- **Dynamic Workflow**: Forward tasks and files sequentially with status updates.
- **Real-time Dashboards**: "My Tasks" view for users to see assigned correspondence and files.
- **Search and Reporting**: Easily search for Daak records and generate reports.

## Technology Stack

- **Backend**: Python (FastAPI)
- **Database**: SQLite (SQLAlchemy ORM)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Authentication**: JWT-based security

## Project Structure

- `backend/`: FastAPI application, models, schemas, and routers.
- `frontend/`: HTML, CSS, and JavaScript files for the user interface.
- `uploads/`: Directory for storing uploaded document attachments (excluded from version control).
- `daak.db`: SQLite database file (excluded from version control).

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js (optional, for serving frontend if not using Python)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rsudha0707-tech/upp-dispatch-register.git
   cd upp-dispatch-register
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Open `frontend/index.html` in your web browser.

## License

This project is licensed under the MIT License.
