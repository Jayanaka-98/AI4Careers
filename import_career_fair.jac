import csv;
import json;
import os;
import sqlite3;
import from uuid { uuid4 }

import from db { DB_PATH, init_db }

glob CAREER_FAIR_CSV: str = os.path.join(
         "data", "umich_fall_2025_career_fair_jac_ready.csv"
     );

glob EVENT_ID: str = "evt_umich_fall_2025";
glob EVENT_NAME: str = "University of Michigan Fall 2025 Career Fair";
glob EVENT_TERM: str = "Fall 2025";
glob EVENT_START: str = "2025-09-22";
glob EVENT_END: str = "2025-09-23";

def _conn -> sqlite3.Connection {
    conn = sqlite3.connect(DB_PATH);
    conn.row_factory = sqlite3.Row;
    conn.execute("PRAGMA foreign_keys=ON");
    return conn;
}

def _safe_str(value) -> str {
    if value is None {
        return "";
    }
    return str(value).strip();
}

def _split_multi(value) -> list[str] {
    text = _safe_str(value);
    if text == "" {
        return [];
    }

    if "\n" in text {
        parts = text.split("\n");
    } elif "|" in text {
        parts = text.split("|");
    } elif ";" in text {
        parts = text.split(";");
    } else {
        parts = [text];
    }

    cleaned: list[str] = [];
    for part in parts {
        item = _safe_str(part);
        if item != "" and item not in cleaned {
            cleaned.append(item);
        }
    }
    return cleaned;
}


def _to_bool(value) -> bool {
    text = _safe_str(value).lower();
    return text in ["true", "1", "yes", "y"];
}

def _normalize_url(value) -> str {
    text = _safe_str(value);
    if text == "" {
        return "";
    }

    if text.startswith("http://") or text.startswith("https://") {
        return text;
    }

    return "https://" + text;
}

def _make_role_titles(row: dict) -> list[dict] {
    role_titles = _split_multi(row["role_titles"]);
    positions = _split_multi(row["positions_recruited"]);
    sponsorship_list = _split_multi(row["work_authorization_sponsorship"]);
    regions = _split_multi(row["regions_recruited"]);

    sponsorship_value = "Unknown";
    if len(sponsorship_list) > 0 {
        sponsorship_value = ", ".join(sponsorship_list);
    }

    roles: list[dict] = [];

    if len(role_titles) > 0 {
        for title in role_titles {
            roles.append(
                {
                    "title": title,
                    "category": positions[0] if len(positions) > 0 else "",
                    "location": ", ".join(regions),
                    "work_mode": "",
                    "sponsorship": sponsorship_value,
                    "description": _safe_str(row["description"]),
                    "tags": positions + _split_multi(row["degree_levels_recruited"])
                }
            );
        }
        return roles;
    }

    for position in positions {
        roles.append(
            {
                "title": position + " Opportunity - " + _safe_str(row["employer_name"]),
                "category": position,
                "location": ", ".join(regions),
                "work_mode": "",
                "sponsorship": sponsorship_value,
                "description": _safe_str(row["description"]),
                "tags": _split_multi(row["degree_levels_recruited"])
            }
        );
    }

    return roles;
}

def import_career_fair(csv_path: str) -> dict {
    init_db();

    conn = _conn();
    c = conn.cursor();

    c.execute("DELETE FROM roles WHERE event_id = ?", (EVENT_ID, ));
    c.execute("DELETE FROM companies WHERE event_id = ?", (EVENT_ID, ));
    c.execute("DELETE FROM events WHERE event_id = ?", (EVENT_ID, ));

    c.execute(
        """INSERT INTO events (event_id, name, term, start_date, end_date)
           VALUES (?, ?, ?, ?, ?)""",
        (EVENT_ID, EVENT_NAME, EVENT_TERM, EVENT_START, EVENT_END)
    );

    company_count: int = 0;
    role_count: int = 0;
    seen_companies: set[str] = set();

    with open(csv_path, "r") as csvfile {
        reader = csv.DictReader(csvfile);
        for row in reader {
            company_id = _safe_str(row["company_id"]);

            if company_id == "" {
                continue;
            }

            if company_id not in seen_companies {
                c.execute(
                    """INSERT INTO companies (
                        company_id,
                        event_id,
                        name,
                        icon_url,
                        fair_day,
                        is_multi_day,
                        website,
                        careers_url,
                        description,
                        positions,
                        degree_levels,
                        academic_years,
                        majors,
                        sponsorship,
                        sponsorship_notes,
                        regions,
                        accepts_hardcopy
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        company_id,
                        EVENT_ID,
                        _safe_str(row["employer_name"]),
                        "",
                        _safe_str(row["fair_day"]),
                        1 if _to_bool(row["is_multi_day_company"]) else 0,
                        _normalize_url(row["website"]),
                        _normalize_url(row["company_careers_website"]),
                        _safe_str(row["description"]),
                        json.dumps(_split_multi(row["positions_recruited"])),
                        json.dumps(_split_multi(row["degree_levels_recruited"])),
                        json.dumps(_split_multi(row["academic_years_recruited"])),
                        json.dumps(_split_multi(row["degrees_majors_recruited"])),
                        json.dumps(_split_multi(row["work_authorization_sponsorship"])),
                        _safe_str(row["work_authorization_notes"]),
                        json.dumps(_split_multi(row["regions_recruited"])),
                        1 if _to_bool(row["accept_hardcopy_resumes"]) else 0
                    )
                );
                seen_companies.add(company_id);
                company_count += 1;
            }

            role_defs = _make_role_titles(row);
            for role in role_defs {
                role_id = "role_" + str(uuid4())[:8];

                c.execute(
                    """INSERT INTO roles (
                        role_id,
                        event_id,
                        title,
                        category,
                        location,
                        work_mode,
                        sponsorship,
                        description,
                        tags
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        role_id,
                        EVENT_ID,
                        role["title"],
                        role["category"],
                        role["location"],
                        role["work_mode"],
                        role["sponsorship"],
                        role["description"],
                        json.dumps(role["tags"])
                    )
                );
                role_count += 1;
            }
        }
    }

    conn.commit();
    conn.close();

    return {
        "ok": True,
        "event_id": EVENT_ID,
        "companies_imported": company_count,
        "roles_imported": role_count,
        "csv_path": csv_path
    };
}

with entry {
    result = import_career_fair(CAREER_FAIR_CSV);
    print(result);
}
