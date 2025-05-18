from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int
    title: str
    body_md: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Book(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    chapters: List["BookChapter"] = Relationship(back_populates="book")


class BookChapter(SQLModel, table=True):
    book_id: int | None = Field(foreign_key="book.id", primary_key=True)
    post_id: int | None = Field(foreign_key="post.id", primary_key=True)
    order: int = Field(default=0)

    book: "Book" = Relationship(back_populates="chapters")