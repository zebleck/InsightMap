from flask import Flask, request, jsonify, Response
import os
import openai
import logging
from dotenv import load_dotenv
from flask_cors import CORS
import uuid
import re
from neo4j import GraphDatabase
from werkzeug.utils import secure_filename

uri = "bolt://graphdb:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))
load_dotenv()

app = Flask(
    __name__, static_folder="uploaded_images", static_url_path="/uploaded_images"
)
CORS(app)

if not os.path.exists("uploaded_images"):
    os.makedirs("uploaded_imag es")

try:
    openai.api_key = os.environ["OPENAI_KEY"]
except:
    logging.warning("Unable to set OpenAI API Key and Organization")

"""
-----------------------
Knowledge Graph endpoints
-----------------------
"""


@app.route("/graph/saveNode/<nodename>", methods=["POST"])
def save_node(nodename):
    content = request.json.get("content")

    # Regex to match your specific format of links
    linked_nodes = re.findall(r"\[([^\]]+)]\(\<node:([^\>]+)\>\)", content)
    unique_linked_nodes = list(set(node[1] for node in linked_nodes))
    if len(unique_linked_nodes) > 0:
        logging.warn("Linking %s to: %s", nodename, unique_linked_nodes)
    else:
        logging.warn("No linked nodes found for %s", nodename)

    with driver.session() as session:
        # First update the content of the node
        session.run(
            "MERGE (f:KnowledgeNode {name: $name}) SET f.content = $content",
            name=nodename,
            content=content,
        )

        # Delete all existing relationships to start afresh
        session.run(
            "MATCH (f:KnowledgeNode {name: $name})-[r:LINKS_TO]->() DELETE r",
            name=nodename,
        )

        # Create relationships
        for linked_node in unique_linked_nodes:
            session.run(
                """
            MATCH (f:KnowledgeNode {name: $nodename})
            WITH f
            MATCH (t:KnowledgeNode {name: $linked_node})
            MERGE (f)-[:LINKS_TO]->(t)
        """,
                nodename=nodename,
                linked_node=linked_node,
            )
    return jsonify(success=True, nodename=nodename)


@app.route("/graph/<nodename>", methods=["DELETE"])
def delete_node(nodename):
    with driver.session() as session:
        session.run(
            "MATCH (f:KnowledgeNode {name: $name}) DETACH DELETE f", name=nodename
        )
    return jsonify(success=True)


@app.route("/graph", methods=["GET"])
def fetch_graph():
    with driver.session() as session:
        result = session.run(
            """
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, n.tags AS tags, type(r) as relType, m
    """
        )

        nodes = []
        edges = []

        node_ids = set()

        for record in result:
            start_node_id = record["n"].id
            start_node = {
                "id": start_node_id,
                "label": record["n"].get("name"),
                "tags": record["n"].get("tags"),
            }

            if start_node_id not in node_ids:
                nodes.append(start_node)
                node_ids.add(start_node_id)

            end_node = record["m"]
            if end_node:
                end_node_id = end_node.id
                end_node_data = {
                    "id": end_node_id,
                    "label": end_node.get("name"),
                    "tags": end_node.get("tags"),
                }

                if end_node_id not in node_ids:
                    nodes.append(end_node_data)
                    node_ids.add(end_node_id)

                relation = {
                    "from": start_node_id,
                    "to": end_node_id,
                    "label": record["relType"],
                }

                edges.append(relation)

        return jsonify({"nodes": nodes, "edges": edges})


@app.route("/graph/<nodename>", methods=["GET"])
def read_node(nodename):
    with driver.session() as session:
        result = session.run(
            "MATCH (f:KnowledgeNode {name: $name}) RETURN f.content as content",
            name=nodename,
        )
        single = result.single()
        content = single["content"] if single else None
        if content is not None:
            return jsonify(success=True, content=content)
        else:
            return jsonify(success=False), 404

@app.route("/graph/renameNode", methods=["POST"])
def rename_node():
    data = request.json
    old_node_name = data.get("oldNodeName")
    new_node_name = data.get("newNodeName")

    with driver.session() as session:
        # Update the node name
        session.run(
            "MATCH (n:KnowledgeNode {name: $oldNodeName}) SET n.name = $newNodeName",
            {"oldNodeName": old_node_name, "newNodeName": new_node_name},
        )

        # Update the links
        session.run(
            """
            MATCH (n:KnowledgeNode)-[r:LINKS_TO]->(m:KnowledgeNode {name: $oldNodeName})
            SET r.name = $newNodeName
            """,
            {"oldNodeName": old_node_name, "newNodeName": new_node_name},
        )

        # Fetch the content of the linked nodes
        result = session.run(
            """
            MATCH (n:KnowledgeNode)-[r:LINKS_TO]->(m:KnowledgeNode)
            WHERE m.content CONTAINS $oldNodeName
            RETURN m.name AS name, m.content AS content
            """,
            {"oldNodeName": old_node_name},
        )

        # Perform the replacement in Python and update the content in the database
        for record in result:
            linked_node_name = record["name"]
            linked_node_content = record["content"]
            updated_content = re.sub(
                f"<node:{old_node_name}>", f"<node:{new_node_name}>", linked_node_content
            )
            session.run(
                """
                MATCH (m:KnowledgeNode {name: $name})
                SET m.content = $content
                """,
                {"name": linked_node_name, "content": updated_content},
            )

    return jsonify({"status": "Node renamed"})


"""
-----------------------
Tagging endpoints
-----------------------
"""


@app.route("/graph/tagNode", methods=["POST"])
def tag_node():
    data = request.json
    nodeName = data.get("nodeName")
    tags = data.get("tags")

    with driver.session() as session:
        session.run(
            """
      MATCH (n:KnowledgeNode {name: $nodeName})
      SET n.tags = CASE 
          WHEN n.tags IS NULL THEN $tags 
          ELSE n.tags + $tags 
      END
    """,
            {"nodeName": nodeName, "tags": tags},
        )

    return jsonify({"status": "Tag added"})


@app.route("/graph/removeTag", methods=["POST"])
def remove_tag():
    data = request.json
    nodeName = data.get("nodeName")
    tag = data.get("tag")

    with driver.session() as session:
        session.run(
            """
      MATCH (n:KnowledgeNode {name: $nodeName})
      SET n.tags = [tag in n.tags WHERE tag <> $tag]
    """,
            {"nodeName": nodeName, "tag": tag},
        )

    return jsonify({"status": "Tag removed"})


"""
-----------------------
Image endpoints
-----------------------
"""


@app.route("/uploadImage", methods=["POST"])
def upload_image():
    uploaded_file = request.files["image"]

    if uploaded_file.filename != "":
        # Generate a unique filename
        file_ext = os.path.splitext(uploaded_file.filename)[1]
        filename = f"{uuid.uuid4().hex}{file_ext}"

        filepath = os.path.join("uploaded_images", secure_filename(filename))
        uploaded_file.save(filepath)

        return jsonify(success=True, filename=filename)


"""
-----------------------
Generative AI endpoints
-----------------------
"""

session_store = {}


def generate_unique_session_id():
    return str(uuid.uuid4())


def generate_tree_func(selection):
    prompt = f"Perform a multi-dimensional analysis of {selection} by constructing a Tree of Abstraction. Start from the immediate, tangible actions and delve into deeper layers of complexity, adapting your approach as needed to capture the unique aspects of this activity. Your analysis may include, but is not limited to, the biological, psychological, social, technological, economic, and philosophical dimensions. Provide a comprehensive and insightful exploration, and identify intersections between different layers of abstraction where relevant. Return in markdown."

    # prompt = f"Outline a Tree of Abstraction for the topic of {selection}. Start with immediate, tangible actions and delve into deeper layers of complexity. Your outline should be formatted as a nested list, and please make sure to think about how each layer or node might connect to others before you begin. Your analysis may include categories like biological, psychological, social, technological, economic, and philosophical dimensions, among others. Begin by contemplating the general structure of this tree and possible connections between nodes, then proceed to outline these nodes and connections. Note: This is a preliminary outline and should focus only on the headers or titles for each node without going into details. Return in markdown."
    def generate():
        response = openai.ChatCompletion.create(
            model="gpt-4-1106-preview",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        for chunk in response:
            try:
                text_chunk = chunk["choices"][0]["delta"]["content"]
                finish_reason = chunk["choices"][0]["finish_reason"]

                if finish_reason == "stop":
                    yield "data: __complete__\n\n"

                text_chunk = text_chunk.replace("\n", "<br>")
                yield f"data: {text_chunk}\n\n"

            except KeyError:
                logging.info(f"Debug: Skipping incomplete chunk {chunk}")  # Debug line
                continue

    return generate


def generate_answer_func(question, system_prompt):
    prompt = f"Answer the following question: {question}. Return in markdown with latex support ($)."

    if system_prompt:
        initial_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ]
    else:
        initial_messages = [
            {"role": "user", "content": prompt},
        ]

    def generate():
        response = openai.ChatCompletion.create(
            model="gpt-4-1106-preview",
            messages=initial_messages,
            stream=True,
        )

        for chunk in response:
            try:
                text_chunk = chunk["choices"][0]["delta"].get("content", "")
                finish_reason = chunk["choices"][0]["finish_reason"]

                if finish_reason == "stop":
                    yield "data: __complete__\n\n"

                text_chunk = text_chunk.replace("\n", "<br>")
                yield f"data: {text_chunk}\n\n"

            except KeyError:
                logging.info(f"Debug: Skipping incomplete chunk {chunk}")  # Debug line
                continue

    return generate

def generate_recommendations_func(current_node_name, current_node_content):
    # Fetch the current node's content and the names of connected nodes from the Neo4j graph database
    # Query Neo4j to get first degree nodes
    first_degree_nodes_query = "MATCH (n:KnowledgeNode {name: $nodeName})--(m) RETURN m.name"
    with driver.session() as session:
        result = session.run(first_degree_nodes_query, {"nodeName": current_node_name})
        list_of_first_degree_nodes = [record["m.name"] for record in result]

    # Query Neo4j to get second degree nodes
    second_degree_nodes_query = "MATCH (n:KnowledgeNode {name: $nodeName})--()--(m) RETURN m.name"
    with driver.session() as session:
        result = session.run(second_degree_nodes_query, {"nodeName": current_node_name})
        list_of_second_degree_nodes = [record["m.name"] for record in result]

    context = f"Given the context about {current_node_name}, which includes this information: \"{current_node_content}\", and has information about related topics such as {list_of_first_degree_nodes} and extended connections including {list_of_second_degree_nodes}, suggest new topics or areas that could expand on this knowledge or provide deeper insight into related areas. Return as a list [topic_name1, topic_name2, ...]"

    def generate():

        response = openai.ChatCompletion.create(
            model="gpt-4-1106-preview",
            messages=[{"role": "user", "content": context}],
            stream=True,
        )

        for chunk in response:
            try:
                text_chunk = chunk["choices"][0]["delta"].get("content", "")
                finish_reason = chunk["choices"][0]["finish_reason"]

                if finish_reason == "stop":
                    yield "data: __complete__\n\n"

                text_chunk = text_chunk.replace("\n", "<br>")
                yield f"data: {text_chunk}\n\n"

            except KeyError:
                logging.info(f"Debug: Skipping incomplete chunk {chunk}")  # Debug line
                continue
    # Send the recommendations back to the frontend
    return generate


@app.route("/generate_tree", methods=["POST"])
def generate_tree_endpoint():
    selection = request.json.get("selection")
    session_id = generate_unique_session_id()  # Assume you have this function defined
    session_store[session_id] = generate_tree_func(selection)
    return jsonify({"session_id": session_id, "selection": selection})


@app.route("/generate_answer", methods=["POST"])
def answer_endpoint():
    question = request.json.get("question")
    system_prompt = request.json.get("system_prompt")
    session_id = generate_unique_session_id()
    session_store[session_id] = generate_answer_func(question, system_prompt)
    return jsonify({"session_id": session_id, "question": question})

@app.route("/generate_recommendations", methods=["POST"])
def generate_recommendations_endpoint():
    node_name = request.json.get("node_name")
    node_content = request.json.get("node_content") 
    session_id = generate_unique_session_id()  # Assume you have this function defined
    session_store[session_id] = generate_recommendations_func(node_name, node_content)
    return jsonify({"session_id": session_id, "node_name": node_name})


@app.route("/request_sse")
def request_sse():
    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    session_id = request.args.get("session_id")
    generator_function = session_store.get(session_id)
    if generator_function:
        return Response(generator_function(), headers=headers)
    else:
        return "Session not found", 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
