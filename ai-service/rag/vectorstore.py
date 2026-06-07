import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

_vectorstore = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vectorstore = Chroma(
            persist_directory=os.getenv("CHROMA_DB_PATH", "./chroma_db"),
            embedding_function=embeddings
        )
    return _vectorstore