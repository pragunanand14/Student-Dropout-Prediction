import os
import json
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

DEFAULT_MODEL_NAME = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
DEFAULT_REQUEST_TIMEOUT = float(os.getenv('GEMINI_TIMEOUT_SECONDS', '35'))
DEFAULT_TRANSPORT = os.getenv('GEMINI_TRANSPORT', 'rest')
BLOCKED_PROXY_VALUE = 'http://127.0.0.1:9'
FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

SYSTEM_PROMPT = """
You are Student Support Consultant, a supportive student well-being assistant for college students.

Your role:
- Respond with warmth, emotional validation, calmness, and respect.
- Sound human, gentle, and encouraging, not robotic or overly clinical.
- Help students reflect on emotional, academic, social, financial, or personal pressures that may affect college retention.
- Offer practical, realistic next steps that feel manageable.
- Encourage healthy support-seeking when appropriate, including talking to trusted people, teachers, mentors, or counselors.

Safety requirements:
- Do not diagnose mental illness.
- Do not claim to be a therapist, doctor, or licensed professional.
- Do not provide manipulative, shaming, or guilt-based advice.
- Do not encourage isolation, retaliation, substance misuse, self-harm, or dangerous behavior.
- If a student sounds severely distressed, hopeless, unsafe, or mentions self-harm, suicide, or not wanting to live, switch to a gentle crisis-support tone.
- In crisis-style responses, prioritize immediate support, encourage contacting a trusted person, counselor, emergency support, or local crisis services right away, and keep the advice serious, calm, and direct.

Response style:
- Usually keep replies between 120 and 220 words.
- Start by acknowledging the student's feelings.
- Reflect back the main struggle in simple language.
- Offer 2 to 4 practical next steps.
- End with a supportive question or a gentle next-step invitation when appropriate.
""".strip()

REPORT_SYSTEM_PROMPT = """
You create structured early-support reports from a student's private support conversation.

Your goals:
- Summarize what the student themselves described in plain, respectful language.
- Compare disclosed struggles with any predicted risk factors if student profile context is provided.
- Highlight what seems confirmed, what appears missing, and what needs gentle follow-up.
- Recommend early support actions that are practical, school-appropriate, and non-judgmental.
- Never diagnose mental illness.
- Never exaggerate certainty.
- Never shame the student.

Output rules:
- Return valid JSON only.
- Keep every item concise and grounded in the conversation.
- If information is unclear, say so instead of inventing details.
- Use one of these urgency levels only: low, medium, high, urgent.
""".strip()

SEVERE_DISTRESS_KEYWORDS = {
    'suicide',
    'kill myself',
    'end my life',
    'self harm',
    'self-harm',
    'hurt myself',
    'want to die',
    'don\'t want to live',
    'do not want to live',
    'can\'t go on',
    'cannot go on',
    'no reason to live',
    'life is not worth it',
    'better off dead',
    'hopeless',
}

MOOD_PATTERNS = {
    'stressed': ['stress', 'stressed', 'pressure', 'burnout', 'burned out'],
    'hopeless': ['hopeless', 'give up', 'quitting', 'quit college', 'no point', 'cannot go on'],
    'anxious': ['anxious', 'anxiety', 'panic', 'nervous', 'fear of failure', 'scared'],
    'lonely': ['alone', 'lonely', 'isolated', 'no friends', 'left out'],
    'overwhelmed': ['overwhelmed', 'too much', 'can\'t handle', 'cannot handle', 'falling behind'],
}


def detect_severe_distress(text):
    normalized = (text or '').strip().lower()
    return any(keyword in normalized for keyword in SEVERE_DISTRESS_KEYWORDS)


def detect_mood_tags(text):
    normalized = (text or '').strip().lower()
    tags = []
    for tag, phrases in MOOD_PATTERNS.items():
        if any(phrase in normalized for phrase in phrases):
            tags.append(tag)
    return tags


def build_crisis_response():
    return (
        "I'm really sorry you're feeling this overwhelmed right now. What you're carrying sounds very heavy, "
        "and you deserve real human support in this moment. I'm not the right kind of help for an emergency, "
        "so please reach out to a trusted person, counselor, family member, or local emergency support right away "
        "and let them know you need help now. If you feel you might act on these thoughts or you are in immediate "
        "danger, call emergency services or go to the nearest emergency room immediately. If you can, stay near "
        "someone you trust instead of being alone right now."
    )


def _sanitize_dead_local_proxy():
    proxy_keys = [
        'HTTP_PROXY',
        'HTTPS_PROXY',
        'ALL_PROXY',
        'http_proxy',
        'https_proxy',
        'all_proxy',
        'GIT_HTTP_PROXY',
        'GIT_HTTPS_PROXY',
    ]

    for key in proxy_keys:
        value = (os.getenv(key) or '').strip().lower()
        if value == BLOCKED_PROXY_VALUE:
            os.environ.pop(key, None)


def _candidate_models():
    ordered = [DEFAULT_MODEL_NAME, *FALLBACK_MODELS]
    seen = set()
    candidates = []
    for model_name in ordered:
        normalized = (model_name or '').strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            candidates.append(normalized)
    return candidates


def _gemini_client():
    _sanitize_dead_local_proxy()
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError('Missing GEMINI_API_KEY. Add it to your .env file.')

    try:
        import google.generativeai as genai
    except ImportError as error:
        raise RuntimeError(
            'google-generativeai is not installed. Run pip install -r backend/requirements.txt.'
        ) from error

    genai.configure(api_key=api_key, transport=DEFAULT_TRANSPORT)
    return genai


def _generate_text_with_fallback(prompt, generation_config=None):
    genai = _gemini_client()
    last_error = None

    for model_name in _candidate_models():
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config,
            )
            response = model.generate_content(
                prompt,
                request_options={'timeout': DEFAULT_REQUEST_TIMEOUT},
            )
            reply_text = (getattr(response, 'text', '') or '').strip()
            if reply_text:
                return reply_text
            last_error = RuntimeError(f'Gemini returned an empty response for model {model_name}.')
        except Exception as error:
            last_error = error
            error_text = str(error).lower()
            if (
                'not found' in error_text
                or 'not supported for generatecontent' in error_text
                or 'quota exceeded' in error_text
                or 'too many requests' in error_text
                or 'rate limit' in error_text
            ):
                continue
            raise

    raise last_error or RuntimeError('Gemini returned an empty response.')


def _clean_json_response(raw_text):
    cleaned = (raw_text or '').strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.strip('`')
        if cleaned.lower().startswith('json'):
            cleaned = cleaned[4:].strip()
    return cleaned.strip()


def _conversation_transcript(conversation_history):
    lines = []
    for item in conversation_history or []:
        role = 'Student' if item.get('role') == 'user' else 'Support assistant'
        text = (item.get('text') or '').strip()
        if text:
            lines.append(f'{role}: {text}')
    return '\n'.join(lines)


def _support_prompt(user_message, conversation_history=None):
    transcript = _conversation_transcript(conversation_history)
    if transcript:
        return f"""
{SYSTEM_PROMPT}

Conversation so far:
{transcript}

Latest student message:
Student: {user_message}
""".strip()

    return f"""
{SYSTEM_PROMPT}

Latest student message:
Student: {user_message}
""".strip()


def _format_history(conversation_history):
    formatted = []
    for item in conversation_history or []:
        role = 'model' if item.get('role') == 'assistant' else 'user'
        text = (item.get('text') or '').strip()
        if not text:
            continue
        formatted.append({'role': role, 'parts': [{'text': text}]})
    return formatted


def generate_support_response(user_message, conversation_history=None):
    cleaned_message = (user_message or '').strip()
    if not cleaned_message:
        return {
            'reply': "I'm here with you. Share what has been feeling hardest lately, and we can sort through it together.",
            'distress_detected': False,
            'mood_tags': [],
        }

    distress_detected = detect_severe_distress(cleaned_message)
    mood_tags = detect_mood_tags(cleaned_message)

    if distress_detected:
        return {
            'reply': build_crisis_response(),
            'distress_detected': True,
            'mood_tags': mood_tags,
        }

    reply_text = _generate_text_with_fallback(
        _support_prompt(cleaned_message, conversation_history),
        generation_config={'temperature': 0.7},
    )

    return {
        'reply': reply_text,
        'distress_detected': False,
        'mood_tags': mood_tags,
    }


def generate_support_report(conversation_history, student_profile=None):
    if not conversation_history:
        raise RuntimeError('Conversation history is required to generate a support report.')

    transcript = _conversation_transcript(conversation_history)
    if not transcript.strip():
        raise RuntimeError('Conversation history is empty.')

    student_context = {
        'student_id': student_profile.get('id') if student_profile else None,
        'student_name': student_profile.get('name') if student_profile else None,
        'predicted_risk_level': student_profile.get('risk_level') if student_profile else None,
        'predicted_risk_score': student_profile.get('risk_score') if student_profile else None,
        'predicted_top_factors': student_profile.get('top_factors', []) if student_profile else [],
        'predicted_risk_reasons': student_profile.get('risk_reasons', []) if student_profile else [],
        'attendance': student_profile.get('attendance') if student_profile else None,
        'marks': student_profile.get('marks') if student_profile else None,
        'percentage_score': student_profile.get('percentage_score') if student_profile else None,
        'grade_letter': student_profile.get('grade_letter') if student_profile else None,
    }

    prompt = f"""
{REPORT_SYSTEM_PROMPT}

Student profile context:
{json.dumps(student_context, indent=2)}

Conversation transcript:
{transcript}

Return a JSON object with exactly these keys:
- conversation_type: string
- primary_concern: string
- summary: string
- confirmed_risk_factors: array of strings
- newly_disclosed_factors: array of strings
- factors_needing_follow_up: array of strings
- student_strengths: array of strings
- urgency_level: string
- recommended_support_actions: array of strings
- risk_confirmation_status: string
- follow_up_focus: string
- counselor_handoff_note: string
""".strip()

    raw_text = _generate_text_with_fallback(
        prompt,
        generation_config={
            'temperature': 0.4,
            'response_mime_type': 'application/json',
        },
    )

    report = json.loads(_clean_json_response(raw_text))
    report.setdefault('conversation_type', 'student support check-in')
    report.setdefault('primary_concern', 'The student may be dealing with overlapping academic and personal stressors.')
    report.setdefault('summary', 'The conversation suggests the student may need early support, but more detail is needed.')
    report.setdefault('confirmed_risk_factors', [])
    report.setdefault('newly_disclosed_factors', [])
    report.setdefault('factors_needing_follow_up', [])
    report.setdefault('student_strengths', [])
    report.setdefault('urgency_level', 'medium')
    report.setdefault('recommended_support_actions', [])
    report.setdefault('risk_confirmation_status', 'partially_confirmed')
    report.setdefault('follow_up_focus', 'Check in gently on what support would feel most helpful next.')
    report.setdefault('counselor_handoff_note', 'Use this as an early-support summary, not as a diagnosis.')
    return report
