# Jeu des Acteurs - Projet Web Sémantique

## Description

Jeu multijoueur où deux joueurs doivent successivement donner le nom d'un acteur de film ayant joué dans un film commun avec l'acteur mentionné précédemment. Le jeu utilise DBpedia pour valider les réponses via des requêtes SPARQL.

## Règles du jeu

1. Le Joueur 1 commence en donnant le nom d'un acteur de cinéma
2. Le Joueur 2 doit donner le nom d'un acteur ayant joué dans un film commun avec l'acteur précédent
3. Les joueurs alternent les tours
4. Un acteur ne peut être mentionné qu'une seule fois par partie
5. Si un joueur répète un acteur ou ne trouve pas de réponse valide, il perd
6. Un joueur peut abandonner s'il n'a plus d'idée

## Technologies utilisées

- **HTML5/CSS3** : Interface utilisateur
- **JavaScript** (Vanilla) : Logique du jeu
- **SPARQL** : Requêtes vers DBpedia
- **DBpedia** : Base de données de connaissances liées

## Structure du projet

```
PROJET/
├── index.html          # Page principale du jeu
├── css/
│   └── style.css       # Styles de l'interface
├── js/
│   ├── game.js         # Logique du jeu
│   └── sparql.js       # Gestion des requêtes SPARQL
└── README.md           # Documentation
```

## Installation

1. Cloner ou télécharger ce projet
2. Ouvrir `index.html` dans un navigateur web moderne
3. Aucune installation de serveur n'est nécessaire

⚠️ **Note** : Le jeu nécessite une connexion Internet pour accéder à DBpedia.

## Utilisation

1. Cliquer sur "Nouvelle Partie" pour commencer
2. Le Joueur 1 entre le nom d'un acteur (ex: "Brad Pitt")
3. Le Joueur 2 entre un acteur ayant joué dans un film avec l'acteur précédent
4. Continuer jusqu'à ce qu'un joueur perde ou abandonne

## Fonctionnalités

### Actuelles

- ✅ Recherche d'acteurs sur DBpedia
- ✅ Vérification des films communs
- ✅ Historique des acteurs mentionnés
- ✅ Système de score
- ✅ Détection des acteurs déjà mentionnés
- ✅ Interface responsive

### Améliorations possibles

- 🔄 Suggestions d'acteurs (autocomplétion)
- 🔄 Mode solo contre l'ordinateur
- 🔄 Statistiques détaillées
- 🔄 Affichage des affiches de films
- 🔄 Timer pour limiter le temps de réflexion
- 🔄 Support multilingue
- 🔄 Historique des parties

## Requêtes SPARQL utilisées

### 1. Recherche d'un acteur

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?actor ?label WHERE {
    ?actor a dbo:Actor ;
           rdfs:label ?label .
    FILTER(LANG(?label) = "en" || LANG(?label) = "fr")
    FILTER(REGEX(?label, "NomActeur", "i"))
}
LIMIT 5
```

### 2. Vérification de film commun

```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?movie ?movieLabel WHERE {
    { <Acteur1> dbo:starring ?movie . }
    UNION { ?movie dbo:starring <Acteur1> . }
    
    { <Acteur2> dbo:starring ?movie . }
    UNION { ?movie dbo:starring <Acteur2> . }
    
    ?movie a dbo:Film ;
           rdfs:label ?movieLabel .
    FILTER(LANG(?movieLabel) = "en" || LANG(?movieLabel) = "fr")
}
LIMIT 10
```

## Limitations connues

- Les données DBpedia peuvent être incomplètes pour certains acteurs
- Les temps de réponse dépendent de la disponibilité de DBpedia
- Certains noms d'acteurs peuvent avoir plusieurs variantes
- Le jeu fonctionne principalement avec des acteurs anglophones et francophones

## Auteurs

Projet réalisé dans le cadre du cours de Web Sémantique - INSA 4IF

## Licence

Projet académique - 2026
