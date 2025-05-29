import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/SideMenu.css'; // Nous créerons ce fichier CSS

// Supposons que nous ayons accès au contexte d'authentification
// import { useAuth } from '../../contexts/AuthContext'; 

const SideMenu = () => {
    // const { user, logout } = useAuth(); // À décommenter et adapter selon votre contexte
    const navigate = useNavigate();

    // Données utilisateur et fonction logout factices pour l'instant
    const user = {
        name: 'Pierre Savignac', // Placeholder
        email: 'pierre.savignac@example.com' // Placeholder
    };
    const logout = () => {
        console.log('Déconnexion...');
        // Logique de déconnexion réelle (vider localStorage, contexte, rediriger)
        // localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="side-menu">
            <ul className="side-menu-nav">
                <li className="side-menu-item">
                    {/* Idéalement, remplacer le texte par une icône en mode rétracté */}
                    <Link to="/" className="side-menu-link">
                        <span className="link-icon">📅</span> {/* Placeholder icône */}
                        <span className="link-text">Calendrier</span>
                    </Link>
                </li>
                <li className="side-menu-item">
                    <Link to="/list-view" className="side-menu-link">
                        <span className="link-icon">📄</span> {/* Placeholder icône */}
                        <span className="link-text">Vue Liste</span>
                    </Link>
                </li>
                <li className="side-menu-item">
                    <Link to="/no-appointment" className="side-menu-link">
                        <span className="link-icon">⏰</span> {/* Placeholder icône */}
                        <span className="link-text">Sans rendez-vous</span>
                    </Link>
                </li>
                <li className="side-menu-item">
                    {/* Pointer vers /admin pour la gestion des usagers */}
                    <Link to="/admin" className="side-menu-link">
                        <span className="link-icon">👥</span>
                        <span className="link-text">Usagers</span>
                    </Link>
                </li>
                <li className="side-menu-item">
                    <Link to="/data-management" className="side-menu-link">
                        <span className="link-icon">🗄️</span>
                        <span className="link-text">Données</span>
                    </Link>
                </li>
                {/* Ajouter d'autres liens ici si nécessaire */}
            </ul>

            <div className="side-menu-footer">
                <div className="user-info">
                    <span className="user-name">{user?.name || 'Utilisateur'}</span>
                    <span className="user-email">{user?.email || 'email@example.com'}</span>
                </div>
                <button onClick={logout} className="logout-button">
                    <span className="link-icon">🚪</span> {/* Placeholder icône */}
                    <span className="link-text">Déconnexion</span>
                </button>
            </div>
        </nav>
    );
};

export default SideMenu; 