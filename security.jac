# security.jac
import from datetime { datetime }
import from uuid { uuid4 }

"""Get current ISO timestamp."""
def now_iso() -> str {
    return datetime.now().isoformat();
}

"""Generate a fake UUID with prefix."""
def fake_uuid(prefix: str) -> str {
    return f"{prefix}_{str(uuid4())[:8]}";
}

"""Hash a password (MVP: simple hash, use bcrypt in production)."""
def hash_password(pw: str) -> str {
    return "hash:" + pw;
}

"""Verify password against hash."""
def verify_password(pw: str, pw_hash: str) -> bool {
    return pw_hash == ("hash:" + pw);
}

"""Issue a token for user_id (MVP: simple token, use JWT in production)."""
def issue_token(user_id: str) -> str {
    return "token:" + user_id;
}

"""Extract user_id from token string."""
def token_to_user_id(token: str) -> str {
    if token.startswith("token:") {
        return token.split(":")[1];
    }
    return "";
}

"""Extract user_id from a walker that may receive token in body or via Authorization header."""
def resolve_user_id(body_token: str) -> str {
    if body_token and body_token != "" {
        return token_to_user_id(body_token);
    }
    return "";
}
