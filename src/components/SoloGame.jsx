import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { findActor, haveCommonMovie } from '../services/sparqlService';
import { findValidActorResponse, getHints } from '../services/aiPlayerService';
import { getHighScore, saveHighScore } from '../services/scoreService';

function SoloGame() {
    const [gameState, setGameState] = useState({
        status: 'idle', // 'idle' | 'playing' | 'gameOver' | 'victory'
        score: 0,
        lastActor: null,
        actorsHistory: [],
        isPlayerTurn: true
    });

    const [highScore, setHighScore] = useState(0);
    const [actorInput, setActorInput] = useState('');
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [isLoading, setIsLoading] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [hints, setHints] = useState([]);
    const [hintsRemaining, setHintsRemaining] = useState(3);
    const [isLoadingHints, setIsLoadingHints] = useState(false);
    const [gameOverReason, setGameOverReason] = useState('');
    const [aiMode, setAiMode] = useState('normal'); // 'normal' | 'easy'

    useEffect(() => {
        setHighScore(getHighScore());
    }, []);

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
    };

    const startGame = () => {
        setGameState({
            status: 'playing',
            score: 0,
            lastActor: null,
            actorsHistory: [],
            isPlayerTurn: true
        });
        setActorInput('');
        setHints([]);
        setHintsRemaining(3);
        setGameOverReason('');
        showMessage('🎬 C\'est parti ! Nommez un acteur pour commencer.', 'info');
    };

    const endGame = (isVictory = false, reason = '') => {
        const finalScore = gameState.score;
        const isNewRecord = saveHighScore(finalScore);

        if (isNewRecord) {
            setHighScore(finalScore);
        }

        setGameOverReason(reason);

        setGameState(prev => ({
            ...prev,
            status: isVictory ? 'victory' : 'gameOver'
        }));

        if (isVictory) {
            showMessage(`🏆 Victoire ! L'IA n'a pas trouvé de réponse. Score: ${finalScore}`, 'success');
        } else if (isNewRecord) {
            showMessage(`🎉 Nouveau record ! Score: ${finalScore}`, 'success');
        } else {
            showMessage(`😢 Game Over ! Score: ${finalScore}`, 'error');
        }
    };

    const addActorToHistory = (actor, isPlayer) => {
        setGameState(prev => ({
            ...prev,
            lastActor: actor,
            actorsHistory: [...prev.actorsHistory, { ...actor, isPlayer }],
            score: isPlayer ? prev.score + 1 : prev.score
        }));
    };

    const handlePlayerSubmit = async () => {
        const actorName = actorInput.trim();

        if (!actorName) {
            showMessage('Veuillez entrer le nom d\'un acteur.', 'error');
            return;
        }

        // Vérifier si l'acteur a déjà été mentionné
        if (gameState.actorsHistory.some(a => a.label.toLowerCase() === actorName.toLowerCase())) {
            showMessage('Cet acteur a déjà été mentionné ! Game Over.', 'error');
            endGame(false, `L'acteur "${actorName}" avait déjà été mentionné dans cette partie.`);
            return;
        }

        setIsLoading(true);

        try {
            // Rechercher l'acteur sur Wikidata
            const actor = await findActor(actorName);

            if (!actor) {
                showMessage('Acteur non trouvé sur Wikidata. Essayez un autre nom.', 'error');
                setIsLoading(false);
                return;
            }

            // Vérifier si l'acteur a déjà été mentionné (par URI - plus fiable)
            if (gameState.actorsHistory.some(a => a.actor === actor.actor)) {
                showMessage('Cet acteur a déjà été mentionné ! Game Over.', 'error');
                endGame(false, `L'acteur "${actor.label}" avait déjà été mentionné dans cette partie.`);
                setIsLoading(false);
                return;
            }

            // Premier tour : accepter n'importe quel acteur
            if (!gameState.lastActor) {
                addActorToHistory(actor, true);
                setActorInput('');
                setIsLoading(false);

                // L'IA joue ensuite
                await aiTurn(actor);
                return;
            }

            // Vérifier si les deux acteurs ont joué dans un film commun
            const commonMovie = await haveCommonMovie(gameState.lastActor.actor, actor.actor);

            if (!commonMovie) {
                showMessage(
                    `Aucun film commun trouvé entre ${gameState.lastActor.label} et ${actor.label}. Game Over !`,
                    'error'
                );
                endGame(false, `Aucun film commun n'a été trouvé entre "${gameState.lastActor.label}" et "${actor.label}".`);
                setIsLoading(false);
                return;
            }

            // Réponse valide
            showMessage(`✓ Film commun: "${commonMovie.movieLabel}"`, 'success');
            addActorToHistory({ ...actor, moviePosterUrl: commonMovie.moviePosterUrl }, true);
            setActorInput('');
            setHints([]); // Clear hints for next turn
            setIsLoading(false);

            // L'IA joue ensuite
            await aiTurn({ ...actor, moviePosterUrl: commonMovie.moviePosterUrl });

        } catch (error) {
            console.error('Erreur:', error);
            showMessage('Erreur lors de la vérification. Veuillez réessayer.', 'error');
            setIsLoading(false);
        }
    };

    const aiTurn = async (lastPlayerActor) => {
        setIsAiThinking(true);
        setGameState(prev => ({ ...prev, isPlayerTurn: false }));

        // Délai pour simuler la réflexion
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const excludedUris = gameState.actorsHistory.map(a => a.actor);
            excludedUris.push(lastPlayerActor.actor);

            const aiResponse = await findValidActorResponse(lastPlayerActor.actor, excludedUris, { mode: aiMode });

            if (!aiResponse) {
                // L'IA n'a pas trouvé de réponse - le joueur gagne !
                setIsAiThinking(false);
                endGame(true);
                return;
            }

            showMessage(`🤖 IA: ${aiResponse.label} (via "${aiResponse.commonMovie.label}")`, 'info');
            addActorToHistory(aiResponse, false);
            setGameState(prev => ({ ...prev, isPlayerTurn: true }));

        } catch (error) {
            console.error('Erreur IA:', error);
            showMessage('L\'IA a rencontré une erreur. Vous gagnez !', 'success');
            endGame(true);
        }

        setIsAiThinking(false);
    };

    const handleGiveUp = () => {
        showMessage('Vous avez abandonné.', 'info');
        endGame(false, 'Vous avez abandonné la partie.');
    };

    const handleGetHint = async () => {
        if (!gameState.lastActor || hintsRemaining <= 0) return;

        setIsLoadingHints(true);
        setHints([]);

        try {
            const excludedUris = gameState.actorsHistory.map(a => a.actor);
            const newHints = await getHints(gameState.lastActor.actor, excludedUris);

            if (newHints.length > 0) {
                setHints(newHints);
                setHintsRemaining(prev => prev - 1);
                showMessage(`💡 Voici quelques suggestions ! (${hintsRemaining - 1} indices restants)`, 'info');
            } else {
                showMessage('Aucun indice disponible pour le moment.', 'error');
            }
        } catch (error) {
            console.error('Erreur hints:', error);
            showMessage('Erreur lors de la récupération des indices.', 'error');
        }

        setIsLoadingHints(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading && !isAiThinking && gameState.isPlayerTurn) {
            handlePlayerSubmit();
        }
    };

    // Styles
    const containerStyle = {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        minHeight: '100vh',
        padding: '20px'
    };

    const cardStyle = {
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '30px'
    };

    const scoreDisplayStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginBottom: '25px'
    };

    const scoreBoxStyle = (isHighScore) => ({
        textAlign: 'center',
        padding: '15px 30px',
        background: isHighScore ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        borderRadius: '15px',
        color: 'white',
        minWidth: '120px'
    });

    const buttonStyle = (isPrimary) => ({
        flex: 1,
        padding: '15px 25px',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1em',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontWeight: '600',
        background: isPrimary ? '#11998e' : '#6c757d',
        color: 'white'
    });

    const inputStyle = {
        width: '100%',
        padding: '15px',
        fontSize: '1.1em',
        border: '2px solid #ddd',
        borderRadius: '10px',
        marginBottom: '15px',
        boxSizing: 'border-box'
    };

    const messageStyle = {
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center',
        background: message.type === 'error' ? '#f8d7da' : message.type === 'success' ? '#d4edda' : '#e7f3ff',
        color: message.type === 'error' ? '#721c24' : message.type === 'success' ? '#155724' : '#004085'
    };

    const historyStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '10px',
        maxHeight: '200px',
        overflowY: 'auto'
    };

    const historyItemStyle = (isPlayer) => ({
        padding: '8px 15px',
        borderRadius: '20px',
        background: isPlayer ? '#11998e' : '#f5576c',
        color: 'white',
        fontSize: '0.9em'
    });

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <header style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '3px solid #11998e' }}>
                    <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
                        🤖 Mode Solo
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.1em' }}>
                        Défiez l'IA en trouvant des acteurs liés par des films
                    </p>
                </header>

                {/* Scores */}
                <div style={scoreDisplayStyle}>
                    <div style={scoreBoxStyle(false)}>
                        <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Score</div>
                        <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{gameState.score}</div>
                    </div>
                    <div style={scoreBoxStyle(true)}>
                        <div style={{ fontSize: '0.9em', opacity: 0.9 }}>🏆 Record</div>
                        <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>{highScore}</div>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div style={messageStyle}>{message.text}</div>
                )}

                {/* Mode IA */}
                <div style={{
                    margin: '0 0 20px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#555', fontWeight: 600 }}>Mode IA :</span>
                    <select
                        value={aiMode}
                        onChange={(e) => setAiMode(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '2px solid #11998e',
                            minWidth: '180px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="normal">Normal </option>
                        <option value="easy">Facile </option>
                    </select>
                </div>

                {/* Game Area */}
                {gameState.status === 'playing' && (
                    <>
                        {/* Current Actor */}
                        {gameState.lastActor && (
                            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '15px' }}>
                                <p style={{ color: '#666', marginBottom: '10px' }}>Dernier acteur :</p>
                                <h2 style={{ color: '#333', margin: 0 }}>{gameState.lastActor.label}</h2>
                                {gameState.lastActor.imageUrl && (
                                    <img
                                        src={gameState.lastActor.imageUrl}
                                        alt={gameState.lastActor.label}
                                        style={{ maxHeight: '150px', borderRadius: '10px', marginTop: '10px' }}
                                    />
                                )}
                            </div>
                        )}

                        {/* AI Thinking Indicator */}
                        {isAiThinking && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                <div style={{ fontSize: '2em', marginBottom: '10px' }}>🤔</div>
                                <p>L'IA réfléchit...</p>
                            </div>
                        )}

                        {/* Player Input */}
                        {gameState.isPlayerTurn && !isAiThinking && (
                            <div>
                                <input
                                    type="text"
                                    value={actorInput}
                                    onChange={(e) => setActorInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Entrez le nom d'un acteur..."
                                    style={inputStyle}
                                    disabled={isLoading}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={handlePlayerSubmit}
                                        disabled={isLoading}
                                        style={buttonStyle(true)}
                                    >
                                        {isLoading ? 'Vérification...' : 'Valider'}
                                    </button>
                                    {gameState.lastActor && hintsRemaining > 0 && (
                                        <button
                                            onClick={handleGetHint}
                                            disabled={isLoadingHints || isLoading}
                                            style={{
                                                ...buttonStyle(false),
                                                background: '#ffc107',
                                                color: '#333'
                                            }}
                                        >
                                            {isLoadingHints ? '...' : `💡 Indice (${hintsRemaining})`}
                                        </button>
                                    )}
                                    <button onClick={handleGiveUp} style={buttonStyle(false)}>
                                        Abandonner
                                    </button>
                                </div>

                                {/* Hints Display */}
                                {hints.length > 0 && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        background: '#fff3cd',
                                        borderRadius: '10px',
                                        border: '1px solid #ffc107'
                                    }}>
                                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>
                                            💡 Suggestions :
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
                                            {hints.map((hint, i) => (
                                                <li key={i}>
                                                    <strong>{hint.label}</strong> <span style={{ opacity: 0.8 }}>(via "{hint.movie}")</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History */}
                        {gameState.actorsHistory.length > 0 && (
                            <div style={historyStyle}>
                                {gameState.actorsHistory.map((actor, index) => (
                                    <span key={index} style={historyItemStyle(actor.isPlayer)}>
                                        {actor.isPlayer ? '👤' : '🤖'} {actor.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Idle / Game Over State */}
                {(gameState.status === 'idle' || gameState.status === 'gameOver' || gameState.status === 'victory') && (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        {gameState.status !== 'idle' && (
                            <div style={{ marginBottom: '30px' }}>
                                <div style={{ fontSize: '4em', marginBottom: '10px' }}>
                                    {gameState.status === 'victory' ? '🏆' : '😢'}
                                </div>
                                <h2 style={{ color: '#333' }}>
                                    {gameState.status === 'victory' ? 'Victoire !' : 'Game Over'}
                                </h2>
                                {gameOverReason && gameState.status === 'gameOver' && (
                                    <p style={{
                                        color: '#856404',
                                        background: '#fff3cd',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        marginBottom: '15px',
                                        border: '1px solid #ffc107'
                                    }}>
                                        <strong>Raison :</strong> {gameOverReason}
                                    </p>
                                )}
                                <p style={{ color: '#666', fontSize: '1.2em' }}>
                                    Score final : <strong>{gameState.score}</strong>
                                </p>
                            </div>
                        )}
                        <button onClick={startGame} style={{ ...buttonStyle(true), padding: '20px 40px', fontSize: '1.2em' }}>
                            {gameState.status === 'idle' ? '🎮 Commencer' : '🔄 Rejouer'}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
                    <Link to="/" style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ ...buttonStyle(false), width: '100%' }}>
                            ← Retour à l'accueil
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SoloGame;
