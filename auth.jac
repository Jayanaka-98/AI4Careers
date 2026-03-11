# auth.jac
import from db { create_user, get_user_by_email }
import from security { hash_password, verify_password, issue_token }

walker:pub Signup {
    has email: str;
    has password: str;
    has name: str;

    can signup with `root entry {
        # Check if user already exists
        existing = get_user_by_email(self.email);
        if existing is not None {
            report {"error": "user_already_exists"};
            return;
        }

        # Create user
        pw_hash = hash_password(self.password);
        user_id = create_user(self.email, pw_hash, self.name);

        report {"user_id": user_id};
    }
}

walker:pub Login {
    has email: str;
    has password: str;

    can login with `root entry {
        # Get user from database
        user = get_user_by_email(self.email);

        if user is None {
            report {"error": "invalid_credentials"};
            return;
        }

        # Verify password
        if not verify_password(self.password, user["password_hash"]) {
            report {"error": "invalid_credentials"};
            return;
        }

        # Issue token
        token = issue_token(user["user_id"]);
        report {"token": token};
    }
}
