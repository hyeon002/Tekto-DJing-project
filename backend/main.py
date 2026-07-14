from fastapi import FastAPI

app = FastAPI(title="TEKTO STUDIO backend")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
