# career_fair.jac
import from db { get_all_events, get_companies, get_company, get_roles }

walker:pub ListEvents {
    can list_events with `root entry {
        events = get_all_events();
        report events;
    }
}

walker:pub ListCompanies {
    has event_id: str;
    has fair_day: str = "";
    has position_type: str = "";
    has sponsors: str = "";
    has region: str = "";
    has major_search: str = "";

    can list_companies with Root entry {
        filters = {
            "fair_day": self.fair_day,
            "position_type": self.position_type,
            "sponsors": self.sponsors,
            "region": self.region,
            "major_search": self.major_search
        };

        companies = get_companies(self.event_id, filters);
        report companies;
    }
}

walker:pub GetCompany {
    has event_id: str;
    has company_id: str;

    can fetch with Root entry {
        company = get_company(self.event_id, self.company_id);

        if company is None {
            report {"error": "company_not_found"};
            return;
        }

        report company;
    }
}

walker:pub ListRoles {
    has event_id: str;
    has location: str = "";
    has work_mode: str = "";

    can list_roles with Root entry {
        roles = get_roles(self.event_id);
        report roles;
    }
}
