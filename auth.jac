# auth.jac
import from db { create_user, get_user_by_email, get_user_by_id, update_user_preferences, list_resumes }
import from security { hash_password, verify_password, issue_token, token_to_user_id }

walker:pub Signup {
    has email: str;
    has password: str;
    has name: str;

    can signup with Root entry {
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

    can login with Root entry {
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

walker:pub Me {
    has token: str;

    can get_me with Root entry {
        uid = token_to_user_id(self.token);
        if uid == "" {
            report {"error": "unauthorized"};
            return;
        }

        user = get_user_by_id(uid);
        if user is None {
            report {"error": "unauthorized"};
            return;
        }

        resumes = list_resumes(uid);
        report {
            "user_id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
            "resume_count": len(resumes),
            "preferences": {
                "needs_sponsorship": user["needs_sponsorship"],
                "work_authorization": user["work_authorization"],
                "preferred_locations": user["preferred_locations"],
                "work_modes": user["work_modes"],
                "role_types": user["role_types"]
            }
        };
    }
}

walker:pub UpdatePreferences {
    has token: str;
    has needs_sponsorship: bool;
    has work_authorization: list;
    has preferred_locations: list;
    has work_modes: list;
    has role_types: list;

    can update_prefs with Root entry {
        uid = token_to_user_id(self.token);
        if uid == "" {
            report {"error": "unauthorized"};
            return;
        }

        success = update_user_preferences(
            uid,
            self.needs_sponsorship,
            self.work_authorization,
            self.preferred_locations,
            self.work_modes,
            self.role_types
        );

        report {"ok": success};
    }
}
