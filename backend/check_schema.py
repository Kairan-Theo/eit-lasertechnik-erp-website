
import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("Schema of crm_quotation:")
cursor.execute("PRAGMA table_info(crm_quotation)")
columns = cursor.fetchall()
for col in columns:
    print(col)

conn.close()
