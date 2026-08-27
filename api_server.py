"""Backend locale trust-first per Everyday Agent.

Questa è una base di sviluppo, non un servizio finanziario/sanitario in produzione:
- SQLite conserva account, workspace, sessioni, stato dashboard, task e audit;
- password con scrypt, cookie di sessione opachi HttpOnly/SameSite=Strict e CSRF;
- autorizzazioni e ruoli sono verificati dal server, non dal browser;
- il modello propone task, mentre l'execution gateway non possiede credenziali e
  blocca qualsiasi azione esterna non ancora integrata e autorizzata.

Non usa dipendenze esterne per rendere il prototipo eseguibile subito. Prima di
un deployment reale servono TLS, key management, backup cifrati, rate limiting
distribuito, audit immutabile/WORM, revisioni di sicurezza e legali, provider
OAuth/Open Banking regolamentati e integrazioni per dominio.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional, Tuple
from urllib.parse import urlparse

from everyday_agent import AgentConfig, AutonomyLevel, EverydayAgent, Memory, Task


API_PREFIX = "/api"
SESSION_COOKIE = "everyday_agent_session"
MAX_BODY_BYTES = 256 * 1024
MAX_STATE_BYTES = 512 * 1024
SESSION_DAYS = 14
VALID_ROLES = {"owner", "partner", "teen", "trusted_person"}
VALID_PERMISSION_ACTIONS = {"read", "approve", "manage"}
SENSITIVE_DOMAINS = {"money", "health", "legal", "contract", "documents", "family_docs"}
FORBIDDEN_STATE_KEY_PARTS = ("password", "credential", "access_token", "refresh_token", "authorization")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class APIError(Exception):
    def __init__(self, status: int, code: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.status = int(status)
        self.code = code
        self.message = message
        self.details = details or {}


@dataclass(frozen=True)
class ServerSettings:
    database_path: Path
    session_secret: bytes
    host: str = "127.0.0.1"
    port: int = 4174
    session_days: int = SESSION_DAYS
    secure_cookie: bool = False
    static_root: Optional[Path] = None

    @classmethod
    def from_environment(cls, *, port: Optional[int] = None, static_root: Optional[Path] = None) -> "ServerSettings":
        database_path = Path(os.environ.get("EVERYDAY_AGENT_DB", "data/everyday-agent.db"))
        secret = os.environ.get("EVERYDAY_AGENT_SESSION_SECRET")
        # In locale il segreto effimero invalida le sessioni al riavvio. In
        # produzione è obbligatorio impostarlo tramite un secret manager.
        secret_bytes = secret.encode("utf-8") if secret else secrets.token_bytes(32)
        return cls(
            database_path=database_path,
            session_secret=secret_bytes,
            host=os.environ.get("EVERYDAY_AGENT_HOST", "127.0.0.1"),
            port=int(port or os.environ.get("EVERYDAY_AGENT_PORT", "4174")),
            session_days=max(1, int(os.environ.get("EVERYDAY_AGENT_SESSION_DAYS", str(SESSION_DAYS)))),
            secure_cookie=os.environ.get("EVERYDAY_AGENT_COOKIE_SECURE", "").casefold() in {"1", "true", "yes"},
            static_root=static_root,
        )


@dataclass(frozen=True)
class SessionContext:
    session_id: str
    user_id: str
    user_name: str
    email: str
    workspace_id: str
    role: str


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(str(value))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def password_hash(password: str, salt: bytes) -> str:
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32).hex()


def validate_password(password: Any) -> str:
    if not isinstance(password, str) or len(password) < 12:
        raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "weak_password", "La password deve avere almeno 12 caratteri.")
    if len(password) > 256 or "\x00" in password:
        raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_password", "Password non valida.")
    return password


def validate_name(name: Any) -> str:
    normalized = " ".join(str(name or "").split())
    if not 1 <= len(normalized) <= 80:
        raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_name", "Inserisci un nome tra 1 e 80 caratteri.")
    return normalized


def validate_email(email: Any) -> str:
    normalized = str(email or "").strip().casefold()
    if len(normalized) > 254 or not EMAIL_RE.fullmatch(normalized):
        raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_email", "Inserisci un indirizzo email valido.")
    return normalized


def safe_json_object(value: Any, *, limit: int = MAX_STATE_BYTES) -> Dict[str, Any]:
    if not isinstance(value, dict):
        raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_state", "Lo stato deve essere un oggetto JSON.")
    encoded = canonical_json(value).encode("utf-8")
    if len(encoded) > limit:
        raise APIError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "state_too_large", "Lo stato supera il limite consentito.")

    def scan(item: Any, path: str = "") -> None:
        if isinstance(item, dict):
            for key, child in item.items():
                key_text = str(key).casefold()
                if any(part in key_text for part in FORBIDDEN_STATE_KEY_PARTS):
                    raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "secret_in_state", "Credenziali e token non possono essere salvati nello stato della dashboard.", {"path": path or "root"})
                scan(child, f"{path}.{key}" if path else str(key))
        elif isinstance(item, list):
            for index, child in enumerate(item):
                scan(child, f"{path}[{index}]")

    scan(value)
    return value


class Database:
    """Repository SQLite deliberatamente piccolo con transazioni serializzate."""

    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path), timeout=10, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 5000")
        return connection

    def _initialize(self) -> None:
        schema = """
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          owner_user_id TEXT NOT NULL REFERENCES users(id),
          dashboard_state_json TEXT NOT NULL DEFAULT '{}',
          agent_memory_json TEXT NOT NULL DEFAULT '{}',
          state_version INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS memberships (
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (workspace_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          csrf_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS permission_grants (
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          domain TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (workspace_id, role, domain, action)
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          created_by TEXT NOT NULL REFERENCES users(id),
          task_json TEXT NOT NULL,
          decision_json TEXT NOT NULL,
          status TEXT NOT NULL,
          approved_by TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS execution_requests (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          requested_by TEXT NOT NULL REFERENCES users(id),
          connector TEXT NOT NULL,
          operation TEXT NOT NULL,
          status TEXT NOT NULL,
          reason TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          actor_user_id TEXT,
          event_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          previous_hash TEXT NOT NULL,
          event_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);
        CREATE INDEX IF NOT EXISTS tasks_workspace_idx ON tasks(workspace_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS audit_workspace_idx ON audit_events(workspace_id, id);
        """
        with self.transaction() as connection:
            connection.executescript(schema)

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            connection = self._connect()
            try:
                connection.execute("BEGIN IMMEDIATE")
                yield connection
                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                connection.close()

    def one(self, query: str, params: Tuple[Any, ...] = ()) -> Optional[sqlite3.Row]:
        with self._lock:
            connection = self._connect()
            try:
                return connection.execute(query, params).fetchone()
            finally:
                connection.close()

    def all(self, query: str, params: Tuple[Any, ...] = ()) -> List[sqlite3.Row]:
        with self._lock:
            connection = self._connect()
            try:
                return connection.execute(query, params).fetchall()
            finally:
                connection.close()


class AgentBackend:
    def __init__(self, settings: ServerSettings):
        self.settings = settings
        self.db = Database(settings.database_path)
        self._attempts: Dict[str, List[float]] = {}
        self._attempt_lock = threading.Lock()

    def _token_hash(self, value: str) -> str:
        return hmac.new(self.settings.session_secret, value.encode("utf-8"), hashlib.sha256).hexdigest()

    @staticmethod
    def _row_json(row: sqlite3.Row, column: str, default: Any) -> Any:
        try:
            value = json.loads(row[column])
            return value if isinstance(value, type(default)) else default
        except (KeyError, TypeError, json.JSONDecodeError):
            return default

    def _check_login_rate(self, key: str) -> None:
        now = utc_now().timestamp()
        with self._attempt_lock:
            recent = [stamp for stamp in self._attempts.get(key, []) if now - stamp < 15 * 60]
            if len(recent) >= 5:
                raise APIError(HTTPStatus.TOO_MANY_REQUESTS, "login_rate_limited", "Troppi tentativi. Riprova più tardi.")
            self._attempts[key] = recent

    def _failed_login(self, key: str) -> None:
        with self._attempt_lock:
            self._attempts.setdefault(key, []).append(utc_now().timestamp())

    def _clear_login_attempts(self, key: str) -> None:
        with self._attempt_lock:
            self._attempts.pop(key, None)

    def _create_session(self, user_id: str, workspace_id: str) -> Tuple[str, str, SessionContext]:
        token = secrets.token_urlsafe(32)
        csrf = secrets.token_urlsafe(32)
        now = iso_now()
        expires = (utc_now() + timedelta(days=self.settings.session_days)).isoformat()
        session_id = str(uuid.uuid4())
        with self.db.transaction() as connection:
            connection.execute(
                "INSERT INTO sessions (id, user_id, workspace_id, token_hash, csrf_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (session_id, user_id, workspace_id, self._token_hash(token), self._token_hash(csrf), now, expires, now),
            )
            row = connection.execute(
                "SELECT u.display_name, u.email, m.role FROM users u JOIN memberships m ON m.user_id = u.id WHERE u.id = ? AND m.workspace_id = ?",
                (user_id, workspace_id),
            ).fetchone()
        if row is None:
            raise APIError(HTTPStatus.UNAUTHORIZED, "invalid_session", "Sessione non valida.")
        return token, csrf, SessionContext(session_id, user_id, row["display_name"], row["email"], workspace_id, row["role"])

    def register(self, payload: Dict[str, Any], client_key: str) -> Tuple[str, str, SessionContext]:
        name = validate_name(payload.get("name"))
        email = validate_email(payload.get("email"))
        password = validate_password(payload.get("password"))
        if payload.get("policiesAcknowledged") is not True:
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "policy_required", "Devi accettare i confini operativi prima di creare un account.")
        self._check_login_rate(f"register:{client_key}:{email}")
        user_id = str(uuid.uuid4())
        workspace_id = str(uuid.uuid4())
        now = iso_now()
        salt = secrets.token_bytes(16)
        try:
            with self.db.transaction() as connection:
                connection.execute(
                    "INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, email, name, password_hash(password, salt), base64.b64encode(salt).decode("ascii"), now),
                )
                connection.execute(
                    "INSERT INTO workspaces (id, name, owner_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                    (workspace_id, f"Spazio di {name}", user_id, now, now),
                )
                connection.execute(
                    "INSERT INTO memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)",
                    (workspace_id, user_id, now),
                )
        except sqlite3.IntegrityError as error:
            self._failed_login(f"register:{client_key}:{email}")
            if "users.email" in str(error):
                raise APIError(HTTPStatus.CONFLICT, "email_in_use", "Esiste già un account con questa email.") from error
            raise
        self._clear_login_attempts(f"register:{client_key}:{email}")
        self.append_audit(workspace_id, user_id, "account_registered", {"email": email, "role": "owner"})
        return self._create_session(user_id, workspace_id)

    def login(self, payload: Dict[str, Any], client_key: str) -> Tuple[str, str, SessionContext]:
        email = validate_email(payload.get("email"))
        password = str(payload.get("password") or "")
        key = f"login:{client_key}:{email}"
        self._check_login_rate(key)
        row = self.db.one("SELECT * FROM users WHERE email = ?", (email,))
        valid = False
        if row is not None:
            try:
                salt = base64.b64decode(row["password_salt"])
                valid = hmac.compare_digest(password_hash(password, salt), row["password_hash"])
            except (ValueError, TypeError):
                valid = False
        if not valid:
            self._failed_login(key)
            raise APIError(HTTPStatus.UNAUTHORIZED, "invalid_credentials", "Email o password non validi.")
        membership = self.db.one("SELECT workspace_id FROM memberships WHERE user_id = ? ORDER BY created_at LIMIT 1", (row["id"],))
        if membership is None:
            raise APIError(HTTPStatus.FORBIDDEN, "no_workspace", "L'account non ha uno spazio attivo.")
        self._clear_login_attempts(key)
        token, csrf, context = self._create_session(row["id"], membership["workspace_id"])
        self.append_audit(context.workspace_id, context.user_id, "account_logged_in", {"role": context.role})
        return token, csrf, context

    def session_from_cookie(self, cookie_header: Optional[str]) -> Optional[SessionContext]:
        if not cookie_header:
            return None
        try:
            cookies = SimpleCookie()
            cookies.load(cookie_header)
            morsel = cookies.get(SESSION_COOKIE)
            token = morsel.value if morsel else ""
        except (KeyError, ValueError):
            return None
        if not token:
            return None
        row = self.db.one(
            """
            SELECT s.id AS session_id, s.user_id, s.workspace_id, s.expires_at,
                   u.display_name, u.email, m.role
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            JOIN memberships m ON m.user_id = s.user_id AND m.workspace_id = s.workspace_id
            WHERE s.token_hash = ?
            """,
            (self._token_hash(token),),
        )
        if row is None:
            return None
        try:
            expired = parse_timestamp(row["expires_at"]) <= utc_now()
        except (ValueError, TypeError):
            expired = True
        if expired:
            with self.db.transaction() as connection:
                connection.execute("DELETE FROM sessions WHERE id = ?", (row["session_id"],))
            return None
        with self.db.transaction() as connection:
            connection.execute("UPDATE sessions SET last_seen_at = ? WHERE id = ?", (iso_now(), row["session_id"]))
        return SessionContext(row["session_id"], row["user_id"], row["display_name"], row["email"], row["workspace_id"], row["role"])

    def rotate_csrf(self, context: SessionContext) -> str:
        csrf = secrets.token_urlsafe(32)
        with self.db.transaction() as connection:
            connection.execute("UPDATE sessions SET csrf_hash = ? WHERE id = ?", (self._token_hash(csrf), context.session_id))
        return csrf

    def verify_csrf(self, context: SessionContext, token: Optional[str]) -> bool:
        if not token or len(token) > 256:
            return False
        row = self.db.one("SELECT csrf_hash FROM sessions WHERE id = ?", (context.session_id,))
        return bool(row and hmac.compare_digest(row["csrf_hash"], self._token_hash(token)))

    def logout(self, context: SessionContext) -> None:
        with self.db.transaction() as connection:
            connection.execute("DELETE FROM sessions WHERE id = ?", (context.session_id,))
        self.append_audit(context.workspace_id, context.user_id, "account_logged_out", {})

    def session_payload(self, context: Optional[SessionContext]) -> Dict[str, Any]:
        if context is None:
            return {"authenticated": False, "externalActions": False, "mode": "local"}
        workspace = self.db.one("SELECT id, name, state_version, updated_at FROM workspaces WHERE id = ?", (context.workspace_id,))
        return {
            "authenticated": True,
            "user": {"id": context.user_id, "name": context.user_name, "email": context.email},
            "workspace": {"id": context.workspace_id, "name": workspace["name"] if workspace else "", "role": context.role, "stateVersion": int(workspace["state_version"]) if workspace else 0, "updatedAt": workspace["updated_at"] if workspace else None},
            "externalActions": False,
            "mode": "local-development",
        }

    def _workspace_row(self, workspace_id: str) -> sqlite3.Row:
        row = self.db.one("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
        if row is None:
            raise APIError(HTTPStatus.NOT_FOUND, "workspace_not_found", "Spazio non trovato.")
        return row

    def get_dashboard_state(self, context: SessionContext) -> Dict[str, Any]:
        row = self._workspace_row(context.workspace_id)
        return {"state": self._row_json(row, "dashboard_state_json", {}), "version": int(row["state_version"]), "updatedAt": row["updated_at"]}

    def put_dashboard_state(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.require_owner(context)
        state = safe_json_object(payload.get("state"))
        expected_version = payload.get("version")
        if expected_version is not None and (not isinstance(expected_version, int) or expected_version < 0):
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_version", "La versione dello stato non è valida.")
        now = iso_now()
        with self.db.transaction() as connection:
            row = connection.execute("SELECT state_version FROM workspaces WHERE id = ?", (context.workspace_id,)).fetchone()
            if row is None:
                raise APIError(HTTPStatus.NOT_FOUND, "workspace_not_found", "Spazio non trovato.")
            current = int(row["state_version"])
            if expected_version is not None and expected_version != current:
                raise APIError(HTTPStatus.CONFLICT, "state_conflict", "Lo stato è stato modificato in un'altra sessione.", {"currentVersion": current})
            next_version = current + 1
            connection.execute(
                "UPDATE workspaces SET dashboard_state_json = ?, state_version = ?, updated_at = ? WHERE id = ?",
                (canonical_json(state), next_version, now, context.workspace_id),
            )
        self.append_audit(context.workspace_id, context.user_id, "dashboard_state_saved", {"version": next_version, "bytes": len(canonical_json(state).encode("utf-8"))})
        return {"version": next_version, "updatedAt": now}

    def _agent_memory(self, workspace_id: str) -> Dict[str, Any]:
        row = self._workspace_row(workspace_id)
        return self._row_json(row, "agent_memory_json", {})

    def _save_agent_memory(self, workspace_id: str, memory_data: Dict[str, Any]) -> None:
        encoded = canonical_json(memory_data)
        if len(encoded.encode("utf-8")) > MAX_STATE_BYTES:
            raise APIError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "agent_memory_too_large", "La memoria dell'agente supera il limite consentito.")
        with self.db.transaction() as connection:
            connection.execute("UPDATE workspaces SET agent_memory_json = ?, updated_at = ? WHERE id = ?", (encoded, iso_now(), workspace_id))

    def permission_matrix(self, workspace_id: str) -> Dict[str, Dict[str, List[str]]]:
        matrix: Dict[str, Dict[str, List[str]]] = {"owner": {"*": ["all"]}}
        for row in self.db.all("SELECT role, domain, action FROM permission_grants WHERE workspace_id = ?", (workspace_id,)):
            matrix.setdefault(row["role"], {}).setdefault(row["domain"], []).append(row["action"])
        return matrix

    def role_allows(self, workspace_id: str, role: str, domain: str, action: str) -> bool:
        normalized_role = str(role).casefold()
        normalized_domain = str(domain or "general").casefold()
        normalized_action = str(action).casefold()
        if normalized_role == "owner":
            return True
        if normalized_role == "trusted_person":
            return normalized_action == "read"
        if normalized_role == "teen" and normalized_domain in SENSITIVE_DOMAINS:
            return False
        rows = self.db.all(
            "SELECT action FROM permission_grants WHERE workspace_id = ? AND role = ? AND domain IN (?, '*')",
            (workspace_id, normalized_role, normalized_domain),
        )
        granted = {row["action"] for row in rows}
        return normalized_action in granted or "manage" in granted

    def set_permission(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.require_owner(context)
        role = str(payload.get("role") or "").casefold()
        domain = str(payload.get("domain") or "").casefold()
        actions = payload.get("actions")
        if role not in VALID_ROLES or role == "owner":
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_role", "Il ruolo selezionato non è modificabile.")
        if not domain or len(domain) > 50 or not isinstance(actions, list):
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_permission", "Permessi non validi.")
        normalized_actions = sorted({str(item).casefold() for item in actions})
        if any(action not in VALID_PERMISSION_ACTIONS for action in normalized_actions):
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_permission", "Azione di permesso non valida.")
        if role == "teen" and (domain in SENSITIVE_DOMAINS or "manage" in normalized_actions):
            raise APIError(HTTPStatus.FORBIDDEN, "minor_permission_blocked", "Un minore non può gestire o approvare domini sensibili.")
        if role == "trusted_person" and any(action != "read" for action in normalized_actions):
            raise APIError(HTTPStatus.FORBIDDEN, "trusted_permission_blocked", "La persona di fiducia può avere solo accesso di lettura in emergenza.")
        with self.db.transaction() as connection:
            connection.execute("DELETE FROM permission_grants WHERE workspace_id = ? AND role = ? AND domain = ?", (context.workspace_id, role, domain))
            connection.executemany(
                "INSERT INTO permission_grants (workspace_id, role, domain, action, created_at) VALUES (?, ?, ?, ?, ?)",
                [(context.workspace_id, role, domain, action, iso_now()) for action in normalized_actions],
            )
        self.append_audit(context.workspace_id, context.user_id, "permission_changed", {"role": role, "domain": domain, "actions": normalized_actions})
        return {"role": role, "domain": domain, "actions": normalized_actions}

    def get_permissions(self, context: SessionContext) -> Dict[str, Any]:
        rows = self.db.all("SELECT role, domain, action FROM permission_grants WHERE workspace_id = ? ORDER BY role, domain, action", (context.workspace_id,))
        return {"matrix": self.permission_matrix(context.workspace_id), "grants": [dict(row) for row in rows]}

    def add_member(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.require_owner(context)
        email = validate_email(payload.get("email"))
        role = str(payload.get("role") or "").casefold()
        if role not in VALID_ROLES or role == "owner":
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_role", "Scegli un ruolo familiare valido.")
        user = self.db.one("SELECT id, display_name, email FROM users WHERE email = ?", (email,))
        if user is None:
            raise APIError(HTTPStatus.NOT_FOUND, "member_not_registered", "La persona deve creare prima un account locale.")
        with self.db.transaction() as connection:
            connection.execute(
                "INSERT INTO memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(workspace_id, user_id) DO UPDATE SET role = excluded.role",
                (context.workspace_id, user["id"], role, iso_now()),
            )
        self.append_audit(context.workspace_id, context.user_id, "member_added", {"member": email, "role": role})
        return {"id": user["id"], "name": user["display_name"], "email": user["email"], "role": role}

    def list_members(self, context: SessionContext) -> Dict[str, Any]:
        rows = self.db.all(
            "SELECT u.id, u.display_name AS name, u.email, m.role, m.created_at FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.workspace_id = ? ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, u.display_name",
            (context.workspace_id,),
        )
        return {"members": [dict(row) for row in rows]}

    def switch_workspace(self, context: SessionContext, payload: Dict[str, Any]) -> Tuple[str, SessionContext]:
        workspace_id = str(payload.get("workspaceId") or "")
        membership = self.db.one("SELECT role FROM memberships WHERE workspace_id = ? AND user_id = ?", (workspace_id, context.user_id))
        if membership is None:
            raise APIError(HTTPStatus.FORBIDDEN, "workspace_forbidden", "Non hai accesso a questo spazio.")
        with self.db.transaction() as connection:
            connection.execute("UPDATE sessions SET workspace_id = ? WHERE id = ?", (workspace_id, context.session_id))
        self.append_audit(workspace_id, context.user_id, "workspace_switched", {"role": membership["role"]})
        refreshed = SessionContext(context.session_id, context.user_id, context.user_name, context.email, workspace_id, membership["role"])
        return self.rotate_csrf(refreshed), refreshed

    def _agent_for_workspace(self, workspace_id: str) -> EverydayAgent:
        memory = Memory(
            initial_data=self._agent_memory(workspace_id),
            save_callback=lambda data: self._save_agent_memory(workspace_id, data),
        )
        config = AgentConfig(family_permissions=self.permission_matrix(workspace_id))
        return EverydayAgent(config, memory)

    @staticmethod
    def _decision_payload(decision: Any) -> Dict[str, Any]:
        return {
            "task": asdict(decision.task),
            "level": int(decision.level),
            "reason": decision.reason,
            "options": list(decision.options),
            "activeNotification": bool(decision.active_notification),
            "notificationQueued": bool(decision.notification_queued),
            "routedTo": decision.routed_to,
            "calibrationNotice": bool(decision.calibration_notice),
            "explanation": decision.explanation,
            "trustScore": decision.trust_score,
            "trustKey": decision.trust_key,
            "trustContext": decision.trust_context,
            "trustCap": decision.trust_cap,
            "dynamicSpendLimitEur": decision.dynamic_spend_limit_eur,
            "trustSource": decision.trust_source,
            "importedTrustProposal": decision.imported_trust_proposal,
        }

    def create_task(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        task_data = payload.get("task", payload)
        if not isinstance(task_data, dict):
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_task", "Il task deve essere un oggetto JSON.")
        task = Task.from_dict(task_data)
        task.title = " ".join(str(task.title or "").split())
        if not task.title or len(task.title) > 300:
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_task", "Il titolo del task deve contenere da 1 a 300 caratteri.")
        if task.amount_eur is not None and (float(task.amount_eur) < 0 or float(task.amount_eur) > 10_000_000):
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_amount", "Importo non valido.")
        # Il motore è separato dall'esecutore. process() produce una decisione,
        # ma nessun connettore o credenziale viene invocato da questo endpoint.
        agent = self._agent_for_workspace(context.workspace_id)
        decision = agent.process(task)
        task_id = str(uuid.uuid4())
        decision_data = self._decision_payload(decision)
        status = "pending" if decision.level == AutonomyLevel.ASK_FIRST else "prepared"
        now = iso_now()
        with self.db.transaction() as connection:
            connection.execute(
                "INSERT INTO tasks (id, workspace_id, created_by, task_json, decision_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, context.workspace_id, context.user_id, canonical_json(asdict(task)), canonical_json(decision_data), status, now, now),
            )
        self.append_audit(context.workspace_id, context.user_id, "task_evaluated", {"task_id": task_id, "level": int(decision.level), "category": task.category, "trust_score": decision.trust_score})
        return {"id": task_id, "status": status, "decision": decision_data, "execution": {"status": "not_started", "externalAction": False, "reason": "Il gateway non ha credenziali né connettori configurati."}}

    def list_tasks(self, context: SessionContext) -> Dict[str, Any]:
        rows = self.db.all("SELECT id, task_json, decision_json, status, approved_by, created_at, updated_at FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100", (context.workspace_id,))
        tasks = []
        for row in rows:
            tasks.append({"id": row["id"], "task": json.loads(row["task_json"]), "decision": json.loads(row["decision_json"]), "status": row["status"], "approvedBy": row["approved_by"], "createdAt": row["created_at"], "updatedAt": row["updated_at"]})
        return {"tasks": tasks}

    def _task_row(self, context: SessionContext, task_id: str) -> sqlite3.Row:
        row = self.db.one("SELECT * FROM tasks WHERE id = ? AND workspace_id = ?", (task_id, context.workspace_id))
        if row is None:
            raise APIError(HTTPStatus.NOT_FOUND, "task_not_found", "Task non trovato.")
        return row

    def resolve_task(self, context: SessionContext, task_id: str, resolution: str) -> Dict[str, Any]:
        row = self._task_row(context, task_id)
        if row["status"] != "pending":
            raise APIError(HTTPStatus.CONFLICT, "task_not_pending", "Il task non è più in attesa di una decisione.")
        task = Task.from_dict(json.loads(row["task_json"]))
        if resolution == "approve":
            if not self.role_allows(context.workspace_id, context.role, task.category, "approve"):
                self.append_audit(context.workspace_id, context.user_id, "approval_denied", {"task_id": task_id, "role": context.role, "category": task.category})
                raise APIError(HTTPStatus.FORBIDDEN, "approval_forbidden", "Questo ruolo non può approvare il dominio richiesto.")
            agent = self._agent_for_workspace(context.workspace_id)
            created = parse_timestamp(task.created_at)
            latency = max(0.0, (utc_now() - created).total_seconds())
            interaction = agent.record_trust_interaction(task, "approved", response_time_seconds=latency)
            agent.memory.record_completion(task)
            agent.memory.record_approval(task.title)
            action = {"task": asdict(task), "status": "approved", "level": 3, "approved_by": context.role, "at": iso_now(), "trust_score_after": interaction["score_after"], "trust_key": interaction["key"], "execution": "not_started"}
            agent.memory.record_action(action)
            agent.memory.record_metric("level3_approved")
            status = "approved"
            response = {"trustScore": interaction["score_after"], "execution": {"status": "not_started", "externalAction": False, "reason": "L'approvazione non invia alcuna azione a terzi senza un connettore autorizzato."}}
        elif resolution == "reject":
            agent = self._agent_for_workspace(context.workspace_id)
            interaction = agent.record_trust_interaction(task, "rejected")
            agent.memory.reject(task.title, interaction["key"])
            agent.memory.record_security_event({"event": "decision_rejected", "title": task.title, "at": iso_now()})
            status = "rejected"
            response = {"trustScore": interaction["score_after"]}
        elif resolution == "defer":
            status = "deferred"
            response = {"message": "Task rimandato nel digest; nessuna azione esterna è stata eseguita."}
        else:
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_resolution", "Risoluzione non valida.")
        with self.db.transaction() as connection:
            connection.execute("UPDATE tasks SET status = ?, approved_by = ?, updated_at = ? WHERE id = ?", (status, context.user_id if status == "approved" else None, iso_now(), task_id))
        self.append_audit(context.workspace_id, context.user_id, f"task_{status}", {"task_id": task_id, "role": context.role})
        return {"id": task_id, "status": status, **response}

    def request_execution(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Gateway esplicito: registra una richiesta ma non chiama mai un terzo.

        La separazione è intenzionale: il modello non riceve token e la sola
        approvazione dell'utente non equivale a un pagamento/prenotazione reale.
        """
        task_id = str(payload.get("taskId") or "")
        connector = str(payload.get("connector") or "").strip().casefold()
        operation = str(payload.get("operation") or "").strip().casefold()
        if not task_id or not connector or not operation:
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_execution_request", "Task, connettore e operazione sono obbligatori.")
        row = self._task_row(context, task_id)
        task = Task.from_dict(json.loads(row["task_json"]))
        forbidden = {"pay", "payment", "transfer", "send", "delete", "cancel", "sign", "share_health"}
        if operation in forbidden or task.category.casefold() in SENSITIVE_DOMAINS:
            reason = "Il gateway blocca azioni sensibili e irreversibili finché non esistono connettore regolamentato, consenso specifico e controllo umano." 
            status = "blocked"
        elif row["status"] != "approved":
            reason = "La richiesta richiede prima una decisione approvata."
            status = "blocked"
        elif operation == "prepare":
            reason = "Bozza preparata localmente: nessuna chiamata al fornitore è stata effettuata."
            status = "prepared"
        else:
            reason = "Nessun connettore con credenziali scoped è configurato: l'azione esterna resta bloccata."
            status = "blocked"
        request_id = str(uuid.uuid4())
        with self.db.transaction() as connection:
            connection.execute(
                "INSERT INTO execution_requests (id, workspace_id, task_id, requested_by, connector, operation, status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (request_id, context.workspace_id, task_id, context.user_id, connector, operation, status, reason, iso_now()),
            )
        self.append_audit(context.workspace_id, context.user_id, "execution_gateway_request", {"request_id": request_id, "task_id": task_id, "connector": connector, "operation": operation, "status": status})
        response = {"id": request_id, "status": status, "reason": reason, "externalAction": False}
        if status == "blocked":
            raise APIError(HTTPStatus.CONFLICT, "external_execution_blocked", reason, response)
        return response

    def grant_consent(self, context: SessionContext, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.require_owner(context)
        domain = str(payload.get("domain") or "").casefold()
        granted = bool(payload.get("granted"))
        if not domain or len(domain) > 50:
            raise APIError(HTTPStatus.UNPROCESSABLE_ENTITY, "invalid_domain", "Dominio non valido.")
        agent = self._agent_for_workspace(context.workspace_id)
        consent = agent.grant_domain_consent(domain, actor=context.role) if granted else agent.revoke_domain_consent(domain, actor=context.role)
        self.append_audit(context.workspace_id, context.user_id, "domain_consent_changed", {"domain": domain, "granted": granted})
        return consent

    def get_audit(self, context: SessionContext) -> Dict[str, Any]:
        self.require_owner(context)
        rows = self.db.all("SELECT id, actor_user_id, event_type, payload_json, previous_hash, event_hash, created_at FROM audit_events WHERE workspace_id = ? ORDER BY id DESC LIMIT 100", (context.workspace_id,))
        return {"valid": self.verify_audit(context.workspace_id), "events": [{**dict(row), "payload": json.loads(row["payload_json"])} for row in rows]}

    def append_audit(self, workspace_id: str, actor_user_id: Optional[str], event_type: str, payload: Dict[str, Any]) -> None:
        timestamp = iso_now()
        with self.db.transaction() as connection:
            previous = connection.execute("SELECT event_hash FROM audit_events WHERE workspace_id = ? ORDER BY id DESC LIMIT 1", (workspace_id,)).fetchone()
            previous_hash = previous["event_hash"] if previous else ""
            body = {"workspaceId": workspace_id, "actorUserId": actor_user_id, "eventType": event_type, "payload": payload, "previousHash": previous_hash, "createdAt": timestamp}
            event_hash = hashlib.sha256((previous_hash + canonical_json(body)).encode("utf-8")).hexdigest()
            connection.execute(
                "INSERT INTO audit_events (workspace_id, actor_user_id, event_type, payload_json, previous_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (workspace_id, actor_user_id, event_type, canonical_json(payload), previous_hash, event_hash, timestamp),
            )

    def verify_audit(self, workspace_id: str) -> bool:
        rows = self.db.all("SELECT actor_user_id, event_type, payload_json, previous_hash, event_hash, created_at FROM audit_events WHERE workspace_id = ? ORDER BY id", (workspace_id,))
        previous_hash = ""
        for row in rows:
            payload = json.loads(row["payload_json"])
            body = {"workspaceId": workspace_id, "actorUserId": row["actor_user_id"], "eventType": row["event_type"], "payload": payload, "previousHash": previous_hash, "createdAt": row["created_at"]}
            expected = hashlib.sha256((previous_hash + canonical_json(body)).encode("utf-8")).hexdigest()
            if row["previous_hash"] != previous_hash or not hmac.compare_digest(row["event_hash"], expected):
                return False
            previous_hash = row["event_hash"]
        return True

    @staticmethod
    def require_owner(context: SessionContext) -> None:
        if context.role != "owner":
            raise APIError(HTTPStatus.FORBIDDEN, "owner_required", "Questa operazione richiede il ruolo di proprietario.")


class APIHandler(BaseHTTPRequestHandler):
    server_version = "EverydayAgentAPI/0.1"
    protocol_version = "HTTP/1.1"

    @property
    def backend(self) -> AgentBackend:
        return self.server.backend  # type: ignore[attr-defined]

    @property
    def settings(self) -> ServerSettings:
        return self.server.settings  # type: ignore[attr-defined]

    def log_message(self, format: str, *args: Any) -> None:
        # Non scrivere token, cookie o body nei log del server.
        if os.environ.get("EVERYDAY_AGENT_HTTP_LOG", "").casefold() in {"1", "true", "yes"}:
            super().log_message(format, *args)

    def _headers(self, *, content_type: str = "application/json; charset=utf-8") -> None:
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")

    def send_json(self, status: int, payload: Dict[str, Any], *, cookies: Optional[Iterable[str]] = None) -> None:
        body = canonical_json(payload).encode("utf-8")
        self.send_response(int(status))
        self._headers()
        for cookie in cookies or []:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, error: APIError) -> None:
        payload: Dict[str, Any] = {"error": {"code": error.code, "message": error.message}}
        if error.details:
            payload["error"]["details"] = error.details
        self.send_json(error.status, payload)

    def read_json(self) -> Dict[str, Any]:
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().casefold()
        if content_type != "application/json":
            raise APIError(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "json_required", "Usa Content-Type application/json.")
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise APIError(HTTPStatus.BAD_REQUEST, "invalid_length", "Content-Length non valido.") from error
        if size < 1:
            raise APIError(HTTPStatus.BAD_REQUEST, "empty_body", "Il body JSON è obbligatorio.")
        if size > MAX_BODY_BYTES:
            raise APIError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "body_too_large", "Richiesta troppo grande.")
        try:
            payload = json.loads(self.rfile.read(size).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise APIError(HTTPStatus.BAD_REQUEST, "invalid_json", "JSON non valido.") from error
        if not isinstance(payload, dict):
            raise APIError(HTTPStatus.BAD_REQUEST, "json_object_required", "Il body deve essere un oggetto JSON.")
        return payload

    def client_key(self) -> str:
        return self.client_address[0] if self.client_address else "local"

    def require_session(self, *, csrf: bool = False) -> SessionContext:
        context = self.backend.session_from_cookie(self.headers.get("Cookie"))
        if context is None:
            raise APIError(HTTPStatus.UNAUTHORIZED, "authentication_required", "Accedi prima di usare questa risorsa.")
        if csrf and not self.backend.verify_csrf(context, self.headers.get("X-CSRF-Token")):
            raise APIError(HTTPStatus.FORBIDDEN, "csrf_failed", "Token CSRF mancante o non valido.")
        return context

    def session_cookie(self, token: str, *, clear: bool = False) -> str:
        attrs = [f"{SESSION_COOKIE}={token}", "Path=/", "HttpOnly", "SameSite=Strict"]
        if clear:
            attrs.append("Max-Age=0")
        else:
            attrs.append(f"Max-Age={self.settings.session_days * 86400}")
        if self.settings.secure_cookie:
            attrs.append("Secure")
        return "; ".join(attrs)

    def do_OPTIONS(self) -> None:
        self.send_json(HTTPStatus.NO_CONTENT, {})

    def do_GET(self) -> None:
        try:
            path = urlparse(self.path).path
            if path == "/api/health":
                self.send_json(HTTPStatus.OK, {"status": "ok", "mode": "local-development", "externalActions": False})
                return
            if path == "/api/session":
                context = self.backend.session_from_cookie(self.headers.get("Cookie"))
                payload = self.backend.session_payload(context)
                if context is not None:
                    payload["csrfToken"] = self.backend.rotate_csrf(context)
                self.send_json(HTTPStatus.OK, payload)
                return
            if path == "/api/state":
                self.send_json(HTTPStatus.OK, self.backend.get_dashboard_state(self.require_session()))
                return
            if path == "/api/permissions":
                self.send_json(HTTPStatus.OK, self.backend.get_permissions(self.require_session()))
                return
            if path == "/api/members":
                self.send_json(HTTPStatus.OK, self.backend.list_members(self.require_session()))
                return
            if path == "/api/tasks":
                self.send_json(HTTPStatus.OK, self.backend.list_tasks(self.require_session()))
                return
            if path == "/api/audit":
                self.send_json(HTTPStatus.OK, self.backend.get_audit(self.require_session()))
                return
            self._serve_static(path)
        except APIError as error:
            self.send_error_json(error)
        except BrokenPipeError:
            return
        except Exception:
            self.send_error_json(APIError(HTTPStatus.INTERNAL_SERVER_ERROR, "internal_error", "Errore interno del server."))

    def do_POST(self) -> None:
        try:
            path = urlparse(self.path).path
            payload = self.read_json()
            if path == "/api/auth/register":
                token, csrf, context = self.backend.register(payload, self.client_key())
                response = self.backend.session_payload(context)
                response["csrfToken"] = csrf
                self.send_json(HTTPStatus.CREATED, response, cookies=[self.session_cookie(token)])
                return
            if path == "/api/auth/login":
                token, csrf, context = self.backend.login(payload, self.client_key())
                response = self.backend.session_payload(context)
                response["csrfToken"] = csrf
                self.send_json(HTTPStatus.OK, response, cookies=[self.session_cookie(token)])
                return
            if path == "/api/auth/logout":
                context = self.require_session(csrf=True)
                self.backend.logout(context)
                self.send_json(HTTPStatus.OK, {"authenticated": False}, cookies=[self.session_cookie("", clear=True)])
                return
            if path == "/api/members":
                self.send_json(HTTPStatus.CREATED, self.backend.add_member(self.require_session(csrf=True), payload))
                return
            if path == "/api/session/workspace":
                csrf, context = self.backend.switch_workspace(self.require_session(csrf=True), payload)
                response = self.backend.session_payload(context)
                response["csrfToken"] = csrf
                self.send_json(HTTPStatus.OK, response)
                return
            if path == "/api/tasks":
                self.send_json(HTTPStatus.CREATED, self.backend.create_task(self.require_session(csrf=True), payload))
                return
            if path.startswith("/api/tasks/"):
                task_id, action = self._task_action(path)
                if action in {"approve", "reject", "defer"}:
                    self.send_json(HTTPStatus.OK, self.backend.resolve_task(self.require_session(csrf=True), task_id, action))
                    return
            if path == "/api/executions":
                self.send_json(HTTPStatus.ACCEPTED, self.backend.request_execution(self.require_session(csrf=True), payload))
                return
            if path == "/api/consents":
                self.send_json(HTTPStatus.OK, self.backend.grant_consent(self.require_session(csrf=True), payload))
                return
            raise APIError(HTTPStatus.NOT_FOUND, "route_not_found", "Endpoint non trovato.")
        except APIError as error:
            self.send_error_json(error)
        except BrokenPipeError:
            return
        except Exception:
            self.send_error_json(APIError(HTTPStatus.INTERNAL_SERVER_ERROR, "internal_error", "Errore interno del server."))

    def do_PUT(self) -> None:
        try:
            path = urlparse(self.path).path
            payload = self.read_json()
            if path == "/api/state":
                self.send_json(HTTPStatus.OK, self.backend.put_dashboard_state(self.require_session(csrf=True), payload))
                return
            if path == "/api/permissions":
                self.send_json(HTTPStatus.OK, self.backend.set_permission(self.require_session(csrf=True), payload))
                return
            raise APIError(HTTPStatus.NOT_FOUND, "route_not_found", "Endpoint non trovato.")
        except APIError as error:
            self.send_error_json(error)
        except BrokenPipeError:
            return
        except Exception:
            self.send_error_json(APIError(HTTPStatus.INTERNAL_SERVER_ERROR, "internal_error", "Errore interno del server."))

    @staticmethod
    def _task_action(path: str) -> Tuple[str, str]:
        parts = [part for part in path.split("/") if part]
        if len(parts) != 4 or parts[0] != "api" or parts[1] != "tasks":
            raise APIError(HTTPStatus.NOT_FOUND, "route_not_found", "Endpoint non trovato.")
        task_id, action = parts[2], parts[3]
        try:
            uuid.UUID(task_id)
        except ValueError as error:
            raise APIError(HTTPStatus.BAD_REQUEST, "invalid_task_id", "Identificatore task non valido.") from error
        return task_id, action

    def _serve_static(self, path: str) -> None:
        root = self.settings.static_root
        if root is None:
            raise APIError(HTTPStatus.NOT_FOUND, "route_not_found", "Endpoint non trovato.")
        requested = "/index.html" if path == "/" else path
        if ".." in Path(requested).parts:
            raise APIError(HTTPStatus.FORBIDDEN, "forbidden", "Risorsa non consentita.")
        file_path = (root / requested.lstrip("/")).resolve()
        try:
            file_path.relative_to(root.resolve())
        except ValueError as error:
            raise APIError(HTTPStatus.FORBIDDEN, "forbidden", "Risorsa non consentita.") from error
        if not file_path.is_file() or file_path.suffix not in {".html", ".css", ".js", ".json", ".svg", ".png", ".ico"}:
            raise APIError(HTTPStatus.NOT_FOUND, "not_found", "Risorsa non trovata.")
        body = file_path.read_bytes()
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self._headers(content_type=content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def create_server(settings: ServerSettings) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((settings.host, settings.port), APIHandler)
    server.backend = AgentBackend(settings)  # type: ignore[attr-defined]
    server.settings = settings  # type: ignore[attr-defined]
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Backend locale sicuro di sviluppo per Everyday Agent")
    parser.add_argument("--host", default=os.environ.get("EVERYDAY_AGENT_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("EVERYDAY_AGENT_PORT", "4174")))
    parser.add_argument("--database", type=Path, default=Path(os.environ.get("EVERYDAY_AGENT_DB", "data/everyday-agent.db")))
    parser.add_argument("--serve-static", action="store_true", help="Serve anche la dashboard dalla directory del progetto.")
    parser.add_argument("--secure-cookie", action="store_true", help="Aggiunge Secure al cookie (richiede HTTPS).")
    args = parser.parse_args()
    configured = ServerSettings.from_environment(port=args.port, static_root=Path(__file__).parent if args.serve_static else None)
    settings = ServerSettings(
        database_path=args.database,
        session_secret=configured.session_secret,
        host=args.host,
        port=args.port,
        session_days=configured.session_days,
        secure_cookie=args.secure_cookie or configured.secure_cookie,
        static_root=configured.static_root,
    )
    if settings.host not in {"127.0.0.1", "::1", "localhost"}:
        print("ATTENZIONE: il server stdlib è pensato solo per sviluppo locale. Usa un reverse proxy TLS e una review di sicurezza in produzione.")
    if "EVERYDAY_AGENT_SESSION_SECRET" not in os.environ:
        print("NOTA: EVERYDAY_AGENT_SESSION_SECRET non impostato; le sessioni vengono invalidate al riavvio.")
    server = create_server(settings)
    print(f"Everyday Agent API: http://{settings.host}:{settings.port}{' (dashboard inclusa)' if settings.static_root else ''}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
