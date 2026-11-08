"""List persistence and ownership checks against an isolated SQLite database."""
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from database import Base, get_db


class ListsTest(unittest.TestCase):
    def test_lists_require_login_and_enforce_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(f"sqlite:///{Path(directory) / 'test.db'}", connect_args={"check_same_thread": False})
            Base.metadata.create_all(engine)
            sessions = sessionmaker(bind=engine)
            def test_db():
                with sessions() as session:
                    yield session
            app.dependency_overrides[get_db] = test_db
            try:
                with TestClient(app) as owner, TestClient(app) as other:
                    self.assertEqual(owner.get('/api/me/lists').status_code, 401)
                    self.assertEqual(owner.post('/api/lists', json={'name': 'Private'}).status_code, 401)
                    self.assertEqual(owner.post('/api/auth/register', json={'username': 'owner', 'password': 'password123'}).status_code, 201)
                    self.assertEqual(owner.post('/api/lists', json={'name': '  '}).status_code, 422)
                    created = owner.post('/api/lists', json={'name': 'Mixed favorites'})
                    self.assertEqual(created.status_code, 201)
                    list_id = created.json()['id']
                    for kind, source in [('movie', 'tmdb'), ('tv', 'tmdb'), ('music', 'spotify'), ('game', 'twitch'), ('book', 'local')]:
                        media = dict(media_type=kind, external_source=source, external_id=f'{kind}-test', title=f'Test {kind}')
                        saved = owner.post(f'/api/lists/{list_id}/items', json=media)
                        self.assertEqual(saved.status_code, 201, saved.text)
                    duplicate = owner.post(f'/api/lists/{list_id}/items', json=media)
                    self.assertEqual(duplicate.status_code, 409)
                    persisted = owner.get('/api/me/lists').json()[0]
                    self.assertEqual(len(persisted['entries']), 5)
                    entry_id = persisted['entries'][0]['id']
                    self.assertEqual(other.post('/api/auth/register', json={'username': 'other', 'password': 'password123'}).status_code, 201)
                    self.assertEqual(other.get('/api/me/lists').json(), [])
                    self.assertEqual(other.post(f'/api/lists/{list_id}/items', json=media).status_code, 404)
                    self.assertEqual(other.delete(f'/api/lists/{list_id}/items/{entry_id}').status_code, 404)
                    self.assertEqual(owner.delete(f'/api/lists/{list_id}/items/{entry_id}').status_code, 204)
                    self.assertEqual(len(owner.get('/api/me/lists').json()[0]['entries']), 4)
            finally:
                app.dependency_overrides.pop(get_db, None)
                engine.dispose()
