import axios from 'axios';

const API_URL = 'https://app.vivreenliberte.org/api';

async function fetchEquipment() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Aucun token trouvé');
            window.location.href = '/login';
            return;
        }
        
        console.log('Token utilisé:', token);
        
        const response = await axios.get(`${API_URL}/equipment.php`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Données reçues:', response.data);
        
        if (!response.data.success) {
            throw new Error(response.data.error || 'Erreur lors de la récupération des équipements');
        }

        return response.data.data;
    } catch (error) {
        console.error('Erreur lors du chargement des équipements:', error);
        
        // Création d'une notification d'erreur personnalisée
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        `;
        errorDiv.textContent = error.response?.data?.error || 'Erreur lors du chargement des équipements';
        document.body.appendChild(errorDiv);
        
        // Supprimer la notification après 5 secondes
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => errorDiv.remove(), 500);
        }, 5000);
        
        // Si l'erreur est 401, rediriger vers la page de connexion
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        throw error;
    }
}

export { fetchEquipment }; 