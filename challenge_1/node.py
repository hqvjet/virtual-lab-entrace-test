class Node:
    def __init__(self, position: list, metadata: dict):
        self.position = position
        self.metadata = metadata
        self.next = []

    def get_metadata(self, key: str):
        return self.metadata.get(key, None)
    
    def add_next(self, next_node):
        self.next.append(next_node)