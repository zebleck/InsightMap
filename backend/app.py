from flask import Flask, request, jsonify, Response
import os
import openai
import logging
from dotenv import load_dotenv
from flask_cors import CORS
import uuid
import re
from neo4j import GraphDatabase
uri = "bolt://graphdb:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))
load_dotenv()

app = Flask(__name__)
CORS(app)

try:
  openai.api_key = os.environ['OPENAI_KEY']
except:
  logging.warning("Unable to set OpenAI API Key and Organization")

@app.route('/save/<filename>', methods=['POST'])
def save_file(filename):
  content = request.json.get("content")

  # Regex to match your specific format of links
  linked_nodes = re.findall(r'\[([^\]]+)]\(\<node:([^\>]+)\>\)', content)
  unique_linked_nodes = list(set(node[1] for node in linked_nodes))
  if len(unique_linked_nodes) > 0:
    logging.warn("Linking %s to: %s", filename, unique_linked_nodes)
  else:
    logging.warn("No linked nodes found for %s", filename)

  with driver.session() as session:
    # First update the content of the file
    session.run("MERGE (f:File {name: $name}) SET f.content = $content", name=filename, content=content)

    # Delete all existing relationships to start afresh
    session.run("MATCH (f:File {name: $name})-[r:LINKS_TO]->() DELETE r", name=filename)

    # Create relationships
    for linked_node in unique_linked_nodes:
        session.run("""
            MATCH (f:File {name: $filename})
            WITH f
            MATCH (t:File {name: $linked_node})
            MERGE (f)-[:LINKS_TO]->(t)
        """, filename=filename, linked_node=linked_node)
  return jsonify(success=True, filename=filename)

@app.route('/files/<filename>', methods=['DELETE'])
def delete_file(filename):
  with driver.session() as session:
    session.run("MATCH (f:File {name: $name}) DETACH DELETE f", name=filename)
  return jsonify(success=True)

@app.route('/files', methods=['GET'])
def list_files():
  with driver.session() as session:
    result = session.run("MATCH (f:File) RETURN f.name as name")
    filenames = [record['name'] for record in result]
  return jsonify(filenames)

@app.route('/files/<filename>', methods=['GET'])
def read_file(filename):
  with driver.session() as session:
    result = session.run("MATCH (f:File {name: $name}) RETURN f.content as content", name=filename)
    single = result.single()
    content = single['content'] if single else None
    if content is not None:
      return jsonify(success=True, content=content)
    else:
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