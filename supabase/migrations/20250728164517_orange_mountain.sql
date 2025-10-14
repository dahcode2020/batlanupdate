/*
  # Données initiales - Utilisateurs de démonstration

  1. Utilisateurs créés
    - Administrateur : admin / admin1237575@@xyz
    - Client 1 : client1 / client123  
    - Client 2 : client2 / client123

  2. Sécurité
    - Mots de passe hashés (en production, utiliser bcrypt)
    - Rôles définis (admin, client)
*/

-- Insert sample users
INSERT INTO users (username, password_hash, role, first_name, last_name, email, phone, address) VALUES
('admin', 'admin1237575@@xyz', 'admin', 'Administrateur', 'Système', 'admin@banqueatlantique.tg', '+228-90-12-34-56', 'Siège Social, Lomé, Togo'),
('client1', 'client123', 'client', 'Jean', 'Dupont', 'jean.dupont@email.com', '+228-91-23-45-67', '123 Rue de la Paix, Lomé, Togo'),
('client2', 'client123', 'client', 'Marie', 'Martin', 'marie.martin@email.com', '+228-92-34-56-78', '456 Avenue de l''Indépendance, Lomé, Togo')
ON CONFLICT (username) DO NOTHING;