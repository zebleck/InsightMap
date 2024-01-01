<p align="center">
  <img src="https://github.com/zebleck/InSightMap/assets/10833180/5943f178-d55d-40a7-ab52-1aa11f936b8a" height="400px" />
  
  
  <h3 align="center">🧠 InsightMap</h3>
  <p align="center">A Next-generation Knowledge Management Platform</p>
</p>

## Description

InsightMap is a knowledge management platform that seamlessly integrates a vast array of information into an easily navigable graph-like structure. Built with a focus on usability, InsightMap lets you capture, link, and traverse complex ideas and topics, enabling you to see the bigger picture. Equipped with dynamic navigation and a rich Markdown editor, the platform provides an interactive and user-friendly experience. Think of it like your own personalized wikipedia.

## Features

- 📝 **Integrated Markdown Editor**: Features a fully-equipped Markdown editor that supports LaTeX for mathematical expressions and coloring, allowing you to document topics in a stylistically versatile and mathematical format.
- 🌐 **File-Based Knowledge Management**: The backend supports dynamic linking of nodes, representing different pieces of information or ideas, using Markdown files.
- ⭐ **User-Focused Design**: From easy node linking to two-way automatic linking between nodes and dynamic navigation, InSightMap aims for an intuitive and frictionless user experience.
- 🤖 **Integration of generative AI**: Answer questions and generate knowledge nodes using latest OpenAI model `gpt-4-1106-preview`.
- 🖼️ **Image support**: Paste images from your clipboard into the markdown editor.
- 📄 **PDF Export**: Easily convert your Markdown notes, along with embedded images and expanded links, into downloadable PDFs.

## Tech Stack

- Backend: Python
- Frontend: React.js including lots of libraries. It's like the python of frontends!
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
3. Navigate to the frontend folder and install packages
   ```bash
   cd ../frontend
   npm install
   ```
4. In the root folder, build and start the docker container
   ```bash
   cd ..
   docker-compose build
   docker-compose up
   ```
5. The frontend should be accessible at port 3000.

## Contributing

Project still needs a lot of work. Feel free to submit pull requests or create issues to improve the project.

## License

See [LICENSE.md](LICENSE.md)
