/* ==========================================================================
   NC Small Farm Platform V.2 — Auth (Firebase Authentication)
   Google Sign-In + Email/Password + Role Detection
   ========================================================================== */

(function() {
  const firebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  let fbApp = null, fbAuth = null, fbDb = null;
  window.currentUser = null;

  try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
      fbApp = firebase.initializeApp(firebaseConfig);
      fbAuth = firebase.auth();
      fbDb = firebase.firestore();
    }
  } catch(e) { console.log('Firebase init skipped:', e.message); }

  window.saveUserProgress = async function(st) {
    if (!fbDb || !currentUser) return;
    try {
      await fbDb.collection('users').doc(currentUser.uid).set({
        language: st.language,
        view: st.view,
        layoutView: st.layoutView,
        progressStep: st.progressStep,
        savedPlans: st.savedPlans || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch(e) { console.error('Save error:', e); }
  };

  window.loadUserProgress = async function() {
    if (!fbDb || !currentUser) return null;
    try {
      const doc = await fbDb.collection('users').doc(currentUser.uid).get();
      return doc.exists ? doc.data() : null;
    } catch(e) { return null; }
  };

  window.handleLogin = async function(method, email, password) {
    if (!fbAuth) { alert('Firebase not configured. Add your Firebase config to enable login.'); return; }
    try {
      if (method === 'google') {
        await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } else {
        try { await fbAuth.signInWithEmailAndPassword(email, password); }
        catch { await fbAuth.createUserWithEmailAndPassword(email, password); }
      }
    } catch(e) { alert(e.message); }
  };

  window.initAuth = function(onAuthChange) {
    if (fbAuth) {
      fbAuth.onAuthStateChanged(async (user) => {
        window.currentUser = user;
        
        if (user && fbDb) {
          try {
            const doc = await fbDb.collection('users').doc(user.uid).get();
            if (doc.exists) {
              const data = doc.data();
              if (data.role === 'planner') {
                window.st.mode = 'professional';
              } else if (data.role === 'admin') {
                window.st.mode = 'admin';
              } else {
                window.st.mode = 'community';
              }
            } else {
              window.st.mode = 'community';
            }
          } catch(e) {
            window.st.mode = 'community';
          }
        } else {
          if (window.st) window.st.mode = 'community';
        }

        if (onAuthChange) onAuthChange(user);
        
        if (typeof window.render === 'function') {
          window.render();
        }
      });
    }
  };

  window.signOut = function() {
    if (fbAuth) {
      fbAuth.signOut();
      window.currentUser = null;
      if (window.st) window.st.mode = 'community';
      if (typeof window.render === 'function') {
        window.render();
      }
    }
  };

  window.getFirebaseAuth = () => fbAuth;
  window.getFirebaseDb = () => fbDb;
})();
