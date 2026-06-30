import streamlit as st
import pandas as pd
import json
import sqlite3
import os
import time
from datetime import datetime
import urllib.parse

# ==========================================
# 1. CONFIGURATION & STYLES
# ==========================================

DB_FILE = "classe_pro.db"

# Couleurs / Colors
COLOR_COBALT = "#0047AB"
COLOR_OCHRE = "#CC7722"
COLOR_BG = "#F0F2F6"
COLOR_RED = "#D32F2F"

st.set_page_config(page_title="Classe Interactive Pro V6", layout="wide", page_icon="🎓")

st.markdown(f"""
    <style>
    .stApp {{ background-color: {COLOR_BG}; }}
    h1, h2, h3 {{ color: {COLOR_COBALT}; }}
    
    /* Boutons standards */
    .stButton > button {{
        width: 100%;
        min-height: 50px;
        font-size: 18px !important;
        font-weight: 600;
        border-radius: 8px;
        border: 2px solid {COLOR_COBALT};
        background-color: white;
        color: {COLOR_COBALT};
        margin-bottom: 8px;
    }}
    .stButton > button:hover {{
        background-color: {COLOR_OCHRE};
        color: white;
        border-color: {COLOR_OCHRE};
    }}
    
    /* Bouton Reset (Rouge) */
    .reset-btn > button {{
        border-color: {COLOR_RED} !important;
        color: {COLOR_RED} !important;
    }}
    .reset-btn > button:hover {{
        background-color: {COLOR_RED} !important;
        color: white !important;
    }}
    
    /* Radio Button (Mode Unique) plus visible */
    .stRadio > div {{
        background-color: white;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #ddd;
    }}
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 2. GESTION DES DONNÉES (SQLite / PostgreSQL)
# ==========================================

DATABASE_URL = os.environ.get("DATABASE_URL", "")

def get_conn():
    if DATABASE_URL:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL)
        _init_pg(conn)
        return conn, "pg"
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    _init_sqlite(conn)
    return conn, "sqlite"

def _init_sqlite(conn):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            active INTEGER DEFAULT 0,
            class_name TEXT DEFAULT '',
            mode TEXT DEFAULT 'unique',
            question TEXT DEFAULT '',
            options TEXT DEFAULT '[]',
            timestamp TEXT DEFAULT ''
        );
        INSERT OR IGNORE INTO config (id) VALUES (1);

        CREATE TABLE IF NOT EXISTS classes (
            class_name TEXT PRIMARY KEY,
            phones TEXT DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS responses (
            phone TEXT PRIMARY KEY,
            name TEXT DEFAULT '',
            answer TEXT DEFAULT '',
            score REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            class_name TEXT,
            phone TEXT,
            name TEXT DEFAULT '',
            question TEXT,
            answer TEXT,
            score REAL DEFAULT 0
        );
    """)
    conn.commit()

def _init_pg(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS config (
            id INTEGER PRIMARY KEY,
            active BOOLEAN DEFAULT false,
            class_name TEXT DEFAULT '',
            mode TEXT DEFAULT 'unique',
            question TEXT DEFAULT '',
            options JSONB DEFAULT '[]',
            timestamp TEXT DEFAULT ''
        );
    """)
    cur.execute("INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            class_name TEXT PRIMARY KEY,
            phones JSONB DEFAULT '[]'
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            phone TEXT PRIMARY KEY,
            name TEXT DEFAULT '',
            answer JSONB DEFAULT '',
            score REAL DEFAULT 0
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id SERIAL PRIMARY KEY,
            date TEXT,
            class_name TEXT,
            phone TEXT,
            name TEXT DEFAULT '',
            question TEXT,
            answer TEXT,
            score REAL DEFAULT 0
        );
    """)
    conn.commit()
    cur.close()

def _exec(conn, db_type, sql, params=None):
    if db_type == "pg":
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(sql.replace("?", "%s"), params or ())
    else:
        cur = conn.cursor()
        cur.execute(sql, params or ())
    return cur

def load_data():
    conn, db_type = get_conn()
    c = _exec(conn, db_type, "SELECT * FROM config WHERE id = 1")
    row = c.fetchone()
    if db_type == "pg":
        config = {
            "active": bool(row["active"]),
            "class_name": row["class_name"],
            "mode": row["mode"],
            "question": row["question"],
            "options": row["options"] if isinstance(row["options"], list) else json.loads(row["options"]),
            "timestamp": row["timestamp"]
        }
    else:
        config = {
            "active": bool(row["active"]),
            "class_name": row["class_name"],
            "mode": row["mode"],
            "question": row["question"],
            "options": json.loads(row["options"]),
            "timestamp": row["timestamp"]
        }
    c.close()

    c = _exec(conn, db_type, "SELECT * FROM classes")
    classes = {}
    for r in c.fetchall():
        p = r["phones"] if isinstance(r["phones"], list) else json.loads(r["phones"])
        classes[r["class_name"]] = p
    c.close()

    c = _exec(conn, db_type, "SELECT * FROM responses")
    responses = {}
    for r in c.fetchall():
        ans = r["answer"] if isinstance(r["answer"], (list, dict)) else json.loads(r["answer"])
        responses[r["phone"]] = {
            "name": r["name"],
            "answer": ans,
            "score": r["score"]
        }
    c.close()

    c = _exec(conn, db_type, "SELECT * FROM history ORDER BY id")
    history = []
    for r in c.fetchall():
        history.append({
            "Date": r["date"],
            "Classe": r["class_name"],
            "ID_Tel": r["phone"],
            "Nom": r["name"],
            "Question": r["question"],
            "Réponse": r["answer"],
            "Score": r["score"]
        })
    c.close()

    if db_type == "pg":
        conn.commit()
    conn.close()
    return {"config": config, "classes": classes, "responses": responses, "history": history}

def save_data(data):
    conn, db_type = get_conn()

    _exec(conn, db_type, """
        UPDATE config SET active=?, class_name=?, mode=?, question=?, options=?, timestamp=?
        WHERE id = 1
    """, (
        True if db_type == "pg" else int(data["config"]["active"]),
        data["config"]["class_name"],
        data["config"]["mode"],
        data["config"]["question"],
        json.dumps(data["config"]["options"], ensure_ascii=False) if db_type != "pg" else data["config"]["options"],
        data["config"]["timestamp"]
    ))

    _exec(conn, db_type, "DELETE FROM classes")
    for cls_name, phones in data["classes"].items():
        val = json.dumps(phones, ensure_ascii=False) if db_type != "pg" else phones
        _exec(conn, db_type, "INSERT INTO classes (class_name, phones) VALUES (?, ?)", (cls_name, val))

    _exec(conn, db_type, "DELETE FROM responses")
    for phone, info in data["responses"].items():
        val = json.dumps(info["answer"], ensure_ascii=False) if db_type != "pg" else info["answer"]
        _exec(conn, db_type, "INSERT INTO responses (phone, name, answer, score) VALUES (?, ?, ?, ?)",
               (phone, info["name"], val, info["score"]))

    _exec(conn, db_type, "DELETE FROM history")
    for entry in data["history"]:
        _exec(conn, db_type, """
            INSERT INTO history (date, class_name, phone, name, question, answer, score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            entry["Date"], entry["Classe"], entry["ID_Tel"],
            entry["Nom"], entry["Question"], entry["Réponse"], entry["Score"]
        ))

    conn.commit()
    conn.close()

def archive_current_session(data):
    if not data["responses"]:
        return data

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    q_txt = data["config"]["question"]
    cls_name = data["config"]["class_name"]

    for phone, res in data["responses"].items():
        ans = res["answer"]
        if isinstance(ans, list):
            ans = ", ".join(ans)

        entry = {
            "Date": timestamp,
            "Classe": cls_name,
            "ID_Tel": phone,
            "Nom": res.get("name", ""),
            "Question": q_txt,
            "Réponse": ans,
            "Score": res.get("score", 0)
        }
        data["history"].append(entry)

    return data

# ==========================================
# 3. LOGIQUE SCORE
# ==========================================

def calculate_score(selected_list, options_config, mode):
    # Récupérer les textes des bonnes réponses
    corrects = [o['text'] for o in options_config if o.get('is_correct', False)]
    
    if not corrects: return 0.0

    # MODE UNIQUE : Tout ou rien
    if mode == "unique":
        # selected_list est une string ici, ou une liste d'un élément
        user_ans = selected_list[0] if isinstance(selected_list, list) else selected_list
        return 100.0 if user_ans in corrects else 0.0

    # MODE MULTIPLE : Proportionnel
    else:
        sel_set = set(selected_list)
        corr_set = set(corrects)

        nb_good = len(sel_set.intersection(corr_set))
        nb_bad = len(sel_set.difference(corr_set))
        total_corr = len(corr_set)

        if total_corr == 0: return 100.0

        raw = (nb_good - nb_bad) / total_corr
        score = max(0.0, min(1.0, raw)) * 100
        return round(score, 1)

# ==========================================
# 4. INTERFACE PROFESSEUR
# ==========================================

def teacher_interface(lang, trans):
    t = trans[lang]
    st.header(f"👨‍🏫 {t['dashboard']}")
    
    data = load_data()
    
    tab_activity, tab_students, tab_results = st.tabs([t['tab_act'], t['tab_std'], t['tab_res']])

    # --- TAB 1 : ACTIVITÉ ---
    with tab_activity:
        col_cls, col_mode = st.columns(2)
        class_list = list(data["classes"].keys()) if data["classes"] else ["Default"]
        selected_class = col_cls.selectbox(t['select_class'], class_list)
        
        # Choix du mode
        mode_val = col_mode.radio(t['mode'], ["unique", "multiple"], format_func=lambda x: t['mode_unique'] if x == "unique" else t['mode_multiple'])
        
        question = st.text_input(t['q_label'], value=data["config"]["question"])
        
        # Options Dynamiques
        st.write(t['config_options'])
        if "temp_opts" not in st.session_state:
            st.session_state.temp_opts = [{"txt": "", "ok": False} for _ in range(4)]
            
        nb = st.slider(t['nb_options'], 2, 6, len(st.session_state.temp_opts))
        
        # Resize liste options
        curr_len = len(st.session_state.temp_opts)
        if curr_len < nb:
            for _ in range(nb - curr_len): st.session_state.temp_opts.append({"txt":"", "ok":False})
        elif curr_len > nb:
            st.session_state.temp_opts = st.session_state.temp_opts[:nb]

        # Saisie des options
        current_options_text = []
        c_opt = st.columns(2)
        
        for i in range(nb):
            with c_opt[i%2]:
                # Juste le texte ici
                txt = st.text_input(f"Option {i+1}", value=st.session_state.temp_opts[i]["txt"], key=f"o_{i}")
                st.session_state.temp_opts[i]["txt"] = txt # Mise à jour state
                if txt: current_options_text.append(txt)

        # Définition de la bonne réponse
        final_opts = []
        if current_options_text:
            st.info(f"👇 {t['define_correct']}")
            if mode_val == "unique":
                # Selectbox pour choisir L'UNIQUE bonne réponse
                correct_txt = st.selectbox(t['select_correct_one'], current_options_text)
                for txt in current_options_text:
                    final_opts.append({"text": txt, "is_correct": (txt == correct_txt)})
            else:
                # Multiselect pour choisir LES bonnes réponses
                correct_list = st.multiselect(t['select_correct_multi'], current_options_text)
                for txt in current_options_text:
                    final_opts.append({"text": txt, "is_correct": (txt in correct_list)})
        
        st.divider()
        c1, c2, c3 = st.columns([1, 1, 1])
        
        # BOUTONS ACTIONS
        if c1.button(f"▶ {t['start']}", type="primary", use_container_width=True):
            if len(final_opts) < 2:
                st.error(t['error_options'])
            else:
                if data["config"]["active"]: data = archive_current_session(data)
                
                data["config"].update({
                    "active": True,
                    "class_name": selected_class,
                    "mode": mode_val,
                    "question": question,
                    "options": final_opts,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
                data["responses"] = {} 
                save_data(data)
                st.rerun()

        if c2.button(f"⏹ {t['stop']}", use_container_width=True):
            data["config"]["active"] = False
            data = archive_current_session(data)
            data["responses"] = {} 
            save_data(data)
            st.rerun()

        with c3:
            st.markdown('<div class="reset-btn">', unsafe_allow_html=True)
            if st.button(f"♻️ {t['reset']}", use_container_width=True):
                data = archive_current_session(data)
                data["config"]["active"] = False
                data["config"]["question"] = ""
                data["config"]["options"] = []
                data["responses"] = {}
                save_data(data)
                st.session_state.temp_opts = [{"txt": "", "ok": False} for _ in range(4)]
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

    # --- TAB 2 : GESTION ÉLÈVES ---
    with tab_students:
        st.subheader(t['import_title'])
        st.info(t['excel_info'])
        
        new_class_name = st.text_input(t['new_class_label'])
        uploaded_file = st.file_uploader(t['excel_label'], type=['xlsx'])
        
        if st.button(t['save_list']):
            if new_class_name and uploaded_file:
                try:
                    df = pd.read_excel(uploaded_file, header=None, engine='openpyxl')
                    raw_phones = df.iloc[:, 0].astype(str).tolist()
                    clean_phones = []
                    for p in raw_phones:
                        p = p.strip().replace(".0", "")
                        if p.lower() != "nan" and p != "" and len(p) > 3:
                            clean_phones.append(p)
                    
                    if clean_phones:
                        data["classes"][new_class_name] = clean_phones
                        save_data(data)
                        st.success(f"✅ {len(clean_phones)} {t['students_added']}")
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.error("Format invalide.")
                except Exception as e:
                    st.error(f"Erreur : {e}")
            else:
                st.warning(t['missing_info'])

    # --- TAB 3 : RÉSULTATS ---
    with tab_results:
        st.subheader(t['live_res'])
        if st.button(t['refresh']): st.rerun()
        
        if data["config"]["active"]:
            active_cls = data["config"]["class_name"]
            st.caption(f"{t['class']} : {active_cls} | {t['q_label']} : {data['config']['question']}")
            
            all_students = data["classes"].get(active_cls, [])
            res_list = []
            
            for phone in all_students:
                r_obj = data["responses"].get(phone, {})
                has_voted = phone in data["responses"]
                
                ans_raw = r_obj.get("answer", "-")
                if isinstance(ans_raw, list): ans_raw = ", ".join(ans_raw)
                
                res_list.append({
                    "ID": phone,
                    "Nom": r_obj.get("name", "-"),
                    "Etat": "✅" if has_voted else "⏳",
                    "Reponse": ans_raw,
                    "Score": f"{r_obj.get('score', 0)}%" if has_voted else "-"
                })
                
            df = pd.DataFrame(res_list)
            st.dataframe(df, use_container_width=True)

# ==========================================
# 5. INTERFACE ÉLÈVE
# ==========================================

def student_interface(lang, trans):
    t = trans[lang]
    data = load_data()
    
    # LOGIN
    if "user_phone" not in st.session_state:
        st.subheader(t['login_title'])
        active_class = data["config"].get("class_name", "")
        
        if not active_class or active_class not in data["classes"]:
            st.warning(t['no_active_class'])
            if st.button(t['refresh']): st.rerun()
            return
            
        st.info(f"{t['class']} : {active_class}")
        phones = data["classes"][active_class]
        my_phone = st.selectbox(t['select_phone'], [""] + phones)
        my_name = st.text_input(t['input_name_opt'])
        
        if st.button(t['enter_btn']):
            if my_phone:
                st.session_state.user_phone = my_phone
                st.session_state.user_name = my_name
                st.rerun()
        return

    # DASHBOARD ÉLÈVE
    phone = st.session_state.user_phone
    name = st.session_state.user_name
    display_name = name if name else phone

    c1, c2 = st.columns([3, 1])
    c1.success(f"👤 {display_name}")
    if c2.button(t['logout']):
        del st.session_state.user_phone
        st.rerun()

    # HISTORIQUE ÉLÈVE
    with st.expander(f"📜 {t['my_history']}"):
        my_hist = [h for h in data["history"] if str(h.get("ID_Tel")) == str(phone)]
        if my_hist:
            df_hist = pd.DataFrame(my_hist)
            cols = ["Date", "Question", "Réponse", "Score"]
            # Mapping des colonnes pour affichage propre
            df_display = df_hist[cols].rename(columns={
                "Question": t['q_label'],
                "Réponse": t['answer_col'],
                "Score": "Score (%)"
            })
            st.dataframe(df_display, use_container_width=True, hide_index=True)
        else:
            st.caption("...")

    # ATTENTE
    if not data["config"]["active"]:
        st.info(t['wait_txt'])
        time.sleep(3)
        st.rerun()
        return

    # VOTE
    q_data = data["config"]
    st.markdown(f"<h3 style='text-align:center'>{q_data['question']}</h3>", unsafe_allow_html=True)

    if phone in data["responses"]:
        st.success(t['vote_ok'])
        my_res = data["responses"][phone]
        
        ans_display = my_res['answer']
        if isinstance(ans_display, list): ans_display = ", ".join(ans_display)
        
        st.write(f"👉 {ans_display}")
        st.metric("Score", f"{my_res['score']}%")
        return

    opts = q_data["options"] # [{'text':'A', 'is_correct':True}, ...]
    
    # FORMULAIRE DE RÉPONSE
    with st.form("response_form"):
        user_choice = None
        
        # LOGIQUE 1 : MODE UNIQUE (Radio Button = Rond à cocher)
        if q_data["mode"] == "unique":
            # On extrait juste les textes pour le radio
            opt_texts = [o['text'] for o in opts]
            user_choice = st.radio(t['choose_one'], opt_texts)
            
        # LOGIQUE 2 : MODE MULTIPLE (Checkbox = Carré à cocher)
        elif q_data["mode"] == "multiple":
            st.write(t['choose_multi'])
            user_choice = []
            for o in opts:
                if st.checkbox(o['text']):
                    user_choice.append(o['text'])

        # Bouton Valider commun
        if st.form_submit_button(t['validate_btn'], type="primary", use_container_width=True):
            if not user_choice:
                st.warning("Selection vide.")
            else:
                score = calculate_score(user_choice, opts, q_data["mode"])
                submit_vote(phone, name, user_choice, score)

def submit_vote(phone, name, answer, score):
    data = load_data()
    data["responses"][phone] = {
        "name": name,
        "answer": answer,
        "score": score
    }
    save_data(data)
    st.rerun()

# ==========================================
# 6. TRADUCTIONS (DICTIONNAIRE COMPLET)
# ==========================================

TRANS = {
    "fr": {
        # General
        "role": "Rôle",
        "prof": "Professeur",
        "student": "Élève",
        "password": "Mot de passe",
        "lang": "Langue",
        "share_title": "Partager",
        "url_label": "URL de l'application",
        "wa_btn": "Partager sur WhatsApp",
        
        # Prof Dashboard
        "dashboard": "Tableau de Bord Prof",
        "tab_act": "Activité",
        "tab_std": "Gestion Classes",
        "tab_res": "Résultats",
        "select_class": "Classe Active",
        "mode": "Type de Question",
        "mode_unique": "Choix Unique (1 réponse)",
        "mode_multiple": "Choix Multiple (Plusieurs réponses)",
        "q_label": "Question",
        "config_options": "Configuration des réponses",
        "nb_options": "Nombre d'options",
        "define_correct": "Définir la bonne réponse :",
        "select_correct_one": "Quelle est la bonne réponse ?",
        "select_correct_multi": "Cochez les bonnes réponses :",
        "start": "LANCER",
        "stop": "ARRÊTER",
        "reset": "RÉINIT. TOUT",
        "error_options": "Il faut au moins 2 options.",
        
        # Prof Import
        "import_title": "Ajouter une classe",
        "excel_info": "Format : Fichier Excel (.xlsx). Une seule colonne avec les numéros.",
        "new_class_label": "Nom de la nouvelle classe",
        "excel_label": "Fichier Excel",
        "save_list": "Enregistrer la liste",
        "students_added": "élèves ajoutés.",
        "missing_info": "Nom ou fichier manquant.",
        
        # Prof Results
        "live_res": "Suivi en Direct",
        "refresh": "Actualiser",
        "class": "Classe",
        
        # Student
        "login_title": "Connexion Élève",
        "no_active_class": "Aucune session active.",
        "select_phone": "Votre Numéro",
        "input_name_opt": "Votre Nom (Optionnel)",
        "enter_btn": "Entrer en classe",
        "logout": "Quitter",
        "my_history": "Mon Historique",
        "answer_col": "Ma Réponse",
        "wait_txt": "En attente du professeur...",
        "vote_ok": "Réponse envoyée !",
        "choose_one": "Cochez la bonne réponse :",
        "choose_multi": "Cochez les réponses correctes :",
        "validate_btn": "VALIDER MA RÉPONSE"
    },
    "ar": {
        # General
        "role": "الدور",
        "prof": "أستاذ",
        "student": "تلميذ",
        "password": "كلمة المرور",
        "lang": "اللغة",
        "share_title": "مشاركة",
        "url_label": "رابط التطبيق",
        "wa_btn": "مشاركة عبر واتساب",
        
        # Prof Dashboard
        "dashboard": "لوحة الأساتذة",
        "tab_act": "النشاط",
        "tab_std": "الأقسام",
        "tab_res": "النتائج",
        "select_class": "القسم الحالي",
        "mode": "نوع السؤال",
        "mode_unique": "إجابة واحدة (Unique)",
        "mode_multiple": "إجابات متعددة (Multiple)",
        "q_label": "السؤال",
        "config_options": "إعداد الخيارات",
        "nb_options": "عدد الخيارات",
        "define_correct": "تحديد الإجابة الصحيحة:",
        "select_correct_one": "ما هي الإجابة الصحيحة؟",
        "select_correct_multi": "ضع علامة على الإجابات الصحيحة:",
        "start": "بدء",
        "stop": "إيقاف",
        "reset": "إعادة تعيين",
        "error_options": "يجب وضع خيارين على الأقل.",
        
        # Prof Import
        "import_title": "إضافة قسم",
        "excel_info": "تنسيق: ملف Excel (.xlsx). عمود واحد يحتوي على الأرقام.",
        "new_class_label": "اسم القسم الجديد",
        "excel_label": "ملف Excel",
        "save_list": "حفظ القائمة",
        "students_added": "طلاب تمت إضافتهم.",
        "missing_info": "الاسم أو الملف مفقود.",
        
        # Prof Results
        "live_res": "النتائج المباشرة",
        "refresh": "تحديث",
        "class": "القسم",
        
        # Student
        "login_title": "دخول الطالب",
        "no_active_class": "لا يوجد نشاط.",
        "select_phone": "رقم الهاتف",
        "input_name_opt": "الاسم (اختياري)",
        "enter_btn": "دخول",
        "logout": "خروج",
        "my_history": "سجلي",
        "answer_col": "إجابتي",
        "wait_txt": "في انتظار الأستاذ...",
        "vote_ok": "تم الإرسال!",
        "choose_one": "اختر الإجابة الصحيحة:",
        "choose_multi": "اختر الإجابات الصحيحة:",
        "validate_btn": "تأكيد الإجابة"
    }
}

def main():
    # Sidebar
    st.sidebar.title("Classe Pro V6")
    
    # Select Language
    lang = st.sidebar.selectbox("Langue / اللغة", ["fr", "ar"])
    if lang == "ar":
        st.markdown("<style>body {direction: rtl; text-align: right;}</style>", unsafe_allow_html=True)
        
    t = TRANS[lang]
    
    # Select Role (Translated)
    role_key = st.sidebar.radio(t['role'], ["prof", "student"], format_func=lambda x: t[x])
    
    st.sidebar.divider()
    
    # Share Section (Translated)
    st.sidebar.markdown(f"### 📲 {t['share_title']}")
    url_app = st.sidebar.text_input(t['url_label'], "https://votre-app.com")
    msg = urllib.parse.quote(f"{url_app}")
    st.sidebar.markdown(f"[📢 {t['wa_btn']}](https://wa.me/?text={msg})")

    # Routing
    if role_key == "prof":
        if st.sidebar.text_input(t['password'], type="password") == "admin":
            teacher_interface(lang, TRANS)
    else:
        student_interface(lang, TRANS)

if __name__ == "__main__":
    main()