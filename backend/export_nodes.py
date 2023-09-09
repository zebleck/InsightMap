from neo4j import GraphDatabase
import os

# Initialize Neo4j connection
uri = "bolt://localhost:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))

def export_nodes(tx):
    # Fetch all File nodes
    result = tx.run("MATCH (n:KnowledgeNode) RETURN n.name AS name, n.content AS content")
    
    # Create directory if it doesn't exist
    if not os.path.exists('exported_files'):
        os.makedirs('exported_files')

    for record in result:
        name = record["name"]
        content = record["content"]
        file_path = os.path.join('exported_files', f"{name}.md")

        # Save each node's content to a .md file
        with open(file_path, 'w') as f:
            f.write(content)

# Run the export function
with driver.session() as session:
    session.write_transaction(export_nodes)

# Close Neo4j driver
driver.close()
