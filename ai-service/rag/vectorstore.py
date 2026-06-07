import os
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma


_vectorstore = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        embeddings = OpenAIEmbeddings()
        _vectorstore = Chroma(
            persist_directory=os.getenv("CHROMA_DB_PATH", "./chroma_db"),
            embedding_function=embeddings
        )
    return _vectorstore
