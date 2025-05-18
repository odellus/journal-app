from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Post, Book, BookChapter

app = FastAPI(title="Journal-App API")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# ----------------- Post CRUD -----------------
@app.post("/posts", response_model=Post)
def create_post(post: Post, session: Session = Depends(get_session)):
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@app.get("/posts/{post_id}", response_model=Post)
def read_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.put("/posts/{post_id}", response_model=Post)
def update_post(post_id: int, payload: Post, session: Session = Depends(get_session)):
    db_post = session.get(Post, post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(db_post, field, value)
    session.add(db_post)
    session.commit()
    session.refresh(db_post)
    return db_post


@app.get("/posts", response_model=list[Post])
def list_posts(limit: int = 20, session: Session = Depends(get_session)):
    stmt = select(Post).order_by(Post.created_at.desc()).limit(limit)
    return session.exec(stmt).all()