from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import math

app = FastAPI(title="SafeGuard AI Engine", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# RISK DETECTION PATTERNS (Regex + Keyword)
# ==========================================
RISK_PATTERNS = {
    "scam": {
        "label": "Lua dao / Scam",
        "base_score": 0.7,
        "patterns": [
            r"chuy[eể]n\s*ti[eề]n",
            r"tr[uú]ng\s*(th[uư][oở]ng|gi[aả]i)",
            r"x[aá]c\s*minh\s*t[aà]i\s*kho[aả]n",
            r"OTP",
            r"m[aã]\s*x[aá]c\s*nh[aậ]n",
            r"nh[aâ]n\s*vi[eê]n\s*(ng[aâ]n\s*h[aà]ng|c[oô]ng\s*an|vi[eệ]n\s*ki[eể]m\s*s[aá]t|thu[eế])",
            r"kh[oó]a\s*t[aà]i\s*kho[aả]n",
            r"(g[aấ]p|ngay|kh[aẩ]n\s*c[aấ]p).*chuy[eể]n",
            r"link\s*(x[aá]c|đ[aă]ng)\s*(nh[aậ]p|k[iy])",
            r"nh[aậ]n\s*qu[aà]",
            r"t[aà]i\s*kho[aả]n.*b[iị]\s*(kh[oó]a|t[aạ]m\s*ng[uư]ng)",
            r"(app|[uứ]ng\s*d[uụ]ng).*ki[eế]m\s*ti[eề]n",
            r"đ[aầ]u\s*t[uư].*l[oợ]i\s*nhu[aậ]n",
            r"hoa\s*h[oồ]ng.*cao",
        ],
        "keywords": [
            "trung thuong", "chuyen tien ngay", "xac minh", "nhan qua",
            "tai khoan bi khoa", "dang nhap de nhan", "kiem tien online",
            "loi nhuan", "hoa hong", "cam ket", "dau tu", "rut tien"
        ]
    },
    "violence": {
        "label": "Bao luc / De doa",
        "base_score": 0.75,
        "patterns": [
            r"đ[aá]nh\s*(nhau|ch[eế]t|g[aã]y)",
            r"gi[eế]t",
            r"ch[eế]m",
            r"đ[aâ]m",
            r"b[aắ]n\s*(ch[eế]t|nhau)",
            r"m[aá]u\s*me",
            r"t[uự]\s*t[uử]",
            r"đe\s*d[oọ]a",
            r"tr[aả]\s*th[uù]",
        ],
        "keywords": [
            "danh nhau", "giet", "chem", "dam", "ban chet",
            "tu tu", "de doa", "tra thu", "thuong tich"
        ]
    },
    "cyberbullying": {
        "label": "Bat nat mang",
        "base_score": 0.65,
        "patterns": [
            r"(m[aà]y|mi)\s*(ngu|d[oố]t|x[aấ]u|b[eé]o|g[aầ]y)",
            r"đ[oồ]\s*(ngu|ch[oó]|r[aá]c|ph[eế]\s*th[aả]i)",
            r"bi[eế]n\s*đi",
            r"kh[oô]ng\s*ai\s*(th[ií]ch|y[eê]u|quan\s*t[aâ]m)",
        ],
        "keywords": [
            "xau xi", "beo", "ngu", "do ngu", "do cho",
            "bien di", "khong ai thich", "mat day"
        ]
    },
    "grooming": {
        "label": "Du do / Grooming",
        "base_score": 0.8,
        "patterns": [
            r"g[uử]i\s*[aả]nh.*cho\s*(anh|ch[iị]|em)",
            r"b[ií]\s*m[aậ]t.*gi[uữ]a.*hai",
            r"đ[uừ]ng\s*n[oó]i.*ai",
            r"g[aặ]p\s*m[aặ]t.*m[oộ]t\s*m[iì]nh",
            r"anh.*y[eê]u\s*em",
            r"cho.*xem.*c[oơ]\s*th[eể]",
            r"t[uụ]t\s*qu[aầ]n",
            r"m[aấ]y\s*tu[oổ]i",
        ],
        "keywords": [
            "gui anh", "bi mat", "dung noi ai", "gap mat",
            "mot minh", "yeu em", "may tuoi", "o dau"
        ]
    },
    "gambling": {
        "label": "Co bac / Ca cuoc",
        "base_score": 0.7,
        "patterns": [
            r"c[aá]\s*(c[uư][oợ]c|đ[oộ])",
            r"l[oô]\s*đ[eề]",
            r"x[oổ]\s*s[oố]",
            r"(s[oòi]|b[aà]i|b[aạ]c|poker|casino|slot)",
            r"(c[uư][oợ]c|đ[aặ]t).*ti[eề]n",
            r"t[iỉ]\s*l[eệ]\s*k[eè]o",
            r"nh[aà]\s*c[aá]i",
        ],
        "keywords": [
            "ca cuoc", "lo de", "xo so", "casino", "slot",
            "nha cai", "ti le keo", "dat cuoc", "choi bai"
        ]
    },
    "drugs": {
        "label": "Chat cam / Ma tuy",
        "base_score": 0.85,
        "patterns": [
            r"ma\s*t[uú]y",
            r"thu[oố]c\s*l[aắ]c",
            r"c[aầ]n\s*sa",
            r"h[eê]r[oô]in",
            r"k[eế]t[aà]min",
            r"thu[oố]c\s*l[aá]\s*đi[eệ]n\s*t[uử]",
            r"vape",
            r"shisha",
        ],
        "keywords": [
            "ma tuy", "thuoc lac", "can sa", "heroin",
            "ketamin", "vape", "pod", "tinh dau"
        ]
    },
    "nsfw": {
        "label": "Noi dung nguoi lon (NSFW)",
        "base_score": 0.75,
        "patterns": [
            r"khi[eê]u\s*d[aâ]m",
            r"sex",
            r"ph[iì]m\s*(n[oó]ng|đen|18\+|x+)",
            r"l[oồ]\s*h[aà]ng",
            r"nude",
        ],
        "keywords": [
            "khieu dam", "sex", "phim nong", "phim den",
            "nude", "lo hang", "18+"
        ]
    },
    "financial_fraud": {
        "label": "Lua dao Tai chinh",
        "base_score": 0.75,
        "patterns": [
            r"đ[aầ]u\s*t[uư].*(\d+%|l[oợ]i\s*nhu[aậ]n)",
            r"ponzi",
            r"đa\s*c[aấ]p",
            r"crypto.*mi[eễ]n\s*ph[ií]",
            r"cho\s*vay.*l[aã]i.*su[aấ]t",
            r"t[iín]\s*d[uụ]ng\s*đen",
        ],
        "keywords": [
            "dau tu", "ponzi", "da cap", "crypto mien phi",
            "cho vay", "lai suat", "tin dung den", "kiem tien nhanh"
        ]
    }
}

LINK_BLACKLIST_PATTERNS = [
    r"free[-_]?gift", r"login[-_]?bank", r"update[-_]?payment",
    r"verify[-_]?account", r"claim[-_]?prize", r"lucky[-_]?winner",
    r"bit\.ly", r"tinyurl", r"is\.gd",  # URL shorteners (suspicious)
    r"(vietcombank|techcombank|vietinbank|bidv|agribank|vpbank|mbbank)(?!\.com\.vn)",  # fake bank
    r"facebook[-_]?login", r"zalo[-_]?verify",
    r"shopee[-_]?(deal|free|gift)", r"lazada[-_]?(gift|free)",
    r"\.tk$", r"\.ml$", r"\.ga$", r"\.cf$",  # free domain = suspicious
]


def remove_vietnamese_accents(text):
    """Normalize Vietnamese text for keyword matching"""
    replacements = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
    }
    result = text.lower()
    for k, v in replacements.items():
        result = result.replace(k, v)
    return result


class TextRequest(BaseModel):
    text: str

class LinkRequest(BaseModel):
    url: str

class BatchTextRequest(BaseModel):
    texts: list[str]


@app.get("/ai/health")
def health_check():
    return {
        "status": "running",
        "version": "3.0.0",
        "engine": "Multi-Signal Risk Scorer",
        "categories": list(RISK_PATTERNS.keys()),
        "total_patterns": sum(len(v["patterns"]) for v in RISK_PATTERNS.values()),
        "total_keywords": sum(len(v["keywords"]) for v in RISK_PATTERNS.values()),
    }


@app.post("/ai/check-text")
def check_text(req: TextRequest):
    text_lower = req.text.lower()
    text_ascii = remove_vietnamese_accents(req.text)
    
    results = []
    
    for category, config in RISK_PATTERNS.items():
        score = 0.0
        matched_signals = []
        
        # Regex pattern matching (on original Vietnamese text)
        for pattern in config["patterns"]:
            if re.search(pattern, text_lower):
                score += 0.25
                matched_signals.append(f"pattern:{pattern[:20]}")
        
        # Keyword matching (on accent-removed text)
        for keyword in config["keywords"]:
            if keyword in text_ascii:
                score += 0.15
                matched_signals.append(f"keyword:{keyword}")
        
        if matched_signals:
            # Cap at base_score + matched signals bonus
            final_score = min(1.0, config["base_score"] + (score * 0.5))
            results.append({
                "category": category,
                "label": config["label"],
                "confidence": round(final_score, 2),
                "signals": len(matched_signals),
            })
    
    if not results:
        return {
            "riskLevel": "low",
            "label": "Binh thuong",
            "confidence": 0.95,
            "category": "safe",
            "details": []
        }
    
    # Sort by confidence, pick top result
    results.sort(key=lambda x: x["confidence"], reverse=True)
    top = results[0]
    
    risk_level = "high" if top["confidence"] >= 0.7 else "medium" if top["confidence"] >= 0.5 else "low"
    
    return {
        "riskLevel": risk_level,
        "label": top["label"],
        "confidence": top["confidence"],
        "category": top["category"],
        "details": results[:3]  # Top 3 risks detected
    }


@app.post("/ai/check-link")
def check_link(req: LinkRequest):
    url_lower = req.url.lower()
    matched = []
    
    for pattern in LINK_BLACKLIST_PATTERNS:
        if re.search(pattern, url_lower):
            matched.append(pattern[:30])
    
    if matched:
        risk_score = min(1.0, 0.5 + len(matched) * 0.2)
        return {
            "riskLevel": "high",
            "message": f"Link nguy hiem! Phat hien {len(matched)} dau hieu gia mao.",
            "confidence": round(risk_score, 2),
            "signals": len(matched),
        }
    
    # Check for HTTPS
    if not url_lower.startswith("https://"):
        return {
            "riskLevel": "medium",
            "message": "Link khong su dung HTTPS. Can than khi nhap thong tin ca nhan.",
            "confidence": 0.5,
            "signals": 1,
        }
    
    return {
        "riskLevel": "low",
        "message": "Link co ve an toan. Khong phat hien dau hieu bat thuong.",
        "confidence": 0.9,
        "signals": 0,
    }


@app.post("/ai/check-batch")
def check_batch(req: BatchTextRequest):
    """Check multiple texts at once"""
    results = []
    for text in req.texts[:20]:  # Max 20 texts per batch
        result = check_text(TextRequest(text=text))
        results.append({"text": text[:50], **result})
    
    high_count = sum(1 for r in results if r["riskLevel"] == "high")
    medium_count = sum(1 for r in results if r["riskLevel"] == "medium")
    
    return {
        "results": results,
        "summary": {
            "total": len(results),
            "high": high_count,
            "medium": medium_count,
            "safe": len(results) - high_count - medium_count,
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
