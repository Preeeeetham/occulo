import os
import psycopg2
from dotenv import load_dotenv

# Load backend .env to get the Supabase DATABASE_URL
load_dotenv('D:/occulo/backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

schema_path = 'd:/Projects/O Connect/supabase/schema.sql'
with open(schema_path, 'r') as f:
    sql = f.read()

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print("Schema applied successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error applying schema: {e}")
