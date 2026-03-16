# parsing.jac

obj SkillExtractor {
    def extract(raw_text: str) -> list by llm();
}

sem SkillExtractor.extract = "You are a resume skill extractor. Extract ALL skills mentioned in the resume: programming languages, frameworks, libraries, tools, technologies, methodologies, and relevant domain knowledge. Return ONLY a Python list of skill name strings, nothing else. Example: ['Python', 'React', 'SQL', 'Docker']";
sem SkillExtractor.extract.raw_text = "The complete resume text to extract skills from.";

def parse_resume_text(raw_text: str) -> dict {
    skills: list[str] = [];

    try {
        extractor = SkillExtractor();
        result = extractor.extract(raw_text);
        if isinstance(result, list) {
            skills = [str(s) for s in result if s];
        }
    } except Exception as e {
        # Fallback to basic scan if LLM unavailable
        basic = ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go",
                 "Rust", "SQL", "React", "Node.js", "Docker", "Kubernetes", "AWS",
                 "Git", "Linux", "TensorFlow", "PyTorch", "Pandas", "NumPy"];
        for skill in basic {
            if skill.lower() in raw_text.lower() and skill not in skills {
                skills.append(skill);
            }
        }
    }

    bullets: list[str] = [];
    for line in raw_text.split("\n") {
        if line.strip().startswith("-") {
            bullets.append(line.strip()[1:].strip());
        }
    }

    return {
        "skills": skills,
        "experience_bullets": bullets,
        "projects": [],
        "education": {}
    };
}
