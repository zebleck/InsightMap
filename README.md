<p align="center">
  <img src="https://github.com/zebleck/InSightMap/assets/10833180/7b14b22f-5c31-4373-84c5-741e3aa76fa6" height="400px" />
  
  
  <h3 align="center">🧠 InSightMap</h3>
  <p align="center">A Next-generation Knowledge Management Website</p>
</p>

## Description

InSightMap is a knowledge management platform that seamlessly integrates a vast array of information into an easily navigable graph-like structure. Built with a focus on usability, InSightMap lets you capture, link, and traverse complex ideas and topics, enabling you to see the bigger picture. Equipped with dynamic navigation and a rich Markdown editor, the platform provides an interactive and user-friendly experience.

## Features

- 📝 **Integrated Markdown Editor**: Features a fully-equipped Markdown editor that supports LaTeX for mathematical expressions and coloring, allowing you to document topics in a stylistically versatile and mathematical format.
- 🌐 **Graph-Based Knowledge Management**: Utilizing Neo4j, the backend supports dynamic linking of nodes, representing different pieces of information or ideas.
- ⭐ **User-Focused Design**: From easy node linking to two-way automatic linking between nodes and dynamic navigation, InSightMap aims for an intuitive and frictionless user experience.
- 🤖 **Integration of generative AI**: Generate abstract representations of selected text through the use of generative AI

## Tech Stack

- Backend: Python + Neo4J
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

Feel free to submit pull requests or create issues to improve the project.

## License

See [LICENSE.md](LICENSE.md)
