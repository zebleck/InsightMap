# 🧠 InSightMap

A web application that allows users to organize knowledge. It uses generative AI to make documenting and collecting knowledge easier in an intuitive way.

## Features

- 📝 Integrated Markdown Editor
- 📁 File management system integrated with the Editor
- 🤖 Integration of generative AI
- 🌲 Tree of Abstraction Generation: Generate abstract representations of selected text

## Tech Stack

- Backend: Python
- Frontend: React.js
- Styling: Bootstrap
- Markdown Rendering: `markdown-it`, `react-simplemde-editor`, `markdown-it-katex`

## Installation & Setup

1. Clone repository
   ```bash
   git clone https://github.com/zebleck/InSightMap.git
   ```
1. Navigate to the backend folder and create a .env file with your OpenAI API key
   ```bash
   cd backend
   echo "OPENAI_KEY=your_openai_api_key" > .env
   ```
3. In the root folder, build and start the docker container
   ```bash
   cd ..
   docker-compose build
   docker-compose up
   ```
4. The frontend should be accessible at port 3000.

## Contributing

Feel free to submit pull requests or create issues to improve the project.
