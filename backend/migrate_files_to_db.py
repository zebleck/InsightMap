from neo4j import GraphDatabase
import os

# Initialize Neo4j connection
uri = "bolt://localhost:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))

def create_node(tx, name, content):
    tx.run("CREATE (:KnowledgeNode {name: $name, content: $content})", name=name, content=content)

FILES_DIR = "files"

# Iterate through existing files and create nodes
with driver.session() as session:
    for nodeName in os.listdir(FILES_DIR):
        file_path = os.path.join(FILES_DIR, nodeName)
        with open(file_path, 'r') as f:
            content = f.read()
        session.execute_write(create_node, nodeName.replace(".md", ""), content)

# Close Neo4j driver
driver.close()
