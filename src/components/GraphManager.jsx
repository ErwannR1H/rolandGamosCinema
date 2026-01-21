import React, { useState, useEffect } from 'react';
import { 
    downloadExpandedActorGraph, 
    saveGraphToStorage, 
    loadGraphFromStorage,
    downloadGraphAsFile,
    loadGraphFromFile
} from '../services/graphDownloadService';
import { computeGraphStats } from '../services/graphAnalysisService';

function GraphManager({ onGraphLoaded, onStartDownload }) {
    const [graph, setGraph] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState('');
    const [stats, setStats] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = React.useRef(null);

    // useEffect(() => {
    //     // Charger depuis le localStorage au démarrage
    //     const savedGraph = loadGraphFromStorage();
    //     if (savedGraph) {
    //         setGraph(savedGraph);
    //         setStats(computeGraphStats(savedGraph));
    //         if (onGraphLoaded) {
    //             onGraphLoaded(savedGraph);
    //         }
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []); // Ne s'exécute qu'au montage du composant

    const handleDownload = async (coreActors, maxTotal) => {
        setIsDownloading(true);
        setProgress('Téléchargement en cours... Cela peut prendre plusieurs minutes.');
        setGraph(null);  // Réinitialiser le graphe précédent
        
        if (onStartDownload) {
            onStartDownload();  // Notifier le parent que le téléchargement commence
        }
        
        try {
            const newGraph = await downloadExpandedActorGraph(coreActors, maxTotal);
            setGraph(newGraph);
            setStats(computeGraphStats(newGraph));
            saveGraphToStorage(newGraph);
            if (onGraphLoaded) {
                onGraphLoaded(newGraph);
            }
            setProgress(`✓ ${newGraph.actors.length} acteurs téléchargés`);
        } catch (error) {
            setProgress(`✗ Erreur: ${error.message}`);
        }
        
        setIsDownloading(false);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
        
        // Notifier le parent que le processus de chargement commence
        if (onStartDownload) {
            onStartDownload();
        }
        
        if (!file) return;  // Si pas de fichier (annulation), on retourne
        
        setIsDownloading(true);
        setProgress('Chargement du fichier...');
        
        try {
            const newGraph = await loadGraphFromFile(file);
            setGraph(newGraph);
            setStats(computeGraphStats(newGraph));
            saveGraphToStorage(newGraph);
            if (onGraphLoaded) {
                onGraphLoaded(newGraph);
            }
            setProgress(`✓ Graphe chargé depuis le fichier (${newGraph.actors.length} acteurs)`);
        } catch (error) {
            setProgress(`✗ Erreur chargement fichier: ${error.message}`);
        }
        
        setIsDownloading(false);
        setIsDragOver(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFileUpload({ dataTransfer: e.dataTransfer });
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '8px' }}>
            <h2>Gestion du Graphe</h2>
            
            {stats && graph && (
                <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                    <h3>Statistiques:</h3>
                    <ul>
                        <li>Acteurs: {stats.actorCount}</li>
                        <li>Connexions: {stats.connectionCount}</li>
                        <li>Degré moyen: {stats.avgDegree}</li>
                        <li>Degré max: {stats.maxDegree}</li>
                        <li>Date: {new Date(graph.metadata.downloadDate).toLocaleString()}</li>
                    </ul>
                    
                    {graph.metadata.distribution && (
                        <div>
                            <h4>Distribution des acteurs par nombre de films:</h4>
                            <ul>
                                {Object.entries(graph.metadata.distribution).map(([range, count]) => (
                                    <li key={range}>{range}: {count} acteurs</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <h3>Télécharger un nouveau graphe</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => handleDownload(100, 2000)} 
                        disabled={isDownloading}
                        style={{ padding: '8px 16px' }}
                    >
                         Petit (100 hubs + 2000 total)
                    </button>
                    <button 
                        onClick={() => handleDownload(200, 3000)} 
                        disabled={isDownloading}
                        style={{ padding: '8px 16px' }}
                    >
                         Moyen (200 hubs + 3000 total)
                    </button>
                    <button 
                        onClick={() => handleDownload(500, 5000)} 
                        disabled={isDownloading}
                        style={{ padding: '8px 16px' }}
                    >
                         Large (500 hubs + 5000 total)
                    </button>
                </div>
            </div>

            {graph && (
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
                    <h3>Exporter/Charger un graphe</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => downloadGraphAsFile(graph)}
                            style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                             Télécharger le graphe actuel
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h3>Charger un graphe depuis fichier</h3>
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: '2px dashed',
                        borderColor: isDragOver ? '#007acc' : '#ccc',
                        borderRadius: '8px',
                        padding: '20px',
                        textAlign: 'center',
                        background: isDragOver ? '#f0f7ff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <p style={{ margin: '0 0 10px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
                        📂 Glissez-déposez un fichier JSON ici
                    </p>
                    <p style={{ margin: 0, color: '#666' }}>
                        ou cliquez pour sélectionner un fichier
                    </p>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".json" 
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {progress && (
                <div style={{ marginTop: '15px', padding: '10px', background: progress.includes('✓') ? '#d4edda' : progress.includes('✗') ? '#f8d7da' : '#e7f3ff', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{progress}</p>
                </div>
            )}
        </div>
    );
}

export default GraphManager;