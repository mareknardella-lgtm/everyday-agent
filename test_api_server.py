import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path

from api_server import APIError, AgentBackend, ServerSettings, create_server


class AgentBackendTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.settings = ServerSettings(
            database_path=Path(self.directory.name) / "agent.db",
            session_secret=b"test-session-secret-that-is-long-enough",
            port=0,
        )
        self.backend = AgentBackend(self.settings)

    def register_owner(self, email="owner@example.test"):
        return self.backend.register(
            {
                "name": "Ada Lovelace",
                "email": email,
                "password": "una-password-lunga-e-sicura",
                "policiesAcknowledged": True,
            },
            "test-client",
        )

    def test_registration_session_and_password_login(self):
        token, csrf, owner = self.register_owner()
        self.assertTrue(token)
        self.assertTrue(csrf)
        self.assertEqual(owner.role, "owner")
        self.assertTrue(self.backend.verify_csrf(owner, csrf))
        payload = self.backend.session_payload(owner)
        self.assertTrue(payload["authenticated"])
        self.assertFalse(payload["externalActions"])
        logged_token, logged_csrf, logged_owner = self.backend.login(
            {"email": "owner@example.test", "password": "una-password-lunga-e-sicura"},
            "test-client",
        )
        self.assertNotEqual(token, logged_token)
        self.assertTrue(self.backend.verify_csrf(logged_owner, logged_csrf))
        with self.assertRaises(APIError) as error:
            self.backend.login({"email": "owner@example.test", "password": "sbagliata"}, "other-client")
        self.assertEqual(error.exception.status, 401)
        self.assertEqual(error.exception.code, "invalid_credentials")

    def test_state_is_versioned_and_rejects_secrets(self):
        _, _, owner = self.register_owner()
        first = self.backend.put_dashboard_state(owner, {"state": {"userName": "Ada", "completed": 2}, "version": 0})
        self.assertEqual(first["version"], 1)
        saved = self.backend.get_dashboard_state(owner)
        self.assertEqual(saved["state"]["userName"], "Ada")
        with self.assertRaises(APIError) as conflict:
            self.backend.put_dashboard_state(owner, {"state": {"completed": 3}, "version": 0})
        self.assertEqual(conflict.exception.code, "state_conflict")
        with self.assertRaises(APIError) as secret:
            self.backend.put_dashboard_state(owner, {"state": {"access_token": "never-store-this"}, "version": 1})
        self.assertEqual(secret.exception.code, "secret_in_state")

    def test_family_permissions_are_server_enforced(self):
        _, _, owner = self.register_owner()
        _, _, partner_own_workspace = self.register_owner("partner@example.test")
        partner = self.backend.add_member(owner, {"email": "partner@example.test", "role": "partner"})
        self.assertEqual(partner["role"], "partner")
        partner_context = type(partner_own_workspace)(
            partner_own_workspace.session_id,
            partner_own_workspace.user_id,
            partner_own_workspace.user_name,
            partner_own_workspace.email,
            owner.workspace_id,
            "partner",
        )
        self.assertFalse(self.backend.role_allows(owner.workspace_id, "partner", "money", "approve"))
        self.backend.set_permission(owner, {"role": "partner", "domain": "errands", "actions": ["approve"]})
        self.assertTrue(self.backend.role_allows(owner.workspace_id, "partner", "errands", "approve"))
        with self.assertRaises(APIError) as teen_error:
            self.backend.set_permission(owner, {"role": "teen", "domain": "money", "actions": ["approve"]})
        self.assertEqual(teen_error.exception.code, "minor_permission_blocked")
        self.assertEqual(partner_context.workspace_id, owner.workspace_id)

    def test_task_policy_audit_and_execution_gateway(self):
        _, _, owner = self.register_owner()
        created = self.backend.create_task(
            owner,
            {
                "task": {
                    "title": "Riparare caldaia",
                    "category": "home",
                    "action": "repair",
                    "counterparty": "Idraulica Nuova",
                    "context": "manutenzione casa",
                    "amount_eur": 30,
                    "reversible": True,
                }
            },
        )
        self.assertEqual(created["status"], "pending")
        self.assertEqual(created["decision"]["level"], 3)
        approved = self.backend.resolve_task(owner, created["id"], "approve")
        self.assertEqual(approved["status"], "approved")
        self.assertFalse(approved["execution"]["externalAction"])
        with self.assertRaises(APIError) as blocked:
            self.backend.request_execution(owner, {"taskId": created["id"], "connector": "bank", "operation": "pay"})
        self.assertEqual(blocked.exception.code, "external_execution_blocked")
        self.assertTrue(self.backend.verify_audit(owner.workspace_id))
        audit = self.backend.get_audit(owner)
        self.assertTrue(audit["valid"])
        self.assertGreaterEqual(len(audit["events"]), 3)


class APIHTTPTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        settings = ServerSettings(
            database_path=Path(self.directory.name) / "http.db",
            session_secret=b"http-test-session-secret-that-is-long-enough",
            port=0,
        )
        self.server = create_server(settings)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop_server)
        self.port = self.server.server_address[1]

    def stop_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)

    def request(self, method, path, payload=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request_headers = dict(headers or {})
        if body is not None:
            request_headers["Content-Type"] = "application/json"
            request_headers["Content-Length"] = str(len(body))
        connection.request(method, path, body=body, headers=request_headers)
        response = connection.getresponse()
        data = json.loads(response.read().decode("utf-8")) if response.getheader("Content-Length") != "0" else {}
        headers_out = dict(response.getheaders())
        connection.close()
        return response.status, data, headers_out

    def test_http_auth_cookie_csrf_and_state_round_trip(self):
        status, registered, headers = self.request(
            "POST",
            "/api/auth/register",
            {
                "name": "Grace Hopper",
                "email": "grace@example.test",
                "password": "una-password-lunga-e-sicura",
                "policiesAcknowledged": True,
            },
        )
        self.assertEqual(status, 201)
        cookie = headers["Set-Cookie"].split(";", 1)[0]
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        self.assertIn("SameSite=Strict", headers["Set-Cookie"])
        csrf = registered["csrfToken"]
        status, session, _ = self.request("GET", "/api/session", headers={"Cookie": cookie})
        self.assertEqual(status, 200)
        csrf = session["csrfToken"]
        status, error, _ = self.request("PUT", "/api/state", {"state": {"userName": "Grace"}, "version": 0}, {"Cookie": cookie})
        self.assertEqual(status, 403)
        self.assertEqual(error["error"]["code"], "csrf_failed")
        status, saved, _ = self.request(
            "PUT",
            "/api/state",
            {"state": {"userName": "Grace"}, "version": 0},
            {"Cookie": cookie, "X-CSRF-Token": csrf},
        )
        self.assertEqual(status, 200)
        self.assertEqual(saved["version"], 1)
        status, state, _ = self.request("GET", "/api/state", headers={"Cookie": cookie})
        self.assertEqual(status, 200)
        self.assertEqual(state["state"]["userName"], "Grace")


if __name__ == "__main__":
    unittest.main()
