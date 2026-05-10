from datetime import date, datetime
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
import csv
import io
import json
import os
import joblib
import numpy as np
import pandas as pd

from support_chatbot import generate_support_response, generate_support_report

os.environ.setdefault('KERAS_BACKEND', 'jax')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIST_DIR, static_url_path='')
CORS(
    app,
    resources={r"/*": {"origins": [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]}},
)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.json')
SUPPORT_REPORTS_PATH = os.path.join(os.path.dirname(__file__), 'support_reports.json')
MODEL_PATHS = {
    'mlp': os.path.join(BASE_DIR, 'student_dropout_mlp_model.pkl'),
    'lstm': os.path.join(BASE_DIR, 'student_dropout_lstm_model (2).pkl'),
    'rf': os.path.join(BASE_DIR, 'student_dropout_rf_model.pkl'),
    'dt': os.path.join(BASE_DIR, 'decision_tree_model.pkl'),
    'meta': os.path.join(BASE_DIR, 'meta_model.pkl'),
}
REQUIRED_FIELDS = [
    'name',
    'class',
    'section',
    'attendance',
    'marks',
    'risk_score',
    'risk_level',
    'explanation',
]
IMPORT_META_FIELDS = {'name', 'class', 'section', 'marks', 'risk_score', 'risk_level', 'explanation'}
SUBJECT_ATTENDANCE_EXCLUDED_KEYWORDS = {
    'id',
    'roll',
    'name',
    'gender',
    'class',
    'section',
    'risk',
    'score',
    'level',
    'explanation',
    'gpa',
    'grade',
    'sentiment',
    'engagement',
    'location',
    'internet',
    'parent',
}
DEFAULT_GENDERS = ['Female', 'Male']
DEFAULT_LOCATIONS = ['Urban', 'Semi-Urban', 'Rural']
DEFAULT_PARENT_EDUCATION = ['Primary', 'Secondary', 'Graduate', 'Postgraduate']
DEFAULT_SENTIMENTS = ['Positive', 'Neutral', 'Negative']
LOW_SUPPORT_EDUCATION = {'Primary', 'Secondary'}
GRADE_SCALE = [
    {'letter': 'O', 'point': 10, 'minimum': 85, 'description': 'Outstanding'},
    {'letter': 'A+', 'point': 9, 'minimum': 75, 'description': 'Excellent'},
    {'letter': 'A', 'point': 8, 'minimum': 60, 'description': 'Very Good'},
    {'letter': 'B+', 'point': 7, 'minimum': 55, 'description': 'Good'},
    {'letter': 'B', 'point': 6, 'minimum': 50, 'description': 'Above Average'},
    {'letter': 'C', 'point': 5, 'minimum': 45, 'description': 'Average'},
    {'letter': 'P', 'point': 4, 'minimum': 40, 'description': 'Pass'},
]


def load_students():
    with open(DATA_PATH, 'r', encoding='utf-8') as file:
        return json.load(file)


def save_students(student_records):
    with open(DATA_PATH, 'w', encoding='utf-8') as file:
        json.dump(student_records, file, indent=2)


def load_support_reports():
    if not os.path.exists(SUPPORT_REPORTS_PATH):
        return []
    with open(SUPPORT_REPORTS_PATH, 'r', encoding='utf-8') as file:
        return json.load(file)


def save_support_reports(report_records):
    with open(SUPPORT_REPORTS_PATH, 'w', encoding='utf-8') as file:
        json.dump(report_records, file, indent=2)


def parse_json_request():
    payload = request.get_json(silent=True)
    if payload is not None:
        return payload
    raw_body = request.get_data(cache=False, as_text=True) or ''
    if not raw_body.strip():
        return {}
    try:
        return json.loads(raw_body)
    except json.JSONDecodeError:
        return {}


def load_model_artifact(model_name, model_path):
    model_record = {
        'name': model_name,
        'path': model_path,
        'loaded': False,
        'model': None,
        'error': None,
        'feature_names': [],
        'mtime': None,
        'size': None,
    }
    if not os.path.exists(model_path):
        model_record['error'] = 'Model file not found.'
        return model_record

    try:
        model_record['mtime'] = os.path.getmtime(model_path)
        model_record['size'] = os.path.getsize(model_path)
        model = joblib.load(model_path)
        model_record['model'] = model
        model_record['loaded'] = True
        model_record['feature_names'] = list(getattr(model, 'feature_names_in_', []))
    except Exception as error:
        model_record['error'] = str(error)

    return model_record


def initialize_model_registry():
    return {
        model_name: load_model_artifact(model_name, model_path)
        for model_name, model_path in MODEL_PATHS.items()
    }


def refresh_model_if_changed(model_name, force_reload=False):
    model_path = MODEL_PATHS[model_name]
    current_record = MODEL_REGISTRY.get(model_name)

    if not os.path.exists(model_path):
        MODEL_REGISTRY[model_name] = load_model_artifact(model_name, model_path)
        return MODEL_REGISTRY[model_name]

    current_mtime = os.path.getmtime(model_path)
    current_size = os.path.getsize(model_path)

    should_reload = force_reload or current_record is None
    if current_record is not None and not should_reload:
        should_reload = (
            current_record.get('mtime') != current_mtime
            or current_record.get('size') != current_size
        )

    if should_reload:
        MODEL_REGISTRY[model_name] = load_model_artifact(model_name, model_path)

    return MODEL_REGISTRY[model_name]


def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def to_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return int(default)


def normalize_bool_text(value, default='No'):
    text = str(value or '').strip().lower()
    if text in {'1', 'true', 'yes', 'y'}:
        return 'Yes'
    if text in {'0', 'false', 'no', 'n'}:
        return 'No'
    return default


def encode_yes_no(value, default=0):
    text = str(value or '').strip().lower()
    if text in {'1', 'true', 'yes', 'y'}:
        return 1
    if text in {'0', 'false', 'no', 'n'}:
        return 0
    return int(default)


def encode_categorical(value, mapping, default=0):
    key = str(value or '').strip().lower()
    return int(mapping.get(key, default))


FEATURE_ENCODERS = {
    'Gender': lambda value: encode_categorical(value, {'female': 0, 'male': 1, 'other': 2}, 1),
    'Family_Income': lambda value: encode_categorical(value, {'low': 0, 'medium': 1, 'high': 2}, 1),
    'Parental_Education': lambda value: encode_categorical(
        value,
        {'none': 0, 'primary': 0, 'secondary': 1, 'graduate': 2, 'postgraduate': 3},
        2,
    ),
    'Scholarship': lambda value: encode_yes_no(value, 0),
    'Internet_Access': lambda value: encode_categorical(
        value,
        {'poor': 0, 'limited': 0, 'average': 1, 'good': 1, 'excellent': 2},
        1,
    ),
    'Part_Time_Job': lambda value: encode_yes_no(value, 0),
    'Displaced': lambda value: encode_yes_no(value, 0),
    'Address': lambda value: encode_categorical(value, {'rural': 0, 'semi-urban': 1, 'urban': 2}, 2),
    'Debtor': lambda value: encode_yes_no(value, 0),
    'Tuition_Fees_Up_to_Date': lambda value: encode_yes_no(value, 1),
    'School_Support': lambda value: encode_yes_no(value, 1),
    'Family_Support': lambda value: encode_yes_no(value, 1),
}


def normalize_feature_value(feature_name, value):
    if feature_name in FEATURE_ENCODERS:
        return FEATURE_ENCODERS[feature_name](value)
    return to_float(value, 0)


def derive_assignment_delay(student):
    trend = str(student.get('attendance_trend', '')).lower()
    if trend == 'decreasing':
        return 3
    if trend == 'stable':
        return 2
    return 1


def derive_number_of_failures(student):
    percentage_score = compute_percentage_score(student)
    if percentage_score <= 33:
        return 3
    if percentage_score < 50:
        return 2
    if percentage_score < 65:
        return 1
    return 0


def build_model_feature_row(student=None, overrides=None):
    base = student or {}
    extra = overrides or {}

    default_row = {
        'Age': to_int(base.get('age', 20), 20),
        'Gender': base.get('gender', 'Male'),
        'Family_Income': base.get('family_income', 'Medium'),
        'Parental_Education': canonical_parent_education(base) or base.get('parent_education') or 'Graduate',
        'Scholarship': base.get('scholarship', 'No'),
        'Internet_Access': canonical_internet(base) or 'Good',
        'Part_Time_Job': base.get('part_time_job', 'No'),
        'Displaced': base.get('displaced', 'No'),
        'Address': base.get('address', base.get('location', 'Urban')),
        'Attendance_Rate': to_float(base.get('attendance', 0), 0),
        'SemGPA': round(to_float(base.get('sem_gpa', compute_percentage_score(base) / 10), 0), 2),
        'CGPA': round(to_float(base.get('cgpa', base.get('gpa', build_default_gpa(base))), 0), 2),
        'Study_Hours': round(to_float(base.get('study_hours', 2.5), 2.5), 2),
        'Assignment_Delay': to_int(base.get('assignment_delay', derive_assignment_delay(base)), 0),
        'Number_of_Failures': to_int(base.get('number_of_failures', derive_number_of_failures(base)), 0),
        'Stress_Index': round(to_float(base.get('stress_index', base.get('risk_score', 50) / 10), 5), 2),
        'Debtor': base.get('debtor', 'No'),
        'Tuition_Fees_Up_to_Date': base.get('tuition_fees_up_to_date', 'Yes'),
        'School_Support': base.get('school_support', 'Yes'),
        'Family_Support': base.get('family_support', 'Yes'),
    }

    # Allow caller to override any model feature using request payload.
    for key, value in extra.items():
        if key in default_row:
            default_row[key] = value

    return {
        feature_name: normalize_feature_value(feature_name, value)
        for feature_name, value in default_row.items()
    }


def infer_dropout_probability(model, prediction_probabilities):
    if prediction_probabilities is None:
        return None

    classes = list(getattr(model, 'classes_', []))
    if not classes:
        return None

    probability_by_class = {
        str(label): float(probability)
        for label, probability in zip(classes, prediction_probabilities)
    }

    preferred_labels = ['1', 'dropout', 'yes', 'true']
    for label in preferred_labels:
        for existing_label, probability in probability_by_class.items():
            if str(existing_label).strip().lower() == label:
                return probability

    if len(probability_by_class) == 2:
        # Fallback: use the larger class label probability in binary case.
        sorted_items = sorted(probability_by_class.items(), key=lambda item: item[0])
        return sorted_items[-1][1]

    return None


def calculate_risk_level(risk_score):
    if risk_score >= 75:
        return 'High'
    if risk_score >= 45:
        return 'Medium'
    return 'Low'


def calculate_hardcoded_risk_score(feature_row):
    attendance = to_float(feature_row.get('Attendance_Rate'), 0)
    sem_gpa = to_float(feature_row.get('SemGPA'), 0)
    cgpa = to_float(feature_row.get('CGPA'), 0)
    study_hours = to_float(feature_row.get('Study_Hours'), 0)
    assignment_delay = to_float(feature_row.get('Assignment_Delay'), 0)
    number_of_failures = to_float(feature_row.get('Number_of_Failures'), 0)
    stress_index = to_float(feature_row.get('Stress_Index'), 0)
    family_income = to_int(feature_row.get('Family_Income'), 1)
    parental_education = to_int(feature_row.get('Parental_Education'), 2)
    internet_access = to_int(feature_row.get('Internet_Access'), 1)
    debtor = to_int(feature_row.get('Debtor'), 0)
    tuition_up_to_date = to_int(feature_row.get('Tuition_Fees_Up_to_Date'), 1)
    school_support = to_int(feature_row.get('School_Support'), 1)
    family_support = to_int(feature_row.get('Family_Support'), 1)

    score = 0.0
    score += max(0.0, 85.0 - attendance) * 0.7
    score += max(0.0, 7.5 - sem_gpa) * 6.0
    score += max(0.0, 7.5 - cgpa) * 4.0
    score += max(0.0, 3.0 - study_hours) * 4.0
    score += min(max(assignment_delay, 0.0), 3.0) * 4.0
    score += min(max(number_of_failures, 0.0), 4.0) * 8.0
    score += min(max(stress_index, 0.0), 10.0) * 2.5

    if family_income <= 0:
        score += 4.0
    elif family_income == 1:
        score += 2.0

    if parental_education <= 0:
        score += 5.0
    elif parental_education == 1:
        score += 3.0

    if internet_access <= 0:
        score += 4.0
    elif internet_access == 1:
        score += 2.0

    if debtor:
        score += 8.0
    if not tuition_up_to_date:
        score += 12.0
    if not school_support:
        score += 6.0
    if not family_support:
        score += 8.0

    return int(round(max(0.0, min(score, 100.0))))


def extract_student_lookup_id(value):
    digits = ''.join(character for character in str(value or '') if character.isdigit())
    if len(digits) >= 4:
        return int(digits[-4:])
    return None


def compute_average_marks(student):
    subject_marks = student.get('subject_marks') or []
    if isinstance(subject_marks, list) and subject_marks:
        scores = []
        for entry in subject_marks:
            raw_score = entry.get('marks') if isinstance(entry, dict) else None
            try:
                score = float(raw_score)
            except (TypeError, ValueError):
                continue
            if 0 <= score <= 100:
                scores.append(score)
        if scores:
            return round(sum(scores) / len(scores), 1)

    raw_average = student.get('average_marks')
    if raw_average not in (None, ''):
        try:
            return round(float(raw_average), 1)
        except (TypeError, ValueError):
            pass

    raw_marks = student.get('marks')
    if raw_marks not in (None, ''):
        try:
            return round(float(raw_marks), 1)
        except (TypeError, ValueError):
            pass

    return 0.0


def compute_percentage_score(student):
    raw_percentage = student.get('percentage_score')
    if raw_percentage not in (None, ''):
        try:
            return round(float(raw_percentage), 1)
        except (TypeError, ValueError):
            pass
    return compute_average_marks(student)


def build_grade_details(student):
    average_marks = compute_average_marks(student)
    percentage_score = compute_percentage_score(student)
    for grade in GRADE_SCALE:
        if average_marks >= grade['minimum']:
            return {
                'average_marks': average_marks,
                'percentage_score': percentage_score,
                'result_status': 'Pass' if percentage_score > 33 else 'Fail',
                'grade_letter': grade['letter'],
                'grade_point': grade['point'],
                'grade_description': grade['description'],
            }
    return {
        'average_marks': average_marks,
        'percentage_score': percentage_score,
        'result_status': 'Pass' if percentage_score > 33 else 'Fail',
        'grade_letter': 'F',
        'grade_point': 0,
        'grade_description': 'Fail',
    }


def build_default_gpa(student):
    return round(compute_percentage_score(student) / 10, 1)


def build_previous_gpa(student, gpa):
    student_id = int(student.get('id', 0))
    adjustment = [-1.4, -0.8, -0.2, 0.4][student_id % 4]
    previous_gpa = round(gpa - adjustment, 1)
    return max(2.0, min(previous_gpa, 10.0))


def build_default_sentiment(student):
    if student.get('risk_level') == 'High':
        return 'Negative'
    if student.get('risk_level') == 'Medium':
        return 'Neutral'
    student_id = int(student.get('id', 0))
    return DEFAULT_SENTIMENTS[student_id % 2]


def build_default_engagement(student):
    attendance = int(student.get('attendance', 0))
    percentage_score = compute_percentage_score(student)
    engagement = round(((attendance / 100) * 10 + (percentage_score / 100) * 10) / 2, 1)
    return max(3.5, min(engagement, 14.0))


def build_default_attendance_trend(student):
    attendance = int(student.get('attendance', 0))
    if attendance < 60:
        return 'decreasing'
    if attendance < 80:
        return 'stable'
    return 'increasing'


def canonical_parent_education(student):
    return student.get('parental_educ') or student.get('parent_education')


def canonical_internet(student):
    return student.get('internet') or student.get('internet_access')


def canonical_engagement(student):
    return student.get('engagement_weekly') or student.get('average_engagement_weekly')


def enrich_student_defaults(student):
    student_id = int(student.get('id', 0))
    student['student_lookup_id'] = extract_student_lookup_id(student.get('roll_no')) or student_id
    student['gender'] = student.get('gender') or DEFAULT_GENDERS[student_id % len(DEFAULT_GENDERS)]
    student['location'] = student.get('location') or DEFAULT_LOCATIONS[student_id % len(DEFAULT_LOCATIONS)]

    internet = canonical_internet(student) or ('Poor' if student.get('attendance', 0) < 60 else 'Good')
    parent_education = canonical_parent_education(student) or DEFAULT_PARENT_EDUCATION[student_id % len(DEFAULT_PARENT_EDUCATION)]

    student['internet'] = internet
    student['internet_access'] = internet
    student['parental_educ'] = parent_education
    student['parent_education'] = parent_education

    gpa = float(student.get('gpa', build_default_gpa(student)))
    student['gpa'] = round(gpa, 1)
    previous_gpa = float(student.get('previous_gpa', build_previous_gpa(student, student['gpa'])))
    student['previous_gpa'] = round(previous_gpa, 1)

    sentiment = student.get('nlp_sentiment') or build_default_sentiment(student)
    student['nlp_sentiment'] = sentiment

    engagement = float(canonical_engagement(student) or build_default_engagement(student))
    student['engagement_weekly'] = round(engagement, 1)
    student['average_engagement_weekly'] = round(engagement, 1)

    student['attendance_trend'] = (student.get('attendance_trend') or build_default_attendance_trend(student)).lower()
    student.update(build_grade_details(student))
    student.pop('grade_trend', None)
    return student


def factor_entry(label, reason, weight):
    return {
        'factor': label,
        'reason': reason,
        'weight': weight,
    }


def generate_risk_reasons(student):
    factors = []
    attendance = int(student.get('attendance', 0))
    percentage_score = compute_percentage_score(student)
    engagement = float(student.get('average_engagement_weekly', student.get('engagement_weekly', 0)))
    sentiment = str(student.get('nlp_sentiment', '')).lower()
    attendance_trend = str(student.get('attendance_trend', '')).lower()
    internet = str(student.get('internet_access', student.get('internet', ''))).lower()
    parental_educ = str(student.get('parental_educ', student.get('parent_education', '')))

    if attendance < 60:
      factors.append(factor_entry('Attendance', 'Low attendance is a major dropout risk factor', 100))
    elif attendance <= 75:
      factors.append(factor_entry('Attendance', 'Attendance is below ideal range', 75))

    if percentage_score <= 33:
      factors.append(factor_entry('Percentage', 'Very low percentage score indicates academic struggle', 95))
    elif percentage_score < 60:
      factors.append(factor_entry('Percentage', 'Percentage score is below strong academic performance level', 70))

    if engagement < 8:
      factors.append(factor_entry('Engagement', 'Low weekly engagement suggests reduced academic involvement', 80))

    if sentiment == 'negative':
      factors.append(factor_entry('Sentiment', 'Negative sentiment may indicate emotional or motivational challenges', 82))

    if attendance_trend == 'decreasing':
      factors.append(factor_entry('Attendance Trend', 'Attendance trend is worsening over time', 78))

    if internet in {'poor', 'limited'}:
      factors.append(factor_entry('Internet', 'Limited internet access may affect learning consistency', 65))

    if parental_educ in LOW_SUPPORT_EDUCATION:
      factors.append(factor_entry('Home Support', 'Lower home academic support may contribute to risk', 60))

    if not factors:
      factors.append(factor_entry('Stability', 'Current academic and engagement indicators look relatively stable', 30))

    factors.sort(key=lambda current_factor: current_factor['weight'], reverse=True)
    risk_reasons = [factor['reason'] for factor in factors]
    top_factors = [factor['factor'] for factor in factors[:3]]
    return {
        'risk_reasons': risk_reasons,
        'top_factors': top_factors,
    }


def serialize_student(student):
    explanations = generate_risk_reasons(student)
    serialized = dict(student)
    serialized.update(explanations)
    return serialized


def serialize_students(student_records):
    return [serialize_student(student) for student in student_records]


students = [enrich_student_defaults(student) for student in load_students()]
save_students(students)
support_reports = load_support_reports()
MODEL_REGISTRY = initialize_model_registry()


def normalize_student(row, student_id):
    risk_score = int(float(row.get('risk_score', 0)))
    risk_level = row.get('risk_level', '').strip() or calculate_risk_level(risk_score)
    normalized_student = {
        'id': student_id,
        'name': row['name'].strip(),
        'class': int(float(row['class'])),
        'section': row['section'].strip().upper(),
        'attendance': int(float(row['attendance'])),
        'marks': int(float(row['marks'])),
        'risk_score': risk_score,
        'risk_level': risk_level,
        'explanation': row['explanation'].strip(),
        'gender': row.get('gender', '').strip() or DEFAULT_GENDERS[student_id % len(DEFAULT_GENDERS)],
        'location': row.get('location', '').strip() or DEFAULT_LOCATIONS[student_id % len(DEFAULT_LOCATIONS)],
    }

    internet = row.get('internet', '').strip() or row.get('internet_access', '').strip() or ('Poor' if normalized_student['attendance'] < 60 else 'Good')
    parent_education = row.get('parental_educ', '').strip() or row.get('parent_education', '').strip() or DEFAULT_PARENT_EDUCATION[student_id % len(DEFAULT_PARENT_EDUCATION)]
    normalized_student['internet'] = internet
    normalized_student['internet_access'] = internet
    normalized_student['parental_educ'] = parent_education
    normalized_student['parent_education'] = parent_education

    normalized_student['gpa'] = round(float(row.get('gpa', build_default_gpa(normalized_student))), 1)
    normalized_student['previous_gpa'] = round(float(row.get('previous_gpa', build_previous_gpa(normalized_student, normalized_student['gpa']))), 1)
    normalized_student['nlp_sentiment'] = row.get('nlp_sentiment', '').strip() or build_default_sentiment(normalized_student)

    engagement = float(
        row.get('engagement_weekly', '').strip()
        or row.get('average_engagement_weekly', '').strip()
        or build_default_engagement(normalized_student)
    )
    normalized_student['engagement_weekly'] = round(engagement, 1)
    normalized_student['average_engagement_weekly'] = round(engagement, 1)
    normalized_student['attendance_trend'] = (row.get('attendance_trend', '').strip() or build_default_attendance_trend(normalized_student)).lower()
    return normalized_student


def average_subject_attendance(row, fieldnames):
    def is_candidate_subject_column(field_name):
        normalized = (field_name or '').strip().lower()
        if not normalized or normalized in IMPORT_META_FIELDS or normalized == 'attendance':
            return False
        if any(keyword in normalized for keyword in SUBJECT_ATTENDANCE_EXCLUDED_KEYWORDS):
            return False
        return True

    candidate_columns = [
        field for field in (fieldnames or [])
        if is_candidate_subject_column(field)
    ]

    scores = []
    for field in candidate_columns:
        raw_value = (row.get(field) or '').strip()
        if not raw_value:
            continue
        try:
            numeric_value = float(raw_value)
        except ValueError:
            continue
        if 0 <= numeric_value <= 100:
            scores.append(numeric_value)

    if not scores:
        return None, []

    average = round(sum(scores) / len(scores))
    return average, candidate_columns


def is_subject_attendance_csv(fieldnames):
    if not fieldnames or 'name' not in fieldnames:
        return False
    if 'attendance' in fieldnames:
        return False

    average, columns = average_subject_attendance({field: '100' for field in fieldnames}, fieldnames)
    return len(columns) >= 2 and average is not None


def normalize_subject_attendance_student(row, student_id, fieldnames):
    attendance, subject_columns = average_subject_attendance(row, fieldnames)
    if attendance is None:
        raise ValueError('Could not find numeric subject attendance columns in the CSV.')

    subject_labels = [column.replace('_attendance', '').replace('_', ' ').title() for column in subject_columns]
    estimated_marks = max(35, min(95, round(attendance * 0.82)))
    risk_score = max(5, min(95, round(100 - attendance + max(0, 60 - estimated_marks) * 0.6)))
    risk_level = calculate_risk_level(risk_score)

    normalized_student = {
        'id': student_id,
        'name': row['name'].strip(),
        'class': int(float((row.get('class') or 0) or 0)) if (row.get('class') or '').strip() else 0,
        'section': (row.get('section') or 'A').strip().upper() or 'A',
        'attendance': attendance,
        'marks': estimated_marks,
        'risk_score': risk_score,
        'risk_level': risk_level,
        'explanation': (
            f"Temporary test import based on subject attendance across {', '.join(subject_labels[:4])}."
            if subject_labels
            else 'Temporary test import based on subject attendance.'
        ),
        'gender': DEFAULT_GENDERS[student_id % len(DEFAULT_GENDERS)],
        'location': DEFAULT_LOCATIONS[student_id % len(DEFAULT_LOCATIONS)],
    }
    return enrich_student_defaults(normalized_student)


def validate_csv_columns(fieldnames):
    if not fieldnames:
        return 'CSV file is empty.'
    if is_subject_attendance_csv(fieldnames):
        return None
    missing_fields = [field for field in REQUIRED_FIELDS if field not in fieldnames]
    if missing_fields:
        return f"Missing required columns: {', '.join(missing_fields)}"
    return None


def generate_alerts(student_records):
    alert_date = date.today().isoformat()
    alerts = []

    for student in student_records:
        student_id = student['id']
        student_name = student['name']
        percentage_score = compute_percentage_score(student)
        engagement = float(student.get('average_engagement_weekly', 0))
        sentiment = student.get('nlp_sentiment', '')

        if int(student.get('attendance', 0)) < 60:
            alerts.append({
                'student_id': student_id,
                'student_name': student_name,
                'type': 'attendance',
                'severity': 'high',
                'message': f'{student_name} has critically low attendance',
                'date': alert_date,
            })

        if percentage_score <= 33:
            alerts.append({
                'student_id': student_id,
                'student_name': student_name,
                'type': 'percentage',
                'severity': 'high',
                'message': f"{student_name}'s percentage score is in the fail range",
                'date': alert_date,
            })

        if sentiment == 'Negative':
            alerts.append({
                'student_id': student_id,
                'student_name': student_name,
                'type': 'sentiment',
                'severity': 'medium',
                'message': f'{student_name} shows negative sentiment',
                'date': alert_date,
            })

        if student.get('risk_level') == 'High':
            alerts.append({
                'student_id': student_id,
                'student_name': student_name,
                'type': 'high_risk',
                'severity': 'high',
                'message': f'{student_name} entered high-risk zone',
                'date': alert_date,
            })

        if engagement < 8:
            alerts.append({
                'student_id': student_id,
                'student_name': student_name,
                'type': 'engagement',
                'severity': 'low' if engagement >= 6 else 'medium',
                'message': f'{student_name} has very low engagement',
                'date': alert_date,
            })

    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    alerts.sort(key=lambda alert: (severity_order[alert['severity']], alert['student_name'], alert['type']))
    return alerts


def build_alert_summary(alerts):
    return {
        'total_alerts': len(alerts),
        'high_severity': len([alert for alert in alerts if alert['severity'] == 'high']),
        'medium_severity': len([alert for alert in alerts if alert['severity'] == 'medium']),
        'low_severity': len([alert for alert in alerts if alert['severity'] == 'low']),
    }


def get_student_by_id(student_id):
    normalized_id = str(student_id).strip()

    direct_match = next((student for student in students if str(student.get('id')) == normalized_id), None)
    if direct_match:
        return direct_match

    roll_match = next(
        (student for student in students if str(student.get('roll_no', '')).strip().lower() == normalized_id.lower()),
        None,
    )
    if roll_match:
        return roll_match

    lookup_matches = [student for student in students if str(student.get('student_lookup_id', '')) == normalized_id]
    if len(lookup_matches) == 1:
        return lookup_matches[0]
    if len(lookup_matches) > 1:
        raise ValueError('Multiple students share this 4-digit student ID. Please use the full roll number instead.')
    return None


def next_support_report_id():
    return max((report.get('id', 0) for report in support_reports), default=0) + 1


def build_support_session_record(
    report,
    conversation,
    student=None,
    student_id=None,
    student_name='',
    session_end_reason='ended',
    feedback=None,
):
    serialized_student = serialize_student(student) if student else None
    safe_feedback = feedback or {}
    effective_student_name = student_name or (serialized_student.get('name') if serialized_student else '') or 'Anonymous student'

    return {
        'id': next_support_report_id(),
        'created_at': datetime.utcnow().isoformat() + 'Z',
        'student_id': serialized_student.get('student_lookup_id') if serialized_student else student_id,
        'student_name': effective_student_name,
        'student_profile': serialized_student,
        'sharing_consent': True,
        'session_end_reason': session_end_reason,
        'feedback': {
            'satisfaction': (safe_feedback.get('satisfaction') or 'not_provided').strip(),
            'needs_human_consultant': bool(safe_feedback.get('needs_human_consultant')),
            'note': (safe_feedback.get('note') or '').strip(),
        },
        'report': report,
        'conversation': conversation,
        'source': 'support_chatbot',
    }


def format_student_list(student_records, formatter, limit=5, empty_message='none right now'):
    if not student_records:
        return empty_message
    return ', '.join(formatter(student) for student in student_records[:limit])


def parse_class_reference(query):
    tokens = query.replace('-', ' ').split()
    for index, token in enumerate(tokens):
        if token == 'class' and index + 1 < len(tokens):
            next_token = tokens[index + 1].rstrip('.,?!')
            if next_token.isdigit():
                return int(next_token)
    return None


def alert_type_label(alert_type):
    return {
        'attendance': 'attendance',
        'percentage': 'percentage',
        'sentiment': 'sentiment',
        'high_risk': 'high risk',
        'engagement': 'engagement',
    }.get(alert_type, alert_type)


def chatbot_response(message):
    query = (message or '').strip().lower()
    if not query:
        return {
            'reply': 'Ask about high-risk students, alerts, attendance, percentage scores, or the most common risk factors.',
            'suggestions': [
                'How many high-risk students are there?',
                'Who has low attendance?',
                'What is the most common risk factor?',
            ],
        }

    serialized_students = serialize_students(students)
    alerts = generate_alerts(students)
    alert_summary = build_alert_summary(alerts)
    class_reference = parse_class_reference(query)
    stats = {
        'total': len(serialized_students),
        'high_risk': len([student for student in serialized_students if student['risk_level'] == 'High']),
        'medium_risk': len([student for student in serialized_students if student['risk_level'] == 'Medium']),
        'low_risk': len([student for student in serialized_students if student['risk_level'] == 'Low']),
    }
    average_attendance = round(sum(student['attendance'] for student in serialized_students) / max(1, len(serialized_students)), 1)
    average_percentage = round(sum(compute_percentage_score(student) for student in serialized_students) / max(1, len(serialized_students)), 1)

    if any(keyword in query for keyword in ['overview', 'summary', 'status', 'snapshot', 'overall']):
        return {
            'reply': (
                f"There are {stats['total']} students in the dashboard: {stats['high_risk']} high-risk, "
                f"{stats['medium_risk']} medium-risk, and {stats['low_risk']} low-risk. "
                f"Average attendance is {average_attendance}% and average percentage score is {average_percentage}%. "
                f"There are {alert_summary['total_alerts']} active alerts."
            ),
            'suggestions': ['Which class has the most high-risk students?', 'Who has the lowest percentage?', 'Show alerts summary'],
        }

    if 'high risk' in query or 'high-risk' in query:
        high_risk_students = [student['name'] for student in serialized_students if student['risk_level'] == 'High'][:6]
        names = ', '.join(high_risk_students) if high_risk_students else 'none right now'
        return {
            'reply': f"There are {stats['high_risk']} high-risk students. Examples: {names}.",
            'suggestions': ['Which class has the most high-risk students?', 'Who has low attendance?', 'What is the top risk factor?'],
        }

    if 'attendance' in query and ('low' in query or 'poor' in query or 'critical' in query):
        low_attendance_students = sorted(
            [student for student in serialized_students if student['attendance'] < 60],
            key=lambda student: student['attendance'],
        )[:5]
        if not low_attendance_students:
            reply = 'No students are currently below 60% attendance.'
        else:
            reply = 'Students with the lowest attendance are ' + ', '.join(
                f"{student['name']} ({student['attendance']}%)" for student in low_attendance_students
            ) + '.'
        return {
            'reply': reply,
            'suggestions': ['Who is high risk?', 'Who has the best attendance?', 'Show alerts summary'],
        }

    if 'best attendance' in query or ('highest' in query and 'attendance' in query):
        strongest_attendance = sorted(serialized_students, key=lambda student: student['attendance'], reverse=True)[:5]
        return {
            'reply': 'Students with the best attendance are ' + format_student_list(
                strongest_attendance,
                lambda student: f"{student['name']} ({student['attendance']}%)",
            ) + '.',
            'suggestions': ['Who has low attendance?', 'Which class has the highest attendance?', 'Show alerts summary'],
        }

    if 'gpa' in query or 'percentage' in query or '% score' in query or 'percent' in query:
        if any(keyword in query for keyword in ['highest', 'best', 'top']):
            strongest_scores = sorted(serialized_students, key=lambda student: compute_percentage_score(student), reverse=True)[:5]
            return {
                'reply': 'Students with the highest percentage scores are ' + format_student_list(
                    strongest_scores,
                    lambda student: f"{student['name']} ({compute_percentage_score(student)}%)",
                ) + '.',
                'suggestions': ['Who has the lowest percentage?', 'Show alerts summary', 'Who is high risk?'],
            }
        weakest_scores = sorted(serialized_students, key=lambda student: compute_percentage_score(student))[:5]
        return {
            'reply': 'Students with the lowest percentage scores are ' + ', '.join(
                f"{student['name']} ({compute_percentage_score(student)}%)" for student in weakest_scores
            ) + '.',
            'suggestions': ['Who has low attendance?', 'Who is high risk?', 'Show explainability insights'],
        }

    if any(keyword in query for keyword in ['lowest marks', 'low marks', 'weakest marks', 'lowest mark']):
        weakest_marks = sorted(serialized_students, key=lambda student: student.get('marks', 0))[:5]
        return {
            'reply': 'Students with the lowest marks are ' + format_student_list(
                weakest_marks,
                lambda student: f"{student['name']} ({student['marks']})",
            ) + '.',
            'suggestions': ['Who has the highest marks?', 'Who has low attendance?', 'Show alerts summary'],
        }

    if any(keyword in query for keyword in ['highest marks', 'best marks', 'top marks', 'top scorers']):
        strongest_marks = sorted(serialized_students, key=lambda student: student.get('marks', 0), reverse=True)[:5]
        return {
            'reply': 'Top scorers are ' + format_student_list(
                strongest_marks,
                lambda student: f"{student['name']} ({student['marks']})",
            ) + '.',
            'suggestions': ['Who has the lowest marks?', 'Who has the highest percentage?', 'Show class performance summary'],
        }

    if 'alert' in query:
        if 'high' in query and 'alert' in query:
            high_alerts = [alert for alert in alerts if alert['severity'] == 'high'][:5]
            return {
                'reply': (
                    f"There are {alert_summary['high_severity']} high-severity alerts. "
                    + format_student_list(
                        high_alerts,
                        lambda alert: f"{alert['student_name']} ({alert_type_label(alert['type'])})",
                        empty_message='No high-severity alerts right now',
                    )
                    + '.'
                ),
                'suggestions': ['Show alerts summary', 'Who is high risk?', 'Who has low attendance?'],
            }
        return {
            'reply': (
                f"There are {alert_summary['total_alerts']} alerts in total: "
                f"{alert_summary['high_severity']} high, "
                f"{alert_summary['medium_severity']} medium, and "
                f"{alert_summary['low_severity']} low severity."
            ),
            'suggestions': ['Who is high risk?', 'Who has low attendance?', 'What is the top risk factor?'],
        }

    if 'factor' in query or 'reason' in query or 'explain' in query:
        factor_counts = {}
        for student in serialized_students:
            factor = student.get('top_factors', ['Stability'])[0]
            factor_counts[factor] = factor_counts.get(factor, 0) + 1
        top_factor = sorted(factor_counts.items(), key=lambda item: item[1], reverse=True)[0]
        return {
            'reply': f"The most common main risk factor is {top_factor[0]}, affecting {top_factor[1]} students.",
            'suggestions': ['Which class has the most high-risk students?', 'Who has low attendance?', 'Show alerts summary'],
        }

    if class_reference is not None:
        class_students = [student for student in serialized_students if int(student.get('class', 0)) == class_reference]
        if not class_students:
            return {
                'reply': f'I could not find any students for Class {class_reference}.',
                'suggestions': ['How many high-risk students are there?', 'Show overall summary', 'Who has low attendance?'],
            }

        class_high = len([student for student in class_students if student['risk_level'] == 'High'])
        class_medium = len([student for student in class_students if student['risk_level'] == 'Medium'])
        class_average_attendance = round(sum(student['attendance'] for student in class_students) / len(class_students), 1)
        class_average_percentage = round(sum(compute_percentage_score(student) for student in class_students) / len(class_students), 1)
        return {
            'reply': (
                f"Class {class_reference} has {len(class_students)} students: {class_high} high-risk and {class_medium} medium-risk. "
                f"Average attendance is {class_average_attendance}% and average percentage score is {class_average_percentage}%."
            ),
            'suggestions': ['Which class has the most high-risk students?', 'Who has low attendance?', 'Show alerts summary'],
        }

    if (('which class' in query or 'class has' in query) and ('high-risk' in query or 'high risk' in query)):
        class_breakdown = {}
        for student in serialized_students:
            class_key = int(student.get('class', 0))
            class_breakdown[class_key] = class_breakdown.get(class_key, 0) + (1 if student['risk_level'] == 'High' else 0)
        busiest_class, busiest_count = sorted(class_breakdown.items(), key=lambda item: item[1], reverse=True)[0]
        return {
            'reply': f"Class {busiest_class} currently has the most high-risk students, with {busiest_count} students in the high-risk band.",
            'suggestions': [f'Show Class {busiest_class} summary', 'How many high-risk students are there?', 'Show alerts summary'],
        }

    if ('which class' in query or 'class has' in query) and 'attendance' in query:
        class_attendance = {}
        for student in serialized_students:
            class_key = int(student.get('class', 0))
            class_attendance.setdefault(class_key, []).append(student['attendance'])
        highest_class, scores = sorted(
            class_attendance.items(),
            key=lambda item: sum(item[1]) / len(item[1]),
            reverse='highest' in query or 'best' in query,
        )[0]
        average_score = round(sum(scores) / len(scores), 1)
        descriptor = 'highest' if 'highest' in query or 'best' in query else 'lowest'
        return {
            'reply': f"Class {highest_class} currently has the {descriptor} average attendance at {average_score}%.",
            'suggestions': [f'Show Class {highest_class} summary', 'Who has low attendance?', 'Show overall summary'],
        }

    matching_student = next(
        (
            student for student in serialized_students
            if student['name'].lower() in query
            or query in student['name'].lower()
            or str(student.get('roll_no', '')).lower() in query
            or str(student.get('student_lookup_id', '')).lower() in query
        ),
        None,
    )
    if matching_student:
        reasons = matching_student.get('risk_reasons', [])[:3]
        reason_text = ' '.join(reasons) if reasons else matching_student.get('explanation', 'No explanation available.')
        return {
            'reply': (
                f"{matching_student['name']} is currently {matching_student['risk_level']} risk with a score of "
                f"{matching_student['risk_score']}. Attendance is {matching_student['attendance']}%, percentage score is {compute_percentage_score(matching_student)}%, "
                f"and grade is {matching_student.get('grade_letter', '-')}. {reason_text}"
            ),
            'suggestions': ['Who is high risk?', 'Show alerts summary', 'What is the top risk factor?'],
        }

    return {
        'reply': (
            f"I can help with this dashboard data. Right now there are {stats['total']} students, "
            f"{stats['high_risk']} high-risk students, and {alert_summary['total_alerts']} active alerts."
        ),
        'suggestions': [
            'Show overall summary',
            'Who has the lowest percentage?',
            'Which class has the most high-risk students?',
        ],
    }


@app.route('/students', methods=['GET'])
@app.route('/api/students', methods=['GET'])
def get_students():
    return jsonify(serialize_students(students))


@app.route('/student/<int:student_id>', methods=['GET'])
@app.route('/api/student/<int:student_id>', methods=['GET'])
def get_student(student_id):
    try:
        student = get_student_by_id(student_id)
    except ValueError as error:
        return jsonify({'error': str(error)}), 409
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    return jsonify(serialize_student(student))


@app.route('/dashboard-stats', methods=['GET'])
@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    total = len(students)
    high_risk = len([student for student in students if student['risk_level'] == 'High'])
    medium_risk = len([student for student in students if student['risk_level'] == 'Medium'])
    low_risk = len([student for student in students if student['risk_level'] == 'Low'])

    return jsonify({
        'total': total,
        'high_risk': high_risk,
        'medium_risk': medium_risk,
        'low_risk': low_risk
    })


@app.route('/alerts', methods=['GET'])
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    return jsonify(generate_alerts(students))


@app.route('/alerts-summary', methods=['GET'])
@app.route('/api/alerts-summary', methods=['GET'])
def get_alerts_summary():
    alerts = generate_alerts(students)
    return jsonify(build_alert_summary(alerts))


def build_model_status_payload():
    status_payload = {}
    for model_name in MODEL_REGISTRY:
        model_record = refresh_model_if_changed(model_name)
        status_payload[model_name] = {
            'loaded': model_record['loaded'],
            'path': model_record['path'],
            'error': model_record['error'],
            'feature_names': model_record['feature_names'],
            'mtime': model_record['mtime'],
            'size': model_record['size'],
        }
    return status_payload


@app.route('/model-status', methods=['GET'])
@app.route('/api/model-status', methods=['GET'])
def get_model_status():
    return jsonify(build_model_status_payload())


@app.route('/model-predict', methods=['POST'])
@app.route('/api/model-predict', methods=['POST'])
def model_predict():
    global students
    payload = parse_json_request()
    model_name = str(payload.get('model', 'mlp')).strip().lower() or 'mlp'
    student_id = payload.get('student_id')
    feature_overrides = payload.get('features') or {}
    persist_prediction = bool(payload.get('persist', False))

    if model_name not in MODEL_REGISTRY:
        return jsonify({
            'error': f"Unsupported model '{model_name}'.",
            'available_models': list(MODEL_REGISTRY.keys()),
        }), 400

    model_record = refresh_model_if_changed(model_name)
    if not model_record['loaded']:
        return jsonify({
            'error': f"Model '{model_name}' is not available.",
            'details': model_record['error'],
            'status': build_model_status_payload(),
        }), 503

    student = None
    if student_id not in (None, ''):
        try:
            student = get_student_by_id(student_id)
        except ValueError as error:
            return jsonify({'error': str(error)}), 409
        if not student:
            return jsonify({'error': 'Student not found for the provided ID.'}), 404

    if not student and not feature_overrides:
        return jsonify({
            'error': 'Provide either student_id or features for prediction.',
        }), 400

    feature_row = build_model_feature_row(student=student, overrides=feature_overrides)
    model_features = model_record['feature_names'] or list(feature_row.keys())
    input_row = {feature_name: feature_row.get(feature_name) for feature_name in model_features}
    input_frame = pd.DataFrame([input_row], columns=model_features)
    model_input = (
        input_frame
        if model_record['feature_names']
        else np.asarray([list(input_row.values())], dtype=np.float32)
    )

    model = model_record['model']
    try:
        prediction_probabilities = None
        probability_map = None
        dropout_probability = None

        if model_name == 'lstm':
            # Saved LSTM expects a single timestep sequence with 20 features.
            lstm_input = np.asarray([list(input_row.values())], dtype=np.float32).reshape(1, 1, -1)
            raw_output = model.predict(lstm_input, verbose=0)
            raw_array = np.asarray(raw_output).reshape(-1)
            if raw_array.size == 0:
                raise ValueError('LSTM prediction returned an empty output.')
            if raw_array.size == 1:
                dropout_probability = float(raw_array[0])
                probability_map = {
                    '0': round(float(1 - dropout_probability), 6),
                    '1': round(float(dropout_probability), 6),
                }
            else:
                dropout_probability = float(raw_array[-1])
                probability_map = {
                    str(index): round(float(probability), 6)
                    for index, probability in enumerate(raw_array.tolist())
                }
            predicted_label = 1 if dropout_probability >= 0.5 else 0
        else:
            predicted_label = model.predict(model_input)[0]

            if hasattr(model, 'predict_proba'):
                prediction_probabilities = model.predict_proba(model_input)[0]
                classes = list(getattr(model, 'classes_', []))
                probability_map = {
                    str(label): round(float(probability), 6)
                    for label, probability in zip(classes, prediction_probabilities)
                }
                dropout_probability = infer_dropout_probability(model, prediction_probabilities)

            if dropout_probability is None:
                normalized_prediction = str(predicted_label).strip().lower()
                dropout_probability = 1.0 if normalized_prediction in {'1', 'dropout', 'yes', 'true'} else 0.0

        model_risk_score = int(round(max(0.0, min(float(dropout_probability), 1.0)) * 100))
        hardcoded_risk_score = calculate_hardcoded_risk_score(feature_row)
        predicted_risk_score = hardcoded_risk_score
        predicted_risk_level = calculate_risk_level(predicted_risk_score)
    except Exception as error:
        return jsonify({
            'error': f"Failed to run model inference: {error}",
        }), 500

    updated_student = None
    if persist_prediction and student is not None:
        student['risk_score'] = predicted_risk_score
        student['risk_level'] = predicted_risk_level
        student['explanation'] = (
            f"Risk updated from {model_name.upper()} model prediction."
        )
        enrich_student_defaults(student)
        save_students(students)
        updated_student = serialize_student(student)

    return jsonify({
        'model': model_name,
        'student_id': student.get('id') if student else None,
        'predicted_label': str(predicted_label),
        'dropout_probability': round(float(dropout_probability), 6),
        'model_risk_score': model_risk_score,
        'hardcoded_risk_score': hardcoded_risk_score,
        'predicted_risk_score': predicted_risk_score,
        'predicted_risk_level': predicted_risk_level,
        'class_probabilities': probability_map,
        'features_used': input_row,
        'persisted': persist_prediction and student is not None,
        'updated_student': updated_student,
    })


@app.route('/chatbot', methods=['POST'])
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    payload = request.get_json(silent=True) or {}
    return jsonify(chatbot_response(payload.get('message', '')))


@app.route('/support-chat', methods=['POST'])
@app.route('/api/support-chat', methods=['POST'])
def support_chat():
    payload = parse_json_request()
    message = (payload.get('message') or '').strip()
    history = payload.get('history') or []

    if not message:
        return jsonify({'error': 'Message is required.'}), 400

    try:
        result = generate_support_response(message, history)
        return jsonify(result)
    except Exception as error:
        return jsonify({
            'reply': (
                "I’m still here with you, but I’m having trouble connecting right now. If things feel urgent, "
                "please reach out to a trusted person, counselor, or local support service while this reconnects."
            ),
            'error': str(error),
            'distress_detected': False,
            'mood_tags': [],
        }), 503


@app.route('/support-report/generate', methods=['POST'])
@app.route('/api/support-report/generate', methods=['POST'])
def generate_support_report_endpoint():
    payload = parse_json_request()
    consent_to_summarize = bool(payload.get('consent_to_summarize'))
    conversation = payload.get('conversation') or []
    student_id = payload.get('student_id')

    if not consent_to_summarize:
        return jsonify({'error': 'Student consent is required before generating a support report.'}), 400
    if len(conversation) < 2:
        return jsonify({'error': 'Please continue the conversation a little more before generating a report.'}), 400

    student_profile = None
    if student_id not in (None, ''):
        student = get_student_by_id(student_id)
        if not student:
            return jsonify({'error': 'Student not found for the provided ID.'}), 404
        student_profile = serialize_student(student)

    try:
        report = generate_support_report(conversation, student_profile)
        return jsonify({
            'report': report,
            'student': student_profile,
        })
    except Exception as error:
        return jsonify({'error': f'Failed to generate support report: {error}'}), 503


@app.route('/support-report/confirm', methods=['POST'])
@app.route('/api/support-report/confirm', methods=['POST'])
def confirm_support_report():
    global support_reports
    payload = parse_json_request()
    report = payload.get('report') or {}
    student_id = payload.get('student_id')
    student_name = (payload.get('student_name') or '').strip()
    conversation = payload.get('conversation') or []
    confirmation_status = (payload.get('confirmation_status') or 'confirmed').strip().lower()
    student_note = (payload.get('student_note') or '').strip()

    if not report:
        return jsonify({'error': 'Report data is required.'}), 400
    if confirmation_status not in {'confirmed', 'needs_changes'}:
        return jsonify({'error': 'Invalid confirmation status.'}), 400

    student = get_student_by_id(student_id) if student_id not in (None, '') else None
    report_record = build_support_session_record(
        report=report,
        conversation=conversation,
        student=student,
        student_id=student_id,
        student_name=student_name,
        feedback={
            'satisfaction': 'legacy_manual_save',
            'needs_human_consultant': confirmation_status == 'needs_changes',
            'note': student_note,
        },
    )
    report_record['student_confirmation'] = {
        'status': confirmation_status,
        'note': student_note,
    }

    support_reports.append(report_record)
    save_support_reports(support_reports)
    return jsonify({
        'message': 'Support report saved successfully.',
        'report_record': report_record,
    })


@app.route('/support-reports', methods=['GET'])
@app.route('/api/support-reports', methods=['GET'])
def get_support_reports():
    student_id = request.args.get('student_id')
    if student_id:
        filtered_reports = [report for report in support_reports if str(report.get('student_id')) == str(student_id)]
        return jsonify(filtered_reports)
    return jsonify(support_reports)


@app.route('/support-reports/<int:report_id>/feedback', methods=['POST'])
@app.route('/api/support-reports/<int:report_id>/feedback', methods=['POST'])
def update_support_report_feedback(report_id):
    global support_reports
    payload = parse_json_request()
    feedback = payload.get('feedback') or {}

    report_record = next((report for report in support_reports if int(report.get('id', 0)) == report_id), None)
    if not report_record:
        return jsonify({'error': 'Support report not found.'}), 404

    report_record['feedback'] = {
        'satisfaction': (feedback.get('satisfaction') or 'not_provided').strip(),
        'needs_human_consultant': bool(feedback.get('needs_human_consultant')),
        'note': (feedback.get('note') or '').strip(),
    }
    report_record['feedback_updated_at'] = datetime.utcnow().isoformat() + 'Z'
    save_support_reports(support_reports)
    return jsonify({
        'message': 'Session feedback saved successfully.',
        'report_record': report_record,
    })


@app.route('/support-session/finalize', methods=['POST'])
@app.route('/api/support-session/finalize', methods=['POST'])
def finalize_support_session():
    global support_reports
    payload = parse_json_request()
    conversation = payload.get('conversation') or []
    student_id = payload.get('student_id')
    student_name = (payload.get('student_name') or '').strip()
    session_end_reason = (payload.get('session_end_reason') or 'ended').strip()
    if len(conversation) < 2:
        return jsonify({'message': 'Session ended without enough conversation to summarize.', 'shared': False}), 200

    student = get_student_by_id(student_id) if student_id not in (None, '') else None
    serialized_student = serialize_student(student) if student else None

    try:
        report = generate_support_report(conversation, serialized_student)
    except Exception as error:
        return jsonify({'error': f'Failed to generate end-of-session report: {error}'}), 503

    report_record = build_support_session_record(
        report=report,
        conversation=conversation,
        student=student,
        student_id=student_id,
        student_name=student_name,
        session_end_reason=session_end_reason,
    )
    support_reports.append(report_record)
    save_support_reports(support_reports)

    return jsonify({
        'message': 'Support session report generated and shared with faculty.',
        'shared': True,
        'report_record': report_record,
    })


@app.route('/students/export-csv', methods=['GET'])
@app.route('/api/students/export-csv', methods=['GET'])
def export_students_csv():
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            'id', 'name', 'class', 'section', 'attendance', 'marks', 'risk_score', 'risk_level',
            'explanation', 'gender', 'location', 'internet', 'internet_access', 'parental_educ',
            'parent_education', 'percentage_score', 'result_status', 'average_marks', 'grade_letter',
            'grade_point', 'grade_description', 'subject_marks', 'nlp_sentiment',
            'engagement_weekly', 'average_engagement_weekly', 'attendance_trend'
        ]
    )
    writer.writeheader()
    writer.writerows(students)
    csv_data = output.getvalue()
    output.close()
    return Response(
        csv_data,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=students.csv'}
    )


@app.route('/students/import-csv', methods=['POST'])
@app.route('/api/students/import-csv', methods=['POST'])
def import_students_csv():
    global students
    file = request.files.get('file')
    mode = 'replace'

    if not file or not file.filename:
        return jsonify({'error': 'Please choose a CSV file to import.'}), 400
    if not file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'Only CSV files are supported.'}), 400

    try:
        decoded = file.stream.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(decoded))
        validation_error = validate_csv_columns(reader.fieldnames)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        parsed_rows = [row for row in reader if any((value or '').strip() for value in row.values())]
        if not parsed_rows:
            return jsonify({'error': 'CSV file does not contain any student rows.'}), 400

        starting_id = 1
        if is_subject_attendance_csv(reader.fieldnames):
            imported_students = [
                normalize_subject_attendance_student(row, starting_id + index, reader.fieldnames)
                for index, row in enumerate(parsed_rows)
            ]
        else:
            imported_students = [
                normalize_student(row, starting_id + index)
                for index, row in enumerate(parsed_rows)
            ]
    except ValueError as error:
        return jsonify({'error': f'Invalid numeric value in CSV: {error}'}), 400
    except Exception as error:
        return jsonify({'error': f'Failed to import CSV: {error}'}), 400

    students = imported_students
    save_students(students)
    return jsonify({
        'message': f'Successfully imported {len(imported_students)} students and replaced the previous dataset.',
        'imported_count': len(imported_students),
        'total_students': len(students),
        'mode': mode,
    })


@app.route('/', defaults={'path': ''}, methods=['GET'])
@app.route('/<path:path>', methods=['GET'])
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404

    asset_path = os.path.join(FRONTEND_DIST_DIR, path)
    if path and os.path.exists(asset_path) and os.path.isfile(asset_path):
        return send_from_directory(FRONTEND_DIST_DIR, path)

    index_path = os.path.join(FRONTEND_DIST_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_DIST_DIR, 'index.html')

    return jsonify({
        'message': 'Student Dropout API running!',
        'frontend_built': False,
        'next_step': 'Run `npm run build` inside the `frontend` folder to serve the frontend from Flask.',
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
