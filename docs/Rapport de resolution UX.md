# Rapport de résolution des problèmes UX

## Problèmes rencontrés

* Responsive : affichage non optimisé sur petits écrans (menus, contenu) et boutons non ou peu visibles
* authentification : pas de feedback (messages d'erreur)
* pas de token stocké, obligation de se reconnecter au refresh + proposer un rememberMe
* gestion de l'utilisateur inconnu dans la base : proposer le register plutôt que le login
* feedback : quand pas de transaction, pas de contenu
  

### 0 - Sécurité
* Utiliser https pour toute l'application (prod)

### 1- Authentification

 - Quand l'utilisateur est inconnu dans la base:
   - Il n'a pas de feedback quand il essaie de se connecter
- Quand il y a un refresh, l'utilisateur doit se reconnecter
  
#### Solution(s) :
* Afficher une erreur sur la page
* Rediriger vers /register plutôt que /login
* ajouter le token dans le navigateur
* proposer un rememberMe

#### Résolution : 
Je choisis d'afficher l'erreur à l'utilisateur et de gérer le token dans sessionStorage ou localStorage :

<details>
Dans AuthContext, ajout des méthodes : 
``` js
const saveToken = (token, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("jwtToken", token);
  };

  const clearToken = () => {
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
  };
```

Ajout de ces méthodes : 
* au logout :
```js
const logout = () => {
    setAuth(null);
    clearToken();
  };
```
* au login (avec amélioration de la gestion d'erreurs et de feedback) : 
```js
const login = async (username, password, rememberMe) => {
   try {
      const data = await loginService.login(username, password);
      console.log("authcontext : data " + JSON.stringify(data.accessToken));
      if (!data?.accessToken) throw new Error("Invalid token received");

      const decodedToken = jwtDecode(data.accessToken);
      console.log("decodedToken", decodedToken);
      setAuth(decodedToken);
      saveToken(data.accessToken, rememberMe);

      return true;
   } catch (error) {
      console.error('Login failed:', error);
      return false;
   }
};
```
* au register :
```js
const register = async (username, password) => {
   try {
      const data = await loginService.register(username, password);
      if (!data?.accessToken) throw new Error("Invalid token received");

      setAuth(jwtDecode(data.accessToken));
      saveToken(data.accessToken);

      return true;
   } catch (error) {
      console.error('Registration error:', error);
      return false;
   }
};
```
Modifier apiService pour récupérer le token et le transmettre avec les requêtes :
```js
export const HOST = 'http://localhost:8080';

function getStoredToken(){
  return sessionStorage.getItem("jwtToken") || localStorage.getItem('jwtToken');
}

export function createHeaders(auth) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = auth?.token || getStoredToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${HOST}${endpoint}`, {
    ...options,
    headers: {
      ...createHeaders(options.auth),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

```

* Ajouter le rememberMe au login
```js
export default function Login() {
   const [isLogin, setIsLogin] = useState(true);
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [authLoading, setAuthLoading] = useState(false);
   const [rememberMe, setRememberMe] = useState(false);
   const {login, register} = useAuth();

   const handleSubmit = useCallback(async (e) => {
      e.preventDefault();
      setAuthLoading(true);
      setError('');

      try {
         const success = isLogin
                 ? await login(username, password, rememberMe)
                 : await register(username, password);

         if (!success) {
            setError(isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed.');
         }
      } catch (err) {
         setError('An unexpected error occurred.');
         console.error(err);
      } finally {
         setAuthLoading(false);
      }
   }, [isLogin, username, password, rememberMe, login, register]);

   return (
           <div className="login-container">
              <h2>{isLogin ? 'Login' : 'Register'}</h2>
              {error && <div className="error">{error}</div>}
              {authLoading && <Loader/>}
              <form onSubmit={handleSubmit}>
                 <input
                         type="text"
                         aria-label="Username field"
                         placeholder="Username"
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         required
                 />
                 <input
                         type="password"
                         placeholder="Password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                 />
                 <label htmlFor="rememberMe">Se souvenir de moi</label>
                 <input
                         type="checkbox"
                         name="rememberMe"
                         checked={rememberMe}
                         onChange={() => setRememberMe(!rememberMe)}
                 />
                 <button type="submit" disabled={authLoading}>
                    {isLogin ? 'Login' : 'Register'}
                 </button>
              </form>
              <button onClick={() => setIsLogin(!isLogin)} disabled={authLoading}>
                 {isLogin ? 'Need to register?' : 'Already have an account?'}
              </button>
           </div>
   );
}
```

Cela nécessite d'installer jwt-decode : 
```bash
npm i jwt-decode
```
et de l'importer :
```js
import { jwtDecode } from "jwt-decode";
```
</details>

### 2- Parcours utilisateur
- Un utilisateur doit créer une méthode de paiement avant de pouvoir enregistrer une transaction. Problème : il n'a aucun moyen de le savoir dans l'application
- En cas de suppression d'un moyen de paiement, la liste n'est pas mise à jour
- En cas d'absence de données à afficher (exemple page transaction), afficher un texte invitant l'utilisateur à en créer ou lui dire que la page n'a rien à afficher
- Logout non mis en valeur

#### Solution(s)
* Empêcher l'accès à la section transaction si un moyen de paiement n'est pas enregistré
* Orienter le parcours utilisateur en forçant la création du moyen de paiement si absent de la base
* Permettre la création du moyen de paiement dans le formulaire de création de transaction
* En cas d'absence de transaction, afficher un texte de bienvenue invitant à en créer une
* Transformer le curseur au survol de la souris sur logout

#### Résolution :
Je choisis de permettre la création d'un moyen de paiement dans le formulaire de création de transaction.

<details>
* Extraction de la modale de création d'un moyen de paiement dans un composant indépendant
* Injection de ce composant dans la page de création d'un moyen de paiement pour rétablir la fonctionnalité
* Injection de ce composant dans la modale de création d'une transaction. 
* On peut maintenant créer un moyen de paiement directement pendant la création d'une transaction

</details>

### Adaptation petits écrans
- le menu ne s'adapte pas aux petits écrans
- les boutons de création sont peu visibles ou accessibles

#### Résolution
* Création d'un menu burger et media query pour les petits écrans (ou autre mise en page de la nav bar)
<details>
    - pas eu le temps, j'ai ajouté un media query pour supprimer le logo du site et empiler les liens :

```css

@media (max-width: 550px) {
    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin: 0;
        align-items: center;
    }
    .nav-links a {
        text-decoration: none;
        display: block;
        width: 100%;
        text-align: center;
        padding: 0.5rem;
    }
    .nav-brand {
        display: none;
    }
}
```


</details>


* Choix de mettre le bouton de création sur la même ligne que le titre

<details>
- ajout d'une div encadrant le h2 et le bouton sur chaque page
- css de cette div : 

```css
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
```
</details>

### Accessibilité et SEO
- Ajuster les couleurs pour améliorer le contraste (page en cours, fond bleu clair, police bleu foncé) ou utiliser des bordures plus contrastées pour détacher les éléments du fond
- Ajouter l'accès au clavier des éléments interactifs (tabIndex)
- Ajouter les attributs ARIA
- Utiliser des balises html ayant du sens
- Configurer les balises meta correctement
- Ajouter un texte descriptif aux liens

### Fonctionnalités
- Manque de fonctionnalités
  - Transactions : 
    - données enregistrées mais non consultables (descriptions)
    - pas de filtres (tri par date)
    - pas d'affichage des catégories
    - pas de possibilité de modifier ou supprimer
  - Catégories :
    - suppression / modification non implémentées (ou pas terminées)
  - Moyen de paiement :
    - en cas de suppression, pas de mise à jour de la liste

### Rapport Lighthouse
- Optimiser le chargement des ressources critiques
- Réduire le poids des fichiers CSS et JS
- Optimiser les images et ressources bloquantes pour améliorer le temps de chargement
- Réduire le temps d'exécution des scripts et différer le chargement des scripts non essentiels
- Utiliser des polices de caractères optimisées
- Minifier les fichiers CSS et JS (build)
- Utiliser la mise en cache
- Réduire les redirections
- Utiliser des animations CSS au lieu de JS

