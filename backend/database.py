import sqlite3

DB_NAME = "users.db"


def get_connection():
    conn = sqlite3.connect(
        DB_NAME,
        check_same_thread=False,
        timeout=15,
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def create_tables():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            language TEXT DEFAULT 'en',
            strictness TEXT DEFAULT 'moderate',
            conditions TEXT DEFAULT '[]',
            preferences TEXT DEFAULT '[]',
            allergies TEXT DEFAULT '[]',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_key TEXT NOT NULL,
            mode TEXT DEFAULT 'barcode',
            product_name TEXT DEFAULT '',
            barcode TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            nutri_grade TEXT DEFAULT '',
            ingredients TEXT DEFAULT '[]',
            allergens TEXT DEFAULT '[]',
            additives TEXT DEFAULT '[]',
            warnings TEXT DEFAULT '[]',
            recommendations TEXT DEFAULT '[]',
            raw_text TEXT DEFAULT '',
            scan_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_key),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        conn.commit()
    finally:
        if conn:
            conn.close()