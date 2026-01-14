import React, { useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import GraphManager from './GraphManager';
import { findHubActors, findBridgeActors, extractSubgraph } from '../services/graphAnalysisService';

// Lazy load NetworkVisualization pour améliorer les performances au chargement initial
const NetworkVisualization = lazy(() => import('./NetworkVisualization'));

function NetworkAnalysis() {
    const [graph, setGraph] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [subgraph, setSubgraph] = useState(null);
    const [hubActors, setHubActors] = useState([]);
    const [bridgeActors, setBridgeActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');

    const handleGraphLoaded = (loadedGraph) => {
        setGraph(loadedGraph);
        setIsDownloading(false);  // Marquer que le téléchargement est fini
        // Calculer automatiquement les hubs et bridges
        const hubs = findHubActors(loadedGraph, 20);
        const bridges = findBridgeActors(loadedGraph);
        setHubActors(hubs);
        setBridgeActors(bridges);
    };

    const handleStartDownload = () => {
        setIsDownloading(true);
        setGraph(null);  // Vider le graphe précédent
        setSubgraph(null);
    };

    const handleExtractSubgraph = () => {
        if (!graph || !selectedActor) return;
        
        const sub = extractSubgraph(graph, selectedActor, 2);
        setSubgraph(sub);
    };

    const handleShowFullGraph = () => {
        setSubgraph(null);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            
        }}>
            <div
            style={{background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",

            }}
            >
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
            
            <h1> 🕸️ Analyse du Réseau d'Acteurs</h1>
            <p>Téléchargez un graphe d'acteurs depuis Wikidata pour analyser les connexions et visualiser le réseau.</p>
            
            <GraphManager 
                onGraphLoaded={handleGraphLoaded} 
                onStartDownload={handleStartDownload}
            />

            {isDownloading && (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: '#f0f0f0',
                    borderRadius: '8px',
                    margin: '20px 0'
                }}>
                    <p style={{ fontSize: '1.2em', color: '#666' }}>
                        ⏳ Téléchargement en cours... Veuillez patienter.
                    </p>
                </div>
            )}

            {graph && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        {/* Acteurs Hub */}
                        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                            <h3>🌟 Acteurs "Hub" (Plus de connexions)</h3>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                Ces acteurs créent le plus de connexions et sont faciles à relier.
                            </p>
                            <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {hubActors.map(actor => (
                                    <li key={actor.id} style={{ marginBottom: '8px' }}>
                                        <strong>{actor.label}</strong> 
                                        <br/>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            {actor.degree} connexions • {actor.movieCount} films
                                        </span>
                                        <button 
                                            onClick={() => setSelectedActor(actor.id)}
                                            style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 6px' }}
                                        >
                                            Explorer
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Acteurs Bridge */}
                        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                            <h3>🌉 Acteurs "Bridge" (Connectent des groupes)</h3>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                Ces acteurs relient des groupes différents - stratégiques pour bloquer l'adversaire.
                            </p>
                            <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {bridgeActors.map(actor => (
                                    <li key={actor.id} style={{ marginBottom: '8px' }}>
                                        <strong>{actor.label}</strong>
                                        <br/>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            Score: {actor.bridgeScore} • {actor.degree} connexions
                                        </span>
                                        <button 
                                            onClick={() => setSelectedActor(actor.id)}
                                            style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 6px' }}
                                        >
                                            Explorer
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contrôles de visualisation */}
                    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3>🔍 Explorer un sous-graphe</h3>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select 
                                value={selectedActor} 
                                onChange={(e) => setSelectedActor(e.target.value)}
                                style={{ padding: '8px', flex: 1, maxWidth: '300px' }}
                            >
                                <option value="">Sélectionnez un acteur...</option>
                                {graph.actors
                                    .sort((a, b) => b.degree - a.degree)
                                    .slice(0, 50)
                                    .map(actor => (
                                        <option key={actor.id} value={actor.id}>
                                            {actor.label} ({actor.degree} connexions)
                                        </option>
                                    ))
                                }
                            </select>
                            <button 
                                onClick={handleExtractSubgraph}
                                disabled={!selectedActor}
                                style={{ padding: '8px 16px' }}
                            >
                                Extraire le réseau
                            </button>
                            {subgraph && (
                                <button 
                                    onClick={handleShowFullGraph}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Afficher tout
                                </button>
                            )}
                        </div>
                        {subgraph && (
                            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                Sous-graphe : {subgraph.actors.length} acteurs, {subgraph.connections.length} connexions
                            </p>
                        )}
                    </div>

                    {/* Visualisation */}
                    <div>
                        <h3>📊 Visualisation du Réseau</h3>
                        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Chargement de la visualisation...</div>}>
                            <NetworkVisualization data={subgraph || graph} />
                        </Suspense>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                            <p>💡 Conseils :</p>
                            <ul>
                                <li>La taille des cercles représente le nombre de connexions</li>
                                <li>Les couleurs indiquent le niveau de connectivité (violet = peu connecté, jaune = très connecté)</li>
                                <li>Survolez un acteur pour voir ses détails</li>
                                <li>Glissez-déposez les acteurs pour réorganiser le graphe</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            </div>
            
        </div>
    );
}

export default NetworkAnalysis;
