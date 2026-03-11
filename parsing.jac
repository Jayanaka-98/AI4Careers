# utils/parsing.jac
# Convert uploaded calendar into structured data
def parse_resume_text(
    raw_text: str
) -> map {
    skills: list[str] = [];
    bullets: list[str] = [];

    for line in raw_text.split("\n") {
        if "Python" in line {
            skills.append("Python");
        }
        if "SQL" in line {
            skills.append("SQL");
        }
        if line.strip().startswith("-") {
            bullets.append(line.strip()[1:]);
        }
    }

    return {
        "skills": uniq(skills),
        "experience_bullets": bullets,
        "projects": [],
        "education": {}
    };
}
