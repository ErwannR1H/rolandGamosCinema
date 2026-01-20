import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  const soloRules = [
    "Donnez le nom d'un acteur de cinéma pour commencer",
    "L'IA propose un acteur ayant joué dans un film commun avec votre acteur",
    "Vous et l'IA alternez à tour de rôle",
    "Un acteur ne peut être mentionné qu'une seule fois par partie",
    "Si vous ne trouvez pas d'acteur avec film commun, vous perdez",
    "Les données proviennent de Wikidata"
  ];

  const multiRules = [
    "Le premier joueur commence en donnant le nom d'un acteur de cinéma",
    "Le joueur suivant doit donner le nom d'un acteur ayant joué dans un film commun avec l'acteur précédent",
    "Les joueurs alternent les tours",
    "Un acteur ne peut être mentionné qu'une seule fois par partie",
    "Si un joueur répète un acteur ou ne trouve pas de réponse valide, il perd et les autres continuent",
    "Le dernier joueur en lice gagne !",
    "Les données proviennent de Wikidata"
  ];

  const defiRules = [
    "Vous avez deux acteurs de départ et un acteur cible",
    "Vous devez trouver le chemin le plus court entre les deux acteurs",
    "Chaque acteur que vous nommez doit avoir joué dans un film commun avec le précédent",
    "Un acteur ne peut être utilisé qu'une seule fois",
    "Vous pouvez demander des indices (nombre limité)",
    "Le moins de tours, le mieux !",
    "Les données proviennent de Wikidata"
  ];

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '30px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              ← Retour à l'accueil
            </button>
          </Link>
        </div>

        <header style={{
          textAlign: 'center',
          marginBottom: '25px',
          paddingBottom: '20px',
          borderBottom: '3px solid #667eea'
        }}>
          <h1 style={{ color: '#333', fontSize: '2.3em', marginBottom: '10px' }}>
            ℹ️ À propos
          </h1>
          <p style={{ color: '#666', fontSize: '1.05em' }}>
            Jeu des acteurs connecté à Wikidata et animé par des règles simples.
          </p>
        </header>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#333', fontSize: '1.4em', marginBottom: '12px' }}>Concept</h2>
          <p style={{ color: '#555', lineHeight: 1.6 }}>
            Trouvez à tour de rôle des acteurs qui ont joué ensemble dans au moins un film. Les connexions sont vérifiées en direct via des requêtes SPARQL sur Wikidata.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#333', fontSize: '1.4em', marginBottom: '12px' }}>Règles du jeu</h2>
          
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
            <h3 style={{ color: '#667eea', fontSize: '1.2em', marginBottom: '10px' }}>🎮 Solo Classique</h3>
            <ol style={{ marginLeft: '20px', color: '#555', lineHeight: 1.6 }}>
              {soloRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{rule}</li>
              ))}
            </ol>
          </div>

          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
            <h3 style={{ color: '#f5576c', fontSize: '1.2em', marginBottom: '10px' }}>👥 Multijoueur Classique</h3>
            <ol style={{ marginLeft: '20px', color: '#555', lineHeight: 1.6 }}>
              {multiRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{rule}</li>
              ))}
            </ol>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#11998e', fontSize: '1.2em', marginBottom: '10px' }}>🎯 Solo Défi</h3>
            <ol style={{ marginLeft: '20px', color: '#555', lineHeight: 1.6 }}>
              {defiRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{rule}</li>
              ))}
            </ol>
          </div>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ color: '#333', fontSize: '1.4em', marginBottom: '12px' }}>Données et technologies</h2>
          <ul style={{ marginLeft: '20px', color: '#555', lineHeight: 1.6 }}>
            <li>Wikidata + SPARQL pour trouver les co-occurences acteurs/films</li>
            <li>React 19 et Vite pour l'interface</li>
            <li>D3 pour la visualisation réseau</li>
            <li>Ollama (LLaMA) pour aider à corriger les noms mal orthographiés</li>
          </ul>
        </section>

        <section style={{ marginBottom: '10px' }}>
          <h2 style={{ color: '#333', fontSize: '1.4em', marginBottom: '12px' }}>Limites et avertissements</h2>
          <ul style={{ marginLeft: '20px', color: '#555', lineHeight: 1.6 }}>
            <li>Dépendance aux données Wikidata (peut être incomplet ou parfois lent)</li>
            <li>Connexion réseau requise pour les requêtes SPARQL</li>
            <li>Les corrections IA restent probabilistes</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default About;
