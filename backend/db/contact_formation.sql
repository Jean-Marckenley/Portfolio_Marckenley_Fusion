-- Exécuter une seule fois sur la base PostgreSQL existante. Aucune suppression de données.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
CREATE TABLE IF NOT EXISTS contact_messages (
 id SERIAL PRIMARY KEY,
 user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sender_name VARCHAR(150) NOT NULL,
 sender_email VARCHAR(255) NOT NULL,
 subject VARCHAR(200) NOT NULL,
 message TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_created ON contact_messages(user_id, created_at DESC);
-- Le profil du compte ADMIN peut être créé dans le tableau de bord si absent.
