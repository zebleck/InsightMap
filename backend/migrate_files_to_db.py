from neo4j import GraphDatabase
import os
import re

# Initialize Neo4j connection
uri = "bolt://localhost:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))

FILES_DIR = "files"

def create_node(tx, name, content):
    tx.run("MERGE (n:KnowledgeNode {name: $name}) SET n.content = $content", name=name, content=content)

def create_links(tx, nodeName, content):
    linked_nodes = re.findall(r'\[([^\]]+)]\(\<node:([^\>]+)\>\)', content)
    unique_linked_nodes = list(set(node[1] for node in linked_nodes))

    # Delete all existing relationships to start afresh
    tx.run("MATCH (f:KnowledgeNode {name: $name})-[r:LINKS_TO]->() DELETE r", name=nodeName)

    # Create relationships
    for linked_node in unique_linked_nodes:
        tx.run("""
            MATCH (f:KnowledgeNode {name: $nodename})
            WITH f
            MATCH (t:KnowledgeNode {name: $linked_node})
            MERGE (f)-[:LINKS_TO]->(t)
        """, nodename=nodeName, linked_node=linked_node)

# First pass to create all the nodes
with driver.session() as session:
    for nodeName in os.listdir(FILES_DIR):
        file_path = os.path.join(FILES_DIR, nodeName)
        with open(file_path, 'r') as f:
            content = f.read()
        session.write_transaction(create_node, nodeName.replace(".md", ""), content)

# Second pass to create links between nodes
with driver.session() as session:
    for nodeName in os.listdir(FILES_DIR):
        file_path = os.path.join(FILES_DIR, nodeName)
        with open(file_path, 'r') as f:
            content = f.read()
        session.write_transaction(create_links, nodeName.replace(".md", ""), content)

# Close Neo4j driver
driver.close()
