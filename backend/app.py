from flask import Flask, request, jsonify, Response
import os
import json
import openai
import logging
from dotenv import load_dotenv
from flask_cors import CORS
import uuid
load_dotenv()

app = Flask(__name__)
CORS(app)

try:
  openai.api_key = os.environ['OPENAI_KEY']
except:
  logging.warning("Unable to set OpenAI API Key and Organization")

FILES_DIR = "files"
if not os.path.exists(FILES_DIR):
  os.makedirs(FILES_DIR)

@app.route('/save/<filename>', methods=['POST'])
def save_file(filename):
  content = request.json.get("content")
  file_path = os.path.join(FILES_DIR, filename)
  
  try:
    with open(file_path, 'w') as f:
      f.write(content)
    return jsonify(success=True, filename=filename)
  except Exception as e:
    print(e)
    return jsonify(success=False), 500

@app.route('/files/<filename>', methods=['DELETE'])
def delete_file(filename):
  file_path = os.path.join(FILES_DIR, filename)
  
  try:
    os.remove(file_path)
    return jsonify(success=True)
  except Exception as e:
    print(e)
    return jsonify(success=False), 500

@app.route('/files', methods=['GET'])
def list_files():
  try:
    filenames = os.listdir(FILES_DIR)
    return jsonify(filenames)
  except Exception as e:
    print(e)
    return jsonify([]), 500

@app.route('/files/<filename>', methods=['GET'])
def read_file(filename):
  file_path = os.path.join(FILES_DIR, filename)
  
  try:
    with open(file_path, 'r') as f:
      content = f.read()
    return jsonify(success=True, content=content)
  except Exception as e:
    print(e)
    return jsonify(success=False), 404
  
def generate_tree_func(selection):
  prompt = f"Perform a multi-dimensional analysis of {selection} by constructing a Tree of Abstraction. Start from the immediate, tangible actions and delve into deeper layers of complexity, adapting your approach as needed to capture the unique aspects of this activity. Your analysis may include, but is not limited to, the biological, psychological, social, technological, economic, and philosophical dimensions. Provide a comprehensive and insightful exploration, and identify intersections between different layers of abstraction where relevant. Return in markdown."
  #prompt = f"Outline a Tree of Abstraction for the topic of {selection}. Start with immediate, tangible actions and delve into deeper layers of complexity. Your outline should be formatted as a nested list, and please make sure to think about how each layer or node might connect to others before you begin. Your analysis may include categories like biological, psychological, social, technological, economic, and philosophical dimensions, among others. Begin by contemplating the general structure of this tree and possible connections between nodes, then proceed to outline these nodes and connections. Note: This is a preliminary outline and should focus only on the headers or titles for each node without going into details. Return in markdown."
  def generate():
    response = openai.ChatCompletion.create(
      model='gpt-4',
      messages=[
          {'role': 'user',
           'content': prompt}
      ],
      stream=True,
    )
    logging.info("Debug: ChatCompletion created") 
    for chunk in response:
      try:
        text_chunk = chunk['choices'][0]['delta']['content']
        finish_reason = chunk['choices'][0]['finish_reason']
        
        if finish_reason == 'stop':
          yield "data: __complete__\n\n"
        
        text_chunk = text_chunk.replace('\n', '<br>')
        yield f"data: {text_chunk}\n\n"

      except KeyError:
        logging.info(f"Debug: Skipping incomplete chunk {chunk}")  # Debug line
        continue

  return generate

session_store = {}

def generate_unique_session_id():
    return str(uuid.uuid4())

@app.route('/generate_tree', methods=['POST'])
def generate_tree_endpoint():
    selection = request.json.get("selection")
    session_id = generate_unique_session_id()  # Assume you have this function defined
    session_store[session_id] = generate_tree_func(selection)
    return jsonify({"session_id": session_id, "selection": selection})

@app.route('/request_sse')
def request_sse():
    headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
    session_id = request.args.get("session_id")
    generator_function = session_store.get(session_id)
    if generator_function:
        return Response(generator_function(), headers=headers)
    else:
        return "Session not found", 404

if __name__ == '__main__':
  app.run(host="0.0.0.0", port=5000)