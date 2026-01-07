# 🎬 Jeu des Acteurs - Projet DBpedia

Ce repository contient deux versions du Jeu des Acteurs : une version en vanilla JavaScript et une version en React.

## 📁 Structure du projet

```
rolandGamosCinema/
├── index.html          # Version originale (Vanilla JS)
├── css/
│   └── style.css
├── js/
│   ├── game.js
│   └── sparql.js
├── react-app/          # Version React
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🚀 Version Vanilla JavaScript

### Démarrage
Ouvrez simplement `index.html` dans votre navigateur.

### Caractéristiques
- ✅ Aucune dépendance
- ✅ Prêt à l'emploi
- ✅ Manipulation DOM directe
- ✅ Fichiers CSS et JS séparés

## ⚛️ Version React

### Installation
```bash
cd react-app
npm install
```

### Développement
```bash
npm run dev
```
L'application sera disponible sur http://localhost:5173/

### Build Production
```bash
npm run build
```

### Caractéristiques
- ✅ Architecture en composants
- ✅ Gestion d'état avec hooks React
- ✅ Hot Module Replacement
- ✅ Build optimisé avec Vite
- ✅ Code modulaire et maintenable

## 🎮 Règles du jeu

1. Le Joueur 1 commence en donnant le nom d'un acteur de cinéma
2. Le Joueur 2 doit donner le nom d'un acteur ayant joué dans un film commun avec l'acteur précédent
3. Les joueurs alternent les tours
4. Un acteur ne peut être mentionné qu'une seule fois par partie
5. Si un joueur répète un acteur ou ne trouve pas de réponse valide, il perd
6. Les données proviennent de DBpedia

## 🔧 Technologies utilisées

### Version Vanilla
- HTML5
- CSS3
- JavaScript ES6+
- SPARQL (DBpedia)

### Version React
- React 18
- Vite
- JavaScript ES6+
- SPARQL (DBpedia)

## 📚 Documentation

- [README React](./react-app/README.md) - Guide complet de la version React
- [MIGRATION](./react-app/MIGRATION.md) - Guide de migration Vanilla → React
- [COMPONENTS](./react-app/COMPONENTS.md) - Documentation des composants React

## 🌐 API utilisée

L'application utilise l'endpoint SPARQL de DBpedia :
- **Endpoint**: https://dbpedia.org/sparql
- **Format**: JSON
- **Ontologies**: dbo:Person, dbo:Actor, dbo:Film

## 📝 Exemples d'acteurs

Pour tester l'application, essayez :
- Brad Pitt
- Tom Hanks
- Leonardo DiCaprio
- Morgan Freeman
- Scarlett Johansson

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 👨‍💻 Auteur

Projet réalisé dans le cadre du cours de Web Sémantique (4IF).
