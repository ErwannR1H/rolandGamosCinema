# 🎬 Roland Gamos Cinema - Jeu des Acteurs

Une application web interactive qui utilise les technologies du **Web Sémantique** (Wikidata + SPARQL) pour un jeu de culture cinématographique.

## 📖 Description

**Roland Gamos Cinema** est un jeu multijoueur où les participants doivent nommer des acteurs ayant joué ensemble dans un film. L'application interroge en temps réel la base de données Wikidata pour vérifier les liens entre acteurs via des requêtes SPARQL.

## 🎮 Règles du Jeu

1. **Le Joueur 1** commence en donnant le nom d'un acteur de cinéma
2. **Le Joueur 2** doit nommer un acteur ayant joué dans un **film commun** avec l'acteur précédent
3. Les joueurs **alternent** les tours
4. Un acteur ne peut être mentionné **qu'une seule fois** par partie
5. **Vous perdez si** :
   - Vous nommez un acteur sans film commun avec le précédent
   - Vous répétez un acteur déjà mentionné
   - Vous abandonnez

## 🛠️ Technologies Utilisées

| Technologie | Utilisation |
|-------------|-------------|
| **React 19** | Framework frontend |
| **Vite** | Build tool & serveur de développement |
| **React Router** | Navigation SPA |
| **Wikidata SPARQL** | Base de données du Web Sémantique |
| **Ollama (LLaMA 3)** | IA pour corriger les noms d'acteurs mal orthographiés |

## 🏗️ Architecture du Projet

```
src/
├── App.jsx                 # Application principale avec routing
├── main.jsx                # Point d'entrée React
├── components/             # Composants UI
│   ├── ActorInput.jsx      # Champ de saisie des acteurs
│   ├── ActorsHistory.jsx   # Historique des acteurs mentionnés
│   ├── GameStatus.jsx      # Affichage des scores
│   ├── LastActor.jsx       # Dernier acteur mentionné
│   ├── Loading.jsx         # Indicateur de chargement
│   ├── MessageContainer.jsx # Messages d'état du jeu
│   └── RulesModal.jsx      # Modal des règles
└── services/               # Services backend
    ├── sparqlService.js    # Orchestrateur principal
    ├── wikidataService.js  # Requêtes SPARQL vers Wikidata
    ├── dbPediaService.js   # Service DBpedia (futur)
    └── ollamaService.js    # Correction de noms par IA
```

## 🔍 Fonctionnement SPARQL

L'application utilise des requêtes SPARQL pour :

- **Rechercher des acteurs** : Vérifie que la personne est bien un acteur (propriété `P106`)
- **Trouver des films communs** : Recherche les films (`Q11424`) ou séries TV (`Q5398426`) où les deux acteurs apparaissent dans le casting (`P161`)
- **Récupérer les images** : Obtient les photos des acteurs (`P18`) depuis Wikidata

### Exemple de requête SPARQL

```sparql
SELECT DISTINCT ?movie ?movieLabel WHERE {
    ?movie wdt:P161 wd:Q40504 .   # Brad Pitt
    ?movie wdt:P161 wd:Q174679 .  # George Clooney
    ?movie wdt:P31/wdt:P279* wd:Q11424 .  # C'est un film
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
```

## 🚀 Installation & Lancement

### Prérequis

- Node.js (v18+)
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd rolandGamosCinema

# Installer les dépendances
npm install
```

### Lancement en mode développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de production

```bash
npm run build
npm run preview
```

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/game` | Jeu des acteurs |

## 🔮 Améliorations Futures

- [ ] Mode solo avec timer
- [ ] Tableau des scores / leaderboard
- [ ] Visualisation du graphe des connexions acteurs-films
- [ ] Intégration DBpedia en fallback
- [ ] Page d'analyse de données

## 👥 Auteurs

Projet réalisé dans le cadre du cours **Web Sémantique** - IF4

## 📄 Licence

Projet académique - INSA Lyon

---

*Propulsé par Wikidata & SPARQL* 🌐
