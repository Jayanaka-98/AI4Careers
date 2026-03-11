# profile.jac
import from db { get_user_by_id, update_user_preferences }
import from security { token_to_user_id }

walker:pub Me {
    has token: str;

    can get_me with `root entry {
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

        report {
            "user_id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
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
    has work_authorization: str;
    has preferred_locations: list;
    has work_modes: list;
    has role_types: list;

    can update_prefs with `root entry {
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
