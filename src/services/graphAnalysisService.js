/**
 * Service d'analyse du graphe téléchargé localement
 */

/**
 * Trouve les acteurs "hub" (plus grand nombre de connexions)
 * @param {Object} graph - Le graphe complet
 * @param {number} topN - Nombre de résultats
 * @returns {Array}
 */
export function findHubActors(graph, topN = 20) {
    return graph.actors
        .sort((a, b) => b.degree - a.degree)
        .slice(0, topN);
}

/**
 * Trouve les acteurs "bridge" qui connectent des groupes différents
 * Utilise la notion de betweenness centrality (simplifié)
 * @param {Object} graph - Le graphe complet
 * @returns {Array}
 */
export function findBridgeActors(graph) {
    const betweenness = new Map();
    
    graph.actors.forEach(actor => {
        betweenness.set(actor.id, 0);
    });

    // Calcul simplifié : un acteur est un bridge s'il connecte des acteurs
    // qui ne sont pas directement connectés entre eux
    graph.actors.forEach(actor => {
        const coActors = new Set(actor.coActors);
        let bridgeScore = 0;
        
        // Compter les paires de co-acteurs non connectées
        const coActorsList = Array.from(coActors);
        for (let i = 0; i < coActorsList.length; i++) {
            for (let j = i + 1; j < coActorsList.length; j++) {
                const coActor1 = graph.actors.find(a => a.id === coActorsList[i]);
                const coActor2 = graph.actors.find(a => a.id === coActorsList[j]);
                
                if (coActor1 && coActor2 && !coActor1.coActors.includes(coActor2.id)) {
                    bridgeScore++;
                }
            }
        }
        
        betweenness.set(actor.id, bridgeScore);
    });

    return graph.actors
        .map(actor => ({
            ...actor,
            bridgeScore: betweenness.get(actor.id)
        }))
        .sort((a, b) => b.bridgeScore - a.bridgeScore)
        .slice(0, 20);
}

/**
 * Trouve le chemin le plus court entre deux acteurs
 * @param {Object} graph - Le graphe complet
 * @param {string} actor1Id - ID du premier acteur
 * @param {string} actor2Id - ID du second acteur
 * @returns {Array|null}
 */
export function findShortestPath(graph, actor1Id, actor2Id) {
    const visited = new Set();
    const queue = [[actor1Id]];
    
    while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];
        
        if (currentId === actor2Id) {
            return path.map(id => graph.actors.find(a => a.id === id));
        }
        
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const currentActor = graph.actors.find(a => a.id === currentId);
        if (!currentActor) continue;
        
        for (const coActorId of currentActor.coActors) {
            if (!visited.has(coActorId)) {
                queue.push([...path, coActorId]);
            }
        }
    }
    
    return null;
}

/**
 * Calcule les statistiques du graphe
 * @param {Object} graph - Le graphe complet
 * @returns {Object}
 */
export function computeGraphStats(graph) {
    const degrees = graph.actors.map(a => a.degree);
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    const maxDegree = Math.max(...degrees);
    const minDegree = Math.min(...degrees);
    
    return {
        actorCount: graph.actors.length,
        connectionCount: graph.connections.length,
        avgDegree: avgDegree.toFixed(2),
        maxDegree,
        minDegree,
        density: (2 * graph.connections.length) / (graph.actors.length * (graph.actors.length - 1))
    };
}

/**
 * Extrait un sous-graphe autour d'un acteur
 * @param {Object} graph - Le graphe complet
 * @param {string} actorId - ID de l'acteur central
 * @param {number} depth - Profondeur (1 = voisins directs, 2 = voisins des voisins...)
 * @returns {Object}
 */
export function extractSubgraph(graph, actorId, depth = 1) {
    const includedActors = new Set([actorId]);
    let currentLayer = new Set([actorId]);
    
    for (let i = 0; i < depth; i++) {
        const nextLayer = new Set();
        for (const id of currentLayer) {
            const actor = graph.actors.find(a => a.id === id);
            if (actor) {
                actor.coActors.forEach(coId => {
                    includedActors.add(coId);
                    nextLayer.add(coId);
                });
            }
        }
        currentLayer = nextLayer;
    }
    
    const subActors = graph.actors.filter(a => includedActors.has(a.id));
    const subConnections = graph.connections.filter(c => 
        includedActors.has(c.actor1) && includedActors.has(c.actor2)
    );
    
    return {
        actors: subActors,
        connections: subConnections,
        metadata: {
            centerActor: actorId,
            depth,
            actorCount: subActors.length,
            connectionCount: subConnections.length
        }
    };
}
