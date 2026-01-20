/**
 * Service d'appel à l'API Ollama pour améliorer les requêtes SPARQL
 */

const OLLAMA_API_URL = 'https://ollama-ui.pagoda.liris.cnrs.fr/api/chat/completions';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5YmM3ZDQ5LWM3NTgtNDgyMC1hYWU4LWZhNjk4N2U1OTZjMCIsImV4cCI6MTc5OTMwNzgzOH0.67Xjpf7F67imbYpusy3V70mCUp2yZqtor9rfOo4WvRs';

/**
 * Améliore le nom d'un acteur pour le format Wikidata
 * @param {string} actorName - Nom brut saisi par l'utilisateur
 * @returns {Promise<string>} - Nom formaté pour Wikidata
 */
export async function improveActorNameForWikiData(actorName) {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3:70b',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un expert en Wikidata. Quand on te donne un nom d\'acteur, tu retournes UNIQUEMENT le nom exact tel qu\'il apparaît dans Wikidata (format: "Prenom Nom" en anglais). Pas d\'explication, juste le nom.'
                    },
                    {
                        role: 'user',
                        content: `Quel est le nom exact de cet acteur dans Wikidata: "${actorName}"`
                    }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur API Ollama: ${response.status}`);
        }

        const data = await response.json();
        const improvedName = data.choices[0].message.content.trim();
        console.log(`IA: "${actorName}" → "${improvedName}"`);
        return improvedName;
    } catch (error) {
        console.error('Erreur IA:', error);
        return actorName; // Retourne le nom original en cas d'erreur
    }
}
