const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();
const port = 5000;

app.use(express.json());

const filesDir = path.join(__dirname, 'files');
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

app.post('/save/:filename', (req, res) => {
  const { content } = req.body;
  const filename = req.params.filename;
  const filePath = path.join(filesDir, filename);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false });
    } else {
      res.json({ success: true, filename });
    }
  });
});

app.get('/files', (req, res) => {
  fs.readdir(filesDir, (err, filenames) => {
    if (err) {
      console.error(err);
      res.status(500).json([]);
      return;
    }
    res.json(filenames);
  });
});

app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(filesDir, filename);

  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error(err);
      res.status(404).json({ success: false });
    } else {
      res.json({ success: true, content });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
