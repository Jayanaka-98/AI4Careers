import os;
import json;
import from urllib.request { Request, urlopen }
import from urllib.error { HTTPError }

import from db { get_companies_full }
import from matching { normalize_company_query }

glob VISUAL_MODEL: str = "gpt-5.4-nano";

glob COMPANY_ALIASES: dict = {
    "KLA": ["kla", "kla corporation"],
    "PricewaterhouseCoopers": ["pwc", "pricewaterhousecoopers", "price waterhouse coopers"],
    "General Motors": ["gm", "general motors"],
    "RTX": ["rtx", "raytheon", "raytheon technologies"],
    "EY": ["ey", "ernst young", "ernst and young"],
    "AMD": ["amd", "advanced micro devices"],
    "BNSF": ["bnsf", "bnsf railway"],
    "TikTok": ["tiktok", "tik tok"],
    "WSP": ["wsp"],
    "KLA Corporation": ["kla", "kla corporation"]
};

def _company_name_list(event_id: str) -> list {
    companies = get_companies_full(event_id);
    names: list = [];

    for company in companies {
        if "name" in company {
            names.append(company["name"]);
        }
    }

    return names;
}

def _append_unique(items: list, value: str) -> list {
    if value.strip() == "" {
        return items;
    }
    if value not in items {
        items.append(value);
    }
    return items;
}

def _normalized_aliases_for_company(company_name: str) -> list {
    aliases: list = [];
    aliases = _append_unique(aliases, normalize_company_query(company_name));

    if company_name in COMPANY_ALIASES {
        for alias in COMPANY_ALIASES[company_name] {
            aliases = _append_unique(aliases, normalize_company_query(str(alias)));
        }
    }

    return aliases;
}

def _resolve_one_query_to_companies(query_text: str, company_names: list) -> list {
    q: str = normalize_company_query(query_text);
    exact: list = [];
    partial: list = [];

    if q == "" {
        return [];
    }

    for allowed in company_names {
        allowed_name: str = str(allowed);
        allowed_norm: str = normalize_company_query(allowed_name);
        aliases: list = _normalized_aliases_for_company(allowed_name);

        if q == allowed_norm {
            exact = _append_unique(exact, allowed_name);
            continue;
        }

        matched_alias_exact: bool = False;
        for alias in aliases {
            alias_norm: str = normalize_company_query(str(alias));
            if q == alias_norm {
                exact = _append_unique(exact, allowed_name);
                matched_alias_exact = True;
                break;
            }
        }

        if matched_alias_exact {
            continue;
        }

        if len(q) >= 3 {
            if q in allowed_norm or allowed_norm in q {
                partial = _append_unique(partial, allowed_name);
                continue;
            }

            for alias in aliases {
                alias_norm: str = normalize_company_query(str(alias));
                if q in alias_norm or alias_norm in q {
                    partial = _append_unique(partial, allowed_name);
                    break;
                }
            }
        }
    }

    if len(exact) > 0 {
        return exact;
    }

    return partial;
}

def _collect_candidate_queries(extraction: dict) -> list {
    queries: list = [];

    if "top_candidates" in extraction {
        for item in extraction["top_candidates"] {
            item_text: str = str(item).strip();
            if item_text != "" and item_text != "NOT_SURE" and item_text != "NOT_FOUND" {
                queries = _append_unique(queries, item_text);
            }
        }
    }

    if "likely_abbreviation" in extraction {
        queries = _append_unique(queries, str(extraction["likely_abbreviation"]));
    }

    if "visible_text" in extraction {
        queries = _append_unique(queries, str(extraction["visible_text"]));
    }

    return queries;
}

def extract_response_text(parsed: dict) -> str {
    if "output_text" in parsed {
        top_text: str = str(parsed["output_text"]).strip();
        if top_text != "" {
            return top_text;
        }
    }

    if "output" not in parsed {
        return "";
    }

    outputs = parsed["output"];
    for item in outputs {
        if "content" not in item {
            continue;
        }

        contents = item["content"];
        for block in contents {
            if "text" in block {
                text_value: str = str(block["text"]).strip();
                if text_value != "" {
                    return text_value;
                }
            }
        }
    }

    return "";
}

def _call_visual_json(
    prompt: str,
    image_data: str,
    image_mime_type: str,
    schema: dict
) -> dict {
    api_key = os.getenv("OPENAI_API_KEY");
    if api_key is None or api_key == "" {
        return {"error": "missing_openai_api_key"};
    }

    mime_type: str = image_mime_type.strip() if image_mime_type.strip() != "" else "image/jpeg";
    image_url: str = "data:" + mime_type + ";base64," + image_data;

    payload: dict = {
        "model": VISUAL_MODEL,
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": image_url}
                ]
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "visual_company_identifier",
                "schema": schema
            }
        }
    };

    body: bytes = json.dumps(payload).encode("utf-8");

    req = Request(
        "https://api.openai.com/v1/responses",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + api_key
        },
        method="POST"
    );

    try {
        resp = urlopen(req);
        raw: str = resp.read().decode("utf-8");
        parsed = json.loads(raw);
        output_text: str = extract_response_text(parsed);

        if output_text == "" {
            return {"error": "empty_visual_output", "details": raw};
        }

        try {
            result = json.loads(output_text);
        } except Exception as e {
            return {"error": "invalid_visual_output", "details": output_text};
        }

        return {"result": result, "raw": raw, "output_text": output_text};
    } except HTTPError as e {
        return {
            "error": "visual_api_http_error",
            "details": "HTTP request to OpenAI failed"
        };
    } except Exception as e {
        return {"error": "visual_api_failed", "details": str(e)};
    }
}

def _first_pass_visual_extraction(
    image_data: str,
    image_mime_type: str,
    company_names: list
) -> dict {
    allowed_lines: list[str] = [];
    for name in company_names {
        allowed_lines.append("- " + str(name));
    }
    allowed_names_text: str = "\n".join(allowed_lines);

    prompt: str = (
        "You are identifying a company from a photographed company logo at a career fair.\n"
        "Do not guess wildly. Use only evidence from the image.\n"
        "The company is guaranteed to be in the allowed company list below.\n"
        "Extract visible text if possible, infer a likely abbreviation if helpful, and suggest up to 3 candidate company names from the allowed list.\n"
        "Return JSON only.\n\n"
        "Allowed company names:\n" + allowed_names_text
    );

    schema: dict = {
        "type": "object",
        "properties": {
            "visible_text": {"type": "string"},
            "likely_abbreviation": {"type": "string"},
            "logo_description": {"type": "string"},
            "top_candidates": {
                "type": "array",
                "items": {"type": "string"}
            },
            "confidence": {"type": "string"}
        },
        "required": [
            "visible_text",
            "likely_abbreviation",
            "logo_description",
            "top_candidates",
            "confidence"
        ],
        "additionalProperties": False
    };

    return _call_visual_json(prompt, image_data, image_mime_type, schema);
}

def _restricted_pick_from_candidates(
    image_data: str,
    image_mime_type: str,
    extraction: dict,
    candidates: list
) -> dict {
    candidate_lines: list[str] = [];
    for name in candidates {
        candidate_lines.append("- " + str(name));
    }
    candidate_text: str = "\n".join(candidate_lines);

    prompt: str = (
        "You are selecting the correct company from a small candidate list based on a photographed company logo.\n"
        "Choose exactly one company from the list, or NOT_FOUND if you are not confident.\n"
        "Use these prior clues:\n"
        "- visible_text: " + str(extraction["visible_text"]) + "\n"
        "- likely_abbreviation: " + str(extraction["likely_abbreviation"]) + "\n"
        "- logo_description: " + str(extraction["logo_description"]) + "\n"
        "- confidence: " + str(extraction["confidence"]) + "\n\n"
        "Candidate companies:\n" + candidate_text
    );

    schema: dict = {
        "type": "object",
        "properties": {
            "company_name": {"type": "string"},
            "confidence": {"type": "string"}
        },
        "required": ["company_name", "confidence"],
        "additionalProperties": False
    };

    return _call_visual_json(prompt, image_data, image_mime_type, schema);
}

def identify_company_name_from_image(
    image_data: str,
    image_mime_type: str,
    event_id: str
) -> dict {
    if image_data.strip() == "" {
        return {"error": "missing_image"};
    }

    company_names = _company_name_list(event_id);
    if len(company_names) == 0 {
        return {"error": "empty_company_list"};
    }

    first_pass = _first_pass_visual_extraction(
        image_data,
        image_mime_type,
        company_names
    );

    if "error" in first_pass {
        return first_pass;
    }

    extraction = first_pass["result"];
    queries: list = _collect_candidate_queries(extraction);
    local_candidates: list = [];

    for query_text in queries {
        matches = _resolve_one_query_to_companies(str(query_text), company_names);
        for match_name in matches {
            local_candidates = _append_unique(local_candidates, str(match_name));
        }
    }

    if len(local_candidates) == 1 {
        return {
            "company_name": str(local_candidates[0]),
            "visual_extraction": extraction,
            "resolution_mode": "local_unique"
        };
    }

    if len(local_candidates) > 1 and len(local_candidates) <= 5 {
        second_pass = _restricted_pick_from_candidates(
            image_data,
            image_mime_type,
            extraction,
            local_candidates
        );

        if "error" in second_pass {
            return second_pass;
        }

        result = second_pass["result"];
        if "company_name" not in result {
            return {"error": "invalid_visual_output"};
        }

        chosen_name: str = str(result["company_name"]).strip();
        if chosen_name == "" or chosen_name == "NOT_FOUND" {
            return {"error": "company_not_found"};
        }

        normalized_target: str = normalize_company_query(chosen_name);
        for allowed in local_candidates {
            allowed_name: str = str(allowed);
            if normalize_company_query(allowed_name) == normalized_target {
                return {
                    "company_name": allowed_name,
                    "visual_extraction": extraction,
                    "resolution_mode": "restricted_pick"
                };
            }
        }
    }

    return {
        "error": "company_not_found",
        "details": {
            "queries": queries,
            "visual_extraction": extraction
        }
    };
}
