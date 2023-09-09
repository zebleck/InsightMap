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

@app.route('/graph/saveNode/<nodename>', methods=['POST'])
def save_node(nodename):
  content = request.json.get("content")

  # Regex to match your specific format of links
  linked_nodes = re.findall(r'\[([^\]]+)]\(\<node:([^\>]+)\>\)', content)
  unique_linked_nodes = list(set(node[1] for node in linked_nodes))
  if len(unique_linked_nodes) > 0:
    logging.warn("Linking %s to: %s", nodename, unique_linked_nodes)
  else:
    logging.warn("No linked nodes found for %s", nodename)

  with driver.session() as session:
    # First update the content of the node
    session.run("MERGE (f:KnowledgeNode {name: $name}) SET f.content = $content", name=nodename, content=content)

    # Delete all existing relationships to start afresh
    session.run("MATCH (f:KnowledgeNode {name: $name})-[r:LINKS_TO]->() DELETE r", name=nodename)

    # Create relationships
    for linked_node in unique_linked_nodes:
        session.run("""
            MATCH (f:KnowledgeNode {name: $nodename})
            WITH f
            MATCH (t:KnowledgeNode {name: $linked_node})
            MERGE (f)-[:LINKS_TO]->(t)
        """, nodename=nodename, linked_node=linked_node)
  return jsonify(success=True, nodename=nodename)

@app.route('/graph/<nodename>', methods=['DELETE'])
def delete_node(nodename):
  with driver.session() as session:
    session.run("MATCH (f:KnowledgeNode {name: $name}) DETACH DELETE f", name=nodename)
  return jsonify(success=True)

@app.route('/graph', methods=['GET'])
def fetch_graph():
  with driver.session() as session:
    result = session.run("""
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, type(r) as relType, m
    """)
    
    nodes = []
    edges = []

    node_ids = set()
    
    for record in result:
      start_node_id = record["n"].id
      start_node = {"id": start_node_id, "label": record["n"].get("name")}

      if start_node_id not in node_ids:
        nodes.append(start_node)
        node_ids.add(start_node_id)

      end_node = record["m"]
      if end_node:
        end_node_id = end_node.id
        end_node_data = {"id": end_node_id, "label": end_node.get("name")}

        if end_node_id not in node_ids:
          nodes.append(end_node_data)
          node_ids.add(end_node_id)

        relation = {
          "from": start_node_id,
          "to": end_node_id,
          "label": record["relType"]
        }

        edges.append(relation)

    return jsonify({"nodes": nodes, "edges": edges})

@app.route('/graph/<nodename>', methods=['GET'])
def read_node(nodename):
  with driver.session() as session:
    result = session.run("MATCH (f:KnowledgeNode {name: $name}) RETURN f.content as content", name=nodename)
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