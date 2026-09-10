
# Cómo Se Dice

Cómo Se Dice, meaning *"How do you say?"* in English, is a **collaborative Spanish-learning website** designed to make language learning more **interactive, accessible, and community-driven.** Rather than relying solely on memorization and traditional grammar exercises, the platform combines interactive activities, user-created resources, group study sessions, and AI assistance to give students multiple ways to practice Spanish.

Students can practice verb conjugation through randomly generated word searches and build vocabulary through interactive crosswords. The platform also features a **shared resource hub** where **users can create, upload, search, save, and rate quizzes and other learning materials,** allowing students to learn from and contribute to a collaborative community. Users can also schedule and join group study sessions for additional opportunities to practice together.

An AI-powered chatbot, Carlito, provides students with additional help by answering Spanish-learning questions and assisting with vocabulary and grammar concepts. The website also incorporates **accessible design,** including some ARIA labels, alternative text, and color-contrast considerations to make the platform more inclusive across different users and devices.

Built with **React and Supabase,** Como Se Dice combines a responsive frontend with backend data storage and authentication to support user accounts, shared resources, quizzes, and collaborative learning. The project was developed using an iterative Agile process, incorporating feedback from Spanish teachers and students to refine the platform around real learner needs.


## Demo
Watch a quick 3 minute video showcasing how the website works!
https://drive.google.com/file/d/1lLRW5kKTKiwDPVgkQ0kJ9HKSOKb5v-vj/view?usp=sharing

Here is a demo of our AI chatbot Carlito shown below:
https://drive.google.com/file/d/1VcIHCac2FW3LLAwz3dM2HidsghOTBMO4/view?usp=sharing

## Installation

### Prerequisites

Before running Como Se Dice locally, make sure you have the following installed:

* [Node.js](https://nodejs.org/)
* npm (included with Node.js)
* Git
* A code editor such as VS Code

### Setup

1. Clone the repository:

```bash
git clone <https://github.com/Ayan-create1/Website-Design-FBLA-Spanish.git>
```

2. Install the required dependencies:

```bash
cd frontend
npm install
cd ../backend
npm install
```

3. Configure environment variables:

Create a `.env` file in the project root and add the required credentials:

```text
VITE_SUPABASE_URL=<YOUR-SUPABASE-URL>
VITE_SUPABASE_ANON_KEY=<YOUR-SUPABASE-ANON-KEY>
VITE_API_KEY=<YOUR-API-KEY>
```

Replace the placeholder values with the appropriate credentials for your Supabase project and API service.

**Important:** Do not commit your `.env` file or any other files containing private API keys or credentials to the repository.

4. Start the development server (Enter the frontend folder):

```bash
cd frontend
npm run dev
```

5. Open the local development URL displayed in the terminal, typically:

```text
http://localhost:5173
```

4. Start chatbot (Enter the backend folder):

```bash
cd backend
npm run dev
```
    

## Run Locally

After completing the installation and configuration steps, start the frontend and backend servers separately.

### Frontend

To activate the frontend, in one terminal run:

```bash
cd frontend
npm run dev
```

The frontend will typically be available at:

```text
http://localhost:5173
```

### Backend

In a second terminal to start the chatbot:

```bash
cd backend
npm run dev
```

Keep both the frontend and backend servers running while using the application locally.



## License

This project is licensed under the MIT License.

