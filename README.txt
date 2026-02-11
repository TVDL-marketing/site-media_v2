Prototype Trigano VDL Media Center (statique)

1) Comment ouvrir le prototype
- Ouvrir directement le fichier `index.html` dans un navigateur moderne.
- Le prototype fonctionne en mode local (sans backend).
- Si votre navigateur bloque la lecture JSON locale, une copie embarquée des mêmes données est utilisée automatiquement.

2) Rôles à tester et droits
- Personnel Trigano VDL (`trigano_staff`) : accès complet à toutes marques, catégories, contenus et outils.
- Distributeur / Agent (`dealer_agent`) : accès catalogues, photos HD, vidéos, implantations, documents vendeur, outil fiche prix.
- Presse spécialisée (`press_specialized`) : accès photos HD, vidéos, brochures/catalogues + contenus techniques presse.
- Presse généraliste (`press_general`) : accès photos HD, vidéos, brochures/catalogues, sans contenus techniques spécialisés.

3) Fonctionnalités implémentées
- Login privé en mode démo (email, mot de passe factices, choix de rôle).
- Choix de marque avec tuiles, logos placeholders SVG, accent couleur par marque.
- Dashboard marque avec cartes catégories + compteurs.
- Actions de sélection : télécharger ma sélection (ZIP simulé) / vider ma sélection.
- Sidebar responsive (desktop + mobile drawer), accès rapide “Uniquement 2026” et “Outils”.
- Liste de contenus avec recherche intelligente (titre, description, tags, modèle).
- Filtres dynamiques : millésime, type, modèle, langue, tags cliquables.
- Multi-sélection de contenus (checkbox), compteur de sélection, toasts de feedback.
- Détail contenu : aperçu, métadonnées complètes, téléchargement simulé, ajout sélection.
- Outil prototype “Génération fiche prix 2026” : formulaire, calcul total TTC + poids, aperçu imprimable, bouton print PDF.
- États UX : chargement simulé, aucun résultat, erreur route fictive, accès non autorisé.

4) Données simulées
- 6 marques, accents couleur distincts.
- Modèles associés par marque.
- 120 contenus simulés (multilingues, multi-modèles, avec forte présence 2026).
- Données locales dans :
  - `data/brands.json`
  - `data/models.json`
  - `data/contents.json`
  - `data/users.json`

5) Limites connues
- ZIP réel non fourni dans le repo (aucun binaire) : téléchargement simulé côté interface.
- PDF réel non exporté : génération d’un aperçu HTML imprimable (window.print).
- Authentification 100% démo (pas de serveur ni sécurité réelle).
